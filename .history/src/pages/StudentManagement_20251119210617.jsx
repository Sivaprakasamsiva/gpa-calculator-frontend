// src/pages/StudentManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI, studentAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

/**
 * StudentManagement.jsx
 *
 * - All original behaviors kept (create student modal, metadata load, search)
 * - Removed the old "View" action button (which previously opened history)
 * - Renamed the "PDF" button to "View" (it now opens a Semester Detail modal)
 * - Semester Detail modal:
 *    * Fetches student's history (semesters + GPA)
 *    * Shows a dropdown of available history semesters
 *    * On semester selection, fetches subject-level grade/point details and download PDF
 */

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // student list + filter
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // create student modal/form
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });
  const [loadingCreate, setLoadingCreate] = useState(false);

  // meta
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyViewData, setHistoryViewData] = useState(null);

  // semester modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterModalStudent, setSemesterModalStudent] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSemesterSubjects, setLoadingSemesterSubjects] =
    useState(false);
  const [loadingSemesterHistory, setLoadingSemesterHistory] =
    useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // ==========================
  // Load Students
  // ==========================
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  // ==========================
  // Load meta
  // ==========================
  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);

      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      toast.error("Failed to load metadata");
    } finally {
      setLoadingMeta(false);
    }
  };

  // ==========================
  // Create Student
  // ==========================
  const handleCreate = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.regulationId ||
      !form.departmentId
    ) {
      toast.error("Please fill all fields");
      return;
    }

    setLoadingCreate(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        regulationId: Number(form.regulationId),
        departmentId: Number(form.departmentId),
      };

      await adminAPI.createStudent(payload);
      toast.success("Student created!");
      setShowModal(false);

      setForm({
        name: "",
        email: "",
        password: "",
        regulationId: "",
        departmentId: "",
      });

      await loadStudents();
    } catch (err) {
      toast.error(err?.response?.data || "Failed to create student");
    } finally {
      setLoadingCreate(false);
    }
  };

  // ==========================
  // Open Semester Modal
  // ==========================
  const openSemesterModal = async (student) => {
    setSemesterModalStudent(student);
    setShowSemesterModal(true);
    setSelectedSemester("");
    setSemesterSubjects([]);
    setSemesterHistory([]);

    setLoadingSemesterHistory(true);
    try {
      const res = await adminAPI.getStudentHistory(student.id);
      setSemesterHistory(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch student history");
    } finally {
      setLoadingSemesterHistory(false);
    }
  };

  // ==========================
  // Load subjects for semester
  // ==========================
  const loadSemesterSubjects = async (studentId, sem) => {
    if (!studentId || !sem) return;

    setLoadingSemesterSubjects(true);
    try {
      const res = await adminAPI.getSemesterReport(studentId, Number(sem));
      const data = res.data || {};

      setSemesterSubjects(data.subjects || []);
      setSelectedSemester(data.semester ?? sem);
    } catch (err) {
      toast.error(err?.response?.data || "Failed to fetch subjects");
      setSemesterSubjects([]);
    } finally {
      setLoadingSemesterSubjects(false);
    }
  };

  // ==========================
  // Download PDF
  // ==========================
  const handleDownloadStudentPdf = async (studentId, sem) => {
    if (!studentId || !sem) {
      toast.error("Select a semester first");
      return;
    }

    setDownloadingPdf(true);
    try {
      const res = await adminAPI.downloadStudentMarksheet(
        studentId,
        Number(sem)
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `student-${studentId}-sem-${sem}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==========================
  // Filter Students
  // ==========================
  const filteredStudents = students.filter((st) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      st.name?.toLowerCase().includes(q) ||
      st.email?.toLowerCase().includes(q) ||
      st.department?.name?.toLowerCase().includes(q) ||
      st.regulation?.name?.toLowerCase().includes(q)
    );
  });

