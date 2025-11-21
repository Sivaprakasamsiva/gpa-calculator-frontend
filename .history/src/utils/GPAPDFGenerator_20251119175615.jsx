// src/utils/GPAPDFGenerator.jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { studentAPI } from "../services/api";

/**
 * generateGPAPDF
 * - If rows/gpaResult provided (coming from GPACalculator UI) it uses them.
 * - Otherwise it fetches the full semester report from backend using studentAPI.getSemesterReport.
 *
 * Visuals:
 * - Classic Green theme (as requested)
 * - Strong table borders & alternating row backgrounds for clear printing
 * - Grade format: GRADE (POINT)  e.g. O (10)
 * - Adds Passed / Failed column (U / RA considered fail)
 *
 * Input:
 *  { profile, semester, rows, gpaResult }
 *
 * Note: studentAPI.getSemesterReport must exist (added to your api.js)
 */
export const generateGPAPDF = async ({ profile, semester, rows, gpaResult }) => {
  try {
    if (!semester) {
      alert("Select a semester to generate PDF.");
      return;
    }

    // If rows or gpaResult are missing, fetch from backend
    if (!Array.isArray(rows) || rows.length === 0 || !gpaResult) {
      try {
        const res = await studentAPI.getSemesterReport(Number(semester));
        const data = res.data;
        // Expecting SemesterReportDTO: { semester, gpa, totalCredits, totalPoints, subjects: [...] }
        rows = Array.isArray(data.subjects) ? data.subjects : [];
        gpaResult = {
          gpa: data.gpa,
          totalCredits: data.totalCredits,
          totalPoints: data.totalPoints,
        };
        // If profile missing, try to get minimal info from response (some backends include user details)
        if (!profile && data.student) {
          profile = {
            name: data.student.name,
            registerNo: data.student.registerNo,
            department: data.student.departmentName,
            regulation: data.student.regulationName,
          };
        }
      } catch (err) {
        console.error("Failed to fetch semester report from API:", err);
        alert("Failed to load semester data from server. Check console for details.");
        return;
      }
    }

    if (!profile) {
      // only minimal profile fields are required by your spec; if not present, leave blank
      profile = {};
    }

    // Build a clean container to render to canvas
    const container = document.createElement("div");
    container.id = "grade-sheet-custom";
    // sizing chosen to make the exported PDF crisp
    container.style.width = "900px";
    container.style.margin = "0 auto";
    container.style.padding = "18px";
    container.style.background = "#eaf6ea"; // soft green background
    container.style.fontFamily = "'Arial', sans-serif";
    container.style.border = "3px solid #0b6b33";
    container.style.borderRadius = "8px";
    container.style.color = "#000";
    container.style.boxSizing = "border-box";
    container.style.boxShadow = "0 0 12px rgba(0,0,0,0.15)";

    // Header area
    const studentName = profile.name || profile.fullName || "";
    const registerNo = profile.registerNo || profile.regNo || profile.register || profile.register_number || "";
    const department = (profile.department && (profile.department.name || profile.department)) || profile.departmentName || "";
    const regulation = (profile.regulation && (profile.regulation.name || profile.regulation)) || profile.regulationName || "";

    // Defensive: ensure numeric text formatting
    const displayGPA = gpaResult && typeof gpaResult.gpa !== "undefined" ? Number(gpaResult.gpa).toFixed(2) : "-";
    const displayCredits = gpaResult && typeof gpaResult.totalCredits !== "undefined" ? gpaResult.totalCredits : "-";
    const displayPoints = gpaResult && typeof gpaResult.totalPoints !== "undefined" ? gpaResult.totalPoints : "-";

    // Build table rows HTML (grade + point and Passed/Failed)
    const rowsHtml = (rows || []).map((r, i) => {
      const code = r.code || r.courseCode || r.subjectCode || "-";
      const title = r.name || r.courseTitle || r.subjectName || "-";
      // credits may be number or string
      const credits = typeof r.credits !== "undefined" && r.credits !== null ? r.credits : "-";
      // grade may be in different fields (grade / letter)
      const grade = r.grade || r.letter || (r.gradeLetter ? r.gradeLetter : "");
      // gradePoint might be stored as points, or gradePoint
      const gradePointVal = typeof r.gradePoint !== "undefined" && r.gradePoint !== null
        ? r.gradePoint
        : (typeof r.points !== "undefined" && r.points !== null ? r.points : (typeof r.pointsEarned !== "undefined" ? r.pointsEarned : null));

      // Format grade display like: O (10)
      const gradeDisplay = grade ? `${grade} ${gradePointVal != null ? `(${gradePointVal})` : ""}`.trim() : "-";

      // Passed/Failed: treat U and RA as fail
      const isFailed = typeof grade === "string" && (grade.toUpperCase() === "U" || grade.toUpperCase().startsWith("RA"));
      const status = isFailed ? "Failed" : "Passed";

      // Strong table borders and alternating background will be applied inline
      return `
        <tr style="background:${i % 2 === 0 ? "#f0fbf0" : "#e0f6e0"};">
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:6%">${i + 1}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:16%">${escapeHtml(code)}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:left; width:42%">${escapeHtml(title)}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:8%">${escapeHtml(credits)}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:12%; font-weight:700">${escapeHtml(gradeDisplay)}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:8%">${gradePointVal != null ? escapeHtml(Number(gradePointVal).toFixed(0)) : "-"}</td>
          <td style="border:1px solid #0b6b33; padding:6px; text-align:center; width:8%">${status}</td>
        </tr>
      `;
    }).join("");

    // Compose the whole HTML
    container.innerHTML = `
      <div style="text-align:center; margin-bottom:8px;">
        <div style="font-size:20px; font-weight:700; color:#085f2a;">CGPA CalC - Semester Performance Report</div>
        <div style="font-size:12px; color:#0b6b33; margin-top:4px;">Official Academic Summary</div>
      </div>

      <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; font-size:13px;">
        <div style="flex:1;">
          <div><strong>Name:</strong> ${escapeHtml(studentName)}</div>
          <div style="margin-top:4px;"><strong>RegisterNo:</strong> ${escapeHtml(registerNo)}</div>
        </div>
        <div style="flex:1;">
          <div><strong>Department:</strong> ${escapeHtml(department)}</div>
          <div style="margin-top:4px;"><strong>Regulation:</strong> ${escapeHtml(regulation)}</div>
        </div>
        <div style="flex:0 0 160px; text-align:right;">
          <div><strong>Semester:</strong> ${escapeHtml(semester)}</div>
          <div style="margin-top:4px;"><strong>Date:</strong> ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
      </div>

      <div style="width:100%; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; border:2px solid #0b6b33;">
          <thead>
            <tr style="background:#b7e8bc;">
              <th style="border:1px solid #0b6b33; padding:8px;">S.No</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Course Code</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Course Title</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Credits</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Grade (Point)</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Point</th>
              <th style="border:1px solid #0b6b33; padding:8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="border:1px solid #0b6b33; padding:10px; text-align:center;">No subjects found</td></tr>`}
          </tbody>
        </table>
      </div>

      <div style="margin-top:12px; font-size:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div><strong>GPA:</strong> ${escapeHtml(displayGPA)}</div>
            <div style="margin-top:6px;"><strong>Total Credits:</strong> ${escapeHtml(displayCredits)}</div>
            <div style="margin-top:6px;"><strong>Total Points:</strong> ${escapeHtml(displayPoints)}</div>
          </div>
          <div style="text-align:right; font-size:12px; color:#0b6b33;">
            <div>System generated report</div>
            <div style="margin-top:18px;">_______________________</div>
            <div style="margin-top:4px; font-weight:600;">Controller of Examinations</div>
          </div>
        </div>
      </div>
    `;

    // Attach temporarily and render to canvas
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // A4 portrait in mm: 210 x 297
    const pdf = new jsPDF("p", "mm", "a4");
    // convert canvas px to mm: we use width fit
    const pageWidth = 210 - 10; // 5mm margin left/right
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    const imgHeightInMM = pageWidth / imgRatio;

    pdf.addImage(imgData, "PNG", 5, 8, pageWidth, imgHeightInMM);
    pdf.save(`CGPACalC_Semester_${semester}_Report.pdf`);

    document.body.removeChild(container);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate PDF. See console for details.");
  }
};

// Helper: map grade → point (fallback)
function gradeToPoint(grade) {
  if (!grade) return "-";
  const g = grade.toString().toUpperCase();
  const map = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0, "RA": 0 };
  return map[g] ?? "-";
}

// Helper: escape HTML to avoid injection into the printable HTML
function escapeHtml(text) {
  if (text === null || typeof text === "undefined") return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
