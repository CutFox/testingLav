import mongoose from "mongoose";
import config from "./config.js";
import Subscriber from "./models/Subscriber.js";
import { addMonths, subDays } from "date-fns";
mongoose.connect(config.MONGO_URI);

export const addSubscriberOneMonth = async (userId) => {
  await mongoose.model("Subscriber").findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), 1), 3),
        subscriptionEnd: addMonths(new Date(), 1),
      },
    },
    { upsert: true }
  );
};
export const addSubscriberTwoMonth = async (userId) => {
  await mongoose.model("Subscriber").findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), 2), 3),
        subscriptionEnd: addMonths(new Date(), 2),
      },
    },
    { upsert: true }
  );
};
export const addSubscriberThreeMonth = async (userId) => {
  await mongoose.model("Subscriber").findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), 3), 3),
        subscriptionEnd: addMonths(new Date(), 3),
      },
    },
    { upsert: true }
  );
};
export const addSubscriberSixMonth = async (userId) => {
  await mongoose.model("Subscriber").findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), 6), 3),
        subscriptionEnd: addMonths(new Date(), 6),
      },
    },
    { upsert: true }
  );
};
export const addSubscriberTwelveMonth = async (userId) => {
  await mongoose.model("Subscriber").findOneAndUpdate(
    { userId },
    {
      $set: {
        startNotificationMessage: subDays(addMonths(new Date(), 12), 3),
        subscriptionEnd: addMonths(new Date(), 12),
      },
    },
    { upsert: true }
  );
};
export const approveUser = async (userId) => {
  return await mongoose.model("Subscriber").findOne({ userId });
};

export const dbfind = async (userId) => {
  return await mongoose.model("Subscriber").find({}, { _id: 0 });
};
export const dbStartNotification = async (userId,value) => {
  return await mongoose.model("Subscriber").updateOne({userId}, { $set :{userNotifacation: value} });
};
export const dbUserActive = async (userId,value) => {
  return await mongoose.model("Subscriber").updateOne({userId}, { $set :{userActive: value} });
};
export const dbfindNotificate = async (userId) => {
  return await mongoose.model("Subscriber").find({userNotifacation:true}, { _id: 0 });
};