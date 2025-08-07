import * as database from "./bot/database.js";
import "dotenv/config";
import { LavaPayment } from "./bot/payments.js";
import { processChannelJoinRequest, subscriptionMap } from "./bot/tools.js";
import "./bot/cron/mainCron.js";
import "./bot/server.js";
import { bot } from "./bot/bot.js";

const lavaApi = new LavaPayment(
  process.env.LAVA_SHOP_ID,
  process.env.LAVA_SECRET_KEY,
  process.env.LAVA_SHOP_NAME
);

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Добро пожаловать в панель администратора");
  bot.deleteMessage(chatId, msg.message_id - 1);
});

bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId == process.env.ADMIN_IDS)
    bot.sendMessage(chatId, "Добро пожаловать в панель администратора", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Отчет по пользователям",
              callback_data: "Adm_report",
            },
          ],
        ],
      },
    });
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userIndb = await database.approveUser(chatId);
  if (!userIndb.userActive) {
    console.log("user in base");
    bot.sendMessage(
      chatId,
      "Ваша подписка временно ограничена, для продления доступа к ресурсу преобретите подписку заново.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "1 МЕСЯЦ", callback_data: "buy_subscriptionOne" },
              { text: "2 МЕСЯЦА 🔥 -5%", callback_data: "buy_subscriptionTwo" },
            ],
            [
              {
                text: "3 МЕСЯЦА 🔥 -8%",
                callback_data: "buy_subscriptionThree",
              },
              {
                text: "6 МЕСЯЦЕВ 🔥 -15%",
                callback_data: "buy_subscriptionSix",
              },
            ],
            [
              {
                text: "12 МЕСЯЦЕВ 🔥 -20%",
                callback_data: "buy_subscriptionTwelve",
              },
            ],
          ],
        },
      }
    );
  } else {
    bot.sendMessage(
      chatId,
      "💰 Купите подписку, чтобы получить доступ к каналу!",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "1 МЕСЯЦ", callback_data: "buy_subscriptionOne" },
              { text: "2 МЕСЯЦА 🔥 -5%", callback_data: "buy_subscriptionTwo" },
            ],
            [
              {
                text: "3 МЕСЯЦА 🔥 -8%",
                callback_data: "buy_subscriptionThree",
              },
              {
                text: "6 МЕСЯЦЕВ 🔥 -15%",
                callback_data: "buy_subscriptionSix",
              },
            ],
            [
              {
                text: "12 МЕСЯЦЕВ 🔥 -20%",
                callback_data: "buy_subscriptionTwelve",
              },
            ],
          ],
        },
      }
    );
  }
});

bot.on("chat_join_request", async (update) => {
  console.log("Получена новая заявка:", update);
  const statusUser = await database.approveUser(update.user_chat_id);
  if (statusUser.userActive) {
    await processChannelJoinRequest(update, true);
  }
  return;
});

bot.on("callback_query", async (query) => {
  try {
    const sub = subscriptionMap[query.data];
    if (!sub) return;
    const dataInvoice = await lavaApi.createInvoice({
      shopId: process.env.LAVA_SHOP_ID,
      sum: sub.sum,
      orderId: `${query.message.chat.id}_${Date.now()}`,
      expire: 5,
      customFields: query.message.chat.id,
    });
    bot.deleteMessage(query.message.chat.id, query.message.message_id);
    bot.sendMessage(
      query.message.chat.id,
      `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
    );
  } catch (error) {
    console.log(error);
  }
});
