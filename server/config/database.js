const dotenv = require("dotenv");
dotenv.config();

const dbType = process.env.DB_TYPE;
let dbConfig;
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, {});
dbConfig = mongoose;

module.exports = dbConfig;
