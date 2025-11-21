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

    // Create a temporary printable area
    const container = document.createElement("div");
    container.id = "grade-sheet-print";
    container.style.width = "800px";
    container.style.margin = "0 auto";
    container.style.padding = "20px";
    container.style.background = "#dbf3f2";
    container.style.fontFamily = "Arial";
    container.style.border = "2px solid #008080";
    container.style.color = "#000";
    container.innerHTML = `
      <h2 style="text-align:center; font-size:22px; margin-bottom:5px; font-weight:bold;">
        ANNA UNIVERSITY, CHENNAI – 25
      </h2>
      <h3 style="text-align:center; font-size:18px; margin-top:0;">
        B.E. DEGREE EXAMINATIONS – GRADE SHEET
      </h3>
      <hr style="border:1px solid #008080">

      <table style="width:100%; font-size:12px; margin-top:10px;">
        <tr>
          <td><b>Name:</b> ${profile.name}</td>
          <td><b>Reg No:</b> ${profile?.registerNo || "---"}</td>
        </tr>
        <tr>
          <td><b>Department:</b> ${profile.department?.name}</td>
          <td><b>Regulation:</b> ${profile.regulation?.name}</td>
        </tr>
        <tr>
          <td><b>Semester:</b> ${semester}</td>
          <td><b>Month & Year:</b> ${new Date().toLocaleString("default", { month: "short", year: "numeric" })}</td>
        </tr>
      </table>

      <br>

      <table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
        <thead style="background:#c3e7e3; font-weight:bold;">
          <tr>
            <th>Sl.No</th>
            <th>Course Code</th>
            <th>Course Title</th>
            <th>Credits</th>
            <th>Grade</th>
            <th>Grade Point</th>
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
      <div style="font-size:13px;">
        <b>GPA:</b> ${Number(gpaResult.gpa).toFixed(3)}<br>
        <b>Total Credits Earned:</b> ${gpaResult.totalCredits}<br>
        <b>Total Grade Points Earned:</b> ${gpaResult.totalPoints}
      </div>

      <br><br>
      <p style="text-align:right; font-size:12px;"><b>Controller of Examinations</b></p>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 200;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);

    pdf.save(`AnnaUniversity-GradeSheet-Sem${semester}.pdf`);

    document.body.removeChild(container);
  } catch (error) {
    console.error("PDF Generation Failed:", error);
    alert("Something went wrong while generating PDF");
  }
};

// Helper to convert grade → points
function gradeToPoint(grade) {
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
  return map[grade] ?? "-";
}
