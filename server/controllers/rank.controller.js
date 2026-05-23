// Add a keyword to track

import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTracking.service.js";

export const addKeyword = async (req, res) => {
  try {
    const { keyword, url } = req.body;

    if (!keyword || !url) {
      return res.status(400).json({
        success: false,
        message: "keyword and Url are required",
      });
    }

    // Extract domain from URL
    let domain;
    try {
      const urlObj = new URL(url.startWith("http") ? url : `https://${url}`);

      domain = urlObj.hostname.replace("www.", "");
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid URL format" });
    }

    // Check if already tracking this keyword + domain
    const existing = await KeywordTracking.findOne({
      userId: req.userId,
      keyword: keyword.toLowerCase().trim(),
      domain,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already tracking this keyword for this domain",
      });
    }

    // Create tracking entry
    const tracking = await KeywordTracking.create({
      userId: req.userId,
      keyword: keyword.toLowerCase().trim(),
      url: url.startWith("http") ? url : `https://${url}`,
      status: "checking",
    });

    res.status(201).json({
      success: true,
      message: "keyword tracking started",
      tracking,
    });

    keywordTracking(tracking);
  } catch (error) {
    console.error("Add Keyword error: ", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Already tracking this keyword",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all tracked keywords for user
export const getKeywords = async (req, res) => {
  try {
    const keywords = await KeywordTracking.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("-rankHistory");

    res.json({
      success: true,
      keywords,
    });
  } catch (error) {
    console.error("Get keyword error", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single keyword with full history
export const getKeyword = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(400).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }
    res.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error("Get single keyword error", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Manually refresh a keyword ranking
export const refreshKeyword = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(400).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    tracking.status = "checking";
    await tracking.save();

    res.json({
      success: true,
      message: "Rank checking started",
    });

    keywordTracking(tracking);
  } catch (error) {
    console.error("Refresh keyword error", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete keyword tracking
export const deleteKeyword = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(400).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    res.json({
      success: true,
      message: "Keyword tracking deleted",
    });

    keywordTracking(tracking);
  } catch (error) {
    console.error("Delete keyword error", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle tracking active / inactive
export const toggleTracking = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(400).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    tracking.active = !tracking.active;

    await tracking.save();

    res.json({
      success: true,
      tracking,
    });

    keywordTracking(tracking);
  } catch (error) {
    console.error("toggle tracking error", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
