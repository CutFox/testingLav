
// Импорт зависимостей и сервисов
import * as database from "./database.js";
import { bot } from "./bot.js";
import { startOfMonth, endOfMonth, format, startOfWeek, endOfWeek } from "date-fns";
import { LavaPayment } from "./payments.js";
import axios from "axios";


// Инициализация API LavaPayment для работы с платежами
const lavaApi = new LavaPayment(
  process.env.LAVA_SHOP_ID,
  process.env.LAVA_SECRET_KEY,
  process.env.LAVA_SHOP_NAME
);


/**
 * Добавляет пользователя через локальный webhook (эмуляция успешной оплаты)
 * @param {number|string} amount - сумма
 * @param {string|number} custom_fields - дополнительные поля
 * @returns {Promise<any>} - ответ сервера
 */
export async function addUser(amount, custom_fields) {
  try {
    const response = await axios.post(
      `http://localhost:3000/lava-webhook`,
      {
        amount,
        status: "success",
        custom_fields,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Server responded with error:", {
        status: error.response.status,
        data: error.response.data,
      });
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Request setup error:", error.message);
      throw new Error("Failed to setup request");
    }
  }
}



// Универсальная функция для получения интервала дат (месяц, неделя и т.д.)
function getInterval(getStart, getEnd, date = new Date()) {
  const firstDay = getStart(date);
  const lastDay = getEnd(date);
  return {
    firstDay,
    lastDay,
    formatted: {
      start: format(firstDay, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      end: format(lastDay, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    },
  };
}

const getMonthInterval = (date) => getInterval(startOfMonth, endOfMonth, date);
const getWeekInterval = (date) => getInterval(startOfWeek, endOfWeek, date);

/**
 * Отправляет уведомление пользователям, у которых скоро закончится подписка
 */
export async function createNotification() {
  const notifyUsers = await database.dbFindNotificationUsers();
  await Promise.all(
    notifyUsers.map(({ userId }) =>
      bot.sendMessage(
        userId,
        `Привет!\nНапоминаю, что срок твоей подписки в моем платном Telegram-канале почти истек.\n` +
          `Если ты хочешь и дальше получать эксклюзивный контент, то не забудь продлить подписку используй команду /start\n` +
          `Если же ты решишь не продлевать подписку, то всё равно огромное спасибо за твою поддержку и время 💪`,
        { parse_mode: "HTML" }
      )
    )
  );
}

/**
 * Отправляет кастомное уведомление администраторам
 * @param {string} textNotification - текст уведомления
 */
export async function createNotificationAdmin(textNotification) {
  const adminNotifyUsers = await database.dbFindNotificationUsersAdmin();
  await Promise.all(
    adminNotifyUsers.map(({ userId }) =>
      bot.sendMessage(userId, textNotification)
    )
  );
}

/**
 * Удаляет пользователя из канала (с возможностью бана)
 * @param {number|string} chatId - ID канала
 * @param {number|string} userId - ID пользователя
 * @param {boolean} ban - true, если нужно забанить, иначе просто удалить
 * @returns {Promise<boolean>} - true, если успешно, иначе false
 */
export async function removeUserFromChannel(chatId, userId, ban = false) {
  try {
    await bot.banChatMember(chatId, userId, { revoke_messages: true });
    if (!ban) {
      await bot.unbanChatMember(chatId, userId, { only_if_banned: true });
    }
    console.log(
      `Пользователь ${userId} ${ban ? "забанен" : "удалён"} из канала ${chatId}`
    );
    return true;
  } catch (error) {
    console.error("Ошибка удаления:", error.message);
    if (error.response?.error_code === 400) {
      console.log("Возможно, пользователь уже не в канале");
    }
    return false;
  }
}

/**
 * Обрабатывает заявку на вступление в канал (одобрение или отклонение)
 * @param {object} request - объект заявки Telegram
 * @param {boolean} approve - true для одобрения, false для отклонения
 * @returns {Promise<boolean>} - true, если успешно, иначе false
 */
export async function processChannelJoinRequest(request, approve = true) {
  try {
    if (!request.chat || !request.from)
      throw new Error("Invalid join request object");
    const chatId = request.chat.id;
    const userId = request.from.id;
    if (approve) {
      await bot.approveChatJoinRequest(chatId, userId);
      console.log(
        `Заявка пользователя ${userId} одобрена для канала ${chatId}`
      );
      try {
        await bot.sendMessage(
          userId,
          `Добро пожаловать в ${request.chat.title}!`
        );
      } catch (e) {
        console.log("Не удалось отправить приветствие:", e.message);
      }
    } else {
      await bot.declineChatJoinRequest(chatId, userId);
      console.log(
        `Заявка пользователя ${userId} отклонена для канала ${chatId}`
      );
    }
    return true;
  } catch (error) {
    console.error("Ошибка обработки заявки:", error.message);
    if (error.response) {
      if (error.response.error_code === 400) {
        console.log("Заявка уже обработана или не существует");
      } else if (error.response.error_code === 403) {
        console.log("Нет прав для обработки заявок");
      }
    }
    return false;
  }
}

/**
 * Сравнивает переданную дату с текущей (игнорируя время)
 * @param {string|Date} date - сравниваемая дата
 * @returns {number} -1 если дата в прошлом, 1 если в будущем, 0 если сегодня
 */
export function compareWithCurrentDate(date) {
  const inputDate = new Date(date);
  const currentDate = new Date();
  inputDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  return inputDate < currentDate ? -1 : inputDate > currentDate ? 1 : 0;
}

/**
 * Класс для формирования отчёта администратора
 */

/**
 * Класс для формирования отчёта администратора
 */
export class Report {
  constructor(
    allUserInbd,
    activeUsersInbd,
    notificateUser,
    userInChannel,
    userThisMonth,
    userThisWeek,
    balance,
    freeze_balance
  ) {
    this.allUserInbd = allUserInbd.length; // Всего пользователей в БД
    this.activeUsersInbd = activeUsersInbd.length; // Активных пользователей
    this.notificateUser = notificateUser.length; // Пользователей для уведомления
    this.userInChannel = userInChannel - 2; // Пользователей в канале (минус бота и владельца)
    this.userThisMonth = userThisMonth.length; // Новых за месяц
    this.userThisWeek = userThisWeek.length; // Новых за неделю
    this.balance = balance; // Баланс Lava
    this.freeze_balance = freeze_balance; // Замороженный баланс
  }
}

/**
 * Формирует и возвращает отчёт для администратора
 * @returns {Promise<Report>} - объект отчёта
 */

/**
 * Формирует и возвращает отчёт для администратора
 * @returns {Promise<Report>} - объект отчёта
 */
export async function createReportAdmin() {
  const lavaData = await lavaApi.getBalance();
  const { balance, freeze_balance } = lavaData.data;
  const intervalMonth = getMonthInterval();
  const intervalWeek = getWeekInterval();
  const [
    allUserInbd,
    activeUsersInbd,
    notificateUser,
    userInChannel,
    userThisMonth,
    userThisWeek,
  ] = await Promise.all([
    database.dbFindAll(),
    database.dbFindNotificationUsersAdmin(),
    database.dbFindNotificationUsers(),
    bot.getChatMemberCount(process.env.TELEGRAM_CHANNEL_ID),
    database.dbFindIntervalDate(
      intervalMonth.formatted.start,
      intervalMonth.formatted.end
    ),
    database.dbFindIntervalDate(
      intervalWeek.formatted.start,
      intervalWeek.formatted.end
    ),
  ]);
  return new Report(
    allUserInbd,
    activeUsersInbd,
    notificateUser,
    userInChannel,
    userThisMonth,
    userThisWeek,
    balance,
    freeze_balance
  );
}

/**
 * Карта соответствия типов подписки и их стоимости (взято из переменных окружения)
 */
export const subscriptionMap = {
  buy_subscriptionOne: {
    sum: process.env.OneMonth,
  },
  buy_subscriptionTwo: {
    sum: process.env.TwoMonth,
  },
  buy_subscriptionThree: {
    sum: process.env.ThreeMonth,
  },
  buy_subscriptionSix: {
    sum: process.env.SixMonth,
  },
  buy_subscriptionTwelve: {
    sum: process.env.TwelveMonth,
  },
};
