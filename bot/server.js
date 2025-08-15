
// Импорт зависимостей и сервисов
import express from "express";
import "dotenv/config";
import * as database from "./database.js";
import { bot } from "./bot.js";
import { subscriptionMap } from "./tools.js";


// Инициализация Express-приложения
const app = express();
app.use(express.json());

// Тестовый POST-эндпоинт (можно использовать для проверки работоспособности сервера)
app.post("/", (req, res) => {
  res.send("add");
});


// Вспомогательная функция для поиска функции добавления подписки по сумме
function getAddSubscriberFunc(amount) {
  for (const [key, { sum }] of Object.entries(subscriptionMap)) {
    if (String(sum) === String(amount)) {
      // Приводим к виду addSubscriberOneMonth, addSubscriberTwoMonth и т.д.
      const funcName = `addSubscriber${key.replace("buy_subscription", "")}Month`;
      if (typeof database[funcName] === "function") {
        return database[funcName];
      }
    }
  }
  return null;
}

// Вебхук для обработки уведомлений от платежной системы Lava
app.post("/lava-webhook", async (req, res) => {
  try {
    const { status, custom_fields, amount } = req.body;
    if (status === "success") {
      const addFunc = getAddSubscriberFunc(amount);
      if (!addFunc) {
        // Если не найден тариф — уведомление об ошибке
        await bot.sendMessage(
          custom_fields,
          `В процессе оплаты произошла ошибка, обратитесь к администратору ${process.env.SUPPORT}`,
          { parse_mode: "HTML" }
        );
      } else {
        // Успешная оплата: уведомление и приглашение в канал
        await addFunc(custom_fields);
        await bot
          .sendMessage(custom_fields, "✅ Спасибо за подписку 💪")
          .then((response) => {
            const messageId = response.message_id;
            // Удаление предыдущего сообщения (например, с кнопкой оплаты)
            bot.deleteMessage(custom_fields, messageId - 1);
          });
        await bot.sendMessage(custom_fields, process.env.TELEGRAM_CHANNEL_LINK, {
          parse_mode: "HTML",
        });
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Запуск сервера на указанном порту
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен, порт ${PORT}`);
});
