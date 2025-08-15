
// Импорт зависимостей и моделей
import mongoose from "mongoose";
import "dotenv/config";
import Subscriber from "./models/Subscriber.js";
import PreSubscriber from "./models/PreSubscriber.js";
import { addMonths, subDays } from "date-fns";

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI);


/**
 * Добавляет или обновляет подписчика на заданное количество месяцев
 * @param {string|number} userId - ID пользователя
 * @param {number} months - срок подписки в месяцах
 * @returns {Promise<void>}
 */
export const addSubscriber = async (userId, months) => {
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

/**
 * Быстрые алиасы для добавления подписки на разные сроки (для совместимости)
 */
export const addSubscriberOneMonth = (userId) => addSubscriber(userId, 1);
export const addSubscriberTwoMonth = (userId) => addSubscriber(userId, 2);
export const addSubscriberThreeMonth = (userId) => addSubscriber(userId, 3);
export const addSubscriberSixMonth = (userId) => addSubscriber(userId, 6);
export const addSubscriberTwelveMonth = (userId) => addSubscriber(userId, 12);

/**
 * Добавляет или обновляет "предподписчика" с сообщением
 * @param {string|number} userId - ID пользователя
 * @param {string|number} msgId - ID сообщения
 * @returns {Promise<void>}
 */
export const addPreSubscriber = async (userId, msgId) => {
  await PreSubscriber.findOneAndUpdate(
    { userId },
    { $set: { msgId } },
    { upsert: true }
  );
};

/**
 * Удаляет предподписчика по userId
 * @param {string|number} userId
 * @returns {Promise<void>}
 */
export const delPreSubscriber = async (userId) => {
  try {
    const result = await PreSubscriber.deleteOne({ userId });
    if (result.deletedCount === 0) {
      console.log("Пользователь не найден");
    } else {
      console.log("Пользователь успешно удален");
    }
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
  }
};


/**
 * Проверяет, есть ли пользователь в базе подписчиков
 * @param {string|number} userId
 * @returns {Promise<Object|null>}
 */
export const approveUser = async (userId) => Subscriber.findOne({ userId });

/**
 * Проверяет, есть ли предподписчик в базе
 * @param {string|number} userId
 * @returns {Promise<Object|null>}
 */
export const approvePreUser = async (userId) => PreSubscriber.findOne({ userId });

/**
 * Возвращает всех подписчиков (без _id)
 * @returns {Promise<Array>}
 */
export const dbFindAll = async () => Subscriber.find({}, { _id: 0 });

/**
 * Устанавливает флаг уведомления для пользователя
 * @param {string|number} userId
 * @param {boolean} value
 * @returns {Promise<Object>}
 */
export const dbSetNotification = async (userId, value) =>
  Subscriber.updateOne({ userId }, { $set: { userNotification: value } });

/**
 * Устанавливает флаг активности пользователя
 * @param {string|number} userId
 * @param {boolean} value
 * @returns {Promise<Object>}
 */
export const dbSetUserActive = async (userId, value) =>
  Subscriber.updateOne({ userId }, { $set: { userActive: value } });

/**
 * Находит пользователей, которым нужно отправить уведомление
 * @returns {Promise<Array>}
 */
export const dbFindNotificationUsers = async () =>
  Subscriber.find({ userNotification: true }, { _id: 0 });

/**
 * Находит всех активных пользователей (для админ-уведомлений)
 * @returns {Promise<Array>}
 */
export const dbFindNotificationUsersAdmin = async () =>
  Subscriber.find({ userActive: true }, { _id: 0 });

/**
 * Находит пользователей, зарегистрированных в заданном интервале дат
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {Promise<Array>}
 */
export const dbFindIntervalDate = async (startDate, endDate) =>
  Subscriber.find({ createdAt: { $gte: startDate, $lte: endDate } }, { _id: 0 });
