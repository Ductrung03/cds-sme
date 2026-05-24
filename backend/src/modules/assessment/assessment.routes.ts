import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createAssessment,
  findAssessmentById,
  findAssessmentsByUser,
  findMyAssessmentsView,
  findActiveQuestionnaire,
  updateAssessmentIndustry,
  updateAssessmentStatus,
  updateAssessmentFeedback,
  deleteAnswersByQuestionIds,
  insertAnswer,
  upsertAnswer,
  findAnswersByAssessment,
  findSolutionsByAssessment,
  upsertAssessmentSolution,
  findLatestScore,
  findIndustryById,
  findAllAnswerOptionsByQuestionIds,
  findQuestionsByIds,
  findQuestionGroups,
  findSolutionsByIndustry
} from "../../db/repository";
import { ok, fail } from "../../utils/api-response";
import { BadRequest, NotFound, Forbidden, UnprocessableEntity, Unauthorized } from "../../utils/errors";
import { writeAudit } from "../../services/audit";
import { computeScore, computeSolutionScore, normalizeTo100, rankScore } from "../../services/scoring";
import { findRankThresholds, findAllSolutionDependencies } from "../../db/repository";

const router = Router();

// --- Schemas ---
const DraftSchema = z.object({
  organizationName: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Email không hợp lệ").optional(),
  contactPhone: z.string().optional()
});

const AnswerSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive("questionId phải là số nguyên dương"),
        optionId: z.number().int().positive().nullable().optional(),
        otherText: z.string().nullable().optional(),
        openText: z.string().nullable().optional()
      })
    )
    .min(1, "Phải có ít nhất 1 câu trả lời")
});

const SolutionsSchema = z.object({
  solutions: z
    .array(
      z.object({
        solutionId: z.number().int().positive(),
        isSelected: z.boolean()
      })
    )
    .min(1)
});

