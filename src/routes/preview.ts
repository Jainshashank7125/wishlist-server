import express from "express";
import { extractPreview } from "../services/extractPreview";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("In preview");
  const { url, raw_html } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const preview = await extractPreview(url, raw_html);
    res.json(preview);
  } catch (err: any) {
    if (err.status) {
      console.log("Error in preview:", err.message);
      res.status(err.status).json({ error: err.message });
    } else {
      console.error("Unexpected error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export { router as previewRouter };
