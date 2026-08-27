import jsPDF from "jspdf";
import type { Step } from "./types";

export async function exportPDF(steps: Step[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Small Steps — Your journal", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 103, 91);
  doc.text(`Exported ${new Date().toLocaleDateString()} — ${steps.length} steps`, margin, y);
  y += 24;
  doc.setTextColor(44, 41, 37);
  for (const s of steps) {
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
    const date = new Date(s.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(date + (s.category ? ` · ${s.category}` : "") + (s.mood ? ` · mood ${s.mood}` : ""), margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(s.note, 515);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 6;
    if (s.ai_response) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(94, 119, 95);
      const aiLines = doc.splitTextToSize(`↳ ${s.ai_response}`, 515);
      doc.text(aiLines, margin, y);
      y += aiLines.length * 12 + 10;
      doc.setTextColor(44, 41, 37);
    } else {
      y += 4;
    }
    doc.setDrawColor(232, 221, 208);
    doc.line(margin, y, 555, y);
    y += 14;
  }
  doc.save(`small-steps-${new Date().toISOString().slice(0, 10)}.pdf`);
}
