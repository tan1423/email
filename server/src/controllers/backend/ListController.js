const Logs = require("../../utils/Logs.js");
const Response = require("../../utils/Response.js");
const {
  verifySingleEmail,
  uploadFile,
  getBulkStatus,
  startBulkEmailVerification,
  removeBulkEmailList,
  calculateStats,
  streamDownloadFromBouncify,
} = require("../../services/bouncify-services.js");
const EmailList = require("../../models/EmailList.js");
const FormData = require("form-data");
const { body, validationResult } = require("express-validator");
const CreditService = require("../../services/credit-service.js");
const BouncifyStatus = require("../../utils/bouncify-status-util.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  /**
   * Get All The List Of Uploaded File
   * @param {*} req
   * @param {*} res
   */
  getAllList: async (req, res) => {
        const userId = req?.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const status = req.query.status || "";
        const skip = (page - 1) * limit;

        try {
            const filterCriteria = { userId };

            // Add search filter for listName (case-insensitive)
            if (search) {
                filterCriteria.listName = { $regex: search, $options: "i" };
            }


            // Add status filter if it's not "all" or empty
            if (status && status.toLowerCase() !== "all") {
                filterCriteria.status = status.toUpperCase(); // Ensure status is case-consistent
            }

            // Aggregate to get total counts of each status
            const totalEmaildata= await EmailList.aggregate([
                     {$group:{
                        _id:"$status",
                        total: {$sum: 1},
                     }}
            ]);

            // Convert the aggregation result to an object for easier access
            const totalEmailCounts = totalEmaildata.reduce((acc, item) => {
                acc[item._id] = item.total;
                return acc;
            }, {});

           

            const emailLists = await EmailList.find(filterCriteria)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Fetch total count for pagination metadata
            const totalEmailLists = await EmailList.countDocuments(filterCriteria);

            if (emailLists.length > 0) {
                res.status(200).json(
                    Response.success("Email lists fetched successfully", {
                        listData: emailLists,
                        totalEmailLists,
                        page,
                        listsPerPage: limit,
                        totalEmailCounts
                    })
                );
            } else {
                res.status(200).json(
                    Response.success("No email lists found", {
                        listData: [],
                        totalEmailLists: 0,
                        page,
                        listsPerPage: limit,
                        totalEmailCounts
                    })
                );
            }
        } catch (error) {
            Logs.error("Error fetching email lists:", error);
            res.status(500).json(
                Response.error("There was an error while fetching email lists", error)
            );
        }
    },

  /**
   * Get The Single List
   * @param {*} req
   * @param {*} res
   */
  getListById: async (req, res) => {
    try {
      const file = await EmailList.findById(req.params.listId);
      if (!file) {
        return res.status(404).json(Response.error("File Not Found"));
      }
      return res
        .status(200)
        .json(Response.success("data fetch successfully", file));
    } catch (error) {
      Logs.error("unable to get data:", error);
      res.status(500).json(Response.error("Internal Server Error", error));
    }
  },

  /**
   * Download  The Verified  List
   * @param {*} req
   * @param {*} res
   */
  download: async (req, res) => {
    // Check if list id is provided
    const downloadType = req.query.type;
    if (!req.params.jobId) {
      res.status(400).send(Response.error("List id is required", {}));
      return;
    }
    try {
      // Download verification result using bouncify api
      const response = await axios({
        method: "POST",
        url: `${process.env.BOUNCIFY_API_URL}/download?jobId=${req.params.jobId}&apikey=${process.env.BOUNCIFY_API_KEY}`,
        responseType: "stream",
        body:
          !downloadType || downloadType === "all"
            ? {
                filterResult: [
                  "deliverable",
                  "undeliverable",
                  "accept_all",
                  "unknown",
                ],
              }
            : { filterResult: [downloadType] },
      });
      // Check if response was successful
      if (response.data.success === false) {
        res
          .status(400)
          .send(Response.error("Failed to download verification result", {}));
        return;
      }
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Verification_Result.csv"'
      );
      res.setHeader("Content-Type", "text/csv");
      response.data.pipe(res);
    } catch (err) {
      Logs.error(err);
      res
        .status(400)
        .send(
          Response.error("There is some  error while downloading report", {})
        );
    }
  },

  /**
   * Validate Single Email Using Bouncify API
   * @param {*} req
   * @param {*} res
   */
  validateSingleEmail: async (req, res) => {
    try {
      //  Validation Rules For Request Body
      const validationRules = [
        body("email", "Email is required").notEmpty().escape(),
        body("email", "Invalid email format").isEmail(),
      ];

      // Run Validation Rules
      await Promise.all(
        validationRules.map(async (rule) => await rule.run(req))
      );
      const errors = validationResult(req);

      // Handle Validation Errors
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(Response.error("Invalid Email", errors.array()));
      }
      const { email } = req.body;

      if (!email) {
        return res.status(400).json(Response.error("Email is required"));
      }

      // Check User Has Enough Credit Or NOt
      const hasCredits = await CreditService.hasEnoughCredits(
        req?.session?.passport?.user.id,
        1
      );
      if (!hasCredits) {
        return res.status(400).json(Response.error("Insufficient credits"));
      }

      // Call The Service To Validate A Single Email
      const result = await verifySingleEmail(email);

      // Deduct credits After verification Completed
      if (result) {
        await CreditService.deductCredits(
          req.user.id,
          1,
          `Used In Verifying Email: ${email}`,
          "VERIFIED_EMAIL"
        );
      }

      return res
        .status(200)
        .json(Response.success("Email validation result", result));
    } catch (err) {
      Logs.error("Single Email Verify Error: ", err);
      return res.status(500).json(Response.error("Internal Server Error"));
    }
  },

  /**
   * Upload The CSV File On Server As Well As IN Bouncify
   * @param {*} req
   * @param {*} res
   */
  uploadList: async (req, res) => {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json(Response.error("No File uploaded"));
      }
      if (file.size > 10 * 1024 * 1024) {
        // Limit file size to 10MB
        return res
          .status(400)
          .json(Response.error("File size exceeds 5MB limit"));
      }
      const formData = new FormData();
      formData.append("local_file", file.buffer, {
        filename: file.originalname,
        contentType: "text/csv",
      });
      // Upload To Bouncify
      const bouncifyResponse = await uploadFile(formData);

      // Calculate Total Emails In The File
      const fileContent = file.buffer.toString();
      const totalEmails = (fileContent.match(/@/g) || []).length;

      // Create File Document
      const fileDoc = await EmailList.create({
        userId: req.user.id,
        filename: file.filename,
        listName: file.originalname,
        totalEmails,
        size: file.size,
        status: "UNPROCESSED",
        uploadedAt: new Date(),
        jobId: bouncifyResponse?.job_id,
      });

      return res
        .status(201)
        .json(Response.success("File uploaded successfully", fileDoc));
    } catch (error) {
      Logs.error("File upload error:", error);
      return res.status(500).json(Response.error("Internal Server Error"));
    }
  },

  /**
   * Validate Bulk Email Using Bouncify API
   * @param {*} req
   * @param {*} res
   */
  validateBulkEmail: async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json(Response.error("Job ID is required"));
      }

      // Check For Valid Job Id
      const existingJob = await EmailList.findOne({ jobId });
      if (!existingJob) {
        return res.status(404).json(Response.error("File Not Found"));
      }

      // Check User Has Enough Credit Or NOt
      const requiredCredits = existingJob.totalEmails;
      const hasCredits = await CreditService.hasEnoughCredits(
        req?.session?.passport?.user.id,
        requiredCredits
      );
      if (!hasCredits) {
        return res.status(400).json(Response.error("Insufficient credits"));
      }

      // Validate Bulk Email Using Bouncify API
      const result = await startBulkEmailVerification(jobId);

      // Get The Status Of File
      const listStatus = BouncifyStatus[result.status];

      // Update The File Status In The Database
      const fileDoc = await EmailList.findOneAndUpdate(
        { report: { jobId } },
        { status: listStatus },
        { new: true }
      );
      return res
        .status(200)
        .json(Response.success("verification Started", fileDoc));
    } catch (err) {
      Logs.error("Bulk Verification Error: ", err);
      return res.status(500).json(Response.error("Internal Server Error"));
    }
  },

  /**
   * Get The Status Of Bulk Email List
   * @param {*} req
   * @param {*} res
   */
  getStatus: async (req, res) => {
    try {
      const { jobId } = req.query;
      // Check For Valid Job Id
      const existingJob = await EmailList.findOne({ jobId: jobId });
      if (!existingJob) {
        Logs.error(`jobId not found in database: ${jobId}`);
        return res.status(404).json(Response.error("File Not Found"));
      }

      const response = await getBulkStatus(jobId);
      if (!response || !response.status) {
        return res.status(404).json(Response.error("Status not found "));
      }

      // Deduct credits After verification Completed
      const requiredCredits = response?.verified;
      if (response.status === "completed") {
        await CreditService.deductCredits(
          req.user.id,
          requiredCredits,
          `Used In Verifying "${existingJob?.listName}" List`,
          "VERIFIED_LIST"
        );
      }

      const updatedStatus = BouncifyStatus[response.status];

      const updatedReport = {
        report: {
          status: response?.status,
          total: response?.total || 0,
          verified: response?.verified || 0,
          pending: response?.pending || 0,
          analysis: {
            common_isp: response?.analysis?.common_isp || 0,
            role_based: response?.analysis?.role_based || 0,
            disposable: response?.analysis?.disposable || 0,
            spamtrap: response?.analysis?.spamtrap || 0,
            syntax_error: response?.analysis?.syntax_error || 0,
          },
          results: {
            deliverable: response?.results?.deliverable || 0,
            undeliverable: response?.results?.undeliverable || 0,
            accept_all: response?.results?.accept_all || 0,
            unknown: response?.results?.unknown || 0,
          },
        },
      };
      // Update the status in the database
      const updatedEmailList = await EmailList.findOneAndUpdate(
        { jobId },
        {
          $set: {
            status: updatedStatus,
            ...updatedReport,
          },
        },
        { new: true }
      );
      if (!updatedEmailList) {
        return res
          .status(404)
          .json(Response.error("Failed to update document"));
      }
      return res
        .status(200)
        .json(Response.success("Data Fetched Successfully", updatedEmailList));
    } catch (error) {
      Logs.error("Error In Fetching List Status: ", error);
      return res.status(500).json(Response.error("Internal Server Error"));
    }
  },

  /**
   * Delete The  Bulk Email List
   * @param {*} req
   * @param {*} res
   */
  deleteBulkEmailList: async (req, res) => {
    try {
      // Validation Rule for jobId
      await body("jobId")
        .notEmpty()
        .withMessage("jobId is required")
        .isString()
        .withMessage("jobId must be a valid string")
        .run(req);

      // Check Validation Result
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(Response.error("Validation failed", errors.array()));
      }
      const { jobId } = req.body;

      // Check if the list exists and belongs to the user
      const list = await EmailList.findOne({
        jobId: jobId,
        userId: req?.session?.passport?.user.id,
      });

      if (!list) {
        return res.status(404).json(Response.error("List not found "));
      }

      // Delete List From Bouncify Server
      const response = await removeBulkEmailList(jobId);
      if (!response || !response.success) {
        return res.status(404).json(Response.error("Status not found "));
      }
      // Delete the list From DataBase
      await EmailList.findByIdAndDelete(list?._id);

      return res
        .status(200)
        .json(Response.success("List deleted successfully"));
    } catch (error) {
      Logs.error("Error in deleting list: ", error);
      return res.status(500).json(Response.error("Internal Server Error"));
    }
  },

  /**
   * Get The Stats Of The  Bulk Email List
   * @param {*} req
   * @param {*} res
   */
  getStats: async (req, res) => {
    try {
      const stats = await calculateStats(req.user.id);
      return res
        .status(200)
        .json(Response.success("Stats fetched successfully", stats));
    } catch (error) {
      Logs.error("Error in fetching stats: ", error);
      return res.status(500).json(Response.error("Error fetching stats"));
    }
  },
};
