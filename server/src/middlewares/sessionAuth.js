/**
 * Session Authentication Middleware
 */

const Response = require('../utils/Response');
const ActivityLog = require('../models/ActivityLog');

module.exports = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(400).json(Response.error("Please login first!"));
  }

  /**
   * Creating activity log
   */
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    let eventData = req.body;
    if (eventData && eventData.password) {
      delete eventData.password;
    }

    const newActivityLog = new ActivityLog({
      user_id: req.user.id,
      module_name:
        req.routeOptions && req.routeOptions.module_name
          ? req.routeOptions.module_name
          : "",
      event_source: "user",
      action: req.method,
      url: req.originalUrl,
      data: JSON.stringify(eventData),
    });

    // Save the logs to the database
    await newActivityLog.save();
  }

  return next(); // User is authenticated, continue to the next middleware or route handler
};