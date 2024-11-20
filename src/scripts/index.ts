// src/scripts/index.ts
import path from "node:path";
import { scanDirectory } from "./scanDirectory";
import { parseFlightLog } from "./parseFlightLog";
import { parseTrackingData } from "./parseTrackingData";
import { mapTelemetryToFrames } from "./mapTelemetryToFrames";
import { prisma } from "../lib/prisma";

async function main() {
  const dataDirectory = process.env.DATA_DIRECTORY || "./data";
  console.log(`Processing data from directory: ${dataDirectory}`);

  try {
    const mappings = scanDirectory(dataDirectory);

    for (const mapping of mappings) {
      const flightName = path.basename(mapping.flightLog, ".csv");
      console.log(`Processing flight: ${flightName}`);

      const flight = await prisma.flight.create({
        data: {
          name: flightName,
          date: new Date(),
          description: `Flight data from ${flightName}`,
          flightLog: mapping.flightLog,
        },
      });

      await parseFlightLog(mapping.flightLog, flight.id);

      for (const { videoFile, trackingFile } of mapping.videos) {
        const videoName = path.basename(videoFile);
        console.log(`Processing video: ${videoName}`);

        try {
          const video = await prisma.video.create({
            data: {
              name: videoName,
              width: 0, // Will be updated from tracking data
              height: 0, // Will be updated from tracking data
              fps: 0, // Will be updated from tracking data
              totalFrames: 0, // Will be updated from tracking data
              filePath: videoFile,
              flightId: flight.id,
            },
          });

          await parseTrackingData(trackingFile, video.id);
        } catch (error) {
          console.error(`Error processing video ${videoName}:`, error);
        }
      }

      await mapTelemetryToFrames(flight.id);
      console.log(`Completed processing flight: ${flightName}`);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
