export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yhatepdf.online").replace(/\/$/, "");
export const siteName = "yHatePDF";
export const siteDescription = "Private, browser-based PDF tools for merging, splitting, editing, converting, signing, and organizing documents without an account or document uploads.";

export const absoluteUrl = (path = "/") => new URL(path, `${siteUrl}/`).toString();
