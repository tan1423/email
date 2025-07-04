const axios = require("axios");
require("dotenv").config();
const mongoose = require("mongoose");
const EmailList = require("../models/EmailList");

const BOUNCIFY_API_URL = process.env.BOUNCIFY_API_URL;
const BOUNCIFY_API_KEY = process.env.BOUNCIFY_API_KEY;

const verifySingleEmail = async (email) => {
  try {
    const response = await axios.get(
      `${BOUNCIFY_API_URL}/verify?apikey=${BOUNCIFY_API_KEY}&email=${email}`
    );
    return response.data;
  } catch (error) {
    console.error("Single email verification error:", error.response?.data || error.message);
    if (error.response) {
      throw new Error(
        `Bouncify API Error: ${error.response.status} - ${
          error.response.data?.message || error.response.data?.error || "Unknown Error"
        }`
      );
    }
    throw new Error("Unexpected Error During Email Validation");
  }
};

const uploadFile = async (formData) => {
  try {
    console.log("Uploading file to Bouncify...");
    const response = await axios({
      method: "POST",
      url: `${BOUNCIFY_API_URL}/bulk`,
      params: {
        apikey: BOUNCIFY_API_KEY,
      },
      data: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log("File upload response:", response.data);
    return response.data;
  } catch (error) {
    console.error("File upload error:", error.response?.data || error.message);
    if (error.response) {
      throw new Error(
        `Bouncify API Upload Error: ${error.response.status} - ${
          error.response.data?.message || error.response.data?.error || "Unknown Error"
        }`
      );
    }
    throw new Error("Unexpected Error During List Upload");
  }
};

const startBulkEmailVerification = async (jobId) => {
  try {
    console.log(`Starting bulk verification for jobId: ${jobId}`);
    console.log(`API URL: ${BOUNCIFY_API_URL}/bulk/${jobId}?apikey=${BOUNCIFY_API_KEY}`);
    
    const response = await axios.patch(
      `${BOUNCIFY_API_URL}/bulk/${jobId}?apikey=${BOUNCIFY_API_KEY}`,
      { action: "start" },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log("Bulk verification start response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Bulk verification start error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: `${BOUNCIFY_API_URL}/bulk/${jobId}?apikey=${BOUNCIFY_API_KEY}`
    });
    
    if (error.response) {
      throw new Error(
        `Bouncify API Bulk Error: ${error.response.status} - ${
          error.response.data?.message || 
          error.response.data?.error || 
          JSON.stringify(error.response.data) || 
          "Unknown Error"
        }`
      );
    }
    throw new Error("Unexpected Error During Bulk Email Validation");
  }
};

const streamDownloadFromBouncify = async (jobId, downloadType = 'all') => {
  try {
    const filterResult = downloadType === 'all'
      ? ["deliverable", "undeliverable", "accept_all", "unknown"]
      : [downloadType];

    const response = await axios({
      method: "POST",
      url: `${BOUNCIFY_API_URL}/download?jobId=${jobId}&apikey=${BOUNCIFY_API_KEY}`,
      responseType: "stream",
      data: { filterResult },
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Download stream error:", error.response?.data || error.message);
    throw new Error(
      `Download failed: ${error.response?.data?.message || error.message}`
    );
  }
};


const getBulkStatus = async (jobId) => { // Fixed: Added missing jobId parameter
  try {
    console.log(`Getting status for jobId: ${jobId}`);
    const response = await axios.get(
      `${BOUNCIFY_API_URL}/bulk/${jobId}?apikey=${BOUNCIFY_API_KEY}`
    );
    console.log("Status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get bulk status error:", error.response?.data || error.message);
    if (error.response) {
      throw new Error(
        `Bouncify API Error: ${error.response.status} - ${
          error.response.data?.message || 
          error.response.data?.error || 
          error.response.data?.result || 
          "Unknown Error"
        }`
      );
    }
    throw new Error(
      "Unexpected Error Occurred While Retrieving Bulk Email List Status"
    );
  }
};

const removeBulkEmailList = async (jobId) => {
  try {
    console.log(`Deleting bulk list for jobId: ${jobId}`);
    const response = await axios.delete(
      `${BOUNCIFY_API_URL}/bulk/${jobId}?apikey=${BOUNCIFY_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Delete bulk list error:", error.response?.data || error.message);
    if (error.response) {
      throw new Error(
        `Bouncify API Error: ${error.response.status} - ${
          error.response.data?.message || 
          error.response.data?.error || 
          error.response.data?.result || 
          "Unknown Error"
        }`
      );
    }
    throw new Error(
      "Unexpected Error Occurred While Deleting the Bulk Email List"
    );
  }
};

const downloadBulkEmailList = async (jobId) => {
  try {
    // Fixed URL format
    const response = await axios.post(
      `${BOUNCIFY_API_URL}/download?jobId=${jobId}&apikey=${BOUNCIFY_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Download bulk list error:", error.response?.data || error.message);
    if (error.response) {
      throw new Error(
        `Bouncify API Error: ${error.response.status} - ${
          error.response.data?.message || 
          error.response.data?.error || 
          error.response.data?.result || 
          "Unknown Error"
        }`
      );
    }
    throw new Error(
      "Unexpected Error Occurred While Downloading the Bulk Email List"
    );
  }
};

const calculateStats = async (userId) => {
  try {
    const stats = await EmailList.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalEmails: { $sum: "$totalEmails" },
          deliverable: { $sum: "$report.results.deliverable" },
          undeliverable: { $sum: "$report.results.undeliverable" },
          acceptAll: { $sum: "$report.results.accept_all" },
          unknown: { $sum: "$report.results.unknown" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalEmails: 0,
        deliverable: 0,
        undeliverable: 0,
        acceptAll: 0,
        unknown: 0,
      }
    );
  } catch (error) {
    console.error("Calculate stats error:", error);
    throw error;
  }
};

module.exports = {
  calculateStats,
  downloadBulkEmailList,
  verifySingleEmail,
  uploadFile,
  getBulkStatus,
  removeBulkEmailList,
  startBulkEmailVerification,
  streamDownloadFromBouncify
};