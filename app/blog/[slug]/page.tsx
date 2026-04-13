import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";
import { BLOG_CONTENT } from "@/app/blog/content/index";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: [...post.tags, "lld interview", "low level design", "system design interview"],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://lldhub.in/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
    alternates: { canonical: `https://lldhub.in/blog/${post.slug}` },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const Content = BLOG_CONTENT[params.slug];
  if (!Content) notFound();

  const relatedProblem = post.problemId ? ALL_PROBLEMS.find((p) => p.id === post.problemId) : null;
  const relatedPosts = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t))
  ).slice(0, 3);

  // JSON-LD for the article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "LLD Hub" },
    publisher: { "@type": "Organization", name: "LLD Hub", url: "https://lldhub.in" },
    url: `https://lldhub.in/blog/${post.slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <div className="mb-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All posts
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">{post.title}</h1>
          <p className="text-gray-400 text-sm">{post.description}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
            <span>{new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>

        {/* CTA — practice this problem */}
        {relatedProblem && (
          <div className="mb-8 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-yellow-400 font-semibold mb-0.5">Practice this problem</p>
              <p className="text-sm text-gray-300">{relatedProblem.title} — get AI-scored feedback on your solution</p>
            </div>
            <Link
              href={`/problem/${relatedProblem.id}`}
              className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs px-3 py-2 rounded-lg transition-colors"
            >
              Solve it →
            </Link>
          </div>
        )}

        {/* Article content */}
        <article className="
          prose prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-li:text-gray-300
          prose-strong:text-white
          prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-xl prose-pre:text-xs prose-pre:overflow-x-auto
          prose-code:text-yellow-300 prose-code:bg-transparent
          prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline
        ">
          <Content />
        </article>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-xl border border-gray-800 bg-[#111] p-6 text-center">
          <p className="text-lg font-bold mb-1">Ready to practice?</p>
          <p className="text-sm text-gray-400 mb-4">
            Submit your solution and get AI-scored feedback on OOP, SOLID principles, design patterns, and code quality.
          </p>
          {relatedProblem ? (
            <Link href={`/problem/${relatedProblem.id}`} className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Solve {relatedProblem.title} →
            </Link>
          ) : (
            <Link href="/" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Browse All Problems →
            </Link>
          )}
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold mb-4 text-gray-400">Related posts</h2>
            <div className="space-y-2">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
                >
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{rp.title}</p>
                  <span className="text-xs text-gray-600 shrink-0 ml-3">{rp.readingTime} min</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
