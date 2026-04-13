import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "LLD Interview Blog — Design Problems, Patterns & Tips | LLD Hub",
  description: "In-depth guides on Low Level Design interview problems — Parking Lot, Uber, BookMyShow, and more. Learn design patterns, SOLID principles, and how to crack the LLD round.",
  alternates: { canonical: "https://lldhub.in/blog" },
  openGraph: {
    title: "LLD Interview Blog | LLD Hub",
    description: "In-depth LLD problem walkthroughs and interview tips.",
    url: "https://lldhub.in/blog",
  },
};

const TAG_COLORS: Record<string, string> = {
  lld:              "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  solid:            "bg-blue-400/10 text-blue-300 border-blue-400/20",
  "design-patterns":"bg-purple-400/10 text-purple-300 border-purple-400/20",
  interview:        "bg-green-400/10 text-green-300 border-green-400/20",
  oop:              "bg-orange-400/10 text-orange-300 border-orange-400/20",
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? "bg-gray-800 text-gray-400 border-gray-700";
}

// Pin these to the top
const FEATURED_SLUGS = [
  "how-to-crack-lld-interview",
  "solid-principles-lld-interview",
  "design-patterns-lld-interview",
];

export default function BlogPage() {
  const featured = BLOG_POSTS.filter((p) => FEATURED_SLUGS.includes(p.slug));
  const rest = BLOG_POSTS.filter((p) => !FEATURED_SLUGS.includes(p.slug));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">LLD Interview Blog</h1>
        <p className="text-gray-400">
          Problem walkthroughs, design patterns, and strategies to crack the Low Level Design round.
        </p>
      </div>

      {/* Featured / concept posts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {featured.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 hover:border-yellow-400/60 transition-colors"
          >
            <p className="text-xs text-yellow-400 font-semibold mb-1 uppercase tracking-wide">Guide</p>
            <p className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors leading-snug">
              {post.title}
            </p>
            <p className="text-xs text-gray-500 mt-2">{post.readingTime} min read</p>
          </Link>
        ))}
      </div>

      {/* All problem posts */}
      <h2 className="text-lg font-semibold mb-4 text-gray-300">Problem Walkthroughs</h2>
      <div className="space-y-3">
        {rest.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-start gap-4 p-4 rounded-xl border border-gray-800 hover:border-gray-700 bg-[#111] hover:bg-[#161616] transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors leading-snug">
                {post.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.description}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${tagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
                <span className="text-[10px] text-gray-600 ml-auto shrink-0">{post.readingTime} min</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
