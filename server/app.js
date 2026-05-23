import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import rankrouter from "./routes/rank.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("server is running...."));
app.use("/api/auth", authRoutes);
app.use("/api/rank", rankrouter);

export default app;
