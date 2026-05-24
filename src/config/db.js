const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  // If requested, or no external MONGO_URI provided, spin up in-memory MongoDB for testing
  if (process.env.USE_INMEMORY === 'true' || !uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
    console.log('Using in-memory MongoDB');
  }

  if (!uri) throw new Error('MONGO_URI not configured and in-memory not enabled');

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB');
};

const stopInMemory = async () => {
  if (mongodInstance) {
    await mongoose.disconnect();
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

module.exports = connectDB;
module.exports.stopInMemory = stopInMemory;
