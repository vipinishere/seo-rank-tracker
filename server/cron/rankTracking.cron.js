import cron from "node-cron";
import KeywordTracking from "./../models/keywordTracking.model.js";
import { keywordTracking } from "./../services/keywordTracking.service.js";

export function startRankTrackingCron() {
  // Schedule the cron job to run every day at 6 AM
  cron.schedule("0 6 * * *", async () => {
    console.log("Starting daily rank tracking...", new Date());
    try {
      const activeTracking = await KeywordTracking.find({ active: true });

      for (const tracking of activeTracking) {
        tracking.status = "checking";
        await tracking.save();

        const result = await keywordTracking(tracking);

        // Delay between checks to avoid rate limit
        await new Promise((r) => setTimeout(r, 10000 + Math.random() * 5000));
      }
    } catch (error) {
      console.error("[CRON]Rank tracking cron error:", error);
    }
  });
}
