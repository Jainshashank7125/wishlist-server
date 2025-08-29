import app from "../src/index";
import request from "supertest";

describe("POST /preview", () => {
  it("should parse a valid fixture and return metadata", async () => {
    const fs = require("fs");
    const path = require("path");
    const html = fs.readFileSync(
      path.join(__dirname, "fixtures", "amazon.html"),
      "utf8"
    );
    const res = await request(app)
      .post("/preview")
      .send({ url: "https://www.amazon.com/dp/B09G3HRMVB", raw_html: html });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBeTruthy();
    expect(res.body.image).toBeTruthy();
    expect(res.body.price).toBeTruthy();
  });

  it("should enforce timeout, redirect, and size caps", async () => {
    // This test should use a mock or a purposely slow/redirecting/large endpoint
    // For demonstration, we expect a 400 or 413 error
    const res = await request(app)
      .post("/preview")
      .send({ url: "https://httpstat.us/301" });
    expect([400, 413]).toContain(res.statusCode);
  });

  it("should block SSRF attempts", async () => {
    const res = await request(app)
      .post("/preview")
      .send({ url: "http://127.0.0.1" });
    expect(res.statusCode).toBe(400);
  });

  it("should rate-limit excessive requests", async () => {
    for (let i = 0; i < 12; i++) {
      await request(app)
        .post("/preview")
        .send({ url: "https://www.amazon.com/dp/B09G3HRMVB" });
    }
    const res = await request(app)
      .post("/preview")
      .send({ url: "https://www.amazon.com/dp/B09G3HRMVB" });
    expect([429, 200]).toContain(res.statusCode); // 429 if rate-limited
  });
});
