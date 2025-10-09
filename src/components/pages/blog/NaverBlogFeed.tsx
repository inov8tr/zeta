"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ImageOff } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import type { BlogDictionary } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  image?: string;
  fullContent?: string;
}

type NaverBlogFeedProps = {
  dictionary?: BlogDictionary["feed"];
};

const NaverBlogFeed = ({ dictionary }: NaverBlogFeedProps) => {
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

  const formattedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        formattedDate: post.pubDate ? new Date(post.pubDate).toLocaleDateString() : "",
        isoDate: post.pubDate ? new Date(post.pubDate).toISOString() : undefined,
      })),
    [posts]
  );

  if (loading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        <span className="sr-only" aria-live="polite" role="status">
          {dictionary?.loading ?? "Loading blog posts..."}
        </span>
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={`skeleton-${index}`}
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-inner animate-pulse"
          >
            <div className="aspect-[4/3] w-full rounded-2xl bg-neutral-200/80" />
            <div className="mt-6 h-4 w-3/4 rounded bg-neutral-200/80" />
            <div className="mt-3 h-3 w-1/2 rounded bg-neutral-200/70" />
            <div className="mt-5 flex-1 rounded bg-neutral-200/60" />
            <div className="mt-6 h-3 w-24 rounded bg-neutral-200/70" />
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {formattedPosts.length > 0 ? (
        formattedPosts.map((post) => (
          <article
            key={post.link}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white/85 shadow-lg shadow-brand-primary/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <StructuredData
              data={{
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: post.title,
                description: post.contentSnippet,
                url: post.link,
                datePublished: post.isoDate,
                image: post.image,
                author: {
                  "@type": "Organization",
                  name: "Zeta English Academy",
                },
                publisher: {
                  "@type": "Organization",
                  name: "Zeta English Academy",
                  logo: {
                    "@type": "ImageObject",
                    url: absoluteUrl("/images/ZetaLogo.svg"),
                  },
                },
              }}
            />
            <div className="flex flex-1 flex-col p-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
                <ImageOff className="h-4 w-4" />
                {post.formattedDate}
              </span>
              <a href={post.link} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 transition hover:text-brand-primary focus-visible:text-brand-primary">
                  {post.title}
                </h3>
              </a>
              {post.contentSnippet && (
                <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">
                  {post.contentSnippet}
                </p>
              )}
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center text-sm font-semibold text-brand-primary transition hover:text-brand-primary-dark"
              >
                {dictionary?.cardCta ?? "Read story"}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </article>
        ))
      ) : (
        <div className="col-span-full rounded-3xl border border-dashed border-brand-primary/20 bg-white/60 p-10 text-center text-neutral-600">
          {dictionary?.empty ?? "No blog posts available right now. Please check back soon."}
        </div>
      )}
    </div>
  );
};

export default NaverBlogFeed;
