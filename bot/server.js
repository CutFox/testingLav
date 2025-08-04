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


async function removeUserFromChannel(chatId, userId, ban = false) {
    try {
        // Сначала кикаем пользователя
        await bot.banChatMember(chatId, userId, {
            revoke_messages: true // Удалить все сообщения пользователя
        });

        // Если не нужно банить - сразу разбаниваем
        if (!ban) {
            await bot.unbanChatMember(chatId, userId, { 
                only_if_banned: true 
            });
        }

        console.log(`Пользователь ${userId} ${ban ? 'забанен' : 'удалён'} из канала ${chatId}`);
        return true;
    } catch (error) {
        console.error('Ошибка удаления:', error.message);
        
        // Проверяем, есть ли пользователь в чате
        if (error.response && error.response.error_code === 400) {
            console.log('Возможно, пользователь уже не в канале');
        }
        
        return false;
    }
}



// Команда /start
bot.onText(/\/qwe/, async(msg) => {
  const chatId = msg.chat.id;
  // var channelId = -1002288400815
  // var userId = 420178775

  removeUserFromChannel('-1002288400815', 420178775); 

  // await banUserFromChannel(channelId,userId)
  bot.sendMessage(chatId, 'Пользователь удален');
});


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
      customFields:query.message.chat.id,
    });
    const balance = await lavaApi.getBalance();
    const status = await lavaApi.getInvoiceStatus(dataInvoice.data.id);
    console.log('balance', balance)
    console.log('status', status)
    bot.sendMessage(query.message.chat.id, `🔗 Ссылка для оплаты: ${dataInvoice.data.url}`);
  }
});
app.get("/", async(req, res) => {
  await bot.addChatMember(
        process.env.TELEGRAM_CHANNEL_ID, 
        420178775
      );
});

app.post('/lava-webhook', async (req, res) => {
  console.log('req', req.body)
  try {

    const { orderId, status, custom_fields } = req.body;
    
    if (status === 'success') {
      await addSubscriber(custom_fields);
      await bot.sendMessage(
        custom_fields,
        '✅ Подписка успешно оформлена! Добро пожаловать в канал!'
      );

      await bot.sendMessage(
        custom_fields,
        'https://t.me/+E1uFRpFVvyA3N2Ey',
      {parse_mode: "HTML"})
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔄 Webhook server listening on port ${PORT}`);
});