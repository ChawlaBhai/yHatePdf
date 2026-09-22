import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "yHatePDF", short_name: "yHatePDF", description: "Private browser-based PDF tools.", start_url: "/", display: "standalone", background_color: "#f7f5ef", theme_color: "#111111", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }] };
}
