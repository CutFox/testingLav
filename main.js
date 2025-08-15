
// Импорт основных зависимостей и сервисов
import * as database from "./bot/database.js";
import "dotenv/config";
import { LavaPayment } from "./bot/payments.js";
import {
  processChannelJoinRequest,
  subscriptionMap,
  createNotificationAdmin,
  createReportAdmin,
  addUser
} from "./bot/tools.js";
import "./bot/cron/mainCron.js";
import "./bot/server.js";
import { bot } from "./bot/bot.js";


// Инициализация платежного API
const lavaApi = new LavaPayment(
  process.env.LAVA_SHOP_ID,
  process.env.LAVA_SECRET_KEY,
  process.env.LAVA_SHOP_NAME
);


// --- Константы и шаблоны ---

// Текст политики конфиденциальности для команды /privacy
const privacyText = `Политика конфиденциальности Telegram бота @TravelShopAnanasik_bot\n\nАдминистрация Telegram бота @TravelShopAnanasik_bot обязуется сохранять вашу конфиденциальность в Интернете. Мы уделяем большое значение охране предоставленных вами данных. Наша политика конфиденциальности основана на требованиях политик конфиденциальности Telegram и магазинов Apple и Google.\nМы не собираем и не обрабатываем персональные данные пользователей. Наш Telegram бот в целях осуществления работы сервиса использует только неперсонализированный Telegram ID.\n\nСбор и использование персональных данных\nМы не запрашиваем и не собираем никаких персональных данных. Все данные пользователей в нашем сервисе привязаны только к неперсонализированному Telegram ID.\nКогда вы запускаете Telegram бот @TravelShopAnanasik_bot, Telegram автоматически передает нам только ваш Telegram ID, который не дает нам доступа к вашей личной информации.\n\nХранение данных, изменение и удаление\nПользователь, предоставивший свой Telegram-ID нашему Telegram боту @TravelShopAnanasik_bot имеет право на удаление своих данных, привязанных к Telegram ID, кроме информации о блокировке пользователя.\n\nРаскрытие информации третьим лицам\nМы не продаем, не используем и не раскрываем третьим лицам какие-либо данные своих пользователей для каких-либо целей.\n\nПредоставление информации детям\nЕсли вы являетесь родителем или опекуном, и вы знаете, что ваши дети предоставили нам свои данные без вашего согласия, свяжитесь с нами.\n\nИзменения в политике конфиденциальности\nTelegram бот @TravelShopAnanasik_bot может обновлять нашу политику конфиденциальности время от времени. Мы сообщаем о любых изменениях, разместив новую политику конфиденциальности на этой странице. Если вы оставили данные у нас, то мы оповестим вас об изменении в политике конфиденциальности при помощи бота @TravelShopAnanasik_bot.\n\nОбратная связь, заключительные положения\nСвязаться с администрацией Telegram бота @TravelShopAnanasik_bot по вопросам, связанным с политикой конфиденциальности можно с помощью контактной информации указанной в разделе Помощь нашего бота. Если вы не согласны с данной политикой конфиденциальности, вы не можете пользоваться услугами Telegram бота @TravelShopAnanasik_bot.\n\nПолитика возврата средств\nНастоящая политика регулирует условия возврата средств за платную подписку на наш сервис. Оформляя подписку, вы соглашаетесь с данной политикой Telegram бота @TravelShopAnanasik_bot. Мы предоставляем 14-дневный период для возврата средств с момента первой оплаты подписки, если услугами не пользовались. Для запроса возврата в этот период напишите в поддержку. Если сервис полностью неработоспособен более 24 часов, вы можете запросить:\n!Продление подписки на срок простоя\n!Частичный возврат за нерабочие дни\n!Полный возврат, если проблема не устранена в разумные сроки\n\nВозврат средств осуществляется до 10 рабочих дней по реквизитам с которых произведена оплата. Мы оставляем право изменять условия. Актуальная версия всегда доступна на данной странице.`;


// Кнопки для выбора тарифа подписки
const subscriptionButtons = [
  [
    { text: "1 МЕСЯЦ", callback_data: "buy_subscriptionOne" },
    { text: "2 МЕСЯЦА 🔥 -5%", callback_data: "buy_subscriptionTwo" },
  ],
  [
    { text: "3 МЕСЯЦА 🔥 -8%", callback_data: "buy_subscriptionThree" },
    { text: "6 МЕСЯЦЕВ 🔥 -15%", callback_data: "buy_subscriptionSix" },
  ],
  [{ text: "12 МЕСЯЦЕВ 🔥 -20%", callback_data: "buy_subscriptionTwelve" }],
];

