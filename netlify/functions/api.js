import serverless from 'serverless-http';
import { createApp } from '../../server.js';
import { connectDB, isConnected } from '../../server/config/db.js';
import { seedAdmin } from '../../server/controllers/authController.js';

let app;

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

function databaseUnavailable(err) {
  console.error('API boot error:', err);
  return jsonResponse(500, {
    success: false,
    message: 'Backend database is unreachable. If this site runs on Netlify, verify that MONGODB_URI is set in Site configuration → Environment variables, that MongoDB Atlas Network Access allows connections from 0.0.0.0/0, and that the function was redeployed after adding the variables.'
  });
}

export const handler = async (event, context) => {
  // Reuse warm connections between invocations instead of keeping the
  // function alive waiting for the event loop to drain.
  context.callbackWaitsForEmptyEventLoop = false;

  if (!app) {
    app = createApp();
  }

  // Connect lazily on the first request and transparently reconnect if the
  // connection dropped (cold start, transient Atlas failure, etc.). Errors
  // are returned as structured JSON responses instead of crashing the
  // function, which Netlify would otherwise report as a bare 502.
  if (!isConnected()) {
    try {
      await connectDB();
      await seedAdmin();
    } catch (err) {
      return databaseUnavailable(err);
    }
  }

  try {
    return await serverless(app)(event, context);
  } catch (err) {
    console.error('API request error:', err);
    return jsonResponse(500, {
      success: false,
      message: 'API request failed while handling the request.'
    });
  }
};
