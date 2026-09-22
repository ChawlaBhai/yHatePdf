import type { MetadataRoute } from "next";
import { tools } from "@/lib/tool-registry";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const published = new Date("2026-09-22T00:00:00.000Z");
  const core = ["/", "/about", "/privacy", "/terms", "/extension"];
  return [...core.map((path) => ({ url: `${siteUrl}${path}`, lastModified: published, changeFrequency: path === "/" ? "weekly" as const : "monthly" as const, priority: path === "/" ? 1 : .6 })), ...tools.map((tool) => ({ url: `${siteUrl}${tool.route}`, lastModified: published, changeFrequency: "monthly" as const, priority: tool.status === "ready" ? .8 : .5 }))];
}
