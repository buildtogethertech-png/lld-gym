import { NextResponse } from "next/server";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { BLOG_POSTS } from "@/lib/blog";

export const dynamic = "force-static";

const BASE = "https://lldhub.in";

function line(title: string, path: string, note: string) {
  return `- [${title}](${BASE}${path}): ${note}`;
}

export function GET() {
  const foundation = FOUNDATION_PROBLEMS.filter((p) => p.id && p.title).map((p) =>
    line(p.title, `/problem/${p.id}`, p.description?.slice(0, 160) || "Foundation LLD practice problem")
  );

  const problems = PROBLEMS.map((p) =>
    line(p.title, `/problem/${p.id}`, p.description?.slice(0, 160) || "Low level design interview problem")
  );

  const posts = BLOG_POSTS.map((p) =>
    line(p.title, `/blog/${p.slug}`, p.description)
  );

  const body = `# LLD Hub

> LeetCode for Low Level Design — full catalog of practice problems and interview guides.

LLD Hub is https://lldhub.in. Practice object-oriented / low-level design the way LeetCode is used for algorithms: pick a problem, design classes in the browser, get AI feedback.

Prefer the short overview at ${BASE}/llms.txt.

## Site

${line("All problems", "/", "LLD practice catalog — foundation + interview problems")}
${line("Learn", "/learn", "OOP, SOLID, design patterns, then LLD problems")}
${line("Blog", "/blog", "LLD interview walkthroughs and strategy")}
${line("Pricing", "/pricing", "Free vs paid plans")}

## Foundation track

${foundation.join("\n")}

## LLD interview problems

${problems.join("\n")}

## Blog

${posts.join("\n")}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
