import express from "express";
import "dotenv/config";
import * as database from "./database.js"
import  {bot}  from "./bot.js";
import {subscriptionMap} from "./tools.js"

const app = express();
app.use(express.json());




app.get("/", async (req, res) => {
  // await database.addSubscriberOneMonth("6990892092")
  res.send("add");
});


app.post("/lava-webhook", async (req, res) => {
  try {
    const { status, custom_fields, amount } = req.body;
    if (status === "success") {
      let added = false;
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
        await bot.sendMessage(
          custom_fields,
          "В процессе оплаты произошла ошибка, обратитесь к администратору @",
          { parse_mode: "HTML" }
        );
      } else {
        
        await bot.sendMessage(
          custom_fields,
          "✅ Подписка успешно оформлена! Добро пожаловать в канал!"
        ).then(response => {
    const messageId = response.message_id;
    console.log('ID отправленного сообщения:', messageId-2);
    bot.deleteMessage(custom_fields,messageId-1)
  })


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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен, порт ${PORT}`);
});
