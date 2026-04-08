// import cors from 'cors';
// import { config } from '../config/environment.js';

// const corsOptions = {
//   origin: config.frontendUrl,
//   credentials: true,
//   optionsSuccessStatus: 200,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };

// export const corsMiddleware = cors(corsOptions);

// export default corsMiddleware;


import cors from 'cors';
import { config } from '../config/environment.js';

const corsOptions = {
  // We changed this to a function to dynamically check the incoming request
  origin: function (origin, callback) {
    // Allow requests that don't have an origin (like Postman), or requests from localhost/your IP
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('172.22.77.141')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;