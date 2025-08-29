import { CheerioAPI } from "cheerio";

/**
 * Fetch OpenGraph data for a given site using opengraph.io API
 * @param siteUrl The site URL to fetch OpenGraph data for
 * @param appId Your opengraph.io app_id
 */
export async function fetchOpenGraphData(siteUrl: string) {
  const encodedSite = encodeURIComponent(siteUrl);
  const url = `https://opengraph.io/api/1.1/site/${encodedSite}?app_id=${process.env.OPENGRAPH_API_KEY}`;
  console.log("URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching OpenGraph data:", error);
    throw error;
  }
}

// Helper to clean and normalize price strings
function cleanPrice(price: string | undefined): string {
  if (!price) return "";
  return price
    .replace(/[^\d.,]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function extractMeta($: CheerioAPI, url: string) {
  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogSite = $('meta[property="og:site_name"]').attr("content");
  // Twitter Card
  const twTitle = $('meta[name="twitter:title"]').attr("content");
  const twImage = $('meta[name="twitter:image"]').attr("content");

  // Amazon-specific selectors (can add more for other sites)
  let productTitle = $("#productTitle").text().trim();
  let productImage =
    $("#imgTagWrapperId img").attr("src") ||
    $("img[data-a-dynamic-image]").attr("src");

  // Fallbacks
  const fallbackTitle = $("title").text().trim();
  const fallbackImage = $("img").first().attr("src") || "";

  // Prefer in order: OG, Twitter, product selectors, fallback
  const title = ogTitle || twTitle || productTitle || fallbackTitle || "";
  const image = ogImage || twImage || productImage || fallbackImage || "";
  const siteName = ogSite || new URL(url).hostname;
  return { title, image, siteName };
}

export function extractPrice($: CheerioAPI, html: string) {
  // Amazon-specific selectors
  let price: string =
    $("#priceblock_ourprice").text() ||
    $("#priceblock_dealprice").text() ||
    $("#priceblock_saleprice").text() ||
    $("span.a-price .a-offscreen").first().text() ||
    $("[data-asin-price]").attr("data-asin-price") ||
    $('[itemprop="price"]').attr("content") ||
    $('[class*="price"]').first().text() ||
    "";

  if (!price) {
    // Regex fallback for $, ₹, €
    const match = /([$₹€]\s?\d+[\d,.]*)/.exec(html);
    price = match ? match[1] : "";
  }

  price = cleanPrice(price);

  // Try to extract currency
  let currency = $('[itemprop="priceCurrency"]').attr("content") || "";
  if (!currency) {
    if (price.includes("$")) currency = "USD";
    else if (price.includes("₹")) currency = "INR";
    else if (price.includes("€")) currency = "EUR";
  }

  return { value: price || "N/A", currency };
}
