'use strict';

const cors = require('cors');
const { env } = require('./env');

const whitelist = [env.CLIENT_URL];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, Postman, server-to-server) and the app origin.
    if (!origin || whitelist.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600,
};

module.exports = cors(corsOptions);
