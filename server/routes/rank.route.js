import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  addKeyword,
  deleteKeyword,
  getKeyword,
  getKeywords,
  refreshKeyword,
  toggleTracking,
} from "../controllers/rank.controller.js";

const rankrouter = express.Router();

rankrouter.post("/add", authMiddleware, addKeyword);

rankrouter.get("/list", authMiddleware, getKeywords);

rankrouter.get("/:id", authMiddleware, getKeyword);

rankrouter.post("/:id/refresh", authMiddleware, refreshKeyword);

rankrouter.put("/:id/toggle", authMiddleware, toggleTracking);

rankrouter.delete("/:id", authMiddleware, deleteKeyword);

export default rankrouter;
