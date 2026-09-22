import { notFound } from "next/navigation";
import PdfWorkspace from "@/components/PdfWorkspace";
import PdfStudio from "@/components/PdfStudio";
import SignatureStudio from "@/components/SignatureStudio";
import ScanStudio from "@/components/ScanStudio";
import SecurityWorkspace from "@/components/SecurityWorkspace";
import { toolById, tools } from "@/lib/tool-registry";

export function generateStaticParams() { return tools.map(tool => ({ slug: tool.id })); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const {slug}=await params; const tool=toolById(slug); return tool?{title:`${tool.name} — yHatePDF`,description:tool.description}:{title:"Tool not found — yHatePDF"};}
export default async function ToolPage({ params }: { params: Promise<{slug:string}> }) { const {slug}=await params; const tool=toolById(slug); if(!tool) notFound(); if(slug==="studio"||slug==="edit-pdf")return <PdfStudio/>; if(slug==="redact")return <PdfStudio initialTool="redaction"/>; if(slug==="sign")return <SignatureStudio/>; if(slug==="scan-to-pdf")return <ScanStudio/>; if(slug==="protect"||slug==="unlock")return <SecurityWorkspace mode={slug}/>; return <PdfWorkspace toolId={tool.id}/>; }
