import { tools } from "@/lib/tool-registry";
import { siteDescription, siteUrl } from "@/lib/site";

export function GET() {
  const list = tools.map((tool) => `- [${tool.name}](${siteUrl}${tool.route}): ${tool.description}`).join("\n");
  const body = `# yHatePDF\n\n> ${siteDescription}\n\nyHatePDF is a local-first PDF toolkit. Supported transformations happen in the visitor's browser; documents are not uploaded to a yHatePDF processing server.\n\n## Key pages\n- [Home](${siteUrl}/)\n- [PDF Studio](${siteUrl}/tools/studio)\n- [Privacy policy](${siteUrl}/privacy)\n- [Terms](${siteUrl}/terms)\n- [About](${siteUrl}/about)\n\n## Tools\n${list}\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
