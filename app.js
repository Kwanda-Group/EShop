// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";           // modular DB + GridFS init
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// prefer MONGO_URI, but if you use MONGO_URL keep it consistent
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;

if (!MONGO_URI) {
  console.error("MONGO_URI (or MONGO_URL) is missing in your .env file");
  process.exit(1);
}

// connect to DB and initialize GridFS, then start server
(async function start() {
  try {
    await connectDB(MONGO_URI); // initializes mongoose connection + GridFSBucket + gfs
    // mount routes after DB is connected
    app.use("/products", productRoutes);
    app.use("/orders", orderRoutes);

    // lightweight streaming route (keeps concerns in one place)
    // this mirrors the streaming handler in the modular server example
    app.get("/videos/:id/stream", async (req, res) => {
      try {
        const conn = mongoose.connection;
        const filesColl = conn.db.collection("videos.files");
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const fileDoc = await filesColl.findOne({ _id: fileId });
        if (!fileDoc) return res.status(404).send("File not found");

        const gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "videos" });
        const range = req.headers.range;
        const fileSize = fileDoc.length;
        const contentType = fileDoc.contentType || "application/octet-stream";

        if (!range) {
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", fileSize);
          const downloadStream = gridfsBucket.openDownloadStream(fileId);
          return downloadStream.pipe(res);
        }

        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end) return res.status(416).send("Requested Range Not Satisfiable");

        const chunkSize = (end - start) + 1;
        res.status(206);
        res.set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType
        });

        const downloadStream = gridfsBucket.openDownloadStream(fileId, { start, end: end });
        downloadStream.pipe(res);
      } catch (err) {
        console.error("Streaming error:", err);
        res.status(500).send("Stream error");
      }
    });

    // error handler (must be after routes)
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
