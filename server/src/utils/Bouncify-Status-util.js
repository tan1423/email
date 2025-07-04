const BouncifyStatus = {
    "preparing": "UNPROCESSED",      // System is getting ready, corresponds to 'UNPROCESSED' in DB
    "ready": "UNPROCESSED",        // List is ready for verification, corresponds to 'PROCESSING' in DB
    "verifying": "PROCESSING",    // Verification is underway, corresponds to 'PROCESSING' in DB
    "completed": "COMPLETED",     // Verification finished, corresponds to 'COMPLETED' in DB
    "failed": "FAILED"            // Verification failed, corresponds to 'FAILED' (if supported)
};

module.exports = BouncifyStatus