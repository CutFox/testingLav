import * as database from "./database.js"
import  {bot}  from "./bot.js";

export async function createNotification() {
  const users = await database.dbFindNotificationUsers();
  for (const { userId } of users) {
    await bot.sendMessage(
      userId,
      `Ваша подписка почти закончилась. Для продления введите команду /start, чтобы не потерять доступ к каналу.`
    );
  }
}

export async function removeUserFromChannel(chatId, userId, ban = false) {
  try {
    // Сначала кикаем пользователя
    await bot.banChatMember(chatId, userId, {
      revoke_messages: true, // Удалить все сообщения пользователя
    });

    // Если не нужно банить - сразу разбаниваем
    if (!ban) {
      await bot.unbanChatMember(chatId, userId, {
        only_if_banned: true,
      });
    }

    console.log(
      `Пользователь ${userId} ${ban ? "забанен" : "удалён"} из канала ${chatId}`
    );
    return true;
  } catch (error) {
    console.error("Ошибка удаления:", error.message);

    // Проверяем, есть ли пользователь в чате
    if (error.response && error.response.error_code === 400) {
      console.log("Возможно, пользователь уже не в канале");
    }

    return false;
  }
}

export async function processChannelJoinRequest(request, approve = true) {
  try {
    if (!request.chat || !request.from) {
      throw new Error("Invalid join request object");
    }

    const chatId = request.chat.id;
    const userId = request.from.id;

    if (approve) {
      // Одобряем заявку
      await bot.approveChatJoinRequest(chatId, userId);
      console.log(
        `Заявка пользователя ${userId} одобрена для канала ${chatId}`
      );

      // Можно отправить приветственное сообщение
      try {
        await bot.sendMessage(
          userId,
          `Добро пожаловать в ${request.chat.title}!`
        );
      } catch (e) {
        console.log("Не удалось отправить приветствие:", e.message);
      }
    } else {
      // Отклоняем заявку
      await bot.declineChatJoinRequest(chatId, userId);
      console.log(
        `Заявка пользователя ${userId} отклонена для канала ${chatId}`
      );
    }

    return true;
  } catch (error) {
    console.error("Ошибка обработки заявки:", error.message);

    if (error.response) {
      switch (error.response.error_code) {
        case 400:
          console.log("Заявка уже обработана или не существует");
          break;
        case 403:
          console.log("Нет прав для обработки заявок");
          break;
      }
    }

    return false;
  }
}

export function compareWithCurrentDate(date) {
  const inputDate = new Date(date);
  const currentDate = new Date();
  inputDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  return inputDate < currentDate ? -1 : inputDate > currentDate ? 1 : 0;
}

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