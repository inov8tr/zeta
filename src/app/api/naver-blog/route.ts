import { NextResponse } from "next/server";
import Parser from "rss-parser";

export async function GET() {
  const parser = new Parser();
  const rssUrl = "https://rss.blog.naver.com/zeta-eng.xml";

  try {
    console.log(`Fetching RSS from: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const text = await response.text();

    if (text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error("Naver RSS returned an HTML page instead of XML. Possible request blocking.");
    }

    const feed = await parser.parseString(text);

    // Function to extract images from a blog post page
    async function getImageFromPost(link?: string) {
      if (!link) return null; // Ensure link is defined before fetching

      try {
        const postResponse = await fetch(link, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = await postResponse.text();

        const match = html.match(/<meta property="og:image" content="(.*?)"/);
        return match ? match[1] : null; // Return OG image or null if not found
      } catch (error) {
        console.error(`Error fetching image from ${link}:`, error);
        return null;
      }
    }

    // Process each blog post
    const posts = await Promise.all(feed.items.map(async (post) => {
      const link = post.link || ""; // Ensure link is always a string
      let imageUrl = post.enclosure?.url || null;

      if (!imageUrl) {
        imageUrl = await getImageFromPost(link); // Fetch from the actual blog page
      }

      return {
        title: post.title,
        link: link,
        pubDate: post.pubDate,
        contentSnippet: post.contentSnippet || "No preview available.",
        fullContent: post["content:encoded"] || "Full content not available.",
        image: imageUrl, // Extracted image URL
      };
    }));

    return NextResponse.json({ items: posts });

  } catch (error) {
    console.error("Error fetching Naver RSS feed:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}
