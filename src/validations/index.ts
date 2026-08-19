import { z } from "zod";

// ─── Semester ────────────────────────────────────────────────────────────────

export const semesterStatusSchema = z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"], {
  errorMap: () => ({ message: "Status de semestre inválido." }),
});

export const semesterBaseSchema = z.object({
  name: z
    .string({ required_error: "O nome do semestre é obrigatório." })
    .min(1, "O nome do semestre não pode ser vazio.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  academicYear: z
    .string({ required_error: "O ano letivo é obrigatório." })
    .regex(/^\d{4}$/, "O ano letivo deve ter 4 dígitos (ex: 2026)."),
  academicTerm: z
    .string({ required_error: "O período letivo é obrigatório." })
    .min(1, "O período letivo não pode ser vazio.")
    .max(50, "O período deve ter no máximo 50 caracteres."),
  startDate: z
    .string({ required_error: "A data de início é obrigatória." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)."),
  endDate: z
    .string({ required_error: "A data de término é obrigatória." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)."),
  status: semesterStatusSchema.default("ACTIVE"),
  isCurrent: z.boolean().default(false),
});

export const createSemesterSchema = semesterBaseSchema.refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: "A data final deve ser posterior à data inicial.",
    path: ["endDate"],
  }
);

export const updateSemesterSchema = semesterBaseSchema.partial();

// ─── Subject ─────────────────────────────────────────────────────────────────

export const subjectStatusSchema = z.enum(
  ["ACTIVE", "COMPLETED", "FAILED", "DROPPED", "ARCHIVED"],
  {
    errorMap: () => ({ message: "Status de disciplina inválido." }),
  }
);

export const createSubjectSchema = z.object({
  semesterId: z
    .string({ required_error: "O semestre é obrigatório." })
    .uuid("ID de semestre inválido."),
  name: z
    .string({ required_error: "O nome da disciplina é obrigatório." })
    .min(1, "O nome não pode ser vazio.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  code: z
    .string()
    .max(30, "O código deve ter no máximo 30 caracteres.")
    .optional()
    .nullable(),
  professor: z
    .string()
    .max(150, "O nome do professor deve ter no máximo 150 caracteres.")
    .optional()
    .nullable(),
  room: z
    .string()
    .max(50, "A sala/local deve ter no máximo 50 caracteres.")
    .optional()
    .nullable(),
  workloadHours: z
    .number({ invalid_type_error: "A carga horária deve ser um número." })
    .positive("A carga horária deve ser maior que zero.")
    .int("A carga horária deve ser um número inteiro.")
    .optional()
    .nullable(),
  minimumAttendancePercentage: z
    .number({ invalid_type_error: "A frequência mínima deve ser um número." })
    .min(0, "A frequência mínima não pode ser menor que 0%.")
    .max(100, "A frequência mínima não pode exceder 100%.")
    .default(75),
  personalDifficulty: z
    .number({ invalid_type_error: "A dificuldade pessoal deve ser um número." })
    .int("A dificuldade deve ser um número inteiro.")
    .min(1, "A dificuldade mínima é 1.")
    .max(5, "A dificuldade máxima é 5.")
    .default(3),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "A cor deve ser um hexadecimal válido (ex: #3B82F6).")
    .optional()
    .nullable(),
  status: subjectStatusSchema.default("ACTIVE"),
});

export const updateSubjectSchema = createSubjectSchema.partial();

// ─── Subject Schedules ───────────────────────────────────────────────────────

export const subjectScheduleBaseSchema = z.object({
  subjectId: z
    .string({ required_error: "A disciplina é obrigatória." })
    .uuid("ID de disciplina inválido."),
  dayOfWeek: z
    .number({ required_error: "O dia da semana é obrigatório." })
    .int()
    .min(0, "Dia da semana inválido (0 = Domingo, 6 = Sábado).")
    .max(6, "Dia da semana inválido (0 = Domingo, 6 = Sábado)."),
  startTime: z
    .string({ required_error: "O horário de início é obrigatório." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido (HH:MM)."),
  endTime: z
    .string({ required_error: "O horário de término é obrigatório." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido (HH:MM)."),
  room: z
    .string()
    .max(50, "A sala deve ter no máximo 50 caracteres.")
    .optional()
    .nullable(),
});

export const createSubjectScheduleSchema = subjectScheduleBaseSchema.refine(
  (data) => {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    return endMin > startMin;
  },
  {
    message: "O horário final deve ser posterior ao horário inicial.",
    path: ["endTime"],
  }
);

export const updateSubjectScheduleSchema = subjectScheduleBaseSchema.partial();

// ─── Grading Scheme & Components ─────────────────────────────────────────────

export const roundingModeSchema = z.enum(
  ["NONE", "ROUND_HALF_UP", "CEIL", "FLOOR"],
  {
    errorMap: () => ({ message: "Modo de arredondamento inválido." }),
  }
);

export const updateGradingSchemeWithComponentsSchema = z.object({
  schemeId: z.string().uuid("ID de esquema inválido."),
  passingGrade: z
    .number({ required_error: "Informe a média mínima para aprovação." })
    .min(0, "A média não pode ser negativa.")
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
  subjectId: z
    .string({ required_error: "Disciplina é obrigatória." })
    .uuid("ID de disciplina inválido."),
  componentId: z.string().uuid("ID de componente inválido.").optional().nullable(),
  title: z
    .string({ required_error: "Título da avaliação é obrigatório." })
    .min(1, "O título não pode ser vazio.")
    .max(150, "O título deve ter no máximo 150 caracteres."),
  type: assessmentTypeSchema.default("EXAM"),
  date: z
    .string({ required_error: "Data da avaliação é obrigatória." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)."),
  weight: z
    .number({ invalid_type_error: "O peso deve ser um número." })
    .positive("O peso deve ser maior que zero.")
    .optional()
    .nullable(),
  maxGrade: z
    .number({ invalid_type_error: "A nota máxima deve ser um número." })
    .positive("A nota máxima deve ser maior que zero.")
    .default(10),
  status: assessmentStatusSchema.default("SCHEDULED"),
  grade: z
    .number({ invalid_type_error: "A nota deve ser um número." })
    .min(0, "A nota não pode ser negativa.")
    .max(10, "A nota não pode ser maior que 10.")
    .optional()
    .nullable(),
  feedback: z.string().optional().nullable(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const saveGradeSchema = z.object({
  assessmentId: z
    .string({ required_error: "Avaliação é obrigatória." })
    .uuid("ID de avaliação inválido."),
  grade: z
    .number({ required_error: "Informe a nota obtida." })
    .min(0, "A nota não pode ser negativa.")
    .max(10, "A nota máxima é 10."),
  feedback: z.string().optional().nullable(),
});

// ─── Attendance & Class Sessions ────────────────────────────────────────────

export const classSessionStatusSchema = z.enum(["SCHEDULED", "HELD", "CANCELED"], {
  errorMap: () => ({ message: "Status de aula inválido." }),
});

export const attendanceStatusSchema = z.enum(
  ["PRESENT", "ABSENT", "EXCUSED", "PARTIAL", "NOT_RECORDED"],
  {
    errorMap: () => ({ message: "Status de presença inválido." }),
  }
);

export const createClassSessionSchema = z.object({
  subjectId: z
    .string({ required_error: "Disciplina é obrigatória." })
    .uuid("ID de disciplina inválido."),
  scheduleId: z.string().uuid("ID de horário inválido.").optional().nullable(),
  date: z
    .string({ required_error: "Data da aula é obrigatória." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)."),
  startTime: z
    .string({ required_error: "Horário inicial é obrigatório." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido (HH:MM)."),
  endTime: z
    .string({ required_error: "Horário final é obrigatório." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido (HH:MM)."),
  absenceUnits: z
    .number({ required_error: "Unidades de ausência são obrigatórias." })
    .int()
    .positive("As unidades de ausência devem ser no mínimo 1.")
    .default(1),
  topic: z.string().max(200).optional().nullable(),
  status: classSessionStatusSchema.default("SCHEDULED"),
});

export const recordAttendanceSchema = z.object({
  classSessionId: z
    .string({ required_error: "Sessão de aula é obrigatória." })
    .uuid("ID de aula inválido."),
  status: attendanceStatusSchema,
  absentUnits: z
    .number({ invalid_type_error: "Unidades de falta devem ser um número." })
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
  parentId: z.string().uuid("ID do tópico pai inválido.").optional().nullable(),
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
  parentId: z.string().uuid().optional().nullable(),
  rawText: z
    .string({ required_error: "Insira a lista de tópicos." })
    .min(1, "Insira pelo menos um tópico."),
  assessmentId: z.string().uuid().optional().nullable(),
});

// ─── Subject Materials ──────────────────────────────────────────────────────

export const createMaterialSchema = z.object({
  subjectId: z.string().uuid("ID de disciplina inválido."),
  topicId: z.string().uuid("ID de tópico inválido.").optional().nullable(),
  title: z
    .string({ required_error: "Título do material é obrigatório." })
    .min(1, "Título do material não pode ser vazio.")
    .max(200, "O título deve ter no máximo 200 caracteres."),
  fileName: z.string().min(1, "Nome do arquivo é obrigatório."),
  fileType: z.string().default("PDF"),
  fileUrl: z.string().min(1, "URL ou dados do arquivo são obrigatórios."),
  fileSize: z.number().int().optional().nullable(),
  pageCount: z.number().int().optional().nullable(),
});

// ─── Topic Study Notes ───────────────────────────────────────────────────────

export const topicNoteTypeSchema = z.enum(
  ["NOTE", "IMPORTANT", "QUESTION", "FORMULA", "EXAM"],
  {
    errorMap: () => ({ message: "Tipo de anotação inválido." }),
  }
);

export const createTopicNoteSchema = z.object({
  topicId: z
    .string({ required_error: "Tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z.string().uuid("ID de material inválido.").optional().nullable(),
  type: topicNoteTypeSchema.default("NOTE"),
  content: z
    .string({ required_error: "O conteúdo da nota é obrigatório." })
    .min(1, "O conteúdo da nota não pode ser vazio."),
  pageNumber: z
    .number({ invalid_type_error: "Número da página deve ser um número inteiro." })
    .int("Número da página deve ser um inteiro.")
    .min(1, "O número da página deve ser no mínimo 1.")
    .optional()
    .nullable(),
});

export const updateTopicNoteSchema = z.object({
  type: topicNoteTypeSchema.optional(),
  content: z.string().min(1, "O conteúdo não pode ser vazio.").optional(),
  pageNumber: z.number().int().min(1).optional().nullable(),
});

// ─── Material Bookmarks ──────────────────────────────────────────────────────

export const materialBookmarkTypeSchema = z.enum(
  ["BOOKMARK", "IMPORTANT", "EXAM", "QUESTION"],
  {
    errorMap: () => ({ message: "Tipo de marcador inválido." }),
  }
);

export const createMaterialBookmarkSchema = z.object({
  topicId: z
    .string({ required_error: "Tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z
    .string({ required_error: "Material é obrigatório." })
    .uuid("ID de material inválido."),
  pageNumber: z
    .number({ required_error: "O número da página é obrigatório." })
    .int("Número da página deve ser um número inteiro.")
    .min(1, "O número da página deve ser no mínimo 1."),
  title: z
    .string({ required_error: "O título do marcador é obrigatório." })
    .min(1, "O título do marcador não pode ser vazio.")
    .max(200, "O título deve ter no máximo 200 caracteres."),
  type: materialBookmarkTypeSchema.default("BOOKMARK"),
});

export const updateMaterialBookmarkSchema = z.object({
  pageNumber: z.number().int().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  type: materialBookmarkTypeSchema.optional(),
});

// ─── PDF Annotations (Fase B1) ──────────────────────────────────────────────

export const pdfAnnotationTypeSchema = z.enum(
  ["PEN", "HIGHLIGHT", "ARROW", "TEXT", "RECTANGLE"],
  {
    errorMap: () => ({ message: "Tipo de anotação gráfica inválido." }),
  }
);

export const createPdfAnnotationSchema = z.object({
  topicId: z
    .string({ required_error: "Tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z.string().uuid("ID de material inválido.").optional().nullable(),
  pageNumber: z
    .number({ required_error: "O número da página é obrigatório." })
    .int("Número da página deve ser um inteiro.")
    .min(1, "O número da página deve ser no mínimo 1."),
  type: pdfAnnotationTypeSchema,
  data: z.record(z.any()),
  schemaVersion: z.number().int().default(1),
});

export const updatePdfAnnotationSchema = z.object({
  data: z.record(z.any()).optional(),
  type: pdfAnnotationTypeSchema.optional(),
});

// ─── PDF Note Anchors (Pins & Regions - Fase B2) ─────────────────────────────

export const pdfAnchorTypeSchema = z.enum(["POINT", "REGION"], {
  errorMap: () => ({ message: "Tipo de âncora inválido." }),
});

export const createPdfNoteAnchorSchema = z.object({
  noteId: z
    .string({ required_error: "ID da nota é obrigatório." })
    .uuid("ID de nota inválido."),
  topicId: z
    .string({ required_error: "ID do tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z.string().uuid("ID de material inválido.").optional().nullable(),
  pageNumber: z
    .number({ required_error: "O número da página é obrigatório." })
    .int("Número da página deve ser um inteiro.")
    .min(1, "O número da página deve ser no mínimo 1."),
  anchorType: pdfAnchorTypeSchema.default("POINT"),
  data: z.record(z.any()),
});

export const createAnchoredNoteSchema = z.object({
  topicId: z
    .string({ required_error: "ID do tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z.string().uuid("ID de material inválido.").optional().nullable(),
  pageNumber: z
    .number({ required_error: "O número da página é obrigatório." })
    .int("Número da página deve ser um inteiro.")
    .min(1, "O número da página deve ser no mínimo 1."),
  type: topicNoteTypeSchema.default("NOTE"),
  content: z
    .string({ required_error: "O conteúdo da nota é obrigatório." })
    .min(1, "O conteúdo da nota não pode ser vazio."),
  anchorType: pdfAnchorTypeSchema.default("POINT"),
  anchorData: z.record(z.any()),
});

// ─── Study Boards (Fase C1) ──────────────────────────────────────────────────

export const studyBoardItemTypeSchema = z.enum(
  ["TEXT", "NOTE", "DRAWING", "ARROW", "PDF_REGION"],
  {
    errorMap: () => ({ message: "Tipo de elemento da lousa inválido." }),
  }
);

export const createStudyBoardItemSchema = z.object({
  boardId: z
    .string({ required_error: "ID da lousa é obrigatório." })
    .uuid("ID de lousa inválido."),
  type: studyBoardItemTypeSchema,
  data: z.record(z.any()),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(200),
  height: z.number().default(150),
  zIndex: z.number().int().default(0),
});

export const updateStudyBoardItemSchema = z.object({
  data: z.record(z.any()).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  zIndex: z.number().int().optional(),
});

export const addPdfRegionToBoardSchema = z.object({
  topicId: z
    .string({ required_error: "ID do tópico é obrigatório." })
    .uuid("ID de tópico inválido."),
  materialId: z.string().uuid("ID de material inválido.").optional().nullable(),
  pageNumber: z
    .number({ required_error: "O número da página é obrigatório." })
    .int("Número da página deve ser um inteiro.")
    .min(1, "O número da página deve ser no mínimo 1."),
  anchorId: z.string().uuid("ID de âncora inválido.").optional().nullable(),
  bounding: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  title: z.string().optional().nullable(),
});

// ─── Exercises & Lists (Módulo Exercícios) ──────────────────────────────────

export const exerciseStatusSchema = z.enum(
  ["PENDING", "RESOLVED", "PARTIALLY_CORRECT", "WRONG", "REVIEW"],
  {
    errorMap: () => ({ message: "Status do exercício inválido." }),
  }
);

export const exerciseAttachmentTypeSchema = z.enum(
  ["STATEMENT_IMAGE", "STATEMENT_FILE", "REFERENCE", "OTHER"],
  {
    errorMap: () => ({ message: "Tipo de anexo inválido." }),
  }
);

export const exerciseAttemptResultSchema = z.enum(
  ["CORRECT", "PARTIALLY_CORRECT", "INCORRECT", "NOT_COMPLETED"],
  {
    errorMap: () => ({ message: "Resultado da tentativa inválido." }),
  }
);

export const exerciseAttemptAttachmentTypeSchema = z.enum(
  ["SOLUTION_IMAGE", "CORRECTION_IMAGE", "OTHER"],
  {
    errorMap: () => ({ message: "Tipo de anexo da resolução inválido." }),
  }
);

export const createExerciseSetSchema = z.object({
  subjectId: z
    .string({ required_error: "ID da disciplina é obrigatório." })
    .uuid("ID de disciplina inválido."),
  assessmentId: z.string().uuid("ID de avaliação inválido.").optional().nullable(),
  title: z
    .string({ required_error: "Título da lista é obrigatório." })
    .min(1, "O título da lista não pode ficar em branco.")
    .max(200, "O título da lista deve ter no máximo 200 caracteres."),
  description: z.string().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de entrega deve estar no formato AAAA-MM-DD.")
    .optional()
    .nullable(),
  sourceFileName: z.string().max(255).optional().nullable(),
  sourceFileUrl: z.string().optional().nullable(),
  sourceFileType: z.string().max(50).optional().nullable(),
});

export const updateExerciseSetSchema = createExerciseSetSchema
  .omit({ subjectId: true })
  .partial();

export const createExerciseSchema = z.object({
  subjectId: z
    .string({ required_error: "ID da disciplina é obrigatório." })
    .uuid("ID de disciplina inválido."),
  exerciseSetId: z.string().uuid("ID da lista inválido.").optional().nullable(),
  topicId: z.string().uuid("ID do tópico/capítulo inválido.").optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  referenceNumber: z.string().max(50).optional().nullable(),
  statement: z.string().optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  sourcePage: z.number().int().min(1).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).default(3).optional().nullable(),
  needsReview: z.boolean().default(false).optional(),
  orderIndex: z.number().int().default(0).optional(),
  statementImages: z
    .array(
      z.object({
        filePath: z.string(),
        mimeType: z.string().default("image/png"),
        originalName: z.string(),
        caption: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const updateExerciseSchema = createExerciseSchema
  .omit({ subjectId: true })
  .partial();

export const createExerciseAttemptSchema = z.object({
  exerciseId: z
    .string({ required_error: "ID do exercício é obrigatório." })
    .uuid("ID de exercício inválido."),
  attemptedAt: z.string().datetime().optional().nullable(),
  result: exerciseAttemptResultSchema,
  durationMinutes: z.number().int().min(0).optional().nullable(),
  difficultyPerceived: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  needsReview: z.boolean().default(false),
  attachments: z
    .array(
      z.object({
        type: exerciseAttemptAttachmentTypeSchema.default("SOLUTION_IMAGE"),
        filePath: z.string(),
        mimeType: z.string().default("image/png"),
        originalName: z.string(),
        caption: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const createExerciseAttachmentSchema = z.object({
  exerciseId: z
    .string({ required_error: "ID do exercício é obrigatório." })
    .uuid("ID de exercício inválido."),
  type: exerciseAttachmentTypeSchema.default("STATEMENT_IMAGE"),
  filePath: z.string({ required_error: "Caminho do arquivo é obrigatório." }),
  mimeType: z.string().max(100).default("image/png"),
  originalName: z.string().max(255),
  caption: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const createAttemptAttachmentSchema = z.object({
  attemptId: z
    .string({ required_error: "ID da tentativa é obrigatório." })
    .uuid("ID de tentativa inválido."),
  type: exerciseAttemptAttachmentTypeSchema.default("SOLUTION_IMAGE"),
  filePath: z.string({ required_error: "Caminho da foto é obrigatório." }),
  mimeType: z.string().max(100).default("image/png"),
  originalName: z.string().max(255),
  caption: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});





