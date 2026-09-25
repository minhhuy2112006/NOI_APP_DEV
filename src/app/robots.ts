export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/ca-nhan",
        "/quan-tri",
        "/to-chuc/quan-ly",
        "/dang-nhap",
      ],
    },
    sitemap:
      (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
      "/sitemap.xml",
  };
}
