-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameIndex" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "timestamp" DATETIME,
    CONSTRAINT "Frame_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Frame" ("frameIndex", "id", "timestamp", "videoId") SELECT "frameIndex", "id", "timestamp", "videoId" FROM "Frame";
DROP TABLE "Frame";
ALTER TABLE "new_Frame" RENAME TO "Frame";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
