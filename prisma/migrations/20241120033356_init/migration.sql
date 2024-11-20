/*
  Warnings:

  - You are about to drop the column `gpsLat` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `gpsLon` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `speed` on the `Object` table. All the data in the column will be lost.
  - You are about to alter the column `timeFromStartMS` on the `Telemetry` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - Added the required column `updatedAt` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Frame` table without a default value. This is not possible if the table is not empty.
  - Made the column `timestamp` on table `Frame` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Object` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Telemetry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "flightLog" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Flight" ("date", "description", "flightLog", "id", "name") SELECT "date", "description", "flightLog", "id", "name" FROM "Flight";
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
    CONSTRAINT "Frame_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Frame" ("frameIndex", "id", "timestamp", "videoId") SELECT "frameIndex", "id", "timestamp", "videoId" FROM "Frame";
DROP TABLE "Frame";
ALTER TABLE "new_Frame" RENAME TO "Frame";
CREATE UNIQUE INDEX "Frame_videoId_frameIndex_key" ON "Frame"("videoId", "frameIndex");
CREATE TABLE "new_Object" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "tid" INTEGER NOT NULL,
    "bbox" TEXT NOT NULL,
    "conf" REAL NOT NULL,
    "cid" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Object_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Object_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Object" ("bbox", "cid", "conf", "frameId", "id", "tid", "videoId") SELECT "bbox", "cid", "conf", "frameId", "id", "tid", "videoId" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE INDEX "Object_videoId_frameId_idx" ON "Object"("videoId", "frameId");
CREATE TABLE "new_Telemetry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeFromStartMS" INTEGER NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "altitude" REAL NOT NULL,
    "heading" REAL NOT NULL,
    "isVideo" BOOLEAN NOT NULL,
    "flightId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Telemetry_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Telemetry" ("altitude", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "timeFromStartMS") SELECT "altitude", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "timeFromStartMS" FROM "Telemetry";
DROP TABLE "Telemetry";
ALTER TABLE "new_Telemetry" RENAME TO "Telemetry";
CREATE INDEX "Telemetry_flightId_timeFromStartMS_idx" ON "Telemetry"("flightId", "timeFromStartMS");
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
    CONSTRAINT "Video_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("filePath", "flightId", "fps", "height", "id", "name", "totalFrames", "width") SELECT "filePath", "flightId", "fps", "height", "id", "name", "totalFrames", "width" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
