const express = require('express');
const ListController = require('../controllers/backend/ListController.js');
const router = express.Router();
const { upload, handleMulterError } = require('../middlewares/multer-middleware.js');

// Routes for fetching stats
router.get("/stats", ListController.getStats);

// Routes for downloading a list
router.get("/download/:jobId", ListController.download);

// Routes for getting the list
router.get("/", ListController.getAllList);

// Routes for getting the status of a bulk email list
router.get("/get-status", ListController.getStatus);

// Routes for getting details of a specific list
router.get("/:listId", ListController.getListById);

// Route for validating a single email
router.post('/validate-single', ListController.validateSingleEmail);

// Routes for uploading a list to the server
router.post('/', upload.single("file"), handleMulterError, ListController.uploadList);

// Routes for validating a bulk email list
router.post("/validate-bulk", ListController.validateBulkEmail);

// Routes for deleting the bulk email list
router.delete("/", ListController.deleteBulkEmailList);



module.exports = router;