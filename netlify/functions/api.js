const serverless = require('serverless-http');
const app = require('../../backend/src/app');
const connectDB = require('../../backend/src/config/db');

let databaseReady = false;

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!databaseReady) {
    await connectDB();
    databaseReady = true;
  }

  return handler(event, context);
};