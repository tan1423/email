const mongoose = require('mongoose');

const EmailListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    listName: {
        type: String,
        required: true
    },
    jobId: {
        type: String
    },
    totalEmails: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['UNPROCESSED', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'UNPROCESSED'
    },
    report: {
        status: { type: String, default: '' },
        total: { type: Number, default: 0 },
        verified: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        analysis: {
            common_isp: { type: Number, default: 0 },
            role_based: { type: Number, default: 0 },
            disposable: { type: Number, default: 0 },
            spamtrap: { type: Number, default: 0 },
            syntax_error: { type: Number, default: 0 }
        },
        results: {
            deliverable: { type: Number, default: 0 },
            undeliverable: { type: Number, default: 0 },
            accept_all: { type: Number, default: 0 },
            unknown: { type: Number, default: 0 }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EmailList', EmailListSchema);