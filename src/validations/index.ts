import { z } from "zod";

// ─── Semester ───────────────────────────────────────────────────────────────

export const semesterStatusSchema = z.enum(
  ["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"],
  {
    errorMap: () => ({ message: "Selecione um status válido para o semestre." }),
  }
);

export const createSemesterSchema = z
  .object({
    name: z
      .string({ required_error: "Informe o nome do semestre." })
      .min(1, "Informe o nome do semestre.")
      .max(100, "O nome do semestre deve ter no máximo 100 caracteres."),
    academicYear: z
      .string({ required_error: "Informe o ano acadêmico." })
      .min(1, "Informe o ano acadêmico (ex: 2026).")
      .max(10, "Ano acadêmico inválido."),
    academicTerm: z
      .string({ required_error: "Informe o período letivo." })
      .min(1, "Informe o período letivo (ex: 1º Semestre).")
      .max(20, "Período inválido."),
    startDate: z
      .string({ required_error: "Informe a data de início." })
      .min(1, "Informe a data de início."),
    endDate: z
      .string({ required_error: "Informe a data de término." })
      .min(1, "Informe a data de término."),
    status: semesterStatusSchema.default("PLANNED"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "A data final deve ser posterior à data inicial.",
    path: ["endDate"],
  });

export const updateSemesterSchema = z
  .object({
    name: z
      .string()
      .min(1, "Informe o nome do semestre.")
      .max(100, "O nome do semestre deve ter no máximo 100 caracteres.")
      .optional(),
    academicYear: z.string().min(1, "Informe o ano acadêmico.").max(10).optional(),
    academicTerm: z.string().min(1, "Informe o período letivo.").max(20).optional(),
    startDate: z.string().min(1, "Informe a data de início.").optional(),
    endDate: z.string().min(1, "Informe a data de término.").optional(),
    status: semesterStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "A data final deve ser posterior à data inicial.",
      path: ["endDate"],
    }
  );

// ─── Subject ────────────────────────────────────────────────────────────────

export const subjectStatusSchema = z.enum(
  ["ACTIVE", "COMPLETED", "FAILED", "DROPPED", "ARCHIVED"],
  {
    errorMap: () => ({ message: "Selecione um status válido para a disciplina." }),
  }
);

export const createSubjectSchema = z.object({
  semesterId: z.string({ required_error: "Semestre é obrigatório." }).uuid("ID de semestre inválido."),
  name: z
    .string({ required_error: "Informe o nome da disciplina." })
    .min(1, "Informe o nome da disciplina.")
    .max(200, "O nome da disciplina deve ter no máximo 200 caracteres."),
  code: z.string().max(30, "Código deve ter no máximo 30 caracteres.").optional().or(z.literal("")),
  professor: z.string().max(200, "Nome do professor deve ter no máximo 200 caracteres.").optional().or(z.literal("")),
  room: z.string().max(50, "Sala deve ter no máximo 50 caracteres.").optional().or(z.literal("")),
  workloadHours: z
    .number({ invalid_type_error: "Carga horária deve ser um número." })
    .int("Carga horária deve ser um número inteiro.")
    .positive("Carga horária deve ser maior que zero.")
    .optional()
    .nullable(),
  minimumAttendancePercentage: z
    .number({ invalid_type_error: "Frequência mínima deve ser um número." })
    .min(0, "A frequência mínima não pode ser menor que 0%.")
    .max(100, "A frequência mínima não pode ser maior que 100%.")
    .default(75),
  personalDifficulty: z
    .number({ invalid_type_error: "Dificuldade deve ser um número." })
    .int()
    .min(1, "Dificuldade mínima é 1.")
    .max(5, "Dificuldade máxima é 5.")
    .default(3),
  color: z.string().max(9).optional().or(z.literal("")),
  status: subjectStatusSchema.default("ACTIVE"),
});

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  id: z.string().uuid().optional(),
});

// ─── SubjectSchedule ────────────────────────────────────────────────────────

