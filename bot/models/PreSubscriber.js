import mongoose from "mongoose";

const presubscriberSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true },
    msgId:{ type: Number, required: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model("PreSubscriber", presubscriberSchema);
