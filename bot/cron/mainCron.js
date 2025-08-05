import cron from "node-cron";
import * as database from '../database.js'
import { removeUserFromChannel,createNotification } from "../server.js";
import "dotenv/config";


cron.schedule("37 23 * * *", async () => {
   function compareWithCurrentDate(date) {
    const inputDate = new Date(date);
    const currentDate = new Date();

    inputDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (inputDate < currentDate) {
      return -1;
    } else if (inputDate > currentDate) {
      return 1;
    } else {
      return 0;
    }
  }
  
  const dbtest = await database.dbfind();
  async function processArray(array) {
    for (const item of array) {
      const {
        userId,
        userNotifacation,
        subscriptionEnd,
        startNotificationMessage,
        userActive,
      } = item;
      if (userActive) {
        if (!userNotifacation) {
          const resulDateNotification = compareWithCurrentDate(
            startNotificationMessage
          );
          if (resulDateNotification <= 0) {
            console.log(userId);
            console.log("start notification");
            await database.dbStartNotification(userId, 1);
          }
        } else {
          const resulDateActive = compareWithCurrentDate(subscriptionEnd);
          if (resulDateActive <= 0) {
            console.log(userId);
            console.log("User disable");
            await database.dbUserActive(userId, 0);
            await database.dbStartNotification(userId, 0);
            await removeUserFromChannel(process.env.TELEGRAM_CHANNEL_ID, userId);
          }
        }
      }
    }
  }
  processArray(dbtest);
});

cron.schedule("37 11 * * *", async () => {
  await createNotification()
  });