// --- POST /api/assessments/draft ---
router.post(
  "/draft",
  authenticate,
  validate(DraftSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return fail(res, 401, "UNAUTHORIZED", "Bạn cần đăng nhập");

      const qv = await findActiveQuestionnaire();
      if (!qv) {
        return fail(
          res,
          400,
          "NO_QUESTIONNAIRE",
          "Chưa có phiên bản bảng hỏi nào được kích hoạt"
        );
      }

      const assessment = await createAssessment(req.user.userId, qv.Id);

      await writeAudit({
        actorUserId: req.user.userId,
        action: "CREATE_ASSESSMENT",
        entityType: "Assessment",
        entityId: assessment.Id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] ?? undefined
      });

      return res.status(201).json({
        success: true,
        data: {
          id: assessment.Id,
          status: assessment.Status,
          questionnaireId: assessment.QuestionnaireId,
          createdAt: assessment.CreatedAt
        },
        error: null,
        meta: { timestamp: new Date().toISOString() }
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/assessments/:id/answers ---
router.patch(
  "/:id/answers",
  authenticate,
  validate(AnswerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized("Bạn cần đăng nhập"));

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound("Không tìm thấy bài khảo sát"));
      if (assessment.UserId !== req.user.userId) return next(Forbidden("Không có quyền sửa bài khảo sát này"));
      if (assessment.Status !== "draft") {
        return next(BadRequest("Bài khảo sát đã nộp, không thể sửa câu trả lời"));
      }

      const { answers } = req.body as z.infer<typeof AnswerSchema>;

      // Hỗ trợ multi-select: xoá hết câu trả lời cũ của các question được submit,
      // rồi insert từng dòng mới (mỗi option được chọn là 1 row)
      const submittedQuestionIds = [...new Set(answers.map((a) => a.questionId))];
      await deleteAnswersByQuestionIds(assessment.Id, submittedQuestionIds);

      for (const a of answers) {
        await insertAnswer(
          assessment.Id,
          a.questionId,
          a.optionId ?? null,
          a.otherText ?? null,
          a.openText ?? null
        );
      }

      await writeAudit({
        actorUserId: req.user.userId,
        action: "UPDATE_ANSWERS",
        entityType: "Assessment",
        entityId: assessment.Id,
        payload: { answerCount: answers.length }
      });

      return ok(res, { answeredCount: answers.length });
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/assessments/:id/industry ---
router.patch(
  "/:id/industry",
  authenticate,
  validate(
    z.object({ industryId: z.number().int().positive() }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());
      if (assessment.UserId !== req.user.userId) return next(Forbidden());
      if (assessment.Status !== "draft") {
        return next(BadRequest("Bài khảo sát đã nộp, không thể đổi ngành"));
      }

      const { industryId } = req.body as { industryId: number };
      const industry = await findIndustryById(industryId);
      if (!industry) return next(NotFound("Ngành không tồn tại"));

      await updateAssessmentIndustry(assessment.Id, industryId);

      return ok(res, { industryId, industryName: industry.Name });
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/assessments/:id/solutions ---
router.patch(
  "/:id/solutions",
  authenticate,
  validate(SolutionsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());
      if (assessment.UserId !== req.user.userId) return next(Forbidden());
      if (assessment.Status !== "draft") {
        return next(BadRequest("Bài khảo sát đã nộp, không thể sửa giải pháp"));
      }

      const { solutions } = req.body as z.infer<typeof SolutionsSchema>;

      for (const s of solutions) {
        await upsertAssessmentSolution(assessment.Id, s.solutionId, s.isSelected);
      }

      return ok(res, { solutionCount: solutions.length });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/assessments/:id/submit ---
router.post(
  "/:id/submit",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());
      if (assessment.UserId !== req.user.userId) return next(Forbidden());
      if (assessment.Status !== "draft") {
        return next(BadRequest("Bài khảo sát đã được nộp trước đó"));
      }

      // Validate: must have industry
      if (!assessment.IndustryId) {
        return next(UnprocessableEntity("Vui lòng chọn ngành trước khi nộp bài"));
      }

      // Lưu đánh giá trải nghiệm (nếu có)
      const { experienceRating, experienceComment, selfScore } = (req.body ?? {}) as {
        experienceRating?: number;
        experienceComment?: string | null;
        selfScore?: number | null;
      };
      if (experienceRating != null) {
        const validSelfScore = (typeof selfScore === 'number' && selfScore >= 0 && selfScore <= 100)
          ? selfScore : null;
        await updateAssessmentFeedback(assessment.Id, experienceRating, experienceComment ?? null, validSelfScore);
      }

      await updateAssessmentStatus(assessment.Id, "submitted");

      await writeAudit({
        actorUserId: req.user.userId,
        action: "SUBMIT_ASSESSMENT",
        entityType: "Assessment",
        entityId: assessment.Id
      });

      return ok(res, { id: assessment.Id, status: "submitted", message: "Bài khảo sát đã được nộp thành công" });
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/assessments ---
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessments = await findAssessmentsByUser(req.user.userId);

      return ok(
        res,
        assessments.map((a) => ({
          id: a.Id,
          status: a.Status,
          industryId: a.IndustryId,
          organizationName: a.OrganizationName,
          submittedAt: a.SubmittedAt,
          scoredAt: a.ScoredAt,
          publishedAt: a.PublishedAt,
          createdAt: a.CreatedAt
        }))
      );
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/assessments/me ---
// Trả danh sách bài khảo sát của user hiện tại với DTO frontend dùng được
// (id, trangThai, maNganh, tenNganh, ngayNop, ngayTao). Phải đặt TRƯỚC "/:id"
// để Express không match nhầm "me" thành GUID và gây lỗi cast 500.
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const rows = await findMyAssessmentsView(req.user.userId);

      return ok(
        res,
        rows.map((r) => ({
          id: r.Id,
          trangThai: r.Status,
          maNganh: r.IndustryCode ?? "",
          tenNganh: r.IndustryName ?? undefined,
          ngayNop: r.SubmittedAt ?? undefined,
          ngayTao: r.CreatedAt
        }))
      );
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/assessments/:id/review ---
// Trả về view CHỈ ĐỌC cho user xem lại bài khảo sát của mình:
// - Luôn trả: thông tin bài, ngành, danh sách câu hỏi đã trả lời (kèm nội dung câu/đáp án đã chọn),
//   trạng thái bài.
// - Nếu admin đã chấm/duyệt/công bố (status = scored | published): kèm tổng điểm + điểm từng nhóm
//   + điểm của từng đáp án mà user đã chọn (Score của option).
// - User chỉ xem được bài của chính mình (admin xem được mọi bài).
// Phải đặt TRƯỚC "/:id" để Express route ordering không match nhầm "review" thành GUID.
router.get(
  "/:id/review",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound("Không tìm thấy bài khảo sát"));
      if (assessment.UserId !== req.user.userId && req.user.role !== "admin") {
        return next(Forbidden("Bạn không có quyền xem bài khảo sát này"));
      }

      const answers = await findAnswersByAssessment(assessment.Id);
      const solutions = await findSolutionsByAssessment(assessment.Id);
      const score = await findLatestScore(assessment.Id);

      const qIds = [...new Set(answers.map((a) => a.QuestionId))];
      const questions = await findQuestionsByIds(qIds);
      const allOptions = await findAllAnswerOptionsByQuestionIds(qIds);

      // Group info (groupNumber + tên nhóm)
      const allGroups = await findQuestionGroups(assessment.QuestionnaireId);
      const groupMap = new Map<number, { groupNumber: number; name: string }>();
      for (const g of allGroups) {
        groupMap.set(g.Id, { groupNumber: g.GroupNumber, name: g.Name });
      }

      // Option map (Id → {content, score, isOther, code})
      const optionMap = new Map<number, { content: string; code: string; score: number; isOther: boolean }>();
      for (const o of allOptions) {
        optionMap.set(o.Id, { content: o.Content, code: o.Code, score: o.Score, isOther: !!o.IsOther });
      }

      // Industry
      const industry = assessment.IndustryId ? await findIndustryById(assessment.IndustryId) : null;

      // Có hiển thị điểm chi tiết không? (admin đã chấm)
      const showScore = assessment.Status === "scored" || assessment.Status === "published";

      // Industry solutions (để render nhóm 7 chọn giải pháp readonly)
      const industrySolutions = assessment.IndustryId
        ? await findSolutionsByIndustry(assessment.IndustryId)
        : [];
      const solutionMap = new Map(industrySolutions.map((s) => [s.Id, s]));

      return ok(res, {
        id: assessment.Id,
        status: assessment.Status,
        industryId: assessment.IndustryId,
        maNganh: industry?.Code ?? "",
        tenNganh: industry?.Name ?? undefined,
        organizationName: assessment.OrganizationName,
        contactName: assessment.ContactName,
        contactEmail: assessment.ContactEmail,
        contactPhone: assessment.ContactPhone,
        submittedAt: assessment.SubmittedAt,
        scoredAt: assessment.ScoredAt,
        publishedAt: assessment.PublishedAt,
        createdAt: assessment.CreatedAt,
        canViewScore: showScore,
        answers: answers.map((a) => {
          const q = questions.find((x) => x.Id === a.QuestionId);
          const gInfo = q ? groupMap.get(q.GroupId) : undefined;
          const opt = a.OptionId ? optionMap.get(a.OptionId) : null;
          return {
            questionId: a.QuestionId,
            questionCode: q?.Code ?? "",
            questionContent: q?.Content ?? "",
            groupNumber: gInfo?.groupNumber ?? 0,
            groupName: gInfo?.name ?? "",
            optionId: a.OptionId,
            optionCode: opt?.code ?? null,
            optionContent: opt?.content ?? null,
            optionIsOther: opt?.isOther ?? false,
            // Chỉ trả điểm khi admin đã chấm
            optionScore: showScore ? (opt?.score ?? null) : null,
            otherText: a.OtherText,
            openText: a.OpenText,
          };
        }),
        solutions: solutions.map((s) => {
          const sol = solutionMap.get(s.SolutionId);
          return {
            solutionId: s.SolutionId,
            solutionCode: sol?.Code ?? "",
            solutionName: sol?.Name ?? "",
            isSelected: s.IsSelected,
            adminScore: showScore ? s.AdminScore : null,
            note: showScore ? s.Note : null,
          };
        }),
        score: showScore && score
          ? {
              normalizedScore: score.NormalizedScore,
              rankLevel: score.RankLevel,
              rankName: score.RankName,
              isOverridden: score.IsOverridden,
              groupBreakdown: JSON.parse(score.GroupBreakdown),
              adminNote: score.OverrideReason ?? null,
            }
          : null,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/assessments/:id ---
router.get(
  "/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());
      if (assessment.UserId !== req.user.userId && req.user.role !== "admin") {
        return next(Forbidden());
      }

      const answers = await findAnswersByAssessment(assessment.Id);
      const solutions = await findSolutionsByAssessment(assessment.Id);

      return ok(res, {
        id: assessment.Id,
        status: assessment.Status,
        questionnaireId: assessment.QuestionnaireId,
        industryId: assessment.IndustryId,
        organizationName: assessment.OrganizationName,
        contactName: assessment.ContactName,
        contactEmail: assessment.ContactEmail,
        contactPhone: assessment.ContactPhone,
        submittedAt: assessment.SubmittedAt,
        scoredAt: assessment.ScoredAt,
        publishedAt: assessment.PublishedAt,
        createdAt: assessment.CreatedAt,
        answers: answers.map((a) => ({
          questionId: a.QuestionId,
          optionId: a.OptionId,
          otherText: a.OtherText,
          openText: a.OpenText
        })),
        solutions: solutions.map((s) => ({
          solutionId: s.SolutionId,
          isSelected: s.IsSelected,
          adminScore: s.AdminScore,
          note: s.Note
        }))
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/assessments/:id/result ---
router.get(
  "/:id/result",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(Unauthorized());

      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());
      if (assessment.UserId !== req.user.userId && req.user.role !== "admin") {
        return next(Forbidden());
      }
      if (assessment.Status !== "published") {
        return ok(res, {
          message: "Kết quả chưa được công bố. Vui lòng đợi quản trị viên chấm điểm và công bố.",
          status: assessment.Status
        });
      }

      const score = await findLatestScore(assessment.Id);
      if (!score) {
        return ok(res, { message: "Chưa có kết quả chấm điểm", status: assessment.Status });
      }

      return ok(res, {
        assessmentId: assessment.Id,
        status: assessment.Status,
        normalizedScore: score.NormalizedScore,
        rankLevel: score.RankLevel,
        rankName: score.RankName,
        isOverridden: score.IsOverridden,
        groupBreakdown: JSON.parse(score.GroupBreakdown),
        scoredAt: assessment.ScoredAt,
        publishedAt: assessment.PublishedAt
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
