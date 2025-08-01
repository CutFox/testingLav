import express from 'express';
import { verifyWebhook } from './payments.js';
import { addSubscriber } from './database.js';
import bot from './bot.js';

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("3Hello World3");
});

app.post('/lava-webhook', async (req, res) => {
  try {
    // Проверяем подпись
    if (!verifyWebhook(req.body)) {
      return res.status(403).send('Invalid signature');
    }

    const { orderId, status, customFields } = req.body;
    
    if (status === 'success') {
      await addSubscriber(customFields.telegramId);
      
      // Добавляем пользователя в канал
      await bot.addChatMember(
        process.env.TELEGRAM_CHANNEL_ID, 
        customFields.telegramId
      );
      
      // Отправляем уведомление пользователю
      await bot.sendMessage(
        customFields.telegramId,
        '✅ Подписка успешно оформлена! Добро пожаловать в канал!'
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔄 Webhook server listening on port ${PORT}`);
});