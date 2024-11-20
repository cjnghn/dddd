/*
  Warnings:

  - A unique constraint covering the columns `[videoId,tid,frameId]` on the table `Object` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `flightLog` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Made the column `timestamp` on table `Frame` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Object_videoId_tid_key";

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "altitude" REAL NOT NULL,
    "speed" REAL NOT NULL,
    "heading" REAL NOT NULL,
    "isVideo" BOOLEAN NOT NULL,
    "flightId" INTEGER NOT NULL,
    CONSTRAINT "Telemetry_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "flightLog" TEXT NOT NULL
);
INSERT INTO "new_Flight" ("date", "description", "id", "name") SELECT "date", "description", "id", "name" FROM "Flight";
DROP TABLE "Flight";
ALTER TABLE "new_Flight" RENAME TO "Flight";
CREATE TABLE "new_Frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameIndex" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "videoId" INTEGER NOT NULL,
    CONSTRAINT "Frame_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Frame" ("frameIndex", "id", "timestamp", "videoId") SELECT "frameIndex", "id", "timestamp", "videoId" FROM "Frame";
DROP TABLE "Frame";
ALTER TABLE "new_Frame" RENAME TO "Frame";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Object_videoId_tid_frameId_key" ON "Object"("videoId", "tid", "frameId");
