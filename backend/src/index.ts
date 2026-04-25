import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import { getSpeechmaticsToken } from "./services/stt";
import { errorHandler } from "./middleware/errorHandler";
import interviewRoutes from "./routes/interview";
import chatRoutes from "./routes/chat";
import assessRoutes from "./routes/assess";
import reportRoutes from "./routes/report";

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: `${req.method} ${req.path}` }));
  next();
});

app.use("/api/interview", interviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/assess", assessRoutes);
app.use("/api/report", reportRoutes);

app.get("/api/stt-token", async (_req, res, next) => {
  try {
    const token = await getSpeechmaticsToken();
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
