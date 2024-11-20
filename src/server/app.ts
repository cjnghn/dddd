// src/server/app.ts

import express from "express";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

// CORS 설정
app.use(cors());

// 정적 비디오 파일 제공
app.use(
  "/videos",
  express.static(path.join(__dirname, "..", "..", "uploads", "videos"))
);

// API 엔드포인트

app.get("/", (req, res) => {
  res.send("Hello World!");
});

/**
 * 특정 비디오 정보 가져오기
 * GET /videos/:id
 */
app.get("/api/videos/:id", async (req, res) => {
  const videoId = Number.parseInt(req.params.id);

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { flight: true },
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 특정 비디오의 프레임 및 객체 정보 가져오기
 * GET /api/videos/:id/frames
 */
app.get("/api/videos/:id/frames", async (req, res) => {
  const videoId = Number.parseInt(req.params.id);

  try {
    const frames = await prisma.frame.findMany({
      where: { videoId },
      include: { objects: true },
      orderBy: { frameIndex: "asc" },
    });

    res.json(frames);
  } catch (error) {
    console.error("Error fetching frames:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 특정 비디오 내 객체의 궤적 가져오기
 * GET /api/videos/:id/trajectory/:tid
 */
app.get("/api/videos/:id/trajectory/:tid", async (req, res) => {
  const videoId = Number.parseInt(req.params.id);
  const tid = Number.parseInt(req.params.tid);

  try {
    const objects = await prisma.object.findMany({
      where: { videoId, tid },
      include: {
        frame: {
          select: { frameIndex: true, timestamp: true },
        },
      },
      orderBy: { frameId: "asc" },
    });

    if (objects.length === 0) {
      res.status(404).json({
        error: "No trajectory found for this TID in the specified video",
      });
      return;
    }

    const trajectory = objects.map((obj) => ({
      frameIndex: obj.frame.frameIndex,
      timestamp: obj.frame.timestamp,
      gpsLat: obj.gpsLat,
      gpsLon: obj.gpsLon,
      speed: obj.speed,
    }));

    res.json({ tid, trajectory });
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 비디오 업로드 API (프론트엔드에서 직접 업로드)
 * POST /api/upload-video
 * (이전 단계에서 자동 스캔을 사용하지만, 필요 시 추가)
 */
// import multer from "multer";

// const upload = multer({
//   dest: path.join(__dirname, "..", "..", "uploads", "videos"),
//   limits: { fileSize: 100 * 1024 * 1024 }, // 최대 100MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("video/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only video files are allowed!"));
//     }
//   },
// });

// app.post("/api/upload-video", upload.single("videoFile"), async (req, res) => {
//   // 추가 기능 구현 가능
//   res.status(200).json({ message: "Video uploaded successfully" });
// });

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server is running on http://localhost:${PORT}`);
});
