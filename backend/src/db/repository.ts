import { getPool, sql } from "../db/pool";
import type {
  AssessmentAnswerRow,
  AssessmentRow,
  AssessmentScoreRow,
  AssessmentSolutionRow,
  AuditLogRow,
  AnswerOptionRow,
  IndustryQuestionRow,
  IndustryRow,
  OtherAnswerReviewRow,
  QuestionGroupRow,
  QuestionRow,
  QuestionnaireVersionRow,
  RankThresholdRow,
  SolutionDependencyRow,
  SolutionRow,
  UserRow
} from "../types/models";

// ===================================================================
// Users
// ===================================================================
export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("email", sql.NVarChar(255), email)
    .query("SELECT * FROM dbo.Users WHERE Email = @email AND IsActive = 1");
  return res.recordset[0] ?? null;
};

export const findUserById = async (id: string): Promise<UserRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("SELECT * FROM dbo.Users WHERE Id = @id");
  return res.recordset[0] ?? null;
};

// ===================================================================
// Questionnaire
// ===================================================================
export const findActiveQuestionnaire = async (): Promise<QuestionnaireVersionRow | null> => {
  const pool = await getPool();
  const res = await pool.request().query(
    "SELECT TOP 1 * FROM dbo.QuestionnaireVersions WHERE IsActive = 1 ORDER BY Id DESC"
  );
  return res.recordset[0] ?? null;
};

export const findQuestionGroups = async (
  questionnaireId: number
): Promise<QuestionGroupRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("qid", sql.Int, questionnaireId)
    .query(
      "SELECT * FROM dbo.QuestionGroups WHERE QuestionnaireId = @qid ORDER BY SortOrder"
    );
  return res.recordset;
};

export const findQuestionsByGroup = async (groupId: number): Promise<QuestionRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("gid", sql.Int, groupId)
    .query("SELECT * FROM dbo.Questions WHERE GroupId = @gid ORDER BY SortOrder");
  return res.recordset;
};

export const findAnswerOptions = async (questionId: number): Promise<AnswerOptionRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("qid", sql.Int, questionId)
    .query(
      "SELECT * FROM dbo.AnswerOptions WHERE QuestionId = @qid ORDER BY SortOrder"
    );
  return res.recordset;
};

export const findAllAnswerOptionsByQuestionIds = async (
  questionIds: number[]
): Promise<AnswerOptionRow[]> => {
  if (questionIds.length === 0) return [];
  const pool = await getPool();
  const res = await pool.request().query(
    `SELECT * FROM dbo.AnswerOptions WHERE QuestionId IN (${questionIds.join(",")}) ORDER BY QuestionId, SortOrder`
  );
  return res.recordset;
};

// ===================================================================
// Industries
// ===================================================================
export const findAllIndustries = async (): Promise<IndustryRow[]> => {
  const pool = await getPool();
  const res = await pool.request().query(
    "SELECT * FROM dbo.Industries WHERE IsActive = 1 ORDER BY SortOrder"
  );
  return res.recordset;
};

export const findIndustryById = async (id: number): Promise<IndustryRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT * FROM dbo.Industries WHERE Id = @id");
  return res.recordset[0] ?? null;
};

// ===================================================================
// IndustryQuestions (nhóm 7)
// ===================================================================
export const findIndustryQuestions = async (industryId: number): Promise<IndustryQuestionRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("indId", sql.Int, industryId)
    .query(
      "SELECT * FROM dbo.IndustryQuestions WHERE IndustryId = @indId ORDER BY SortOrder"
    );
  return res.recordset;
};

export const findQuestionsByIds = async (ids: number[]): Promise<QuestionRow[]> => {
  if (ids.length === 0) return [];
  const pool = await getPool();
  const res = await pool.request().query(
    `SELECT * FROM dbo.Questions WHERE Id IN (${ids.join(",")}) ORDER BY SortOrder`
  );
  return res.recordset;
};

// ===================================================================
// Solutions & Dependencies
// ===================================================================
export const findSolutionsByIndustry = async (industryId: number): Promise<SolutionRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("indId", sql.Int, industryId)
    .query(
      "SELECT * FROM dbo.Solutions WHERE IndustryId = @indId AND IsActive = 1 ORDER BY SortOrder"
    );
  return res.recordset;
};

export const findAllSolutionDependencies = async (): Promise<SolutionDependencyRow[]> => {
  const pool = await getPool();
  const res = await pool.request().query("SELECT * FROM dbo.SolutionDependencies");
  return res.recordset;
};

export const findSolutionDependenciesByIndustry = async (
  industryId: number
): Promise<SolutionDependencyRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("indId", sql.Int, industryId)
    .query(`
      SELECT sd.*
      FROM dbo.SolutionDependencies sd
      INNER JOIN dbo.Solutions s ON sd.SolutionId = s.Id
      WHERE s.IndustryId = @indId
    `);
  return res.recordset;
};

