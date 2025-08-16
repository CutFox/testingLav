// Импорт зависимостей и сервисов
import cron from "node-cron";
// import * as database from "../database.js";
import {
  // removeUserFromChannel,
  createNotification,
  cronUserUpdate,
  // compareWithCurrentDate,
} from "../tools.js";
import "dotenv/config";

// Ежедневная задача: проверка статусов подписок и уведомлений
cron.schedule("50 9 * * *", async () => {
  await cronUserUpdate();
});

// Ежедневная задача: массовая рассылка уведомлений пользователям
export const task = cron.schedule("55 9 * * *", async () => {
  console.log("task");
  await createNotification();
});
