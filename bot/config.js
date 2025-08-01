import 'dotenv/config'

export default {
  TELEGRAM: {
    TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
    ADMIN_IDS: process.env.ADMIN_IDS
  },
  LAVA: {
    SHOP_ID: process.env.LAVA_SHOP_ID,
    SECRET_KEY: process.env.LAVA_SECRET_KEY,
    WEBHOOK_URL: process.env.LAVA_WEBHOOK_URL,
  },
  MONGO_URI: process.env.MONGODB_URI,
};