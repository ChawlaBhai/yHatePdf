import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "yHatePDF — private PDF tools in your browser";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", color: "#f7f5ef", background: "#101012", padding: "54px 62px", fontFamily: "Arial, sans-serif" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, letterSpacing: 2, fontWeight: 700 }}><span>WHY <span style={{ color: "#ff6047" }}>HATE</span> PDF?</span><span style={{ color: "#83e2b3" }}>100% IN-BROWSER</span></div>
    <div style={{ height: 2, width: "100%", background: "#57575f", marginTop: 30 }} />
    <div style={{ display: "flex", flex: 1, alignItems: "center" }}><div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}><span style={{ color: "#ff6047", fontSize: 22, letterSpacing: 3, fontWeight: 700 }}>PRIVATE PDF TOOLKIT</span><span style={{ fontSize: 78, lineHeight: 1.03, fontWeight: 800, letterSpacing: -4, marginTop: 16 }}>PDFs weren&apos;t the problem.</span><span style={{ fontSize: 38, marginTop: 24, color: "#c2c2c9" }}>Merge. Split. Edit. Sign. Keep your files on your device.</span></div></div>
    <div style={{ display: "flex", gap: 16 }}><span style={{ border: "2px solid #f7f5ef", padding: "14px 18px", fontSize: 20, fontWeight: 700 }}>NO ACCOUNT</span><span style={{ border: "2px solid #f7f5ef", padding: "14px 18px", fontSize: 20, fontWeight: 700 }}>NO WATERMARK</span><span style={{ background: "#ff6047", color: "#101012", padding: "14px 18px", fontSize: 20, fontWeight: 800 }}>yhatepdf.vercel.app</span></div>
  </div>, size);
}