// ===================================================================
// Rank Thresholds
// ===================================================================
export const findRankThresholds = async (): Promise<RankThresholdRow[]> => {
  const pool = await getPool();
  const res = await pool.request().query(
    "SELECT * FROM dbo.RankThresholds ORDER BY Level"
  );
  return res.recordset;
};

// ===================================================================
// Assessments
// ===================================================================
export const createAssessment = async (
  userId: string,
  questionnaireId: number
): Promise<AssessmentRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("qId", sql.Int, questionnaireId)
    .query(`
      INSERT INTO dbo.Assessments (UserId, QuestionnaireId, Status)
      OUTPUT INSERTED.*
      VALUES (@userId, @qId, 'draft')
    `);
  return res.recordset[0];
};

export const findAssessmentById = async (id: string): Promise<AssessmentRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("SELECT * FROM dbo.Assessments WHERE Id = @id");
  return res.recordset[0] ?? null;
};

export const findAssessmentsByUser = async (userId: string): Promise<AssessmentRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(
      "SELECT * FROM dbo.Assessments WHERE UserId = @userId ORDER BY CreatedAt DESC"
    );
  return res.recordset;
};

// View tối ưu cho màn user (Survey/Result): chỉ lấy field cần thiết + JOIN ngành.
export interface MyAssessmentListItemRow {
  Id: string;
  Status: string;
  IndustryId: number | null;
  IndustryCode: string | null;
  IndustryName: string | null;
  SubmittedAt: string | null;
  CreatedAt: string;
}

export const findMyAssessmentsView = async (
  userId: string
): Promise<MyAssessmentListItemRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(`
      SELECT
        a.Id            AS Id,
        a.Status        AS Status,
        a.IndustryId    AS IndustryId,
        i.Code          AS IndustryCode,
        i.Name          AS IndustryName,
        a.SubmittedAt   AS SubmittedAt,
        a.CreatedAt     AS CreatedAt
      FROM dbo.Assessments a
      LEFT JOIN dbo.Industries i ON i.Id = a.IndustryId
      WHERE a.UserId = @userId
      ORDER BY a.CreatedAt DESC
    `);
  return res.recordset;
};

export const findAllAssessments = async (): Promise<AssessmentRow[]> => {
  const pool = await getPool();
  const res = await pool.request().query(
    "SELECT * FROM dbo.Assessments ORDER BY CreatedAt DESC"
  );
  return res.recordset;
};

export const findAllAssessmentsWithUserInfo = async (): Promise<any[]> => {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT 
      a.*,
      u.FullName AS UserFullName,
      u.Email AS UserEmail,
      u.Phone AS UserPhone,
      u.OrganizationName AS UserOrganizationName
    FROM dbo.Assessments a
    LEFT JOIN dbo.Users u ON a.UserId = u.Id
    ORDER BY a.CreatedAt DESC
  `);
  return res.recordset;
};

export const updateAssessmentIndustry = async (
  id: string,
  industryId: number
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("indId", sql.Int, industryId)
    .query(`
      UPDATE dbo.Assessments
      SET IndustryId = @indId, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
};

export const updateAssessmentStatus = async (
  id: string,
  status: string,
  extra?: { scoredByUserId?: string }
): Promise<void> => {
  const pool = await getPool();
  const timestampField =
    status === "submitted"
      ? "SubmittedAt"
      : status === "scored"
        ? "ScoredAt"
        : status === "published"
          ? "PublishedAt"
          : null;

  const q = `
    UPDATE dbo.Assessments
    SET Status = @status,
        UpdatedAt = SYSUTCDATETIME()
        ${timestampField ? `, ${timestampField} = SYSUTCDATETIME()` : ""}
        ${extra?.scoredByUserId ? `, ScoredByUserId = @scoredBy` : ""}
    WHERE Id = @id
  `;
  const req = pool.request().input("id", sql.UniqueIdentifier, id).input("status", sql.NVarChar(20), status);
  if (extra?.scoredByUserId) req.input("scoredBy", sql.UniqueIdentifier, extra.scoredByUserId);
  await req.query(q);
};

