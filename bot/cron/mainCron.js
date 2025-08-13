// Импорт зависимостей и сервисов
import cron from "node-cron";
import * as database from "../database.js";
import {
  removeUserFromChannel,
  createNotification,
  compareWithCurrentDate,
} from "../tools.js";
import "dotenv/config";

// Ежедневная задача: проверка статусов подписок и уведомлений
cron.schedule("50 9 * * *", async () => {
  let users = await database.dbFindAll();
  for (const item of users) {
    const {
      userId,
      userNotification,
      subscriptionEnd,
      startNotificationMessage,
      userActive,
    } = item;
    if (!userActive) continue; // Пропуск неактивных пользователей

    // Если пользователь ещё не получил уведомление, но пора уведомить
    if (!userNotification) {
      if (compareWithCurrentDate(startNotificationMessage) <= 0) {
        await database.dbSetNotification(userId, true);
        console.log(userId, "start notification");
      }
    } else {
      // Если подписка закончилась — отключаем пользователя
      if (compareWithCurrentDate(subscriptionEnd) <= 0) {
        console.log(userId, "User disable");
        await database.dbSetUserActive(userId, false);
        await database.dbSetNotification(userId, false);
        await removeUserFromChannel(process.env.TELEGRAM_CHANNEL_ID, userId);
        await bot.sendMessage(
          userId,
          `Привет! Срок действия платной подписки истёк.` +
            `Спасибо тебе огромное за то, что был со мной и поддерживал меня в течение этого времени! Я очень ценю, что ты выбрал мой платный Telegram-канал.` +
            `Буду очень рад видеть тебя снова в числе моих подписчиков!\nУдачи! 💪`,
          { parse_mode: "HTML" }
        );
      }
    }
  }
});

// Ежедневная задача: массовая рассылка уведомлений пользователям
cron.schedule("55 9 * * *", async () => {
  await createNotification();
});
