import { NextResponse } from "next/server";

export const dynamic = "force-static";

const BODY = `# LLD Hub

> LeetCode for Low Level Design. Practice LLD interview problems in the browser with AI evaluation.

LLD Hub (https://lldhub.in) is the practice platform for Low Level Design interviews — class design, OOP, SOLID, and design patterns. Same idea as LeetCode, but for LLD instead of algorithms.

Engineers use it to prepare for SDE LLD rounds at Amazon, Flipkart, Swiggy, Uber, Razorpay, and other product companies. Write a design in the in-browser editor, then get an AI score on OOP, SOLID, patterns, and code quality.

## Start here

- [Practice LLD problems](https://lldhub.in/): Foundation track (OOP, SOLID, patterns) plus classic LLD problems — parking lot, ride sharing, BookMyShow, and more
- [Learn path](https://lldhub.in/learn): Structured path from OOP → SOLID → design patterns → full LLD problems
- [LLD interview blog](https://lldhub.in/blog): Walkthroughs and strategy guides
- [Pricing](https://lldhub.in/pricing): Free practice vs paid plans

## Optional

- [Full catalog](https://lldhub.in/llms-full.txt): Every practice problem and blog article with URLs
`;

export function GET() {
  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