export const createSubjectScheduleSchema = z
  .object({
    subjectId: z.string().uuid("ID de disciplina inválido."),
    dayOfWeek: z
      .number({ required_error: "Selecione o dia da semana." })
      .int()
      .min(0, "Dia da semana inválido.")
      .max(6, "Dia da semana inválido."),
    startTime: z
      .string({ required_error: "Informe o horário inicial." })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Horário inicial inválido (use HH:MM)."),
    endTime: z
      .string({ required_error: "Informe o horário final." })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Horário final inválido (use HH:MM)."),
    room: z.string().max(50, "Sala deve ter no máximo 50 caracteres.").optional().or(z.literal("")),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "O horário final deve ser posterior ao horário inicial.",
    path: ["endTime"],
  });

// ─── GradingScheme & Components ─────────────────────────────────────────────

export const roundingModeSchema = z.enum(
  ["ROUND_HALF_UP", "ROUND_DOWN", "ROUND_UP", "NONE"],
  {
    errorMap: () => ({ message: "Modo de arredondamento inválido." }),
  }
);

export const updateGradingSchemeWithComponentsSchema = z.object({
  schemeId: z.string().uuid(),
  passingGrade: z
    .number({ required_error: "Informe a nota mínima para aprovação." })
    .min(0, "A média mínima não pode ser negativa.")
    .max(10, "A média mínima não pode exceder 10."),
  examEnabled: z.boolean().default(true),
  examTriggerThreshold: z
    .number({ required_error: "Informe o limite para exame." })
    .min(0, "O limite para exame não pode ser negativo.")
    .max(10, "O limite não pode exceder 10."),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
  components: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1, "Informe o nome da avaliação."),
        code: z.string().min(1, "Informe o código da avaliação (ex: P1)."),
        weight: z
          .number({ required_error: "Informe o peso." })
          .positive("O peso deve ser maior que zero."),
        maxGrade: z
          .number({ required_error: "Informe a nota máxima." })
          .positive("A nota máxima deve ser maior que zero.")
          .default(10),
        orderIndex: z.number().int().default(0),
        isExam: z.boolean().default(false),
      })
    )
    .min(1, "Adicione pelo menos um componente de avaliação."),
});

// ─── Assessment & Results ───────────────────────────────────────────────────

export const assessmentTypeSchema = z.enum(
  ["EXAM", "FINAL_EXAM", "ASSIGNMENT", "OTHER"],
  {
    errorMap: () => ({ message: "Tipo de avaliação inválido." }),
  }
);

export const assessmentStatusSchema = z.enum(
  ["SCHEDULED", "COMPLETED", "CANCELED"],
  {
    errorMap: () => ({ message: "Status de avaliação inválido." }),
  }
);

