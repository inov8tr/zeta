import type { Metadata } from "next";
import NaverBlogFeed from "@/components/pages/blog/NaverBlogFeed";

export const metadata: Metadata = {
  title: "Blog | Zeta English Academy",
  description: "Updates and insights from Zeta English Academy.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen px-4 py-10 bg-gray-100">
      <div className="max-w-3xl mx-auto pt-20"> {/* Added pt-20 to push content down */}
        <h1 className="text-3xl font-bold text-center text-gray-900">Blog</h1>
        <p className="text-center text-gray-600 mt-2">
          Stay updated with our latest posts and insights.
        </p>
        <NaverBlogFeed />
      </div>
    </div>
  );
}
