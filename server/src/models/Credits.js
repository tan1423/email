const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalCredits: {
        type: Number,
        default: 0
    },
    usedCredits: {
        type: Number,
        default: 0
    },
    remainingCredits: {
        type: Number,
        default: 0
    },
    history: [{
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['DEDUCTION', 'ADDITION'],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['ADDED', 'VERIFIED_LIST', "VERIFIED_EMAIL"],
            default: 'ADDED'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true
});


module.exports = mongoose.model('Credit', CreditSchema);