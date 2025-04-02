"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  image?: string;
}

export default function NaverBlogFeed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRSS() {
      try {
        const response = await fetch("/api/naver-blog");
        const data = await response.json();
        setPosts(data.items || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRSS();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600 mt-6">Loading blog posts...</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <a href={post.link} target="_blank" rel="noopener noreferrer">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition">
                {post.title}
              </h3>
            </a>
            <p className="text-gray-500 text-sm">{new Date(post.pubDate).toLocaleDateString()}</p>
            {post.image && (
              <Image
                src={post.image}
                alt={post.title || "Blog Post"}
                width={600} // Adjust as needed
                height={400}
                className="w-full h-auto rounded-md mt-3 object-cover"
              />
            )}
            <p className="text-gray-700 mt-3">{post.contentSnippet}</p>
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold mt-2 inline-block"
            >
              Read More →
            </a>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-600">No blog posts available.</p>
      )}
    </div>
  );
}