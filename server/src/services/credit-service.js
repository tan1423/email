const { default: mongoose } = require('mongoose');
const Credit = require('../models/Credits');

const CreditService = {

    // Initialize credits for a user
    initializeCredits: async (userId) => {
        try {
            const existingCredit = await Credit.findOne({ userId });
            if (existingCredit) {
                return existingCredit;
            }

            return await Credit.create({
                userId,
                totalCredits: 0,
                usedCredits: 0,
                remainingCredits: 0,
            });
        } catch (error) {
            throw error;
        }
    },

    // Check if user has enough credits
    hasEnoughCredits: async (userId, requiredCredits) => {
        const credit = await Credit.findOne({ userId });
        if (!credit) return false;

        // Check if credits have expired
        if (credit.validTill && new Date() > credit.validTill) {
            return false;
        }

        return credit.remainingCredits >= requiredCredits;
    },

    // Deduct credits
    deductCredits: async (userId, amount, description, status) => {
        try {
            const credit = await Credit.findOne({ userId });

            if (!credit) {
                throw new Error('Credit record not found');
            }

            if (credit.remainingCredits < amount) {
                throw new Error('Insufficient credits');
            }


            const updatedCredit = await Credit.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        usedCredits: amount,
                        remainingCredits: -amount
                    },
                    $push: {
                        history: {
                            amount,
                            type: 'DEDUCTION',
                            description,
                            status,
                            createdAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            return updatedCredit;
        } catch (error) {
            throw error;
        }
    },

    // Add credits
    addCredits: async (userId, amount, description, status) => {
        try {
            let credit = await Credit.findOne({ userId });

            if (!credit) {
                credit = await CreditService.initializeCredits(userId);
            }


            const updatedCredit = await Credit.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        totalCredits: amount,
                        remainingCredits: amount
                    },
                    $push: {
                        history: {
                            amount,
                            type: 'ADDITION',
                            description,
                            status,
                            createdAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            return updatedCredit;
        } catch (error) {
            throw error;
        }
    },

    // Get credit History details
    getCreditDetails: async (userId, { page, limit, skip, search, status }) => {
        let filter = { userId: new mongoose.Types.ObjectId(userId) };
        const searchFilter = search ? { "history.description": { $regex: search, $options: "i" } } : {};

        // Handle status filter
        if (status) {
            filter["history.status"] = status;
        }

        filter = { ...filter, ...searchFilter };

        const totalCredits = await Credit.aggregate([
            { $match: filter },
            { $unwind: "$history" },
            { $match: filter },
            { $count: "total" }
        ]);

        const credits = await Credit.aggregate([
            { $match: filter },
            { $unwind: "$history" },
            { $match: filter },
            { $sort: { "history.createdAt": -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    history: {
                        amount: 1,
                        type: 1,
                        description: 1,
                        status: 1,
                        createdAt: 1
                    }
                }
            }
        ]);

        return {
            data: credits.map(c => c.history),
            totalCredits: totalCredits[0]?.total || 0,
            page,
            creditsPerPage: limit
        };
    }
};



module.exports = CreditService;