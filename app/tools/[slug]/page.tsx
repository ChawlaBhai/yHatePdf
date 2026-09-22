import { notFound } from "next/navigation";
import PdfWorkspace from "@/components/PdfWorkspace";
import PdfStudio from "@/components/PdfStudio";
import SignatureStudio from "@/components/SignatureStudio";
import ScanStudio from "@/components/ScanStudio";
import SecurityWorkspace from "@/components/SecurityWorkspace";
import { toolById, tools } from "@/lib/tool-registry";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() { return tools.map(tool => ({ slug: tool.id })); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {const {slug}=await params; const tool=toolById(slug); return tool?{title:tool.name,description:tool.description,alternates:{canonical:tool.route},openGraph:{title:`${tool.name} | yHatePDF`,description:tool.description,url:absoluteUrl(tool.route),images:[{url:absoluteUrl("/opengraph-image"),width:1200,height:630,alt:"yHatePDF private browser PDF tools"}]},twitter:{card:"summary_large_image",title:`${tool.name} | yHatePDF`,description:tool.description,images:[absoluteUrl("/opengraph-image")]}}:{title:"Tool not found"};}
export default async function ToolPage({ params }: { params: Promise<{slug:string}> }) { const {slug}=await params; const tool=toolById(slug); if(!tool) notFound(); if(slug==="studio"||slug==="edit-pdf")return <PdfStudio/>; if(slug==="redact")return <PdfStudio initialTool="redaction"/>; if(slug==="sign")return <SignatureStudio/>; if(slug==="scan-to-pdf")return <ScanStudio/>; if(slug==="protect"||slug==="unlock")return <SecurityWorkspace mode={slug}/>; return <PdfWorkspace toolId={tool.id}/>; }
