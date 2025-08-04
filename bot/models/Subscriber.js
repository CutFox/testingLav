import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true },
    userActive: { type: Boolean, required: true, default: true },
    startNotificationMessage: {
      type: Date,
    },
    subscriptionEnd: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscriber", subscriberSchema);
