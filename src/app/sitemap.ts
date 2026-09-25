import { getData } from "@/lib/data";
export default async function sitemap() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const data = await getData();
  return [
    "",
    "/chien-dich",
    "/gioi-thieu",
    "/minh-bach",
    "/tro-giup",
    ...data.campaigns
      .filter((c) => ["published", "active", "closed"].includes(c.status))
      .map((c) => "/chien-dich/" + c.slug),
  ].map((path) => ({ url: origin + path }));
}
