// Импорт зависимостей и сервисов
import express from "express";
import "dotenv/config";
import * as database from "./database.js";
import { bot } from "./bot.js";
import { subscriptionMap } from "./tools.js";

// Инициализация Express-приложения
const app = express();
app.use(express.json());

// Тестовый GET-эндпоинт (можно использовать для проверки работоспособности сервера)
app.get("/", async (req, res) => {
  res.send("add");
});

// Вебхук для обработки уведомлений от платежной системы Lava
app.post("/lava-webhook", async (req, res) => {
  try {
    const { status, custom_fields, amount } = req.body;
    if (status === "success") {
      let added = false;
      // Поиск подходящего тарифа по сумме и добавление подписки
      for (const [key, { sum }] of Object.entries(subscriptionMap)) {
        if (String(sum) === String(amount)) {
          const addFunc = database[`addSubscriber${key.replace('buy_subscription', '')}Month`];
          if (typeof addFunc === 'function') {
            await addFunc(custom_fields);
            added = true;
            break;
          }
        }
      }
      if (!added) {
        // Если не найден тариф — уведомление об ошибке
        await bot.sendMessage(
          custom_fields,
          "В процессе оплаты произошла ошибка, обратитесь к администратору @",
          { parse_mode: "HTML" }
        );
      } else {
        // Успешная оплата: уведомление и приглашение в канал
        await bot.sendMessage(
          custom_fields,
          "✅ Подписка успешно оформлена! Добро пожаловать в канал!"
        ).then(response => {
          const messageId = response.message_id;
          // Удаление предыдущего сообщения (например, с кнопкой оплаты)
          console.log('ID отправленного сообщения:', messageId-2);
          bot.deleteMessage(custom_fields, messageId-1);
        });
        await bot.sendMessage(custom_fields, "https://t.me/+bu6xGLGfqCNlNTVi", {
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
