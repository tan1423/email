const multer = require('multer');
const path = require('path');
const Logs = require('../utils/Logs'); // Make sure the path is correct
const Response = require('../utils/Response'); // Make sure the path is correct

// Middleware to handle Multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    Logs.error('Multer error:', err.message);
    return res.status(422).json(Response.failed('File upload error: ' + err.message));
  } else if (err) {
    // Handle custom or general errors
    Logs.error('Multer error:', err.message);
    return res.status(400).json(Response.failed('Upload failed: ' + err.message));
  }
  next();
};

// Use in-memory storage (buffer-based, not file system)
const storage = multer.memoryStorage();

// File upload configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (ext !== '.csv') {
      return cb(new Error('Only .csv files are allowed'));
    }

    // Allow common CSV MIME types
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!allowedMimeTypes.includes(mime)) {
      return cb(new Error('Invalid MIME type for CSV'));
    }

    cb(null, true);
  },
});

module.exports = { upload, handleMulterError };
