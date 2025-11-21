export const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'U': 0
}

export const GRADE_OPTIONS = [
  { label: "O (10)", value: "O" },
  { label: "A+ (9)", value: "A+" },
  { label: "A (8)", value: "A" },
  { label: "B+ (7)", value: "B+" },
  { label: "B (6)", value: "B" },
  { label: "C (5)", value: "C" },
  { label: "U (0)", value: "U" },   // changed from RA(0)
  { label: "Not Have", value: "NOT_HAVE" },
];


export const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Semester ${i + 1}`
}))