import express from "express";
import {
  analyzeUrl,
  deleteAnalysis,
  getAllAnalyses,
  getAnalyzeById,
} from "../controllers/analysis.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const analysisRouter = express.Router();

analysisRouter.post("/analyze", authMiddleware, analyzeUrl);
analysisRouter.get("/list", authMiddleware, getAllAnalyses);
analysisRouter.get("/:id", authMiddleware, getAnalyzeById);
analysisRouter.delete("/:id", authMiddleware, deleteAnalysis);

export default analysisRouter;
