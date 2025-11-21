import jsPDF from "jspdf";
import QRCode from "qrcode";

export const generateGPAPDFPro = async ({ profile, semester, rows, gpaResult }) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");

    // HEADER BORDER
    pdf.setDrawColor(0, 102, 153);
    pdf.setLineWidth(1.5);
    pdf.rect(5, 5, 200, 287);

    // UNIVERSITY HEADER
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(0, 51, 102);
    pdf.text("ANNA UNIVERSITY", 105, 18, { align: "center" });

    pdf.setFontSize(13);
    pdf.text("CHENNAI - 25", 105, 25, { align: "center" });

    pdf.setFontSize(14);
    pdf.setTextColor(0, 102, 153);
    pdf.text("OFFICIAL GRADE SHEET", 105, 32, { align: "center" });

    pdf.setLineWidth(0.8);
    pdf.line(20, 36, 190, 36);

    // STUDENT INFORMATION BOX
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Name: ${profile.name}`, 20, 50);
    pdf.text(`Roll No: ${profile.registerNo || "---"}`, 140, 50);

    pdf.text(`Department: ${profile.department?.name}`, 20, 57);
    pdf.text(`Regulation: ${profile.regulation?.name}`, 140, 57);

    pdf.text(`Semester: ${semester}`, 20, 64);
    pdf.text(
      `Exam: ${new Date().toLocaleString("default", { month: "short", year: "numeric" })}`,
      140,
      64
    );

    // TABLE HEADER
    const tableY = 75;
    pdf.setFillColor(220, 240, 255);
    pdf.rect(10, tableY - 5, 190, 10, "F");

    pdf.setFont("Helvetica", "bold");
    pdf.text("Sl.No", 15, tableY);
    pdf.text("Course Code", 35, tableY);
    pdf.text("Course Title", 80, tableY);
    pdf.text("Credits", 140, tableY);
    pdf.text("Grade", 160, tableY);
    pdf.text("Grade Point", 180, tableY);

    // TABLE CONTENT
    pdf.setFont("Helvetica", "normal");
    let y = tableY + 8;

    rows.forEach((r, i) => {
      pdf.text(String(i + 1), 15, y);
      pdf.text(r.code || "-", 35, y);
      pdf.text((r.name || "-").substring(0, 35), 80, y);
      pdf.text(String(r.credits || "-"), 140, y);
      pdf.text(r.grade || "-", 160, y);
      pdf.text(String(gradeToPoint(r.grade)), 180, y);
      y += 7;
    });

    // RESULTS BOX
    y += 10;
    pdf.setFont("Helvetica", "bold");
    pdf.setTextColor(0, 102, 0);
    pdf.text(`GPA : ${Number(gpaResult.gpa).toFixed(3)}`, 20, y);
    pdf.text(`Total Credits : ${gpaResult.totalCredits}`, 90, y);
    pdf.text(`Total Points : ${gpaResult.totalPoints}`, 160, y);

    // SIGNATURE AREA WITH QR
    y += 25;
    pdf.setTextColor(0, 0, 0);
    pdf.text("Verified & Approved", 20, y);

    pdf.text("Controller of Examinations", 140, y + 15);

    // QR CODE FOR E-VERIFICATION
    const qrData = `Student:${profile.name}|Sem:${semester}|GPA:${gpaResult.gpa}`;
    const qr = await QRCode.toDataURL(qrData);
    pdf.addImage(qr, "PNG", 20, y + 5, 22, 22);

    pdf.save(`ANNA_UNIVERSITY_PRO_MARKSHEET_SEM_${semester}.pdf`);
  } catch (err) {
    alert("Failed generating Pro Marksheet");
  }
};

// Grade → numeric mapping
function gradeToPoint(grade) {
  const map = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, U: 0, RA: 0 };
  return map[grade] ?? "-";
}
