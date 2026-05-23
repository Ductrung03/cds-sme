import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ok, created } from "../../utils/api-response";
import { BadRequest, NotFound, Conflict } from "../../utils/errors";
import { writeAudit } from "../../services/audit";
import {
  findAdminQuestions,
  findQuestionById,
  updateQuestion,
  findOptionById,
  createAnswerOption,
  updateAnswerOption,
  deleteAnswerOption,
  countAnswerOptionUsage,
  findAllIndustries
} from "../../db/repository";

const router = Router();

router.use(authenticate, requireAdmin);

// --- GET /api/admin/questions ---
router.get("/questions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupNumber = req.query.nhom
      ? parseInt(String(req.query.nhom), 10)
      : req.query.groupNumber
      ? parseInt(String(req.query.groupNumber), 10)
      : undefined;
    const industryId = req.query.industryId
      ? parseInt(String(req.query.industryId), 10)
      : req.query.maNganh
      ? undefined
      : undefined;

    if (groupNumber !== undefined && Number.isNaN(groupNumber)) {
      return next(BadRequest("Tham số nhóm không hợp lệ"));
    }
    if (industryId !== undefined && Number.isNaN(industryId)) {
      return next(BadRequest("Tham số ngành không hợp lệ"));
    }

    const [questions, industries] = await Promise.all([
      findAdminQuestions({
        groupNumber: Number.isFinite(groupNumber as number) ? groupNumber : undefined,
        industryId: Number.isFinite(industryId as number) ? industryId : undefined
      }),
      findAllIndustries()
    ]);

    return ok(res, {
      industries: industries.map((i) => ({
        id: i.Id,
        code: i.Code,
        name: i.Name
      })),
      items: questions
    });
  } catch (err) {
    return next(err);
  }
});

// --- PATCH /api/admin/questions/:id ---
const PatchQuestionSchema = z
  .object({
    content: z.string().trim().min(1, "Nội dung không được trống").max(2000).optional(),
    questionType: z.enum(["single", "multiple", "open"]).optional(),
    allowOther: z.boolean().optional(),
    isOptional: z.boolean().optional(),
    maxScore: z.number().min(0).max(100).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional()
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Không có thay đổi nào để cập nhật"
  });

router.patch(
  "/questions/:id",
  validate(PatchQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID câu hỏi không hợp lệ"));

      const existing = await findQuestionById(id);
      if (!existing) return next(NotFound("Không tìm thấy câu hỏi"));

      await updateQuestion(id, req.body);

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "UPDATE_QUESTION",
        entityType: "Question",
        entityId: String(id),
        payload: req.body as Record<string, unknown>
      });

      const updated = await findQuestionById(id);
      return ok(res, {
        id,
        message: "Đã cập nhật câu hỏi",
        question: updated
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/questions/:id/options ---
const CreateOptionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập mã đáp án")
    .max(20, "Mã đáp án quá dài"),
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung đáp án")
    .max(1000),
  score: z.number().min(0).max(100),
  isOther: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional()
});

router.post(
  "/questions/:id/options",
  validate(CreateOptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questionId = parseInt(req.params.id, 10);
      if (Number.isNaN(questionId)) return next(BadRequest("ID câu hỏi không hợp lệ"));

      const q = await findQuestionById(questionId);
      if (!q) return next(NotFound("Không tìm thấy câu hỏi"));

      const body = req.body as z.infer<typeof CreateOptionSchema>;

      try {
        const opt = await createAnswerOption({
          questionId,
          code: body.code,
          content: body.content,
          score: body.score,
          isOther: body.isOther,
          sortOrder: body.sortOrder
        });

        await writeAudit({
          actorUserId: req.user?.userId,
          action: "CREATE_OPTION",
          entityType: "AnswerOption",
          entityId: String(opt.Id),
          payload: { questionId, ...body }
        });

        return created(res, {
          id: opt.Id,
          questionId: opt.QuestionId,
          code: opt.Code,
          content: opt.Content,
          score: Number(opt.Score),
          isOther: !!opt.IsOther,
          sortOrder: opt.SortOrder
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("UX_AO_Question_Code")) {
          return next(Conflict("Mã đáp án đã tồn tại trong câu hỏi này"));
        }
        throw err;
      }
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/admin/options/:id ---
const PatchOptionSchema = z
  .object({
    code: z.string().trim().min(1).max(20).optional(),
    content: z.string().trim().min(1).max(1000).optional(),
    score: z.number().min(0).max(100).optional(),
    isOther: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional()
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Không có thay đổi nào để cập nhật"
  });

router.patch(
  "/options/:id",
  validate(PatchOptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID đáp án không hợp lệ"));

      const opt = await findOptionById(id);
      if (!opt) return next(NotFound("Không tìm thấy đáp án"));

      try {
        await updateAnswerOption(id, req.body);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("UX_AO_Question_Code")) {
          return next(Conflict("Mã đáp án đã tồn tại trong câu hỏi này"));
        }
        throw err;
      }

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "UPDATE_OPTION",
        entityType: "AnswerOption",
        entityId: String(id),
        payload: req.body as Record<string, unknown>
      });

      const updated = await findOptionById(id);
      return ok(res, {
        id,
        message: "Đã cập nhật đáp án",
        option: updated
          ? {
              id: updated.Id,
              questionId: updated.QuestionId,
              code: updated.Code,
              content: updated.Content,
              score: Number(updated.Score),
              isOther: !!updated.IsOther,
              sortOrder: updated.SortOrder
            }
          : null
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- DELETE /api/admin/options/:id ---
router.delete(
  "/options/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID đáp án không hợp lệ"));

      const opt = await findOptionById(id);
      if (!opt) return next(NotFound("Không tìm thấy đáp án"));

      // Pre-check: nếu đáp án đã được dùng trong AssessmentAnswers thì
      // không cho xóa, trả 409 với thông báo tiếng Việt.
      const usage = await countAnswerOptionUsage(id);
      if (usage > 0) {
        return next(
          Conflict(
            "Không thể xóa đáp án đã được sử dụng trong bài khảo sát"
          )
        );
      }

      try {
        await deleteAnswerOption(id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("REFERENCE") || msg.includes("FK_AA_Option")) {
          return next(
            Conflict(
              "Không thể xóa đáp án đã được sử dụng trong bài khảo sát"
            )
          );
        }
        throw err;
      }

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "DELETE_OPTION",
        entityType: "AnswerOption",
        entityId: String(id),
        payload: { questionId: opt.QuestionId, code: opt.Code }
      });

      return ok(res, { id, message: "Đã xóa đáp án" });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
