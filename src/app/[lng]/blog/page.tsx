import NaverBlogFeed from "@/components/pages/blog/NaverBlogFeed";
import { normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);

  return buildLocalizedMetadata({
    lng,
    path: "/blog",
    title: "Blog",
    description: "Updates and insights from Zeta English Academy.",
    keywords: ["blog", "updates", "English education"],
    image: "/images/pages/home/Strat.png",
    imageAlt: "Zeta English Academy blog",
  });
}

const BlogPage = () => {
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
};

export default BlogPage;
