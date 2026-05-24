import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  findAllAssessments,
  findAssessmentById,
  updateAssessmentStatus,
  findAnswersByAssessment,
  findAllAnswerOptionsByQuestionIds,
  findSolutionsByAssessment,
  findLatestScore,
  createAssessmentScore,
  findRankThresholds,
  findSolutionDependenciesByIndustry,
  updateAssessmentIndustry,
  upsertOtherAnswerReview,
  findOtherAnswerReviewsByAnswerIds,
  findQuestionsByIds,
  updateScoreOverride,
  upsertAnswer,
  findSolutionsByIndustry,
  updateSolutionAdminScore
} from "../../db/repository";
import { ok, fail } from "../../utils/api-response";
import { NotFound, BadRequest, UnprocessableEntity } from "../../utils/errors";
import { writeAudit } from "../../services/audit";
import { createAiReviewService } from "../../services/ai-review";
import { env } from "../../config/env";
import type { AssessmentAnswerRow, AnswerOptionRow, QuestionRow, RankThresholdRow } from "../../types/models";

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// --- GET /api/admin/assessments ---
router.get(
  "/assessments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { getPool, sql } = await import("../../db/pool");
      const pool = await getPool();

      const statusFilter = req.query.trangThai as string | undefined;

      let query = `
        SELECT
          a.Id, a.UserId, a.Status, a.IndustryId, a.QuestionnaireId,
          a.OrganizationName, a.ContactName, a.ContactEmail, a.ContactPhone,
          a.SubmittedAt, a.ScoredAt, a.PublishedAt, a.CreatedAt,
          u.FullName AS UserFullName, u.Email AS UserEmail, u.Phone AS UserPhone, u.OrganizationName AS UserOrganizationName,
          i.Code AS IndustryCode, i.Name AS IndustryName,
          sc.NormalizedScore, sc.RankName
        FROM dbo.Assessments a
        LEFT JOIN dbo.Users u ON a.UserId = u.Id
        LEFT JOIN dbo.Industries i ON a.IndustryId = i.Id
        OUTER APPLY (
          SELECT TOP 1 NormalizedScore, RankName
          FROM dbo.AssessmentScores
          WHERE AssessmentId = a.Id
          ORDER BY Id DESC
        ) sc
      `;

      const req2 = pool.request();
      if (statusFilter) {
        query += ` WHERE a.Status = @status`;
        req2.input("status", sql.NVarChar(20), statusFilter);
      }
      query += ` ORDER BY a.CreatedAt DESC`;

      const result = await req2.query(query);
      const rows: any[] = result.recordset;

      return ok(
        res,
        rows.map((a: any) => ({
          id: a.Id,
          userId: a.UserId,
          status: a.Status,
          industryId: a.IndustryId,
          // Ưu tiên contact info từ assessment, fallback từ Users
          organizationName: a.OrganizationName || a.UserOrganizationName,
          contactName: a.ContactName || a.UserFullName,
          contactEmail: a.ContactEmail || a.UserEmail,
          contactPhone: a.ContactPhone || a.UserPhone,
          // Thông tin ngành
          maNganh: a.IndustryCode ?? '',
          tenNganh: a.IndustryName ?? undefined,
          // Điểm nếu có
          tongDiem: a.NormalizedScore ?? undefined,
          capDo: a.RankName ?? undefined,
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

// --- GET /api/admin/dashboard ---
router.get(
  "/dashboard",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { findAllAssessments } = await import("../../db/repository");
      const all = await findAllAssessments();
      const tongBaiKhaoSat = all.length;
      const choXetDuyet = all.filter((a) => a.Status === "submitted").length;
      const dangXetDuyet = 0; // backend không có trạng thái "reviewing" riêng
      const daChamDiem = all.filter((a) => a.Status === "scored").length;
      const daCongBo = all.filter((a) => a.Status === "published").length;
      return ok(res, {
        tongBaiKhaoSat,
        choXetDuyet,
        dangXetDuyet,
        daChamDiem,
        daCongBo,
        phanBoCapDo: [],
        baiCanXuLy: [],
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/admin/assessments/:id ---
router.get(
  "/assessments/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound("Không tìm thấy bài khảo sát"));

      const answers = await findAnswersByAssessment(assessment.Id);
      const solutions = await findSolutionsByAssessment(assessment.Id);
      const score = await findLatestScore(assessment.Id);

      // Lấy options cho các câu hỏi "Khác"
      const qIds = answers.map((a) => a.QuestionId);
      const allOptions = await findAllAnswerOptionsByQuestionIds(qIds);
      const questions = await findQuestionsByIds(qIds);

      // Lấy thông tin nhóm cho các câu hỏi (groupNumber)
      const { findQuestionGroups } = await import("../../db/repository");
      const allGroups = await findQuestionGroups(assessment.QuestionnaireId);
      const groupMap = new Map<number, number>(); // GroupId → GroupNumber
      for (const g of allGroups) groupMap.set(g.Id, g.GroupNumber);

      // Map option info (content, score, isOther)
      const optionMap = new Map<number, { content: string; score: number; isOther: boolean }>();
      for (const o of allOptions) {
        optionMap.set(o.Id, { content: o.Content, score: o.Score, isOther: !!o.IsOther });
      }

      // Lấy industry info
      const { findIndustryById: _findIndustry } = await import("../../db/repository");
      const industry = assessment.IndustryId ? await _findIndustry(assessment.IndustryId) : null;

      const otherAnswerIds = answers
        .filter((a) => a.OtherText && a.OtherText.trim().length > 0)
        .map((a) => a.Id);

      const reviews =
        otherAnswerIds.length > 0
          ? await findOtherAnswerReviewsByAnswerIds(otherAnswerIds)
          : [];

      const reviewMap = new Map(reviews.map((r) => [r.AnswerId, r]));

      return ok(res, {
        assessment: {
          id: assessment.Id,
          userId: assessment.UserId,
          status: assessment.Status,
          industryId: assessment.IndustryId,
          maNganh: industry?.Code ?? '',
          tenNganh: industry?.Name ?? undefined,
          organizationName: assessment.OrganizationName,
          contactName: assessment.ContactName,
          contactEmail: assessment.ContactEmail,
          contactPhone: assessment.ContactPhone,
          submittedAt: assessment.SubmittedAt,
          scoredAt: assessment.ScoredAt,
          publishedAt: assessment.PublishedAt,
          createdAt: assessment.CreatedAt
        },
        answers: answers.map((a) => {
          const q = questions.find((q) => q.Id === a.QuestionId);
          const gId = q?.GroupId;
          const opt = a.OptionId ? optionMap.get(a.OptionId) : null;
          const review = reviewMap.get(a.Id);
          return {
            answerId: a.Id,
            questionId: a.QuestionId,
            questionCode: q?.Code ?? '',
            questionContent: q?.Content ?? null,
            groupNumber: gId ? (groupMap.get(gId) ?? 0) : 0,
            optionId: a.OptionId,
            optionContent: opt?.content ?? null,
            optionScore: opt?.score ?? null,
            optionIsOther: opt?.isOther ?? false,
            otherText: a.OtherText,
            openText: a.OpenText,
            review: review
              ? {
                  aiSuggestion: review.AiSuggestion,
                  aiConfidence: review.AiConfidence,
                  aiRelevant: review.AiRelevant,
                  adminScore: review.AdminScore,
                  adminComment: review.AdminComment,
                  reviewedAt: review.ReviewedAt
                }
              : null
          };
        }),
        solutions: solutions.map((s) => ({
          solutionId: s.SolutionId,
          isSelected: s.IsSelected,
          adminScore: s.AdminScore,
          note: s.Note
        })),
        score: score
          ? {
              normalizedScore: score.NormalizedScore,
              rankLevel: score.RankLevel,
              rankName: score.RankName,
              isOverridden: score.IsOverridden,
              groupBreakdown: JSON.parse(score.GroupBreakdown)
            }
          : null
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/assessments/:id/ai-review ---
router.post(
  "/assessments/:id/ai-review",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      const answers = await findAnswersByAssessment(assessment.Id);
      const qIds = answers.map((a) => a.QuestionId);
      const questions = await findQuestionsByIds(qIds);
      const qMap = new Map(questions.map((q) => [q.Id, q]));

      const otherAnswers = answers.filter((a) => a.OtherText && a.OtherText.trim().length > 0);

      if (otherAnswers.length === 0) {
        return ok(res, { message: "Không có câu trả lời 'Khác' nào cần đánh giá", results: [] });
      }

      const aiService = createAiReviewService(env.AI_PROVIDER);
      const results: unknown[] = [];

      for (const ans of otherAnswers) {
        const q = qMap.get(ans.QuestionId);
        const allOptions = await (async () => {
          const { findAnswerOptions } = await import("../../db/repository");
          return findAnswerOptions(ans.QuestionId);
        })();

        const review = await aiService.review({
          questionContent: q?.Content ?? "",
          answerText: ans.OtherText ?? "",
          availableOptions: allOptions
            .filter((o) => !o.IsOther)
            .map((o) => ({ code: o.Code, content: o.Content }))
        });

        await upsertOtherAnswerReview({
          answerId: ans.Id,
          aiSuggestion: review.suggestion,
          aiConfidence: review.confidence,
          aiRelevant: review.isRelevant
        });

        results.push({
          answerId: ans.Id,
          questionId: ans.QuestionId,
          isRelevant: review.isRelevant,
          verdict: review.verdict,
          matchedOptionCode: review.matchedOptionCode ?? null,
          matchedOptionContent: review.matchedOptionContent ?? null,
          reason: review.reason ?? null,
          confidence: review.confidence,
          suggestion: review.suggestion
        });
      }

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "AI_REVIEW",
        entityType: "Assessment",
        entityId: assessment.Id,
        payload: { reviewedCount: otherAnswers.length }
      });

      return ok(res, { results });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/assessments/:id/questions/:qid/ai-review ---
// Phân tích AI cho MỘT câu hỏi cụ thể (chỉ câu có đáp án "Khác")
router.post(
  "/assessments/:id/questions/:qid/ai-review",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      const questionId = Number(req.params.qid);
      if (!Number.isFinite(questionId)) return next(NotFound());

      const answers = await findAnswersByAssessment(assessment.Id);
      const ans = answers.find((a) => a.QuestionId === questionId);

      if (!ans) return next(NotFound("Không tìm thấy câu trả lời cho câu hỏi này"));
      if (!ans.OtherText || ans.OtherText.trim().length === 0) {
        return fail(res, 400, "NO_OTHER_ANSWER", "Câu hỏi này không có đáp án 'Khác' để phân tích");
      }

      const questions = await findQuestionsByIds([questionId]);
      const q = questions[0];

      const { findAnswerOptions } = await import("../../db/repository");
      const allOptions = await findAnswerOptions(questionId);

      const aiService = createAiReviewService(env.AI_PROVIDER);
      const review = await aiService.review({
        questionContent: q?.Content ?? "",
        answerText: ans.OtherText,
        availableOptions: allOptions
          .filter((o) => !o.IsOther)
          .map((o) => ({ code: o.Code, content: o.Content })),
      });

      await upsertOtherAnswerReview({
        answerId: ans.Id,
        aiSuggestion: review.suggestion,
        aiConfidence: review.confidence,
        aiRelevant: review.isRelevant,
      });

      return ok(res, {
        questionId,
        answerId: ans.Id,
        isRelevant: review.isRelevant,
        verdict: review.verdict,
        matchedOptionCode: review.matchedOptionCode ?? null,
        matchedOptionContent: review.matchedOptionContent ?? null,
        reason: review.reason ?? null,
        confidence: review.confidence,
        suggestion: review.suggestion,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/assessments/:id/score ---
router.post(
  "/assessments/:id/score",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      if (assessment.Status !== "submitted" && assessment.Status !== "scored") {
        return next(BadRequest("Bài khảo sát phải ở trạng thái 'đã nộp' hoặc 'đã chấm' mới có thể chấm điểm"));
      }

      if (!assessment.IndustryId) {
        return next(UnprocessableEntity("Bài khảo sát chưa chọn ngành"));
      }

      const answers = await findAnswersByAssessment(assessment.Id);
      const solutions = await findSolutionsByAssessment(assessment.Id);
      const qIds = answers.map((a) => a.QuestionId);
      const allOptions = await findAllAnswerOptionsByQuestionIds(qIds);
      const solutionDeps = await findSolutionDependenciesByIndustry(assessment.IndustryId);
      const ranks = await findRankThresholds();

      // Map option score per answer
      const optionMap = new Map<number, AnswerOptionRow>();
      for (const o of allOptions) optionMap.set(o.Id, o);

      // Nhóm 1-6: điểm từ câu trả lời
      let answerSum = 0;
      let answerCount = 0;

      for (const a of answers) {
        if (a.OptionId) {
          const opt = optionMap.get(a.OptionId);
          if (opt && !opt.IsOther) {
            answerSum += opt.Score;
            answerCount++;
          }
        }
      }

      const answerNorm = answerCount > 0 ? answerSum / answerCount : 0;

      // Nhóm 7: điểm từ giải pháp (Phụ lục 3)
      const depSet = new Set<number>();
      for (const d of solutionDeps) depSet.add(d.SolutionId);

      const allIndustrySolutions = await findSolutionsByIndustry(assessment.IndustryId);
      const maxPossible = allIndustrySolutions.length || 1;

      let solutionSum = 0;
      for (const s of solutions) {
        if (s.IsSelected) {
          if (s.AdminScore !== null) {
            solutionSum += s.AdminScore;
          } else {
            solutionSum += depSet.has(s.SolutionId) ? 0.5 : 1.0;
          }
        }
      }

      const solutionNorm = solutions.length > 0 ? solutionSum / maxPossible : 0;
      const rawScore = answerNorm * 0.70 + solutionNorm * 0.30;
      const topsisScore = rawScore;
      const normalizedScore = Math.round(rawScore * 100 * 100) / 100;

      // Xếp hạng
      const sorted = [...ranks].sort((a, b) => a.Level - b.Level);
      let rankLevel = 1;
      let rankName = "Chưa xếp hạng";
      for (const r of sorted) {
        if (normalizedScore >= r.MinScore && normalizedScore <= r.MaxScore) {
          rankLevel = r.Level;
          rankName = r.Name;
          break;
        }
      }

      const groupBreakdownRaw = {
        groups: [
          {
            groupNumber: 1,
            weight: 0.70,
            questions: answerCount,
            rawScore: answerSum,
            maxScore: answerCount,
            normalizedGroupScore: Math.round(answerNorm * 100 * 100) / 100
          },
          {
            groupNumber: 7,
            weight: 0.30,
            solutions: solutions.filter((s) => s.IsSelected).length,
            solutionScore: Math.round(solutionNorm * 100 * 100) / 100
          }
        ]
      };

      const score = await createAssessmentScore(
        assessment.Id,
        Math.round(rawScore * 10000) / 10000,
        Math.round(solutionNorm * 10000) / 10000,
        Math.round(topsisScore * 10000) / 10000,
        normalizedScore,
        rankLevel,
        rankName,
        JSON.stringify(groupBreakdownRaw),
        JSON.stringify({
          answerNorm: Math.round(answerNorm * 10000) / 10000,
          solutionNorm: Math.round(solutionNorm * 10000) / 10000,
          totalAnswers: answerCount,
          totalSolutions: solutions.filter((s) => s.IsSelected).length,
          maxPossibleSolutions: maxPossible
        }),
        req.user?.userId
      );

      await updateAssessmentStatus(assessment.Id, "scored", {
        scoredByUserId: req.user?.userId
      });

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "SCORE_ASSESSMENT",
        entityType: "Assessment",
        entityId: assessment.Id,
        payload: { normalizedScore, rankLevel, rankName }
      });

      return ok(res, {
        normalizedScore: score.NormalizedScore,
        rankLevel: score.RankLevel,
        rankName: score.RankName,
        groupBreakdown: groupBreakdownRaw
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/admin/assessments/:id/score ---
router.patch(
  "/assessments/:id/score",
  validate(
    z.object({
      scoreId: z.number().int().positive(),
      reason: z.string().min(1, "Phải có lý do sửa điểm")
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      const { scoreId, reason } = req.body as { scoreId: number; reason: string };

      const score = await findLatestScore(assessment.Id);
      if (!score || score.Id !== scoreId) {
        return next(NotFound("Không tìm thấy điểm để sửa"));
      }

      await updateScoreOverride(scoreId, reason);

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "OVERRIDE_SCORE",
        entityType: "Assessment",
        entityId: assessment.Id,
        payload: { scoreId, reason }
      });

      return ok(res, { message: "Đã ghi nhận sửa điểm", scoreId, reason });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/assessments/:id/publish ---
router.post(
  "/assessments/:id/publish",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      if (assessment.Status !== "scored") {
        return next(BadRequest("Bài khảo sát phải được chấm điểm trước khi công bố"));
      }

      await updateAssessmentStatus(assessment.Id, "published");

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "PUBLISH_ASSESSMENT",
        entityType: "Assessment",
        entityId: assessment.Id
      });

      return ok(res, { message: "Kết quả đã được công bố", status: "published" });
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/admin/assessments/:id/solutions/:solutionId ---
router.patch(
  "/assessments/:id/solutions/:solutionId",
  validate(
    z.object({
      adminScore: z.number().min(0).max(1).nullable().optional(),
      note: z.string().nullable().optional()
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await findAssessmentById(req.params.id);
      if (!assessment) return next(NotFound());

      const solutionId = parseInt(req.params.solutionId, 10);
      if (isNaN(solutionId)) return next(BadRequest("solutionId không hợp lệ"));

      const { adminScore, note } = req.body as {
        adminScore?: number | null;
        note?: string | null;
      };

      await updateSolutionAdminScore(
        assessment.Id,
        solutionId,
        adminScore ?? null,
        note ?? undefined
      );

      return ok(res, { solutionId, adminScore, note });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
