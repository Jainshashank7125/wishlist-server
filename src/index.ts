import express from "express";
import rateLimit from "express-rate-limit";
import { previewRouter } from "./routes/preview";
import { Request, Response, NextFunction } from "express";
import "dotenv/config";

const app = express();
app.use(express.json({ limit: "512kb" }));

// Rate limiting: 10 req/min/IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use("/preview", previewRouter);

interface PayloadTooLargeError extends Error {
  type?: string;
}

app.use(
  (
    err: PayloadTooLargeError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: "Payload too large" });
    }
    next(err);
  }
);

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
