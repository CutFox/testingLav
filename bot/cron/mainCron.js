import cron from "node-cron";
import * as database from '../database.js'
import { removeUserFromChannel,createNotification,compareWithCurrentDate } from "../tools.js";
import "dotenv/config";

cron.schedule("38 10 * * *", async () => {
  let users = await database.dbFindAll();
  for (const item of users) {
    const {
      userId,
      userNotification,
      subscriptionEnd,
      startNotificationMessage,
      userActive,
    } = item;
    if (!userActive) continue;

    if (!userNotification) {
      if (compareWithCurrentDate(startNotificationMessage) <= 0) {
        await database.dbSetNotification(userId, true);
        console.log(userId, "start notification");
      }
    } else {
      if (compareWithCurrentDate(subscriptionEnd) <= 0) {
        console.log(userId, "User disable");
        await database.dbSetUserActive(userId, false);
        await database.dbSetNotification(userId, false);
        await removeUserFromChannel(process.env.TELEGRAM_CHANNEL_ID, userId);
      }
    }
  }
});
cron.schedule("15 11 * * *", async () => {
  await createNotification();
});