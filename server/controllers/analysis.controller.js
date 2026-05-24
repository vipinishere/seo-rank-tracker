import Analysis from "../models/analysis.model.js";
import { analyzeSeoData } from "../services/gemini.service.js";
import { scrapeUrl } from "../services/scapper.service.js";

// Analyze a URL
export const analyzeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "URL is required" });
    }

    // Validate URL format
    let validUrl;
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid URL format" });
    }

    // Create analysis record with pending status
    const analysis = await Analysis.create({
      userId: req.userId,
      url: validUrl.href,
      status: "processing",
    });

    res.json({
      success: true,
      message: "URL analysis started",
      analysisId: analysis._id,
    });

    // Run the scraping and analysis in the background
    try {
      // step 1: scrape the url with browserbase and playwright
      const scrapeResult = await scrapeUrl(validUrl.href);
      if (!scrapeResult.success) {
        analysis.status = "failed";
        await analysis.save();
        return;
      }

      // step 2: analyze with Gemini Ai
      const aiResult = await analyzeSeoData(scrapeResult.data);

      if (!aiResult) {
        analysis.status = "failed";
        await analysis.save();
        return;
      }

      // step 3: save results to database
      analysis.overallScore = aiResult.data.overallScore || 0;
      analysis.categories = aiResult.data.categories || {};
      analysis.metaData = scrapeResult.data.metaData || {};
      analysis.headings = scrapeResult.data.headings || {};
      analysis.links = scrapeResult.data.links || {};
      analysis.images = scrapeResult.data.images || {};
      analysis.keywords = aiResult.data.keywords || [];
      analysis.issues = aiResult.data.issues || [];
      analysis.loadTime = scrapeResult.data.loadTime || 0;
      analysis.pageSize = scrapeResult.data.pageSize || 0;
      analysis.wordCount = scrapeResult.data.wordCount || 0;
      analysis.status = "completed";
      await analysis.save();
    } catch (bgError) {
      console.error("Background analysis error:", bgError.message);
      try {
        analysis.status = "failed";
        await analysis.save();
      } catch (saveError) {
        console.error("Failed to save failed status", saveError.message);
      }
    }
  } catch (error) {
    console.error("Analyze URL error:", error.message);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
};

// Get analyze by Id
export const getAnalyzeById = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!analysis)
      return res
        .status(404)
        .json({ success: false, message: "Analysis not found" });

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Get analysis by ID error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get all analyses for user
export const getAllAnalyses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-issues -keywords");

    const total = await Analysis.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      analyses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get all analyses error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Delete analysis

export const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    res.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Delete analysis error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
