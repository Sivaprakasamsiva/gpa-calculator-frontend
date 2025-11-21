// src/utils/GPAPDFGenerator.jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { studentAPI } from "../services/api";

/**
 * generateGPAPDF - fetches semester report from backend and generates PDF
 *
 * expected backend response shape:
 * {
 *   semester: 1,
 *   gpa: 9.23,
 *   totalCredits: 22,
 *   totalPoints: 202,
 *   subjects: [
 *     { courseCode: "BS3171", courseTitle: "Physics ...", credits: 2, grade: "O", gradePoint: 10 },
 *     ...
 *   ]
 * }
 */
export const generateGPAPDF = async ({ semester }) => {
  try {
    if (!semester) {
      alert("Select a semester");
      return;
    }

    // fetch report from backend - ensures grades & points come from DB
    const res = await studentAPI.getSemesterReport(Number(semester));
    const data = res.data;

    const profileRes = await studentAPI.getProfile();
    const profile = profileRes.data || {};

    const rows = Array.isArray(data.subjects) ? data.subjects : [];
    const gpaResult = {
      gpa: data.gpa,
      totalCredits: data.totalCredits,
      totalPoints: data.totalPoints,
    };

    // build printable container
    const container = document.createElement("div");
    container.id = "grade-sheet-custom";
    container.style.width = "1000px";
    container.style.margin = "0 auto";
    container.style.padding = "18px";
    container.style.background = "#e6f6e6"; // soft classic green
    container.style.fontFamily = "'Arial', sans-serif";
    container.style.border = "3px solid #0b7a39";
    container.style.borderRadius = "6px";
    container.style.color = "#003d1f";

    const now = new Date();
    const formattedDate = now.toLocaleString();

    // Table rows html using backend field names
    const tableRowsHtml = rows
      .map((r, i) => {
        // grade text format: "O (10)" or "-" if absent
        const gradeText = r.grade ? `${r.grade} (${r.gradePoint ?? "-"})` : "-";
        const gradePointCell = r.gradePoint != null ? r.gradePoint : "-";
        // status: U or RA -> Failed else Passed
        const status = r.grade === "U" || r.grade === "RA" ? "Failed" : "Passed";
        return `
          <tr style="background:${i % 2 === 0 ? "#f0fbef" : "#e2f7df"};">
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${i + 1}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${escapeHtml(
              r.courseCode ?? "-"
            )}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:left;">${escapeHtml(
              r.courseTitle ?? "-"
            )}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${r.credits ?? "-"}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${escapeHtml(
              gradeText
            )}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${gradePointCell}</td>
            <td style="border:1px solid #0b7a39; padding:8px; text-align:center;">${status}</td>
          </tr>
        `;
      })
      .join("");

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:6px;">
        <h1 style="margin:0; font-size:28px; color:#0b7a39;">CGPA CalC - Semester Performance Report</h1>
        <div style="font-size:12px; color:#066a2b; margin-top:6px;">Official Academic Summary</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:14px; margin-bottom:6px;">
        <div style="font-size:13px; line-height:1.4;">
          <div><b>Name:</b> ${escapeHtml(profile.name || "")}</div>
          <div><b>RegisterNo:</b> ${escapeHtml(profile.registerNo || profile.registerNo || "")}</div>
          <div><b>Department:</b> ${escapeHtml(profile.department?.name || "")}</div>
          <div><b>Regulation:</b> ${escapeHtml(profile.regulation?.name || "")}</div>
        </div>
        <div style="text-align:right; font-size:13px;">
          <div><b>Semester:</b> ${escapeHtml(String(data.semester || semester))}</div>
          <div><b>Date:</b> ${escapeHtml(formattedDate)}</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:12px; border:2px solid #0b7a39;">
        <thead>
          <tr style="background:#cfeed3;">
            <th style="border:1px solid #0b7a39; padding:8px; width:5%;">S.No</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:15%;">Course Code</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:48%;">Course Title</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:8%;">Credits</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:12%;">Grade (Point)</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:6%;">Point</th>
            <th style="border:1px solid #0b7a39; padding:8px; width:8%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div style="margin-top:18px; font-size:15px;">
        <div><b>GPA:</b> ${formatNumber(gpaResult.gpa)}</div>
        <div><b>Total Credits:</b> ${formatNumber(gpaResult.totalCredits)}</div>
        <div><b>Total Points:</b> ${formatNumber(gpaResult.totalPoints)}</div>
      </div>

      <div style="margin-top:28px; text-align:right;">
        <div style="font-size:12px; color:#0b7a39;">System generated report</div>
        <div style="height:36px;"></div>
        <div style="font-weight:bold; color:#0b7a39;">Controller of Examinations</div>
      </div>
    `;

    document.body.appendChild(container);

    // render to canvas and produce PDF
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    // Calculate image size to fit width leaving margins
    const pageWidth = 210; // a4 mm
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", margin, 10, imgWidth, imgHeight);
    pdf.save(`Semester-${semester}-PerformanceReport.pdf`);

    document.body.removeChild(container);
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("Failed to generate PDF: " + (err?.message || err));
  }
};

// small helpers
function escapeHtml(text) {
  if (!text && text !== 0) return "";
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(n) {
  if (n === null || n === undefined) return "-";
  if (typeof n === "number") {
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }
  return n;
}
