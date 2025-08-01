import mongoose from 'mongoose';
import config from './config.js';
import Subscriber from './Subscriber.js';
mongoose.connect(config.MONGO_URI);




export const addSubscriber = async (userId) => {
  await mongoose.model('Subscriber').findOneAndUpdate(
    { userId },
    { $set: { subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    { upsert: true }
  );
};