export const updateAssessmentFeedback = async (
  id: string,
  experienceRating: number,
  experienceComment: string | null,
  selfScore?: number | null
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("rating", sql.Decimal(3, 1), experienceRating)
    .input("comment", sql.NVarChar(2000), experienceComment ?? null)
    .input("selfScore", sql.Decimal(5, 2), selfScore ?? null)
    .query(`
      UPDATE dbo.Assessments
      SET ExperienceRating = @rating,
          ExperienceComment = @comment,
          SelfScore = @selfScore,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
};

// ===================================================================
// AssessmentAnswers
// ===================================================================

/** Xoá tất cả câu trả lời của một assessment cho các questionId cụ thể */
export const deleteAnswersByQuestionIds = async (
  assessmentId: string,
  questionIds: number[]
): Promise<void> => {
  if (questionIds.length === 0) return;
  const pool = await getPool();
  // Dùng table-valued param đơn giản: build IN clause
  const placeholders = questionIds.map((_, i) => `@qid${i}`).join(", ");
  const req = pool.request().input("aid", sql.UniqueIdentifier, assessmentId);
  for (let i = 0; i < questionIds.length; i++) {
    req.input(`qid${i}`, sql.Int, questionIds[i]);
  }
  await req.query(`
    DELETE FROM dbo.AssessmentAnswers
    WHERE AssessmentId = @aid AND QuestionId IN (${placeholders})
  `);
};

/** Insert một câu trả lời (không ghi đè) */
export const insertAnswer = async (
  assessmentId: string,
  questionId: number,
  optionId: number | null,
  otherText: string | null,
  openText: string | null
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .input("qid", sql.Int, questionId)
    .input("oid", sql.Int, optionId ?? null)
    .input("ot", sql.NVarChar(2000), otherText ?? null)
    .input("op", sql.NVarChar(2000), openText ?? null)
    .query(`
      INSERT INTO dbo.AssessmentAnswers (AssessmentId, QuestionId, OptionId, OtherText, OpenText)
      VALUES (@aid, @qid, @oid, @ot, @op)
    `);
};

/** @deprecated Dùng deleteAnswersByQuestionIds + insertAnswer để hỗ trợ multi-select */
export const upsertAnswer = async (
  assessmentId: string,
  questionId: number,
  optionId: number | null,
  otherText: string | null,
  openText: string | null
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .input("qid", sql.Int, questionId)
    .input("oid", sql.Int, optionId ?? null)
    .input("ot", sql.NVarChar(2000), otherText ?? null)
    .input("op", sql.NVarChar(2000), openText ?? null)
    .query(`
      MERGE dbo.AssessmentAnswers AS t
      USING (SELECT @aid AS AssessmentId, @qid AS QuestionId) AS s
      ON t.AssessmentId = s.AssessmentId AND t.QuestionId = s.QuestionId
      WHEN MATCHED THEN
        UPDATE SET OptionId = @oid, OtherText = @ot, OpenText = @op
      WHEN NOT MATCHED THEN
        INSERT (AssessmentId, QuestionId, OptionId, OtherText, OpenText)
        VALUES (@aid, @qid, @oid, @ot, @op);
    `);
};

export const findAnswersByAssessment = async (
  assessmentId: string
): Promise<AssessmentAnswerRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .query("SELECT * FROM dbo.AssessmentAnswers WHERE AssessmentId = @aid");
  return res.recordset;
};

// ===================================================================
// AssessmentSolutions
// ===================================================================
export const upsertAssessmentSolution = async (
  assessmentId: string,
  solutionId: number,
  isSelected: boolean
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .input("sid", sql.Int, solutionId)
    .input("sel", sql.Bit, isSelected)
    .query(`
      MERGE dbo.AssessmentSolutions AS t
      USING (SELECT @aid AS AssessmentId, @sid AS SolutionId) AS s
      ON t.AssessmentId = s.AssessmentId AND t.SolutionId = s.SolutionId
      WHEN MATCHED THEN
        UPDATE SET IsSelected = @sel
      WHEN NOT MATCHED THEN
        INSERT (AssessmentId, SolutionId, IsSelected)
        VALUES (@aid, @sid, @sel);
    `);
};

export const findSolutionsByAssessment = async (
  assessmentId: string
): Promise<AssessmentSolutionRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .query("SELECT * FROM dbo.AssessmentSolutions WHERE AssessmentId = @aid");
  return res.recordset;
};

export const updateSolutionAdminScore = async (
  assessmentId: string,
  solutionId: number,
  adminScore: number | null,
  note?: string
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .input("sid", sql.Int, solutionId)
    .input("score", sql.Decimal(9, 4), adminScore ?? null)
    .input("note", sql.NVarChar(1000), note ?? null)
    .query(`
      UPDATE dbo.AssessmentSolutions
      SET AdminScore = @score, Note = @note
      WHERE AssessmentId = @aid AND SolutionId = @sid
    `);
};

// ===================================================================
// OtherAnswerReviews
// ===================================================================
export const upsertOtherAnswerReview = async (params: {
  answerId: number;
  aiSuggestion?: string;
  aiConfidence?: number;
  aiRelevant?: boolean;
  adminScore?: number;
  adminComment?: string;
  reviewedByUserId?: string;
}): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("ansId", sql.BigInt, params.answerId)
    .input("aiSug", sql.NVarChar(2000), params.aiSuggestion ?? null)
    .input("aiConf", sql.Decimal(5, 4), params.aiConfidence ?? null)
    .input("aiRel", sql.Bit, params.aiRelevant ?? (null as unknown as boolean))
    .input("admScore", sql.Decimal(9, 4), params.adminScore ?? null)
    .input("admComm", sql.NVarChar(2000), params.adminComment ?? null)
    .input("revBy", sql.NVarChar(36), params.reviewedByUserId ?? null)
    .input("revAt", sql.DateTime2, params.reviewedByUserId ? new Date() : null)
    .query(`
      MERGE dbo.OtherAnswerReviews AS t
      USING (SELECT @ansId AS AnswerId) AS s
      ON t.AnswerId = s.AnswerId
      WHEN MATCHED THEN
        UPDATE SET AiSuggestion = @aiSug, AiConfidence = @aiConf, AiRelevant = @aiRel,
                   AdminScore = @admScore, AdminComment = @admComm,
                   ReviewedByUserId = COALESCE(@revBy, ReviewedByUserId),
                   ReviewedAt = COALESCE(@revAt, ReviewedAt)
      WHEN NOT MATCHED THEN
        INSERT (AnswerId, AiSuggestion, AiConfidence, AiRelevant, AdminScore, AdminComment, ReviewedByUserId, ReviewedAt)
        VALUES (@ansId, @aiSug, @aiConf, @aiRel, @admScore, @admComm, @revBy, @revAt);
    `);
};

export const findOtherAnswerReviewsByAnswerIds = async (
  answerIds: number[]
): Promise<OtherAnswerReviewRow[]> => {
  if (answerIds.length === 0) return [];
  const pool = await getPool();
  const res = await pool.request().query(
    `SELECT * FROM dbo.OtherAnswerReviews WHERE AnswerId IN (${answerIds.join(",")})`
  );
  return res.recordset;
};

// ===================================================================
// AssessmentScores
// ===================================================================
export const createAssessmentScore = async (
  assessmentId: string,
  rawScore: number,
  solutionScore: number,
  topsisScore: number,
  normalizedScore: number,
  rankLevel: number,
  rankName: string,
  groupBreakdown: string,
  details: string | null,
  computedByUserId?: string
): Promise<AssessmentScoreRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .input("raw", sql.Decimal(12, 4), rawScore)
    .input("sol", sql.Decimal(12, 4), solutionScore)
    .input("topsis", sql.Decimal(12, 6), topsisScore)
    .input("norm", sql.Decimal(7, 2), normalizedScore)
    .input("level", sql.Int, rankLevel)
    .input("rankName", sql.NVarChar(100), rankName)
    .input("breakdown", sql.NVarChar(sql.MAX), groupBreakdown)
    .input("details", sql.NVarChar(sql.MAX), details ?? null)
    .input("computedBy", sql.NVarChar(36), computedByUserId ?? null)
    .query(`
      INSERT INTO dbo.AssessmentScores
        (AssessmentId, RawScore, SolutionScore, TopsisScore, NormalizedScore, RankLevel, RankName, GroupBreakdown, Details, ComputedByUserId)
      OUTPUT INSERTED.*
      VALUES
        (@aid, @raw, @sol, @topsis, @norm, @level, @rankName, @breakdown, @details, @computedBy)
    `);
  return res.recordset[0];
};

export const findLatestScore = async (assessmentId: string): Promise<AssessmentScoreRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("aid", sql.UniqueIdentifier, assessmentId)
    .query(
      "SELECT TOP 1 * FROM dbo.AssessmentScores WHERE AssessmentId = @aid ORDER BY ComputedAt DESC"
    );
  return res.recordset[0] ?? null;
};

export const updateScoreOverride = async (
  scoreId: number,
  reason: string
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.BigInt, scoreId)
    .input("reason", sql.NVarChar(2000), reason)
    .query(`
      UPDATE dbo.AssessmentScores
      SET IsOverridden = 1, OverrideReason = @reason
      WHERE Id = @id
    `);
};

// ===================================================================
// Audit Logs
// ===================================================================
export const findAuditLogsByEntity = async (
  entityType: string,
  entityId: string
): Promise<AuditLogRow[]> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("type", sql.NVarChar(50), entityType)
    .input("id", sql.NVarChar(100), entityId)
    .query(
      "SELECT * FROM dbo.AuditLogs WHERE EntityType = @type AND EntityId = @id ORDER BY CreatedAt DESC"
    );
  return res.recordset;
};

// ===================================================================
// User registration
// ===================================================================
export const createUser = async (params: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  organizationName?: string | null;
  role?: "user" | "admin";
}): Promise<UserRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("email", sql.NVarChar(255), params.email)
    .input("passwordHash", sql.NVarChar(255), params.passwordHash)
    .input("fullName", sql.NVarChar(255), params.fullName)
    .input("phone", sql.NVarChar(30), params.phone ?? null)
    .input("organizationName", sql.NVarChar(255), params.organizationName ?? null)
    .input("role", sql.VarChar(20), params.role ?? "user")
    .query(`
      INSERT INTO dbo.Users (Email, PasswordHash, FullName, Phone, OrganizationName, Role, IsActive)
      OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.PasswordHash, INSERTED.FullName,
             INSERTED.Role, INSERTED.OrganizationName, INSERTED.Phone, INSERTED.IsActive,
             INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@email, @passwordHash, @fullName, @phone, @organizationName, @role, 1)
    `);
  return res.recordset[0];
};

// ===================================================================
// Admin: Questions / Options CRUD
// ===================================================================
export interface AdminQuestionListItem {
  id: number;
  groupId: number;
  groupNumber: number;
  groupName: string;
  code: string;
  content: string;
  questionType: "single" | "multiple" | "open";
  allowOther: boolean;
  isOptional: boolean;
  maxScore: number;
  sortOrder: number;
  industries: { id: number; code: string; name: string }[];
  options: {
    id: number;
    code: string;
    content: string;
    score: number;
    isOther: boolean;
    sortOrder: number;
  }[];
}

export const findAdminQuestions = async (filter?: {
  groupNumber?: number;
  industryId?: number;
}): Promise<AdminQuestionListItem[]> => {
  const pool = await getPool();

  // Lấy questions + group
  const reqQ = pool.request();
  let whereQ = "";
  if (filter?.groupNumber) {
    reqQ.input("gn", sql.Int, filter.groupNumber);
    whereQ = "WHERE g.GroupNumber = @gn";
  }
  const qRes = await reqQ.query(`
    SELECT
      q.Id AS QId, q.GroupId, q.Code, q.Content, q.QuestionType,
      q.AllowOther, q.IsOptional, q.MaxScore, q.SortOrder,
      g.GroupNumber, g.Name AS GroupName
    FROM dbo.Questions q
    INNER JOIN dbo.QuestionGroups g ON g.Id = q.GroupId
    ${whereQ}
    ORDER BY g.GroupNumber, q.SortOrder, q.Id
  `);

  const questions: AdminQuestionListItem[] = qRes.recordset.map((r) => ({
    id: r.QId,
    groupId: r.GroupId,
    groupNumber: r.GroupNumber,
    groupName: r.GroupName,
    code: r.Code,
    content: r.Content,
    questionType: r.QuestionType,
    allowOther: !!r.AllowOther,
    isOptional: !!r.IsOptional,
    maxScore: Number(r.MaxScore),
    sortOrder: r.SortOrder,
    industries: [],
    options: []
  }));

  if (questions.length === 0) return [];

  const qIds = questions.map((q) => q.id);
  const idList = qIds.join(",");

  // Options
  const optRes = await pool.request().query(`
    SELECT Id, QuestionId, Code, Content, Score, IsOther, SortOrder
    FROM dbo.AnswerOptions
    WHERE QuestionId IN (${idList})
    ORDER BY QuestionId, SortOrder, Id
  `);
  const optMap = new Map<number, AdminQuestionListItem["options"]>();
  for (const o of optRes.recordset) {
    const arr = optMap.get(o.QuestionId) ?? [];
    arr.push({
      id: o.Id,
      code: o.Code,
      content: o.Content,
      score: Number(o.Score),
      isOther: !!o.IsOther,
      sortOrder: o.SortOrder
    });
    optMap.set(o.QuestionId, arr);
  }
  for (const q of questions) {
    q.options = optMap.get(q.id) ?? [];
  }

  // Industry mapping (group 7)
  const iqRes = await pool.request().query(`
    SELECT iq.QuestionId, i.Id AS IndustryId, i.Code AS IndustryCode, i.Name AS IndustryName
    FROM dbo.IndustryQuestions iq
    INNER JOIN dbo.Industries i ON i.Id = iq.IndustryId
    WHERE iq.QuestionId IN (${idList})
    ORDER BY i.SortOrder
  `);
  const iqMap = new Map<number, AdminQuestionListItem["industries"]>();
  for (const r of iqRes.recordset) {
    const arr = iqMap.get(r.QuestionId) ?? [];
    arr.push({ id: r.IndustryId, code: r.IndustryCode, name: r.IndustryName });
    iqMap.set(r.QuestionId, arr);
  }
  for (const q of questions) {
    q.industries = iqMap.get(q.id) ?? [];
  }

  // Industry filter (chỉ áp với group 7)
  if (filter?.industryId) {
    return questions.filter(
      (q) => q.groupNumber !== 7 || q.industries.some((i) => i.id === filter.industryId)
    );
  }

  return questions;
};

export const findQuestionById = async (id: number): Promise<QuestionRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT Id, GroupId, Code, Content, QuestionType, AllowOther, IsOptional, MaxScore, SortOrder FROM dbo.Questions WHERE Id = @id"
    );
  return res.recordset[0] ?? null;
};

export const updateQuestion = async (
  id: number,
  patch: {
    content?: string;
    questionType?: "single" | "multiple" | "open";
    allowOther?: boolean;
    isOptional?: boolean;
    maxScore?: number;
    sortOrder?: number;
  }
): Promise<void> => {
  const pool = await getPool();
  const sets: string[] = [];
  const r = pool.request().input("id", sql.Int, id);

  if (patch.content !== undefined) {
    sets.push("Content = @content");
    r.input("content", sql.NVarChar(2000), patch.content);
  }
  if (patch.questionType !== undefined) {
    sets.push("QuestionType = @qt");
    r.input("qt", sql.VarChar(20), patch.questionType);
  }
  if (patch.allowOther !== undefined) {
    sets.push("AllowOther = @ao");
    r.input("ao", sql.Bit, patch.allowOther ? 1 : 0);
  }
  if (patch.isOptional !== undefined) {
    sets.push("IsOptional = @io");
    r.input("io", sql.Bit, patch.isOptional ? 1 : 0);
  }
  if (patch.maxScore !== undefined) {
    sets.push("MaxScore = @ms");
    r.input("ms", sql.Decimal(9, 4), patch.maxScore);
  }
  if (patch.sortOrder !== undefined) {
    sets.push("SortOrder = @so");
    r.input("so", sql.Int, patch.sortOrder);
  }
  if (sets.length === 0) return;

  await r.query(`UPDATE dbo.Questions SET ${sets.join(", ")} WHERE Id = @id`);
};

export const findOptionById = async (id: number): Promise<AnswerOptionRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT Id, QuestionId, Code, Content, Score, IsOther, SortOrder FROM dbo.AnswerOptions WHERE Id = @id"
    );
  return res.recordset[0] ?? null;
};

export const createAnswerOption = async (params: {
  questionId: number;
  code: string;
  content: string;
  score: number;
  isOther?: boolean;
  sortOrder?: number;
}): Promise<AnswerOptionRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("qid", sql.Int, params.questionId)
    .input("code", sql.VarChar(20), params.code)
    .input("content", sql.NVarChar(1000), params.content)
    .input("score", sql.Decimal(9, 4), params.score)
    .input("isOther", sql.Bit, params.isOther ? 1 : 0)
    .input("sortOrder", sql.Int, params.sortOrder ?? 0)
    .query(`
      INSERT INTO dbo.AnswerOptions (QuestionId, Code, Content, Score, IsOther, SortOrder)
      OUTPUT INSERTED.Id, INSERTED.QuestionId, INSERTED.Code, INSERTED.Content,
             INSERTED.Score, INSERTED.IsOther, INSERTED.SortOrder
      VALUES (@qid, @code, @content, @score, @isOther, @sortOrder)
    `);
  return res.recordset[0];
};

export const updateAnswerOption = async (
  id: number,
  patch: {
    code?: string;
    content?: string;
    score?: number;
    isOther?: boolean;
    sortOrder?: number;
  }
): Promise<void> => {
  const pool = await getPool();
  const sets: string[] = [];
  const r = pool.request().input("id", sql.Int, id);

  if (patch.code !== undefined) {
    sets.push("Code = @code");
    r.input("code", sql.VarChar(20), patch.code);
  }
  if (patch.content !== undefined) {
    sets.push("Content = @content");
    r.input("content", sql.NVarChar(1000), patch.content);
  }
  if (patch.score !== undefined) {
    sets.push("Score = @score");
    r.input("score", sql.Decimal(9, 4), patch.score);
  }
  if (patch.isOther !== undefined) {
    sets.push("IsOther = @isOther");
    r.input("isOther", sql.Bit, patch.isOther ? 1 : 0);
  }
  if (patch.sortOrder !== undefined) {
    sets.push("SortOrder = @sortOrder");
    r.input("sortOrder", sql.Int, patch.sortOrder);
  }
  if (sets.length === 0) return;

  await r.query(`UPDATE dbo.AnswerOptions SET ${sets.join(", ")} WHERE Id = @id`);
};

// Đếm số lượt đáp án đã được trả lời trong AssessmentAnswers — dùng để
// chặn xóa nếu option đã được sử dụng. Trả về 0 nếu chưa từng được dùng.
export const countAnswerOptionUsage = async (id: number): Promise<number> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT COUNT(1) AS Cnt FROM dbo.AssessmentAnswers WHERE OptionId = @id"
    );
  return Number(res.recordset[0]?.Cnt ?? 0);
};

export const deleteAnswerOption = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM dbo.AnswerOptions WHERE Id = @id");
};

// ===================================================================
// Admin: Solutions (Phụ lục III) CRUD
// ===================================================================
export interface AdminSolutionListItem {
  id: number;
  industryId: number;
  industryCode: string;
  industryName: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  defaultScore: number; // 0.5 nếu có dependency, ngược lại 1
  dependencies: {
    id: number;
    dependsOnSolutionId: number;
    dependsOnCode: string;
    dependsOnName: string;
    note: string | null;
  }[];
}

export const findAdminSolutions = async (
  industryId?: number
): Promise<AdminSolutionListItem[]> => {
  const pool = await getPool();
  const r = pool.request();
  let where = "";
  if (industryId) {
    r.input("indId", sql.Int, industryId);
    where = "WHERE s.IndustryId = @indId";
  }

  const sRes = await r.query(`
    SELECT
      s.Id, s.IndustryId, s.Code, s.Name, s.Description,
      s.SortOrder, s.IsActive,
      i.Code AS IndustryCode, i.Name AS IndustryName
    FROM dbo.Solutions s
    INNER JOIN dbo.Industries i ON i.Id = s.IndustryId
    ${where}
    ORDER BY i.SortOrder, s.SortOrder, s.Id
  `);

  const list: AdminSolutionListItem[] = sRes.recordset.map((row) => ({
    id: row.Id,
    industryId: row.IndustryId,
    industryCode: row.IndustryCode,
    industryName: row.IndustryName,
    code: row.Code,
    name: row.Name,
    description: row.Description,
    sortOrder: row.SortOrder,
    isActive: !!row.IsActive,
    defaultScore: 1, // overwrite after dependency lookup
    dependencies: []
  }));

  if (list.length === 0) return [];

  const ids = list.map((s) => s.id).join(",");
  const depRes = await pool.request().query(`
    SELECT sd.Id, sd.SolutionId, sd.DependsOnSolutionId, sd.Note,
           s.Code AS DepCode, s.Name AS DepName
    FROM dbo.SolutionDependencies sd
    INNER JOIN dbo.Solutions s ON s.Id = sd.DependsOnSolutionId
    WHERE sd.SolutionId IN (${ids})
    ORDER BY sd.Id
  `);

  const depMap = new Map<number, AdminSolutionListItem["dependencies"]>();
  for (const d of depRes.recordset) {
    const arr = depMap.get(d.SolutionId) ?? [];
    arr.push({
      id: d.Id,
      dependsOnSolutionId: d.DependsOnSolutionId,
      dependsOnCode: d.DepCode,
      dependsOnName: d.DepName,
      note: d.Note
    });
    depMap.set(d.SolutionId, arr);
  }

  for (const s of list) {
    s.dependencies = depMap.get(s.id) ?? [];
    s.defaultScore = s.dependencies.length > 0 ? 0.5 : 1;
  }

  return list;
};

export const findSolutionById = async (id: number): Promise<SolutionRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT Id, IndustryId, Code, Name, Description, SortOrder, IsActive FROM dbo.Solutions WHERE Id = @id"
    );
  return res.recordset[0] ?? null;
};

export const createSolution = async (params: {
  industryId: number;
  code: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<SolutionRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("industryId", sql.Int, params.industryId)
    .input("code", sql.VarChar(50), params.code)
    .input("name", sql.NVarChar(500), params.name)
    .input("description", sql.NVarChar(2000), params.description ?? null)
    .input("sortOrder", sql.Int, params.sortOrder ?? 0)
    .input("isActive", sql.Bit, params.isActive === false ? 0 : 1)
    .query(`
      INSERT INTO dbo.Solutions (IndustryId, Code, Name, Description, SortOrder, IsActive)
      OUTPUT INSERTED.Id, INSERTED.IndustryId, INSERTED.Code, INSERTED.Name,
             INSERTED.Description, INSERTED.SortOrder, INSERTED.IsActive
      VALUES (@industryId, @code, @name, @description, @sortOrder, @isActive)
    `);
  return res.recordset[0];
};

export const updateSolution = async (
  id: number,
  patch: {
    code?: string;
    name?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<void> => {
  const pool = await getPool();
  const sets: string[] = [];
  const r = pool.request().input("id", sql.Int, id);

  if (patch.code !== undefined) {
    sets.push("Code = @code");
    r.input("code", sql.VarChar(50), patch.code);
  }
  if (patch.name !== undefined) {
    sets.push("Name = @name");
    r.input("name", sql.NVarChar(500), patch.name);
  }
  if (patch.description !== undefined) {
    sets.push("Description = @description");
    r.input("description", sql.NVarChar(2000), patch.description ?? null);
  }
  if (patch.sortOrder !== undefined) {
    sets.push("SortOrder = @sortOrder");
    r.input("sortOrder", sql.Int, patch.sortOrder);
  }
  if (patch.isActive !== undefined) {
    sets.push("IsActive = @isActive");
    r.input("isActive", sql.Bit, patch.isActive ? 1 : 0);
  }
  if (sets.length === 0) return;
  await r.query(`UPDATE dbo.Solutions SET ${sets.join(", ")} WHERE Id = @id`);
};

// Đếm số lượt solution đã được dùng trong AssessmentSolutions.
export const countSolutionAssessmentUsage = async (id: number): Promise<number> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT COUNT(1) AS Cnt FROM dbo.AssessmentSolutions WHERE SolutionId = @id"
    );
  return Number(res.recordset[0]?.Cnt ?? 0);
};

// Đếm số dependency liên quan tới solution (cả hai chiều).
export const countSolutionDependencyRefs = async (id: number): Promise<number> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT COUNT(1) AS Cnt FROM dbo.SolutionDependencies WHERE SolutionId = @id OR DependsOnSolutionId = @id"
    );
  return Number(res.recordset[0]?.Cnt ?? 0);
};

export const deleteSolution = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM dbo.Solutions WHERE Id = @id");
};

export const createSolutionDependency = async (params: {
  solutionId: number;
  dependsOnSolutionId: number;
  note?: string | null;
}): Promise<SolutionDependencyRow> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("solutionId", sql.Int, params.solutionId)
    .input("dependsOnSolutionId", sql.Int, params.dependsOnSolutionId)
    .input("note", sql.NVarChar(500), params.note ?? null)
    .query(`
      INSERT INTO dbo.SolutionDependencies (SolutionId, DependsOnSolutionId, Note)
      OUTPUT INSERTED.Id, INSERTED.SolutionId, INSERTED.DependsOnSolutionId, INSERTED.Note
      VALUES (@solutionId, @dependsOnSolutionId, @note)
    `);
  return res.recordset[0];
};

export const deleteSolutionDependency = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM dbo.SolutionDependencies WHERE Id = @id");
};

export const findSolutionDependencyById = async (
  id: number
): Promise<SolutionDependencyRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT Id, SolutionId, DependsOnSolutionId, Note FROM dbo.SolutionDependencies WHERE Id = @id");
  return res.recordset[0] ?? null;
};

// ===================================================================
// Score Config (cấu hình điểm) — Rank Thresholds + QuestionGroups
// ===================================================================
export const findRankThresholdById = async (
  id: number
): Promise<RankThresholdRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT Id, Level, Code, Name, MinScore, MaxScore, Description FROM dbo.RankThresholds WHERE Id = @id"
    );
  return res.recordset[0] ?? null;
};

export const updateRankThreshold = async (
  id: number,
  patch: {
    name?: string;
    minScore?: number;
    maxScore?: number;
    description?: string | null;
  }
): Promise<void> => {
  const pool = await getPool();
  const sets: string[] = [];
  const r = pool.request().input("id", sql.Int, id);

  if (patch.name !== undefined) {
    sets.push("Name = @name");
    r.input("name", sql.NVarChar(100), patch.name);
  }
  if (patch.minScore !== undefined) {
    sets.push("MinScore = @minScore");
    r.input("minScore", sql.Decimal(7, 2), patch.minScore);
  }
  if (patch.maxScore !== undefined) {
    sets.push("MaxScore = @maxScore");
    r.input("maxScore", sql.Decimal(7, 2), patch.maxScore);
  }
  if (patch.description !== undefined) {
    sets.push("Description = @description");
    r.input("description", sql.NVarChar(500), patch.description);
  }
  if (sets.length === 0) return;

  await r.query(`UPDATE dbo.RankThresholds SET ${sets.join(", ")} WHERE Id = @id`);
};

export const findQuestionGroupById = async (
  id: number
): Promise<QuestionGroupRow | null> => {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "SELECT Id, QuestionnaireId, GroupNumber, Name, Description, Weight, IsOptional, IsIndustrySpecific, SortOrder FROM dbo.QuestionGroups WHERE Id = @id"
    );
  return res.recordset[0] ?? null;
};

export const updateQuestionGroupWeight = async (
  id: number,
  weight: number
): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, id)
    .input("weight", sql.Decimal(9, 4), weight)
    .query("UPDATE dbo.QuestionGroups SET Weight = @weight WHERE Id = @id");
};

/**
 * Lấy danh sách nhóm câu hỏi của bộ khảo sát đang active.
 * Tránh SELECT *: chỉ lấy các cột cần cho cấu hình điểm.
 */
export const findActiveQuestionGroups = async (): Promise<QuestionGroupRow[]> => {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT g.Id, g.QuestionnaireId, g.GroupNumber, g.Name, g.Description,
           g.Weight, g.IsOptional, g.IsIndustrySpecific, g.SortOrder
    FROM dbo.QuestionGroups g
    INNER JOIN dbo.QuestionnaireVersions v ON v.Id = g.QuestionnaireId
    WHERE v.IsActive = 1
    ORDER BY g.SortOrder, g.GroupNumber
  `);
  return res.recordset;
};
