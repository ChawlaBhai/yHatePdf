# yHatePDF launch: indexing, previews, and analytics

The website now ships a crawlable sitemap, robots rules, canonical URLs, tool-page metadata, schema markup, an `llms.txt` overview, and a 1200×630 social preview image. None of those features access PDF contents.

## 1. Set the production URL in Vercel

In **Vercel → yHatePDF → Settings → Environment Variables**, add this for Production, Preview, and Development:

```text
NEXT_PUBLIC_SITE_URL=https://yhatepdf.site
```

If a custom domain is attached later, replace that value with its canonical HTTPS URL and redeploy. This keeps sitemap, canonical, Open Graph, and robots URLs aligned.

## 2. Connect the Namecheap domain to Vercel

1. In **Vercel → yHatePDF → Settings → Domains**, add `yhatepdf.site` and `www.yhatepdf.site`.
2. In Namecheap, open **Domain List → Manage → Advanced DNS**.
3. Copy the exact DNS records Vercel shows for the apex and `www` host. Save them in Namecheap, then wait for Vercel to verify the domain.
4. Keep `NEXT_PUBLIC_SITE_URL=https://yhatepdf.site` and redeploy once the domain is verified.

Do not guess old DNS values: Vercel's Domains screen is the source of truth for the records attached to this project.

## 3. Processed counter: zero-service model

Like iLoveMD, yHatePDF uses no counter database or tracking endpoint. Every browser calculates the same public baseline from the launch timestamp and advances it once every ten minutes. A supported source document that successfully loads into a workspace adds its count only in that browser, such as `4` for four PDFs loaded to merge. No source file, filename, page content, preview, account, browser ID, or analytics event is sent.

## 4. Turn on Google Analytics

1. Create a Google Analytics 4 property and a Web data stream for `https://yhatepdf.site`.
2. Copy its Measurement ID, which looks like `G-XXXXXXXXXX`.
3. Add it in Vercel as `NEXT_PUBLIC_GA_MEASUREMENT_ID` and redeploy.
4. Open the site and check **GA4 → Realtime**.

The GA script is intentionally absent until that environment variable exists. It has no access to selected PDF files, previews, names, or output contents. Review your local consent and privacy-law obligations before enabling analytics for audiences that require consent.

## 5. Ask Google to crawl it

1. Create a property in [Google Search Console](https://search.google.com/search-console/).
2. Verify the Vercel domain through DNS (best for a domain property) or use Search Console’s supported URL-prefix verification.
3. Submit `https://yhatepdf.site/sitemap.xml` under **Sitemaps**.
4. Use **URL Inspection** to request indexing for the home page, Merge PDF, Split PDF, PDF Studio, About, and Privacy pages after a production deploy.

Indexing is decided by search engines; a sitemap requests discovery, not a ranking guarantee.

## 6. Check social cards

After deployment, test a public URL in the [X Card Validator](https://cards-dev.twitter.com/validator) and send it to a WhatsApp test chat. Both use the deployed Open Graph image at `/opengraph-image`. Cache refresh timing is controlled by each platform.

## 7. Ongoing launch loop

- Keep descriptions specific to the actual tool behavior.
- Add useful, original tool help and examples as features mature.
- Link launch profiles from the About page once Peerlist and Product Hunt go live.
- Check Search Console coverage and GA4 weekly, then improve pages people actually reach.
