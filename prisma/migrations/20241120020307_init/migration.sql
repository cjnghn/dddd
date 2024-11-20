-- CreateTable
CREATE TABLE "Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" REAL NOT NULL,
    "totalFrames" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "flightId" INTEGER NOT NULL,
    CONSTRAINT "Video_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameIndex" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "videoId" INTEGER NOT NULL,
    CONSTRAINT "Frame_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Object" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "tid" INTEGER NOT NULL,
    "bbox" TEXT NOT NULL,
    "conf" REAL NOT NULL,
    "cid" INTEGER NOT NULL,
    "speed" REAL NOT NULL,
    "gpsLat" REAL NOT NULL,
    "gpsLon" REAL NOT NULL,
    CONSTRAINT "Object_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Object_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Object_videoId_tid_key" ON "Object"("videoId", "tid");
