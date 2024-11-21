/*
  Warnings:

  - You are about to drop the column `flightLog` on the `Flight` table. All the data in the column will be lost.
  - You are about to drop the column `cid` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `conf` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `tid` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `timeFromStartMS` on the `Telemetry` table. All the data in the column will be lost.
  - Added the required column `classId` to the `Object` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `Object` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trackingId` to the `Object` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeFromStart` to the `Telemetry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Telemetry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "logPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Flight" ("createdAt", "date", "description", "id", "name", "updatedAt") SELECT "createdAt", "date", "description", "id", "name", "updatedAt" FROM "Flight";
DROP TABLE "Flight";
ALTER TABLE "new_Flight" RENAME TO "Flight";
CREATE TABLE "new_Frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameIndex" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "altitude" REAL,
    "heading" REAL,
    "videoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Frame_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Frame" ("altitude", "createdAt", "frameIndex", "heading", "id", "latitude", "longitude", "timestamp", "updatedAt", "videoId") SELECT "altitude", "createdAt", "frameIndex", "heading", "id", "latitude", "longitude", "timestamp", "updatedAt", "videoId" FROM "Frame";
DROP TABLE "Frame";
ALTER TABLE "new_Frame" RENAME TO "Frame";
CREATE INDEX "Frame_videoId_frameIndex_idx" ON "Frame"("videoId", "frameIndex");
CREATE UNIQUE INDEX "Frame_videoId_frameIndex_key" ON "Frame"("videoId", "frameIndex");
CREATE TABLE "new_Object" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" INTEGER NOT NULL,
    "frameId" INTEGER NOT NULL,
    "trackingId" INTEGER NOT NULL,
    "bbox" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "pixelSpeed" REAL,
    "groundSpeed" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "courseHeading" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Object_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Object_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Object" ("bbox", "courseHeading", "createdAt", "frameId", "groundSpeed", "id", "latitude", "longitude", "pixelSpeed", "updatedAt", "videoId") SELECT "bbox", "courseHeading", "createdAt", "frameId", "groundSpeed", "id", "latitude", "longitude", "pixelSpeed", "updatedAt", "videoId" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE INDEX "Object_videoId_frameId_idx" ON "Object"("videoId", "frameId");
CREATE INDEX "Object_trackingId_idx" ON "Object"("trackingId");
CREATE TABLE "new_Telemetry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeFromStart" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "altitude" REAL NOT NULL,
    "heading" REAL NOT NULL,
    "isVideo" BOOLEAN NOT NULL,
    "flightId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Telemetry_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Telemetry" ("altitude", "createdAt", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "updatedAt") SELECT "altitude", "createdAt", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "updatedAt" FROM "Telemetry";
DROP TABLE "Telemetry";
ALTER TABLE "new_Telemetry" RENAME TO "Telemetry";
CREATE INDEX "Telemetry_flightId_timeFromStart_idx" ON "Telemetry"("flightId", "timeFromStart");
CREATE TABLE "new_Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" REAL NOT NULL,
    "totalFrames" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "flightId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Video_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("createdAt", "filePath", "flightId", "fps", "height", "id", "name", "totalFrames", "updatedAt", "width") SELECT "createdAt", "filePath", "flightId", "fps", "height", "id", "name", "totalFrames", "updatedAt", "width" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE INDEX "Video_flightId_idx" ON "Video"("flightId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
