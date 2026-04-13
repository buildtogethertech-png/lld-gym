import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/problem/", "/learn", "/pricing"],
        disallow: ["/api/", "/settings", "/submissions", "/uml-practice/my-diagrams"],
      },
    ],
    sitemap: "https://lldhub.in/sitemap.xml",
  };
}
