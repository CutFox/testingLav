import express from "express";
import * as database from "./database.js";
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";
import { LavaPayment } from "./payments.js";
import "./cron/mainCron.js";

const app = express();
app.use(express.json());
const lavaApi = new LavaPayment(
  "840d3dff-2252-446b-8802-ce0b2521f76f",
  "d1daa6c1065b9b21e0d4f221905306ca3e3c0c8b",
  "fireshield.network"
);
const bot = new TelegramBot(config.TELEGRAM.TOKEN, { polling: true });

export async function createNotification() {
   const dbtest = await database.dbfindNotificate();
    async function processArray(array) {
      for (const item of array) {
        const {userId} = item;
        bot.sendMessage(
        userId,
        `Ваша подписка почти закончилась для проления подписки введите команду /resub чтоб не потерять доступ к каналу.`
      );
      }
      
    }
 processArray(dbtest)
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

async function processChannelJoinRequest(request, approve = true) {
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

// Обработчик входящих запросов на вступление
bot.on("chat_join_request", async (update) => {
  console.log("Получена новая заявка:", update);
  const statusUser = await database.approveUser(update.user_chat_id);

  if (statusUser.userActive) {
    await processChannelJoinRequest(update, true);
  }
  return;
});

// Команда /start
bot.onText(/\/qwe/, async (msg) => {
  const chatId = msg.chat.id;
 
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

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
            { text: "3 МЕСЯЦА 🔥 -8%", callback_data: "buy_subscriptionThree" },
            { text: "6 МЕСЯЦЕВ 🔥 -15%", callback_data: "buy_subscriptionSix" },
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
});

bot.on("callback_query", async (query) => {
  console.log("query.data", query.data);
  try {
    if (query.data === "buy_subscriptionOne") {
      const dataInvoice = await lavaApi.createInvoice({
        shopId: process.env.LAVA_SHOP_ID,
        sum: process.env.OneMonth,
        orderId: `${query.message.chat.id}_${Date.now()}`,
        expire: 5,
        customFields: query.message.chat.id,
      });
      // const balance = await lavaApi.getBalance();
      const status = await lavaApi.getInvoiceStatus(dataInvoice.data.id);
      // console.log('balance', balance)
      console.log("status", status);
      bot.sendMessage(
        query.message.chat.id,
        `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
      );
    }
    if (query.data === "buy_subscriptionTwo") {
      const dataInvoice = await lavaApi.createInvoice({
        shopId: process.env.LAVA_SHOP_ID,
        sum: process.env.TwoMonth,
        orderId: `${query.message.chat.id}_${Date.now()}`,
        expire: 5,
        customFields: query.message.chat.id,
      });
      const status = await lavaApi.getInvoiceStatus(dataInvoice.data.id);
      bot.sendMessage(
        query.message.chat.id,
        `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
      );
    }
    if (query.data === "buy_subscriptionThree") {
      const dataInvoice = await lavaApi.createInvoice({
        shopId: process.env.LAVA_SHOP_ID,
        sum: process.env.ThreeMonth,
        orderId: `${query.message.chat.id}_${Date.now()}`,
        expire: 5,
        customFields: query.message.chat.id,
      });
      bot.sendMessage(
        query.message.chat.id,
        `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
      );
    }
    if (query.data === "buy_subscriptionSix") {
      const dataInvoice = await lavaApi.createInvoice({
        shopId: process.env.LAVA_SHOP_ID,
        sum: process.env.SixMonth,
        orderId: `${query.message.chat.id}_${Date.now()}`,
        expire: 5,
        customFields: query.message.chat.id,
      });
      bot.sendMessage(
        query.message.chat.id,
        `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
      );
    }
    if (query.data === "buy_subscriptionTwelve") {
      const dataInvoice = await lavaApi.createInvoice({
        shopId: process.env.LAVA_SHOP_ID,
        sum: process.env.TwelveMonth,
        orderId: `${query.message.chat.id}_${Date.now()}`,
        expire: 5,
        customFields: query.message.chat.id,
      });
      // console.log('status', status)
      bot.sendMessage(
        query.message.chat.id,
        `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`
      );
    }
  } catch (error) {
    console.log(error);
  }
});
app.get("/", async (req, res) => {
  // await database.addSubscriberOneMonth("6990892092")
  res.send("add");
});

app.post("/lava-webhook", async (req, res) => {
  console.log("req", req.body);
  try {
    const { orderId, status, custom_fields, amount } = req.body;
    if (status === "success") {
      switch (amount) {
        case process.env.OneMonth:
          await database.addSubscriberOneMonth(custom_fields);
          console.log("1");
          break;
        case process.env.TwoMonth:
          await database.addSubscriberTwoMonth(custom_fields);
          console.log("2");
          break;
        case process.env.ThreeMonth:
          await database.addSubscriberThreeMonth(custom_fields);
          console.log("3");
          break;
        case process.env.SixMonth:
          await database.addSubscriberSixMonth(custom_fields);
          console.log("6");
          break;
        case process.env.TwelveMonth:
          await database.addSubscriberTwelveMonth(custom_fields);
          console.log("12");
          break;
        default:
          await bot.sendMessage(
            custom_fields,
            "В процессе оплаты произошла ошибка обратитесь к администратору @",
            { parse_mode: "HTML" }
          );
          break;
      }
      console.log("first", amount);
      await bot.sendMessage(
        custom_fields,
        "✅ Подписка успешно оформлена! Добро пожаловать в канал!"
      );
      await bot.sendMessage(custom_fields, "https://t.me/+bu6xGLGfqCNlNTVi", {
        parse_mode: "HTML",
      });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔄 Webhook server listening on port ${PORT}`);
});
