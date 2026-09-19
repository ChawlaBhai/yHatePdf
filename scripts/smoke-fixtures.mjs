import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";

const folder = process.argv[2] || "/private/tmp";
for (const [name, pages, color] of [["yhatepdf-test-alpha.pdf", 3, rgb(.1,.35,.65)], ["yhatepdf-test-beta.pdf", 2, rgb(.65,.2,.1)]]) {
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let index=0;index<pages;index++) { const page=pdf.addPage([450,600]); page.drawRectangle({x:25,y:25,width:400,height:550,borderColor:color,borderWidth:3}); page.drawText(`${name}: PAGE ${index+1}`,{x:48,y:500,size:25,font,color}); page.drawText(`Preview and ordering regression fixture ${index+1}`,{x:48,y:460,size:12,font,color:rgb(.25,.25,.25)}); }
  await writeFile(`${folder}/${name}`,await pdf.save());
}
const canvas=createCanvas(800,1000);const context=canvas.getContext("2d");const pixels=context.createImageData(800,1000);let seed=12345;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;pixels.data[i]=(seed>>>16)&255;pixels.data[i+1]=(seed>>>8)&255;pixels.data[i+2]=seed&255;pixels.data[i+3]=255;}context.putImageData(pixels,0,0);const noisy=await PDFDocument.create();const image=await noisy.embedPng(canvas.toBuffer("image/png"));for(let i=0;i<3;i++){const page=noisy.addPage([600,750]);page.drawImage(image,{x:0,y:0,width:600,height:750});}await writeFile(`${folder}/yhatepdf-test-image-heavy.pdf`,await noisy.save());
const firstImage=createCanvas(400,500);const firstContext=firstImage.getContext("2d");firstContext.fillStyle="#4389d1";firstContext.fillRect(0,0,400,500);firstContext.fillStyle="#ffffff";firstContext.font="bold 50px sans-serif";firstContext.fillText("FIRST",100,250);await writeFile(`${folder}/yhatepdf-test-first.png`,firstImage.toBuffer("image/png"));const secondImage=createCanvas(400,500);const secondContext=secondImage.getContext("2d");secondContext.fillStyle="#dc734a";secondContext.fillRect(0,0,400,500);secondContext.fillStyle="#ffffff";secondContext.font="bold 50px sans-serif";secondContext.fillText("SECOND",75,250);await writeFile(`${folder}/yhatepdf-test-second.jpg`,secondImage.toBuffer("image/jpeg"));
const formPdf=await PDFDocument.create();const formPage=formPdf.addPage([450,600]);formPage.drawText("Form flattening test",{x:45,y:535,size:20});const field=formPdf.getForm().createTextField("sample-name");field.setText("Ada Lovelace");field.addToPage(formPage,{x:45,y:450,width:250,height:35});await writeFile(`${folder}/yhatepdf-test-form.pdf`,await formPdf.save());
