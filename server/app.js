import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import rankrouter from "./routes/rank.route.js";
import analysisRouter from "./routes/analysis.route.js";
import { startRankTrackingCron } from "./cron/rankTracking.cron.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("server is running...."));
app.use("/api/auth", authRoutes);
app.use("/api/rank", rankrouter);
app.use("/api/analysis", analysisRouter);

// Start Cron jobs
startRankTrackingCron();

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

app.use((err, req, res) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});
export default app;