// Кнопки для выбора способа оплаты
const payMethods = [
  [
    { text: "🇷🇺 Российские карты", callback_data: "buy_ru" },
    { text: "🇰🇿🇺🇿🇹🇯 Доллары (СНГ)", callback_data: "buy_sng" },
  ],
  [{ text: "🇺🇸🇪🇺🇨🇦🇮🇱 Зарубежные карты", callback_data: "buy_world" }],
  [{ text: "💰 Криптовалюта (USDT - TRC20)", callback_data: "buy_trc" }],
];


// --- Обработчики команд ---

// /privacy — политика конфиденциальности
bot.onText(/\/privacy/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, privacyText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Начать",
            url: "https://t.me/TravelShopAnanasik_bot?start=1",
          },
        ],
      ],
    },
  });
});


// /test — заглушка для тестовой команды (можно добавить отладку)
bot.onText(/\/test/, async (msg) => {
  // ...existing code...
});


// /support — поддержка
bot.onText(/\/support/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `По вопросам технической поддержки обращайтесь ${process.env.SUPPORT}`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Начать",
              url: "https://t.me/TravelShopAnanasik_bot?start=1",
            },
          ],
        ],
      },
    }
  );
});


// /admin — панель администратора
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const adminIds = String(process.env.ADMIN_IDS)
    .split(",")
    .map((id) => id.trim());
  if (adminIds.includes(String(chatId))) {
    bot.sendMessage(chatId, "Добро пожаловать в панель администратора", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Отчет по пользователям", callback_data: "Adm_report" }],
          [
            {
              text: "Уведомление для пользователей",
              callback_data: "Adm_notification",
            },
          ],
        ],
      },
    });
  }
});


// /start — проверка статуса подписки и предложение покупки
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userIndb = await database.approveUser(chatId);
  if (userIndb?.userActive) {
    bot.sendMessage(
      chatId,
      `Ваша подписка активна до ${userIndb.subscriptionEnd}. Введите команду /start для проверки статуса подписки`
    );
  } else {
    bot.sendMessage(
      chatId,
      userIndb
        ? "Ваша подписка временно ограничена, для продления доступа к ресурсу преобретите подписку заново."
        : "Выберите метод оплаты в автоматическом режиме работает только поплнение с карты РФ",
      {
        reply_markup: {
          inline_keyboard: payMethods,
        },
      }
    );
  }
});


// Обработка заявок на вступление в канал
bot.on("chat_join_request", async (update) => {
  console.log("Получена новая заявка:", update);
  const statusUser = await database.approveUser(update.user_chat_id);
  if (statusUser?.userActive) {
    await processChannelJoinRequest(update, true);
  }
});


