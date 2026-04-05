const mongoose = require('mongoose');
const env = require('./env');

const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
};

module.exports = connectDatabase;
