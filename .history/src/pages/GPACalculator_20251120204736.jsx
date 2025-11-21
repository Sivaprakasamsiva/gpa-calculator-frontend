// ===============================
// GPA CALCULATOR (PATCHED - PART 1)
// WITH SEARCHABLE ELECTIVE DROPDOWN
// ===============================

import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";

import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";

import { Download, Calculator as CalcIcon, XCircle } from "lucide-react";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";

// ⭐ NEW SEARCHABLE SELECT COMPONENT
import SearchableDropdown from "../components/SearchableDropdown";

const GPACalculator = () => {
  // ----------------------------------------
  // STATE
  // ----------------------------------------
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");

  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // default credits for unselected elective
  const [electiveDefaultCredits, setElectiveDefaultCredits] = useState(3);

  // ----------------------------------------
  // LOAD PROFILE
  // ----------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // ----------------------------------------
  // SEMESTER COUNT
  // ----------------------------------------
  const maxSemesters = useMemo(() => {
    if (
      profile?.department?.semesterCount &&
      profile.department.semesterCount > 0
    ) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

  // ----------------------------------------
  // GRADE → POINT MAP
  // ----------------------------------------
  const GRADE_POINT_MAP = {
    O: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    U: 0,
    RA: 0,
    "RA(0)": 0,
  };

  // ----------------------------------------
  // BUILD ROWS
  // ----------------------------------------
  const buildRowsFromSubjects = (subjectList, electiveCount) => {
    if (!Array.isArray(subjectList)) return [];

    const mandatory = subjectList.filter((s) => !s.isElective);
    const electives = subjectList.filter((s) => !!s.isElective);

    const defaultElectiveCredits =
      electives.length > 0 ? electives[0].credits ?? 3 : 3;

    setElectiveDefaultCredits(defaultElectiveCredits);

    const mandatoryRows = mandatory.map((s) => ({
      rowId: `MAND-${s.id}`,
      mode: "mandatory",
      isElective: false,
      subjectId: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type || "CORE",
      grade: "",
      points: null,
    }));

    const electiveRows = Array.from(
      { length: Number(electiveCount || 0) },
      (_, i) => ({
        rowId: `ELEC-${i + 1}`,
        mode: "elective",
        isElective: true,
        slotNumber: i + 1,
        subjectId: "",
        code: "",
        name: `Elective ${i + 1}`,
        credits: defaultElectiveCredits,
        type: "ELECTIVE",
        grade: "",
        points: 3,
        boundToSubject: false,
      })
    );

    return [...mandatoryRows, ...electiveRows];
  };

  // ----------------------------------------
  // WHEN SEMESTER CHANGES → LOAD SUBJECTS
  // ----------------------------------------
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile is missing regulation/department");
      return;
    }

    try {
      setLoading(true);

      const regId = profile.regulation.id;
      const deptId = profile.department.id;
      const semNum = Number(value);

      const [subRes, semRes] = await Promise.all([
        studentAPI.getSubjects(regId, deptId, semNum),
        studentAPI.getSemesterDetails(deptId, regId, semNum),
      ]);

      const subjects = Array.isArray(subRes.data) ? subRes.data : [];
      const semInfo = semRes?.data || {};

      const electiveCount =
        typeof semInfo.electiveCount === "number"
          ? semInfo.electiveCount
          : semInfo?.elective_count ?? 0;

      setRawSubjects(subjects);

      const builtRows = buildRowsFromSubjects(subjects, electiveCount);
      setRows(builtRows);

      if (subjects.length === 0) {
        toast.info("No subjects configured for this semester.");
      }
    } catch (err) {
      console.error("Failed loading subject / semester data:", err);
      toast.error("Failed loading data");
    } finally {
      setLoading(false);
    }
  };
