import serverless from 'serverless-http';
import { createApp } from '../../server.js';
import { connectDB } from '../../server/config/db.js';
import { seedAdmin } from '../../server/controllers/authController.js';

let app;
let initialized = false;

async function init() {
  if (initialized) return;
  await connectDB();
  await seedAdmin();
  app = createApp();
  initialized = true;
}

export const handler = async (event, context) => {
  await init();
  return serverless(app)(event, context);
};
