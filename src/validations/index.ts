import { z } from "zod";

// ─── Semester ───────────────────────────────────────────────────────────────

export const semesterStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const createSemesterSchema = z
  .object({
    name: z.string().min(1).max(100),
    academicYear: z.string().min(1).max(10),
    academicTerm: z.string().min(1).max(20),
    startDate: z.string().date(),
    endDate: z.string().date(),
    status: semesterStatusSchema.optional().default("PLANNED"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

// ─── Subject ────────────────────────────────────────────────────────────────

export const subjectStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "FAILED",
  "DROPPED",
  "ARCHIVED",
]);

export const createSubjectSchema = z.object({
  semesterId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().max(30).optional(),
  professor: z.string().max(200).optional(),
  room: z.string().max(50).optional(),
  workloadHours: z.number().int().positive().optional(),
  minimumAttendancePercentage: z.number().min(0).max(100).optional().default(75),
  personalDifficulty: z.number().int().min(1).max(5).optional().default(3),
  color: z.string().max(9).optional(),
  status: subjectStatusSchema.optional().default("ACTIVE"),
});

// ─── SubjectSchedule ────────────────────────────────────────────────────────

export const createSubjectScheduleSchema = z.object({
  subjectId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM or HH:MM:SS)"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM or HH:MM:SS)"),
  room: z.string().max(50).optional(),
});

// ─── GradingScheme ──────────────────────────────────────────────────────────

export const roundingModeSchema = z.enum([
  "ROUND_HALF_UP",
  "ROUND_DOWN",
  "ROUND_UP",
  "NONE",
]);

export const createGradingSchemeSchema = z.object({
  subjectId: z.string().uuid(),
  passingGrade: z.number().min(0).optional().default(5),
  examEnabled: z.boolean().optional().default(true),
  examTriggerThreshold: z.number().min(0).optional().default(5),
  roundingMode: roundingModeSchema.optional().default("ROUND_HALF_UP"),
  decimalPlaces: z.number().int().min(0).max(4).optional().default(2),
});

// ─── GradeComponent ────────────────────────────────────────────────────────

export const createGradeComponentSchema = z.object({
  gradingSchemeId: z.string().uuid(),
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(10),
  weight: z.number().positive().optional().default(1),
  maxGrade: z.number().positive().optional().default(10),
  orderIndex: z.number().int().min(0).optional().default(0),
  isExam: z.boolean().optional().default(false),
});

// ─── Assessment ─────────────────────────────────────────────────────────────

export const assessmentTypeSchema = z.enum([
  "EXAM",
  "FINAL_EXAM",
  "ASSIGNMENT",
  "OTHER",
]);

export const assessmentStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELED",
]);

export const createAssessmentSchema = z.object({
  subjectId: z.string().uuid(),
  gradeComponentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  type: assessmentTypeSchema,
  date: z.string().date().optional(),
  maxGrade: z.number().positive().optional().default(10),
  status: assessmentStatusSchema.optional().default("SCHEDULED"),
  notes: z.string().optional(),
});

// ─── AssessmentResult ───────────────────────────────────────────────────────

export const createAssessmentResultSchema = z.object({
  assessmentId: z.string().uuid(),
  grade: z.number().min(0),
  gradedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ─── ClassSession ───────────────────────────────────────────────────────────

export const classSessionStatusSchema = z.enum([
  "SCHEDULED",
  "HELD",
  "CANCELED",
]);

export const createClassSessionSchema = z.object({
  subjectId: z.string().uuid(),
  scheduleId: z.string().uuid().optional(),
  date: z.string().date(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .optional(),
  absenceUnits: z.number().int().positive().optional().default(1),
  status: classSessionStatusSchema.optional().default("SCHEDULED"),
});

// ─── Attendance ─────────────────────────────────────────────────────────────

export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "ABSENT",
  "PARTIAL",
  "EXCUSED",
  "NOT_RECORDED",
]);

export const createAttendanceSchema = z.object({
  classSessionId: z.string().uuid(),
  status: attendanceStatusSchema,
  absentUnits: z.number().int().min(0).optional().default(0),
  notes: z.string().optional(),
});