// --- Обработка callback_query (кнопки) ---
bot.removeAllListeners("callback_query");
bot.on("callback_query", async (query) => {
  try {
    const sub = subscriptionMap[query.data];
    // Если это не кнопка покупки подписки, обрабатываем специальные действия
    if (!sub) {
      switch (query.data) {
        case "buy_ru":
          await bot.sendMessage(
            query.message.chat.id,
            "💰 Купите подписку, чтобы получить доступ к каналу!",
            {
              reply_markup: { inline_keyboard: subscriptionButtons },
            }
          );
          break;
        case "buy_sng":
          await bot.sendMessage(
            query.message.chat.id,
            "💰 Купите подписку, чтобы получить доступ к каналу! подтверждение производится в ручном режиме и может занять некоторое время месяц 10р комментарий к платежу ваш ID",
            {
              reply_markup: {
                inline_keyboard: [[{ text: "Я оплатил", callback_data: "card_paid" }]],
              },
            }
          );
          break;
        case "card_paid": {
          await bot.deleteMessage(query.message.chat.id, query.message.message_id);
          await bot
            .sendMessage(
              process.env.ADMIN_IDS,
              `Заявка на предоставление доступа к каналу от пользователя ID:${query.message.chat.id}`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: "1 мес", callback_data: `Adm_subEnablePay_${process.env.OneMonth}_${query.message.chat.id}` },
                      { text: "2 мес", callback_data: `Adm_subEnablePay_${process.env.TwoMonth}_${query.message.chat.id}` },
                      { text: "3 мес", callback_data: `Adm_subEnablePay_${process.env.ThreeMonth}_${query.message.chat.id}` },
                    ],
                    [
                      { text: "6 мес", callback_data: `Adm_subEnablePay_${process.env.SixMonth}_${query.message.chat.id}` },
                      { text: "12 мес", callback_data: `Adm_subEnablePay_${process.env.TwelveMonth}_${query.message.chat.id}` },
                    ],
                    [
                      { text: "Отказать", callback_data: `Adm_subDisable_${query.message.chat.id}` },
                    ],
                  ],
                },
              }
            )
            .then(async (response) => {
              const messageId = response.message_id;
              await database.addPreSubscriber(query.message.chat.id, messageId);
            });
          await bot.sendMessage(
            query.message.chat.id,
            "Заявка отправлена на модерацию, после подтверждения платежа вам будет отправлена ссылка на вступление в группу"
          );
          break;
        }
        case query.data.match(/^Adm_subDisable_*/)?.input: {
          const queryTelegramIDdis = query.data.slice(15);
          const { msgId, userId } = await database.approvePreUser(queryTelegramIDdis);
          await database.delPreSubscriber(queryTelegramIDdis);
          await bot.deleteMessage(query.message.chat.id, msgId);
          await bot.sendMessage(
            userId,
            `Платеж не был доставлен, обратитесь в техническую поддержку ${process.env.SUPPORT}`
          );
          break;
        }
        case query.data.match(/^Adm_subEnablePay_*/)?.input: {
          const queryTelegramIDena = query.data.slice(17);
          const splitDate = queryTelegramIDena.split("_");
          const dataQuery = await database.approvePreUser(splitDate[1]);
          await addUser(splitDate[0], splitDate[1]);
          await bot.deleteMessage(query.message.chat.id, dataQuery.msgId);
          break;
        }
        case "Adm_report": {
          const report = await createReportAdmin();
          await bot.sendMessage(
            query.message.chat.id,
            `<blockquote><b>Отчет</b></blockquote>\n\n🔹Пользователей в БД: <b>${report.allUserInbd}</b>\n🔹Активные пользователи в БД: <b>${report.activeUsersInbd}</b>\n🔹Неактивные пользователи в БД: <b>${report.allUserInbd - report.activeUsersInbd}</b>\n` +
              `🔹Ост. менее 3 д. подписки: <b>${report.notificateUser}</b>\n\n🔹Кол-во участников в канале: <b>${report.userInСhannel}</b>\n<blockquote>За исключением Админа и бота</blockquote>\n\n` +
              `🔹Прирост за месяц: <b>${report.userThisMounth}</b>\n🔹Прирост за 7 дней: <b>${report.userThisWeek}</b>\n\n` +
              `🔹Баланс кошелька: <b>${report.balance}₽</b>\n🔹Баланс в заморозке 10д.: <b>${report.freeze_balance}₽</b>`,
            { parse_mode: "HTML" }
          );
          break;
        }
        case "Adm_notification": {
          await bot.sendMessage(
            query.message.chat.id,
            `Ответьте на данное сообщение текстом уведомления`,
            { reply_markup: { force_reply: true } }
          );
          break;
        }
        default:
          console.log(query.data);
          break;
      }
      return;
    }
    // Кнопки покупки подписки
    const dataInvoice = await lavaApi.createInvoice({
      shopId: process.env.LAVA_SHOP_ID,
      sum: sub.sum,
      orderId: `${query.message.chat.id}_${Date.now()}`,
      expire: 5,
      customFields: query.message.chat.id,
    });
    await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    await bot.sendMessage(
      query.message.chat.id,
      `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
    );
  } catch (error) {
    console.log(error);
  }
});


// --- Обработка force_reply для массовых уведомлений от администратора ---
bot.removeAllListeners("message");
bot.on("message", async (msg) => {
  if (!msg.reply_to_message) return;
  const adminIds = String(process.env.ADMIN_IDS)
    .split(",")
    .map((id) => id.trim());
  if (
    adminIds.includes(String(msg.chat.id)) &&
    msg.reply_to_message.text ===
      "Ответьте на данное сообщение текстом уведомления"
  ) {
    const textNotification = msg.text;
    await createNotificationAdmin(textNotification);
  }
});
