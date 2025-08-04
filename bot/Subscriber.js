import mongoose from 'mongoose';



const subscriberMountSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  startNotificationMes:{ type: Date, default: () => new Date(Date.now() + 27 * 24 * 60 * 60 * 1000) },
  subscriptionEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // +30 дней
}, { timestamps: true });

// Регистрируем модель сразу при экспорте
export default mongoose.model('SubscriberMount', subscriberMountSchema);