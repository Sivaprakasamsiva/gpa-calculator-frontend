import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateGPAPDF = ({ profile, semester, subjects, gpa }) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    // Theme Colors
    const themeBg = "#D1F0D1";
    const themeText = "#004d00";
    const borderColor = "#006600";

    // Title Block
    doc.setFillColor(themeBg);
    doc.setDrawColor(borderColor);
    doc.roundedRect(10, 10, 190, 18, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(themeText);
    doc.text("CGPA CalC - Semester Performance Report", 105, 20, {
      align: "center",
    });

    // Student Details Block
    doc.setFillColor("#E8FFE8");
    doc.roundedRect(10, 30, 190, 20, 2, 2, "FD");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.text(`Name: `, 14, 38);
    doc.text(`Department: `, 14, 44);

    doc.text(`Semester: `, 110, 38);
    doc.text(`Date: `, 110, 44);

    doc.setFont("helvetica", "normal");
    doc.text(`${profile.name || "-"}`, 35, 38);
    doc.text(`${profile.department?.name || "-"}`, 42, 44);
    doc.text(`${semester}`, 140, 38);
    doc.text(`${new Date().toLocaleDateString()}`, 130, 44);

    // Table data convert (Grade + Points -> format: O (10), A+ (9) etc.)
    const formattedRows = subjects.map((s, index) => [
      index + 1,
      s.code || "-",
      s.name || "-",
      s.credits || "-",
      `${s.grade || "-"} (${s.points ?? "-"})`,
    ]);

    // Table Rendering
    autoTable(doc, {
      startY: 55,
      head: [["S.No", "Course Code", "Course Title", "Credits", "Grade (Pts)"]],
      body: formattedRows,
      theme: "grid",
      headStyles: {
        fillColor: "#7CCD7C",
        textColor: "#003300",
        lineColor: borderColor,
        lineWidth: 0.3,
        halign: "center",
      },
      bodyStyles: {
        fillColor: "#F6FFF6",
        textColor: "#003300",
        lineColor: borderColor,
        halign: "center",
      },
      alternateRowStyles: { fillColor: "#E8FFE8" },
      styles: { fontSize: 9 },
    });

    // GPA Summary
    const summaryY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text(`GPA:`, 12, summaryY);
    doc.text(`Total Credits Earned:`, 12, summaryY + 7);
    doc.text(`Total Points Earned:`, 12, summaryY + 14);

    doc.setFont("helvetica", "normal");
    doc.text(`${gpa?.gpa?.toFixed(2) || "-"}`, 40, summaryY);
    doc.text(`${gpa?.totalCredits || "-"}`, 55, summaryY + 7);
    doc.text(`${gpa?.totalPoints || "-"}`, 55, summaryY + 14);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor("#444");
    doc.text(
      "This is a system-generated performance statement — No manual signature required.",
      105,
      290,
      { align: "center" }
    );

    // Save PDF
    doc.save(`Semester-${semester}-PerformanceReport.pdf`);
  } catch (error) {
    console.error("PDF Generation Failed:", error);
  }
};
