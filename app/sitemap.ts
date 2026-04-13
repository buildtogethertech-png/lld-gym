import { MetadataRoute } from "next";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { BLOG_POSTS } from "@/lib/blog";

const BASE = "https://lldhub.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,              lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/blog`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/learn`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const problemPages: MetadataRoute.Sitemap = [...FOUNDATION_PROBLEMS, ...PROBLEMS].map((p) => ({
    url: `${BASE}/problem/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticPages, ...problemPages, ...blogPages];
}
