/**
 * Basic Authentication Middleware
 */

const Response = require("../utils/Response-util.js");
const ActivityLog = require("../models/ActivityLog.js");
const passport = require("passport");
const Logs = require("../utils/Logs-util.js");

module.exports = async (req, res, next) => {
  passport.authenticate(
    "basic",
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          throw err;
        }

        if (!user) {
          throw "Invalid access!";
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
            user_id: user.id,
            module_name:
              req.routeOptions && req.routeOptions.module_name
                ? req.routeOptions.module_name
                : "",
            event_source: "api",
            action: req.method,
            url: req.originalUrl,
            data: JSON.stringify(eventData),
          });

          // Save the logs to the database
          await newActivityLog.save();
        }

        req.user = user;
        return next(); // User is authenticated, continue to the next middleware or route handler
      } catch (err) {
        Logs.error(err);
        res.status(401).json(Response.error(err));
      }
    }
  )(req, res); // Pass req and res to the authenticate function
};