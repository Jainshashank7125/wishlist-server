import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";
import { isPrivateIp } from "../utils/ssrf";
import {
  extractMeta,
  extractPrice,
  fetchOpenGraphData,
} from "../utils/extractors";

const MAX_REDIRECTS = 3;
const MAX_HTML_SIZE = 512 * 1024; // 512 KB
const TIMEOUT = 5000; // 5 seconds
const USER_AGENT = "CentscapeBot/1.0 (+https://centscape.app)";

export async function extractPreview(url: string, raw_html?: string) {
  let html = raw_html;
  let finalUrl = url;

  // SSRF protection
  try {
    const parsed = new URL(url);
    if (isPrivateIp(parsed.hostname)) {
      throw { status: 400, message: "Blocked private/loopback IP" };
    }
  } catch {
    throw { status: 400, message: "Invalid URL" };
  }

  if (!html) {
    try {
      const response = await axios.get(url, {
        maxRedirects: MAX_REDIRECTS,
        // timeout: TIMEOUT,
        responseType: "text",
        headers: { "User-Agent": USER_AGENT },
        validateStatus: (status) => status < 400,
      });
      if (!/^text\/html/.test(response.headers["content-type"] || "")) {
        throw { status: 400, message: "Content-Type must be text/html" };
      }
      // if (response.data.length > MAX_HTML_SIZE) {
      //   throw { status: 400, message: "HTML too large" };
      // }
      html = response.data;
      finalUrl = response.request.res.responseUrl || url;
    } catch (err: any) {
      console.log("Fetch error:", err.message);
      if (err.status) throw err;
      throw { status: 400, message: "Failed to fetch URL" };
    }
  }

  const $ = cheerio.load(html!);
  const meta = extractMeta($, finalUrl);
  const price = extractPrice($, html!);
  const ogData = await fetchOpenGraphData(finalUrl).catch((e) => {
    console.error("Error fetching OpenGraph data:", e);
    return null;
  });

  return {
    title: ogData.hybridGraph.title,
    image: ogData.hybridGraph.image,
    price: price.value,
    currency: price.currency,
    siteName: ogData.hybridGraph.site_name,
    sourceUrl: finalUrl,
  };
}
