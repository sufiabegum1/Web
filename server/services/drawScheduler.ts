import { storage } from "../storage";
import { lotteryService } from "./lotteryService";
import { lotteryDrawingService } from "./lotteryDrawingService";
import { fakeWinnerService } from "./fakeWinnerService";
import cron from "node-cron";

let schedulerInterval: NodeJS.Timeout | null = null;

export function initializeDrawScheduler() {
  console.log("🎰 Initializing lottery draw scheduler...");
  
  // Check for due draws every 30 seconds for more responsive draws
  schedulerInterval = setInterval(async () => {
    try {
      await checkAndTriggerDueDraws();
    } catch (error) {
      console.error("Error in draw scheduler:", error);
    }
  }, 30000); // Check every 30 seconds

  // Schedule weekly fake winner generation every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    try {
      console.log('🎭 Running weekly fake winner generation...');
      await fakeWinnerService.generateWeeklyFakeWinners();
    } catch (error) {
      console.error('Error in weekly fake winner generation:', error);
    }
  });

  // Also create scheduled draws and initial fake winners on startup
  lotteryService.createScheduledDraws()
    .then(() => console.log("✅ Scheduled draws created successfully"))
    .catch(console.error);
    
  // Add fake winners to recent draws on startup
  setTimeout(async () => {
    try {
      await fakeWinnerService.addFakeWinnersToRecentDraws();
    } catch (error) {
      console.error("Error adding initial fake winners:", error);
    }
  }, 5000); // Wait 5 seconds after startup
}

async function checkAndTriggerDueDraws() {
  // Get all scheduled draws, including past due ones
  const allScheduledDraws = await storage.getScheduledDraws(); // Will create this method
  const now = new Date();

  for (const draw of allScheduledDraws) {
    if (new Date(draw.drawDate) <= now && draw.status === "scheduled") {
      console.log(`Triggering scheduled draw: ${draw.id} (${draw.lottery.type})`);
      try {
        // Use the proper drawing service based on lottery type
        if (draw.lottery.type === 'daily') {
          await lotteryDrawingService.executeDailyDraw(draw.id);
        } else if (draw.lottery.type === 'weekly') {
          await lotteryDrawingService.executeWeeklyDraw(draw.id);
        } else if (draw.lottery.type === 'monthly') {
          await lotteryDrawingService.executeMonthlyDraw(draw.id);
        } else {
          // Fallback to simple lottery service
          await lotteryService.triggerDraw(draw.id);
        }
        console.log(`Draw ${draw.id} (${draw.lottery.type}) completed successfully`);
      } catch (error) {
        console.error(`Failed to trigger draw ${draw.id}:`, error);
      }
    }
  }

  // Create new scheduled draws
  await lotteryService.createScheduledDraws();
}

export function stopDrawScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
