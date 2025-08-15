import mongoose from "mongoose";
import "dotenv/config";
import Subscriber from "./models/Subscriber.js";
import PreSubscriber from "./models/PreSubscriber.js";
import { addMonths, subDays } from "date-fns";

mongoose.connect(process.env.MONGODB_URI);

const updateSubscriber = async (userId, months) => {
  await Subscriber.findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), months), 3),
        subscriptionEnd: addMonths(new Date(), months),
        userActive: true,
        userNotification: false,
      },
    },
    { upsert: true }
  );
};

const updatePreSubscriber = async (userId, msgId) => {
  await PreSubscriber.findOneAndUpdate(
    { userId },
    {
      $set: {
        msgId: msgId,
      },
    },
    { upsert: true }
  );
};

const deletePreSubscriber = async (userId) => {
  try {
    const result = await PreSubscriber.deleteOne({ userId: userId });
    if (result.deletedCount === 0) {
      console.log("Пользователь не найден");
    } else {
      console.log("Пользователь успешно удален");
    }
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
  }
};

export const addSubscriberOneMonth = async (userId) =>
  updateSubscriber(userId, 1);
export const addSubscriberTwoMonth = async (userId) =>
  updateSubscriber(userId, 2);
export const addSubscriberThreeMonth = async (userId) =>
  updateSubscriber(userId, 3);
export const addSubscriberSixMonth = async (userId) =>
  updateSubscriber(userId, 6);
export const addSubscriberTwelveMonth = async (userId) =>
  updateSubscriber(userId, 12);

export const addPreSubscriber = async (userId,msgId) => updatePreSubscriber(userId,msgId);
export const delPreSubscriber = async (userId) => deletePreSubscriber(userId);

export const approveUser = async (userId) => {
  return await Subscriber.findOne({ userId });
};

export const approvePreUser = async (userId) => {
  return await PreSubscriber.findOne({ userId });
};

export const dbFindAll = async () => {
  return await Subscriber.find({}, { _id: 0 });
};

export const dbSetNotification = async (userId, value) => {
  return await Subscriber.updateOne(
    { userId },
    { $set: { userNotification: value } }
  );
};

export const dbSetUserActive = async (userId, value) => {
  return await Subscriber.updateOne(
    { userId },
    { $set: { userActive: value } }
  );
};

export const dbFindNotificationUsers = async () => {
  return await Subscriber.find({ userNotification: true }, { _id: 0 });
};

export const dbFindNotificationUsersAdmin = async () => {
  return await Subscriber.find({ userActive: true }, { _id: 0 });
};

export const dbFindIntervalDate = async (startDate, endDate) => {
  return await Subscriber.find(
    {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    },
    { _id: 0 }
  );
};
