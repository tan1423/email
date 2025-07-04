const mongoose = require('mongoose');
const CreditService = require('../../services/credit-service.js');
const Logs = require('../../utils/Logs-util.js');
const Response = require('../../utils/Response-util.js');
const { body, validationResult } = require('express-validator');
const Credit = require('../../models/Credits.js');

const creditController = {

    /**
    * Get The List Credit Balance
    * @param {*} req 
    * @param {*} res 
    */
    getCreditBalance: async (req, res) => {
        try {
            const userId = req.user.id;

            // Aggregation Pipeline
            const creditSummary = await Credit.aggregate([
                {
                    $match: { userId: new mongoose.Types.ObjectId(userId) },
                },
                {
                    $project: {
                        _id: 1,
                        totalCredits: 1,
                        usedCredits: 1,
                        remainingCredits: 1
                    }
                }
            ]);

            // Handle No Results
            if (creditSummary.length === 0) {
                return res.status(200).json(Response.success("No credit data found for this user", {
                    totalCredits: 0,
                    usedCredits: 0,
                    remainingCredits: 0
                }));
            }

            return res.status(200).json(Response.success("Credit summary retrieved successfully", creditSummary[0]));

        } catch (error) {
            Logs.error("Error fetching credit summary: ", error);
            return res.status(500).json(Response.error('Internal Server Error'));
        }
    },

    /**
    * Add Credit To The User Accounts (Only Admin)
    * @param {*} req 
    * @param {*} res 
    */
    addCreditsToUser: async (req, res) => {
        try {
            // Validation Rules for Request Body
            const validationRules = [
                body('userId', 'Invalid user ID').custom((value) => mongoose.Types.ObjectId.isValid(value)),
                body('amount', 'Credit amount is required').notEmpty(),
                body('amount', 'Credit amount must be greater than zero').isFloat({ gt: 0 }),
                body('description').optional().escape(),
            ];

            // Run Validation Rules
            await Promise.all(validationRules.map(async (rule) => await rule.run(req)));
            const errors = validationResult(req);

            // Handle Validation Errors
            if (!errors.isEmpty()) {
                return res.status(400).json(Response.error('Validation failed', errors.array()));
            }

            const { userId, amount, description, status } = req.body;
            const updatedCredit = await CreditService.addCredits(
                userId,
                amount,
                description || "Credits added by admin",
                status || "ADDED"
            );

            return res.status(200).json(Response.success("Credits added successfully", updatedCredit));

        } catch (error) {
            Logs.error("Error adding credits: ", error);
            return res.status(500).json(Response.error('Internal Server Error'));
        }
    },

    /**
    * Get The List Credit history
    * @param {*} req 
    * @param {*} res 
    */
    creditHistory: async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const frontendStatus = req.query.status || "";
        const skip = (page - 1) * limit;

        const getSchemaStatus = (frontendStatus) => {
            const statusMap = {
                'Added': 'ADDED',
                'Verified Email': 'VERIFIED_EMAIL',
                'Verified List': 'VERIFIED_LIST'
            };
            return statusMap[frontendStatus] || '';
        };
        const status = frontendStatus === 'all' ? '' : getSchemaStatus(frontendStatus);
        try {
            const creditDetails = await CreditService.getCreditDetails(req.user.id, {
                page,
                limit,
                skip,
                search,
                status,
            });

            if (creditDetails.data.length > 0) {
                res.status(200).json(
                    Response.success("Credit history successfully fetched", creditDetails)
                );
            } else {
                res.status(200).json(
                    Response.success("No credit history found", {
                        data: [],
                        totalCredits: 0,
                        page,
                        creditsPerPage: limit,
                    })
                );
            }
        } catch (error) {
            Logs.error("Error fetching credit history:", error);
            res
                .status(500)
                .json(
                    Response.error("There is some error while getting credit history", {})
                );
        }
    },

};

module.exports = creditController;