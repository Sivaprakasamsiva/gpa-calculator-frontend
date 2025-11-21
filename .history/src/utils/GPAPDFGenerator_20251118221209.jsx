// src/utils/GPAPDFGenerator.jsx
import { jsPDF } from "jspdf";

import html2canvas from "html2canvas";

/**
 * Generate a single-semester GPA marksheet PDF
 * Frontend-only, Anna University style (approximate).
 *
 * Expected shape:
 *  profile: {
 *    name, registerNo?, department: { name }, regulation: { name, year? }
 *  }
 *  semester: number | string
 *  rows: [
 *    { code, name, credits, grade }  // grade can be empty
 *  ]
 *  gpaResult: { gpa, totalCredits, totalPoints }
 */
export const generateGPAPDF = async ({
  profile,
  semester,
  rows,
  gpaResult,
}) => {
  try {
    if (!profile || !semester || !gpaResult) {
      alert("Missing data! Cannot generate PDF.");
      return;
    }

    const safeSemester = Number(semester) || semester;
    const subjects = Array.isArray(rows) ? rows : [];

    // ---- Build printable DOM ----
    const container = document.createElement("div");
    container.id = "au-grade-sheet-print";
    container.style.width = "800px";
    container.style.margin = "0 auto";
    container.style.padding = "18px 24px 24px 24px";
    container.style.background = "#d8f3f1"; // light aqua, similar to sample
    container.style.fontFamily = "Arial, sans-serif";
    container.style.border = "1px solid #008b8b";
    container.style.color = "#000";
    container.style.boxSizing = "border-box";
    container.style.position = "relative";

    // light watermark text in centre (approximate)
    const watermark = `
      <div style="
        position:absolute;
        top:50%;
        left:50%;
        transform:translate(-50%, -50%);
        font-size:60px;
        color:rgba(0,0,0,0.04);
        letter-spacing:4px;
        text-align:center;
        pointer-events:none;
        user-select:none;
      ">
        ANNA UNIVERSITY
      </div>
    `;

    const today = new Date();
    const monthYear = today.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const dateStr = today.toLocaleDateString("en-GB");

    const gpaValue = Number(gpaResult.gpa || 0);
    const totalCredits = gpaResult.totalCredits ?? "-";
    const totalPoints = gpaResult.totalPoints ?? "-";

    container.innerHTML = `
      ${watermark}

      <!-- TOP HEADING -->
      <div style="text-align:center; margin-bottom:4px;">
        <div style="font-size:20px; font-weight:bold;">
          ANNA UNIVERSITY, CHENNAI – 25
        </div>
        <div style="font-size:16px; font-weight:bold; margin-top:2px;">
          B.E. DEGREE EXAMINATIONS
        </div>
        <div style="font-size:14px; font-weight:bold; margin-top:2px;">
          GRADE SHEET
        </div>
      </div>

      <!-- TOP META ROW -->
      <table style="width:100%; font-size:11px; margin-top:8px; border-collapse:collapse;">
        <tr>
          <td style="width:50%; padding:2px 0;">
            <b>S.I.No:</b> &nbsp; MA&nbsp; <span style="font-weight:bold; letter-spacing:1px;">${profile.registerNo || "0000000"}</span>
          </td>
          <td style="width:25%; padding:2px 0;">
            <b>Folio No.</b> &nbsp; __________
          </td>
          <td style="width:25%; padding:2px 0; text-align:right;">
            <!-- placeholder for QR / hologram -->
            <span style="
              display:inline-block;
              border:1px solid #999;
              padding:12px;
              font-size:9px;
              background:rgba(255,255,255,0.6);
            ">
              QR / Seal
            </span>
          </td>
        </tr>
      </table>

      <!-- CANDIDATE INFO (TOP GRID) -->
      <table style="width:100%; font-size:11px; margin-top:6px; border-collapse:collapse;">
        <tr>
          <td style="width:50%; padding:2px 0;">
            <b>NAME OF THE CANDIDATE</b><br/>
            ${profile.name || "-"}
          </td>
          <td style="width:30%; padding:2px 0;">
            <b>REGISTER NO.</b><br/>
            ${profile.registerNo || "__________"}
          </td>
          <td style="width:20%; padding:2px 0; text-align:center;" rowspan="3">
            <!-- Student photo placeholder -->
            <div style="
              width:85px;
              height:100px;
              margin-left:auto;
              border:1px solid #333;
              background:#ffe0e0;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:10px;
            ">
              PHOTO
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:2px 0;">
            <b>DATE OF BIRTH</b><br/>
            __________
          </td>
          <td style="padding:2px 0;">
            <b>GENDER</b><br/>
            __________
          </td>
        </tr>

        <tr>
          <td style="padding:2px 0;">
            <b>COLLEGE OF STUDY</b><br/>
            ${profile.collegeName || "____________________________"}
          </td>
          <td style="padding:2px 0;">
            <b>MONTH & YEAR OF EXAMINATION</b><br/>
            ${monthYear.toUpperCase()}
          </td>
        </tr>

        <tr>
          <td style="padding:2px 0;">
            <b>PROGRAMME & BRANCH</b><br/>
            ${profile.programme || "B.E. / B.TECH"} &nbsp; 
            ${profile.department?.name || ""}
          </td>
          <td style="padding:2px 0;">
            <b>REGULATIONS</b><br/>
            ${profile.regulation?.name || ""} ${profile.regulation?.year ? `(${profile.regulation.year})` : ""}
          </td>
          <td></td>
        </tr>
      </table>

      <!-- SUBJECT TABLE -->
      <div style="margin-top:10px; border:1px solid #000;">
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#c7eceb; font-weight:bold;">
              <th style="border-right:1px solid #000; padding:4px; width:8%;">SEM. NO.</th>
              <th style="border-right:1px solid #000; padding:4px; width:12%;">COURSE CODE</th>
              <th style="border-right:1px solid #000; padding:4px;">COURSE TITLE</th>
              <th style="border-right:1px solid #000; padding:4px; width:10%;">CREDITS</th>
              <th style="border-right:1px solid #000; padding:4px; width:10%;">LETTER GRADE</th>
              <th style="border-right:1px solid #000; padding:4px; width:10%;">GRADE POINT</th>
              <th style="padding:4px; width:10%;">RESULT</th>
            </tr>
          </thead>
          <tbody>
            ${
              subjects.length > 0
                ? subjects
                    .map(
                      (r, i) => `
                <tr>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:center;">
                    ${safeSemester.toString().padStart(2, "0")}
                  </td>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:center;">
                    ${r.code || "-"}
                  </td>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:left;">
                    ${r.name || "-"}
                  </td>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:center;">
                    ${r.credits ?? "-"}
                  </td>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:center;">
                    ${r.grade || ""}
                  </td>
                  <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px; text-align:center;">
                    ${gradeToPoint(r.grade)}
                  </td>
                  <td style="border-top:1px solid #000; padding:4px; text-align:center;">
                    ${gradeToResult(r.grade)}
                  </td>
                </tr>
              `
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="7" style="border-top:1px solid #000; padding:8px; text-align:center;">
                    Subject-wise grades not available. GPA summary only.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>

      <!-- BOTTOM SUMMARY GRID -->
      <div style="margin-top:10px; border:1px solid #000; padding:8px 6px; font-size:11px;">
        <table style="width:100%; border-collapse:collapse; text-align:center;">
          <tr>
            <th style="border-right:1px solid #000; padding:4px;">Semester</th>
            <th style="border-right:1px solid #000; padding:4px;">Credits Registered</th>
            <th style="border-right:1px solid #000; padding:4px;">Credits Earned</th>
            <th style="border-right:1px solid #000; padding:4px;">Grade Points Earned</th>
            <th style="border-right:1px solid #000; padding:4px;">Grade Point Average (GPA)</th>
            <th style="padding:4px;">Cumulative Grade Point Average (CGPA)</th>
          </tr>
          <tr>
            <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px;">
              ${safeSemester}
            </td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px;">
              ${totalCredits}
            </td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px;">
              ${totalCredits}
            </td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px;">
              ${totalPoints}
            </td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; padding:4px;">
              ${gpaValue.toFixed(3)}
            </td>
            <td style="border-top:1px solid #000; padding:4px;">
              ${gpaValue.toFixed(2)}
            </td>
          </tr>
        </table>

        <div style="margin-top:8px; font-size:9px; text-align:left;">
          <b>RA</b> – Reappearance is required &nbsp;&nbsp;
          <b>W</b> – Withdrawal &nbsp;&nbsp;
          <b>SE</b> – Sports Exemption &nbsp;&nbsp;
          <b>*</b> – Absent for University Examination
        </div>
      </div>

      <!-- SIGNATURE ROW -->
      <div style="margin-top:16px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div>Chennai – 600 025.</div>
            <div>Date : ${dateStr}</div>
          </div>
          <div style="text-align:center;">
            <div style="
              display:inline-block;
              border-radius:50%;
              border:1px solid #444;
              padding:12px 18px;
              font-size:10px;
              margin-bottom:4px;
            ">
              Controller of Examinations<br/>Seal
            </div>
            <div style="border-top:1px solid #000; margin-top:20px; padding-top:2px;">
              CONTROLLER OF EXAMINATIONS i/c
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // ---- Render to PDF ----
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 5;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save(`AU-GradeSheet-Sem${safeSemester}.pdf`);

    document.body.removeChild(container);
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Something went wrong while generating PDF");
  }
};

// Helper: convert grade → points
function gradeToPoint(grade) {
  const g = String(grade || "").toUpperCase();
  const map = {
    O: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    U: 0,
    RA: 0,
  };
  return map[g] ?? "";
}

// Helper: convert grade → PASS / RA / blank
function gradeToResult(grade) {
  if (!grade) return "";
  const g = String(grade).toUpperCase();
  if (g === "U" || g === "RA") return "RA";
  return "PASS";
}
