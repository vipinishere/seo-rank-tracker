import express from "express";
import { configDotenv } from "dotenv";
import connectDB from "./config/db.js";
configDotenv();

const app = express();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
});
