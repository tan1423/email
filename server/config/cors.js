const cors = require('cors');
const allowedDomains = ['localhost:1337', 'pabbly.com', 'localhost:3031', 'localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // console.log("Request Origin:", origin);

    if (!origin) {
      // Allow Postman or curl
      return callback(null, true);
    }

    const regex = new RegExp(`^https?:\/\/([a-zA-Z0-9-]+\\.)*(${allowedDomains.join('|').replace(/\./g, '\\.')})$`);
    if (regex.test(origin)) {
      return callback(null, true);
    } else {
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      return callback(error, false);
    }
  },
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders:
    'Content-Type, Content-Length, Accept-Encoding, X-Requested-With, Authorization, accept, file-name,x-csrf-token',
  optionsSuccessStatus: 200,
  credentials: true,
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;