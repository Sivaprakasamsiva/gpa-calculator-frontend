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

    // 1️⃣ fetch subjects
    const subRes = await studentAPI.getSubjects(
      profile.regulation.id,
      profile.department.id,
      Number(value)
    );
    const subjects = Array.isArray(subRes.data) ? subRes.data : [];
    setRawSubjects(subjects);

    // 2️⃣ fetch semester details
    const semRes = await studentAPI.getSemesterDetails(
      profile.department.id,
      profile.regulation.id,
      Number(value)
    );

    const electiveCount = semRes?.data?.elective_count ?? 0;

    // 3️⃣ Build UI rows using new logic
    const finalRows = buildRowsFromSubjects(subjects, electiveCount);
    setRows(finalRows);

  } catch (err) {
    console.error("Failed to fetch subjects or semester details:", err);
    toast.error("Failed to load semester data");
  } finally {
    setLoading(false);
  }
};
