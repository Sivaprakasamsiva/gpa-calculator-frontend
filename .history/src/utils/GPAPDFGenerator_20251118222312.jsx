// src/utils/GPAPDFGenerator.jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateGPAPDF = async ({
  profile,
  semester,
  rows,
  gpaResult,
}) => {
  try {
    if (!profile || !semester || !rows || !gpaResult) {
      alert("Missing data! Cannot generate PDF.");
      return;
    }

    const container = document.createElement("div");
    container.id = "grade-sheet-custom";
    container.style.width = "900px";
    container.style.margin = "0 auto";
    container.style.padding = "20px";
    container.style.background = "#d3f5d1"; // Classic soft green
    container.style.fontFamily = "'Arial', sans-serif";
    container.style.border = "3px solid #007a3d";
    container.style.borderRadius = "8px";
    container.style.color = "#000";
    container.style.boxShadow = "0 0 8px rgba(0,0,0,0.25)";

    container.innerHTML = `
      <h2 style="text-align:center; font-size:26px; font-weight:bold; margin-bottom:5px; color:#004d26;">
        CGPA CalC - Semester Performance Report
      </h2>
      <p style="text-align:center; font-size:14px; margin-top:0; color:#005c2d;">
        Generated Report | Verified Academic Summary
      </p>
      <hr style="border:1px solid #007a3d; margin:10px 0 15px 0;">

      <table style="width:100%; font-size:14px; margin-bottom:10px;">
        <tr>
          <td><b>Name:</b> ${profile.name}</td>
          <td><b>Register No:</b> ${profile?.registerNo || "---"}</td>
        </tr>
        <tr>
          <td><b>Department:</b> ${profile.department?.name || "---"}</td>
          <td><b>Regulation:</b> ${profile.regulation?.name || "---"}</td>
        </tr>
        <tr>
          <td><b>Semester:</b> ${semester}</td>
          <td><b>Date:</b> ${new Date().toLocaleDateString()}</td>
        </tr>
      </table>

      <table border="1" cellpadding="6" cellspacing="0"
      style="width:100%; border-collapse:collapse; text-align:center; font-size:13px; border-color:#007a3d;">
        <thead style="background:#a7e9a1; color:#003f1f;">
          <tr>
            <th style="width:5%;">S.No</th>
            <th style="width:18%;">Course Code</th>
            <th style="width:47%;">Course Title</th>
            <th style="width:10%;">Credits</th>
            <th style="width:10%;">Grade</th>
            <th style="width:10%;">Grade Point</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.code || "-"}</td>
              <td style="text-align:left; padding-left:5px;">${r.name || "-"}</td>
              <td>${r.credits || "-"}</td>
              <td>${r.grade || "-"}</td>
              <td>${gradeToPoint(r.grade)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <br>
      <div style="font-size:15px;">
        <b>GPA:</b> ${Number(gpaResult.gpa).toFixed(2)}<br>
        <b>Total Credits Earned:</b> ${gpaResult.totalCredits}<br>
        <b>Total Grade Points:</b> ${gpaResult.totalPoints}
      </div>

      <br><br>
      <p style="text-align:center; font-size:11px; color:#004d26;">
        This is a system generated academic summary – no official stamp or signature required.
      </p>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 200;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
    pdf.save(`Semester-${semester}-PerformanceReport.pdf`);

    document.body.removeChild(container);
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Something went wrong while generating PDF");
  }
};

// grade → points
function gradeToPoint(grade) {
  const map = {
    O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, U: 0, RA: 0,
  };
  return map[grade] ?? "-";
}
