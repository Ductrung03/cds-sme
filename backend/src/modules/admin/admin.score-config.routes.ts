import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ok } from "../../utils/api-response";
import { BadRequest, NotFound, UnprocessableEntity } from "../../utils/errors";
import { writeAudit } from "../../services/audit";
import {
  findRankThresholds,
  findRankThresholdById,
  updateRankThreshold,
  findActiveQuestionGroups,
  findQuestionGroupById,
  updateQuestionGroupWeight
} from "../../db/repository";

const router = Router();

router.use(authenticate, requireAdmin);

// ---------------------------------------------------------------------
// Quy tắc tính điểm dùng chung — hiển thị cho admin tham khảo.
// Trả về cấu trúc cố định để frontend render mà không cần hardcode.
// ---------------------------------------------------------------------
const SCORING_RULES = {
  algorithm: "TOPSIS",
  scoreRange: { min: 0, max: 100 },
  description:
    "Hệ thống tính điểm thô dựa trên thuật toán TOPSIS, sau đó chuẩn hóa về thang điểm 0-100 để phân loại cấp độ chuyển đổi số.",
  items: [
    {
      key: "topsis",
      title: "Thuật toán TOPSIS",
      detail:
        "TOPSIS tổng hợp điểm các câu hỏi theo trọng số nhóm để tạo ra điểm thô phản ánh khoảng cách tới giải pháp lý tưởng."
    },
    {
      key: "normalize",
      title: "Chuẩn hóa thang điểm 0-100",
      detail:
        "Điểm thô được chuẩn hóa về thang 0-100 và đối chiếu với ngưỡng cấp độ (1-5) để xác định mức độ chuyển đổi số."
    },
    {
      key: "appendix3",
      title: "Phụ lục III (Giải pháp phụ thuộc)",
      detail:
        "Giải pháp KHÔNG phụ thuộc tính hệ số 1.0; giải pháp PHỤ THUỘC tính hệ số 0.5 khi giải pháp tiên quyết chưa đạt — nhằm phản ánh đúng mức độ trưởng thành."
    },
    {
      key: "override",
      title: "Admin có quyền sửa điểm",
      detail:
        "Quản trị viên có thể điều chỉnh điểm cuối cùng, nhưng BẮT BUỘC phải nhập lý do; mọi thao tác đều được ghi vào nhật ký audit."
    }
  ]
};

// =====================================================================
// GET /api/admin/score-config
// =====================================================================
router.get(
  "/score-config",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [thresholds, groups] = await Promise.all([
        findRankThresholds(),
        findActiveQuestionGroups()
      ]);

      return ok(res, {
        rankThresholds: thresholds.map((t) => ({
          id: t.Id,
          level: t.Level,
          code: t.Code,
          name: t.Name,
          minScore: Number(t.MinScore),
          maxScore: Number(t.MaxScore),
          description: t.Description
        })),
        groupWeights: groups.map((g) => ({
          id: g.Id,
          groupNumber: g.GroupNumber,
          name: g.Name,
          weight: Number(g.Weight),
          isOptional: !!g.IsOptional,
          isIndustrySpecific: !!g.IsIndustrySpecific
        })),
        rules: SCORING_RULES
      });
    } catch (err) {
      return next(err);
    }
  }
);

// =====================================================================
// PATCH /api/admin/score-config/rank-thresholds/:id
// =====================================================================
const RankThresholdPatchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên cấp độ")
      .max(100)
      .optional(),
    minScore: z
      .number()
      .min(0, "Điểm tối thiểu không được nhỏ hơn 0")
      .max(100, "Điểm tối thiểu không được vượt quá 100")
      .optional(),
    maxScore: z
      .number()
      .min(0, "Điểm tối đa không được nhỏ hơn 0")
      .max(100, "Điểm tối đa không được vượt quá 100")
      .optional(),
    description: z.string().trim().max(500).nullable().optional()
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.minScore !== undefined ||
      v.maxScore !== undefined ||
      v.description !== undefined,
    { message: "Cần cung cấp ít nhất một trường để cập nhật" }
  );

router.patch(
  "/score-config/rank-thresholds/:id",
  validate(RankThresholdPatchSchema, "body"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(BadRequest("Mã ngưỡng cấp độ không hợp lệ"));
      }

      const existing = await findRankThresholdById(id);
      if (!existing) {
        return next(NotFound("Không tìm thấy ngưỡng cấp độ"));
      }

      const patch = req.body as z.infer<typeof RankThresholdPatchSchema>;

      const nextMin = patch.minScore ?? Number(existing.MinScore);
      const nextMax = patch.maxScore ?? Number(existing.MaxScore);
      if (nextMin > nextMax) {
        return next(
          UnprocessableEntity("Điểm tối thiểu không được lớn hơn điểm tối đa")
        );
      }

      await updateRankThreshold(id, {
        name: patch.name,
        minScore: patch.minScore,
        maxScore: patch.maxScore,
        description:
          patch.description === undefined ? undefined : patch.description ?? null
      });

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "UPDATE_RANK_THRESHOLD",
        entityType: "RankThreshold",
        entityId: String(id),
        payload: patch as unknown as Record<string, unknown>
      });

      const updated = await findRankThresholdById(id);
      return ok(res, {
        id: updated!.Id,
        level: updated!.Level,
        code: updated!.Code,
        name: updated!.Name,
        minScore: Number(updated!.MinScore),
        maxScore: Number(updated!.MaxScore),
        description: updated!.Description,
        message: "Đã cập nhật ngưỡng cấp độ"
      });
    } catch (err) {
      return next(err);
    }
  }
);

// =====================================================================
// PATCH /api/admin/score-config/group-weights/:id
// =====================================================================
const GroupWeightPatchSchema = z.object({
  weight: z
    .number({ invalid_type_error: "Trọng số phải là số" })
    .min(0, "Trọng số không được nhỏ hơn 0")
    .max(10, "Trọng số không được vượt quá 10")
});

router.patch(
  "/score-config/group-weights/:id",
  validate(GroupWeightPatchSchema, "body"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(BadRequest("Mã nhóm câu hỏi không hợp lệ"));
      }

      const existing = await findQuestionGroupById(id);
      if (!existing) {
        return next(NotFound("Không tìm thấy nhóm câu hỏi"));
      }

      const { weight } = req.body as z.infer<typeof GroupWeightPatchSchema>;

      await updateQuestionGroupWeight(id, weight);

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "UPDATE_GROUP_WEIGHT",
        entityType: "QuestionGroup",
        entityId: String(id),
        payload: { weight, previousWeight: Number(existing.Weight) }
      });

      const updated = await findQuestionGroupById(id);
      return ok(res, {
        id: updated!.Id,
        groupNumber: updated!.GroupNumber,
        name: updated!.Name,
        weight: Number(updated!.Weight),
        isOptional: !!updated!.IsOptional,
        isIndustrySpecific: !!updated!.IsIndustrySpecific,
        message: "Đã cập nhật trọng số nhóm câu hỏi"
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
