export const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'RA': 0
}

export const GRADE_OPTIONS = [
  { value: 'O', label: 'O (10)' },
  { value: 'A+', label: 'A+ (9)' },
  { value: 'A', label: 'A (8)' },
  { value: 'B+', label: 'B+ (7)' },
  { value: 'B', label: 'B (6)' },
  { value: 'C', label: 'C (5)' },
  { value: '', label: 'RA (0)' }
]

export const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Semester ${i + 1}`
}))