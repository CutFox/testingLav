import mongoose from 'mongoose';



const subscriberSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  subscriptionEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // +30 дней
}, { timestamps: true });

// Регистрируем модель сразу при экспорте
export default mongoose.model('Subscriber', subscriberSchema);