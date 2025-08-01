import mongoose from 'mongoose';
import config from './config.js';

mongoose.connect(config.MONGO_URI);

const SubscriberSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  subscriptionEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // +30 дней
});

export const addSubscriber = async (userId) => {
  await mongoose.model('Subscriber').findOneAndUpdate(
    { userId },
    { $set: { subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    { upsert: true }
  );
};