import express from 'express';
import { addSubscriber } from './database.js';

import TelegramBot from 'node-telegram-bot-api';
import config from './config.js';
import { LavaPayment } from './payments.js';




const app = express();
app.use(express.json());
const lavaApi = new LavaPayment(
  "840d3dff-2252-446b-8802-ce0b2521f76f",
  "d1daa6c1065b9b21e0d4f221905306ca3e3c0c8b",
  "fireshield.network"
);
const bot = new TelegramBot(config.TELEGRAM.TOKEN, { polling: true });

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '💰 Купите подписку, чтобы получить доступ к каналу!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💳 Купить подписку (300 ₽)', callback_data: 'buy_subscription' }]
      ]
    }
  });
});

// Обработка кнопки "Купить подписку"
bot.on('callback_query', async (query) => {
  if (query.data === 'buy_subscription') {
    const dataInvoice = await lavaApi.createInvoice({
      shopId: "840d3dff-2252-446b-8802-ce0b2521f76f",
      sum: 10,
      orderId: `${query.message.chat.id}_${Date.now()}`,
      expire: 5,
    });
    const balance = await lavaApi.getBalance();
    const status = await lavaApi.getInvoiceStatus(dataInvoice.data.id);
    console.log('balance', balance)
    console.log('status', status)
    bot.sendMessage(query.message.chat.id, `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`);
  }
});
app.get("/", (req, res) => {
  res.send("3Hello World3");
});

app.post('/lava-webhook', async (req, res) => {
  console.log('req', req.body)
  // try {
  //   // Проверяем подпись
  //   if (!verifyWebhook(req.body)) {
  //     return res.status(403).send('Invalid signature');
  //   }

  //   const { orderId, status, customFields } = req.body;
    
  //   if (status === 'success') {
  //     await addSubscriber(customFields.telegramId);
      
  //     // Добавляем пользователя в канал
  //     await bot.addChatMember(
  //       process.env.TELEGRAM_CHANNEL_ID, 
  //       customFields.telegramId
  //     );
      
  //     // Отправляем уведомление пользователю
  //     await bot.sendMessage(
  //       customFields.telegramId,
  //       '✅ Подписка успешно оформлена! Добро пожаловать в канал!'
  //     );
  //   }

  //   res.status(200).json({ success: true });
  // } catch (error) {
  //   console.error('Webhook error:', error);
  //   res.status(500).json({ error: 'Internal server error' });
  // }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔄 Webhook server listening on port ${PORT}`);
});