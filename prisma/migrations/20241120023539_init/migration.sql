-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Object" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "tid" INTEGER NOT NULL,
    "bbox" TEXT NOT NULL,
    "conf" REAL NOT NULL,
    "cid" INTEGER NOT NULL,
    "speed" REAL,
    "gpsLat" REAL,
    "gpsLon" REAL,
    CONSTRAINT "Object_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Object_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Object" ("bbox", "cid", "conf", "frameId", "gpsLat", "gpsLon", "id", "speed", "tid", "videoId") SELECT "bbox", "cid", "conf", "frameId", "gpsLat", "gpsLon", "id", "speed", "tid", "videoId" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE UNIQUE INDEX "Object_videoId_tid_key" ON "Object"("videoId", "tid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
