/*
  Warnings:

  - You are about to drop the column `speed` on the `Telemetry` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Telemetry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "altitude" REAL NOT NULL,
    "heading" REAL NOT NULL,
    "isVideo" BOOLEAN NOT NULL,
    "flightId" INTEGER NOT NULL,
    CONSTRAINT "Telemetry_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Telemetry" ("altitude", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "timestamp") SELECT "altitude", "flightId", "heading", "id", "isVideo", "latitude", "longitude", "timestamp" FROM "Telemetry";
DROP TABLE "Telemetry";
ALTER TABLE "new_Telemetry" RENAME TO "Telemetry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