export const createAssessmentSchema = z.object({
  subjectId: z.string({ required_error: "Disciplina é obrigatória." }).uuid("ID de disciplina inválido."),
  gradeComponentId: z.string().uuid("ID de componente inválido.").optional().nullable(),
  title: z
    .string({ required_error: "Informe o título da avaliação." })
    .min(1, "Informe o título da avaliação (ex: Prova 1 - P1).")
    .max(200, "O título deve ter no máximo 200 caracteres."),
  type: assessmentTypeSchema.default("EXAM"),
  date: z.string().optional().nullable(),
  maxGrade: z
    .number({ invalid_type_error: "Nota máxima deve ser um número." })
    .min(0, "Nota máxima não pode ser negativa.")
    .max(100, "Nota máxima inválida.")
    .default(10),
  status: assessmentStatusSchema.default("SCHEDULED"),
  notes: z.string().optional().nullable(),
  grade: z
    .number({ invalid_type_error: "Nota deve ser um número." })
    .min(0, "A nota não pode ser negativa.")
    .max(100, "A nota não pode exceder o valor máximo.")
    .optional()
    .nullable(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const saveGradeSchema = z.object({
  assessmentId: z.string().uuid("ID de avaliação inválido."),
  grade: z
    .number({ required_error: "Informe a nota obtida." })
    .min(0, "A nota não pode ser negativa.")
    .max(100, "A nota não pode exceder 100."),
  notes: z.string().optional().nullable(),
});

// ─── ClassSession & Attendance ──────────────────────────────────────────────

export const classSessionStatusSchema = z.enum(
  ["SCHEDULED", "HELD", "CANCELED"],
  {
    errorMap: () => ({ message: "Status de aula inválido." }),
  }
);

export const attendanceStatusSchema = z.enum(
  ["PRESENT", "ABSENT", "PARTIAL", "EXCUSED", "NOT_RECORDED"],
  {
    errorMap: () => ({ message: "Status de presença inválido." }),
  }
);

export const createClassSessionSchema = z.object({
  subjectId: z.string().uuid("ID de disciplina inválido."),
  scheduleId: z.string().uuid("ID de horário inválido.").optional().nullable(),
  date: z.string({ required_error: "Informe a data da aula." }).min(1, "Informe a data da aula."),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  absenceUnits: z
    .number({ invalid_type_error: "Unidades de ausência deve ser um número." })
    .int("Unidades de ausência deve ser um número inteiro.")
    .min(1, "A aula deve valer pelo menos 1 unidade.")
    .default(1),
  status: classSessionStatusSchema.default("SCHEDULED"),
});

export const recordAttendanceSchema = z.object({
  classSessionId: z.string().uuid("ID de aula inválido."),
  status: attendanceStatusSchema,
  absentUnits: z
    .number({ required_error: "Informe as unidades de falta." })
    .int()
    .min(0, "Unidades de falta não podem ser negativas.")
    .default(0),
  notes: z.string().optional().nullable(),
});

// ─── Topic / Conteúdo ───────────────────────────────────────────────────────

export const topicStatusSchema = z.enum(
  ["NOT_STARTED", "IN_PROGRESS", "REVIEWED", "COMPLETED", "ARCHIVED"],
  {
    errorMap: () => ({ message: "Status de conteúdo inválido." }),
  }
);

export const createTopicSchema = z.object({
  subjectId: z.string({ required_error: "Disciplina é obrigatória." }).uuid("ID de disciplina inválido."),
  title: z
    .string({ required_error: "Informe o título do conteúdo." })
    .min(1, "Informe o título do conteúdo.")
    .max(250, "O título deve ter no máximo 250 caracteres."),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
  masteryLevel: z
    .number({ invalid_type_error: "Nível de domínio deve ser um número." })
    .int()
    .min(0, "Domínio mínimo é 0.")
    .max(4, "Domínio máximo é 4.")
    .default(0),
  importance: z
    .number({ invalid_type_error: "Importância deve ser um número." })
    .int()
    .min(1, "Importância mínima é 1.")
    .max(5, "Importância máxima é 5.")
    .default(3),
  estimatedHours: z
    .number({ invalid_type_error: "Horas estimadas deve ser um número." })
    .min(0, "Horas não podem ser negativas.")
    .optional()
    .nullable(),
  status: topicStatusSchema.default("NOT_STARTED"),
  assessmentId: z.string().uuid("ID de avaliação inválido.").optional().nullable(),
});

export const updateTopicSchema = createTopicSchema.partial();

export const updateTopicMasterySchema = z.object({
  topicId: z.string().uuid("ID de conteúdo inválido."),
  masteryLevel: z
    .number({ required_error: "Informe o nível de domínio." })
    .int()
    .min(0, "Nível mínimo é 0.")
    .max(4, "Nível máximo é 4."),
});

export const batchCreateTopicsSchema = z.object({
  subjectId: z.string().uuid("ID de disciplina inválido."),
  rawText: z
    .string({ required_error: "Insira a lista de tópicos." })
    .min(1, "Insira pelo menos um tópico."),
  assessmentId: z.string().uuid().optional().nullable(),
});
