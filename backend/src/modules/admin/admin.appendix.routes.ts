import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ok, created } from "../../utils/api-response";
import { BadRequest, NotFound, Conflict, UnprocessableEntity } from "../../utils/errors";
import { writeAudit } from "../../services/audit";
import {
  findAdminSolutions,
  findSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
  countSolutionAssessmentUsage,
  countSolutionDependencyRefs,
  createSolutionDependency,
  deleteSolutionDependency,
  findSolutionDependencyById,
  findAllIndustries
} from "../../db/repository";

const router = Router();

router.use(authenticate, requireAdmin);

// --- GET /api/admin/appendix-iii ---
router.get(
  "/appendix-iii",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const industryId = req.query.industryId
        ? parseInt(String(req.query.industryId), 10)
        : undefined;

      if (industryId !== undefined && Number.isNaN(industryId)) {
        return next(BadRequest("Tham số ngành không hợp lệ"));
      }

      const [solutions, industries] = await Promise.all([
        findAdminSolutions(industryId),
        findAllIndustries()
      ]);

      return ok(res, {
        industries: industries.map((i) => ({
          id: i.Id,
          code: i.Code,
          name: i.Name
        })),
        items: solutions
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/solutions ---
const CreateSolutionSchema = z.object({
  industryId: z.number().int().positive(),
  code: z.string().trim().min(1, "Vui lòng nhập mã giải pháp").max(50),
  name: z.string().trim().min(1, "Vui lòng nhập tên giải pháp").max(500),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional()
});

router.post(
  "/solutions",
  validate(CreateSolutionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof CreateSolutionSchema>;

      try {
        const sol = await createSolution({
          industryId: body.industryId,
          code: body.code,
          name: body.name,
          description: body.description ?? null,
          sortOrder: body.sortOrder,
          isActive: body.isActive
        });

        await writeAudit({
          actorUserId: req.user?.userId,
          action: "CREATE_SOLUTION",
          entityType: "Solution",
          entityId: String(sol.Id),
          payload: body as unknown as Record<string, unknown>
        });

        return created(res, {
          id: sol.Id,
          industryId: sol.IndustryId,
          code: sol.Code,
          name: sol.Name,
          description: sol.Description,
          sortOrder: sol.SortOrder,
          isActive: !!sol.IsActive,
          dependencies: [],
          defaultScore: 1
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("UX_S_Industry_Code")) {
          return next(Conflict("Mã giải pháp đã tồn tại trong ngành này"));
        }
        if (msg.includes("FK_S_Industry")) {
          return next(UnprocessableEntity("Ngành không tồn tại"));
        }
        throw err;
      }
    } catch (err) {
      return next(err);
    }
  }
);

// --- PATCH /api/admin/solutions/:id ---
const PatchSolutionSchema = z
  .object({
    code: z.string().trim().min(1).max(50).optional(),
    name: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional()
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Không có thay đổi nào để cập nhật"
  });

router.patch(
  "/solutions/:id",
  validate(PatchSolutionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID giải pháp không hợp lệ"));

      const existing = await findSolutionById(id);
      if (!existing) return next(NotFound("Không tìm thấy giải pháp"));

      try {
        await updateSolution(id, req.body);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("UX_S_Industry_Code")) {
          return next(Conflict("Mã giải pháp đã tồn tại trong ngành này"));
        }
        throw err;
      }

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "UPDATE_SOLUTION",
        entityType: "Solution",
        entityId: String(id),
        payload: req.body as Record<string, unknown>
      });

      const updated = await findSolutionById(id);
      return ok(res, {
        id,
        message: "Đã cập nhật giải pháp",
        solution: updated
          ? {
              id: updated.Id,
              industryId: updated.IndustryId,
              code: updated.Code,
              name: updated.Name,
              description: updated.Description,
              sortOrder: updated.SortOrder,
              isActive: !!updated.IsActive
            }
          : null
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- DELETE /api/admin/solutions/:id ---
router.delete(
  "/solutions/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID giải pháp không hợp lệ"));

      const existing = await findSolutionById(id);
      if (!existing) return next(NotFound("Không tìm thấy giải pháp"));

      // Pre-check: chặn xóa nếu giải pháp đã được dùng trong bài khảo sát.
      const usage = await countSolutionAssessmentUsage(id);
      if (usage > 0) {
        return next(
          Conflict(
            "Không thể xóa giải pháp đã được sử dụng trong bài khảo sát"
          )
        );
      }

      // Pre-check: chặn xóa nếu vẫn còn dependency liên quan (giải pháp này
      // hoặc đang phụ thuộc vào nó). Admin phải gỡ phụ thuộc trước.
      const depRefs = await countSolutionDependencyRefs(id);
      if (depRefs > 0) {
        return next(
          Conflict(
            "Không thể xóa giải pháp vì vẫn còn phụ thuộc liên quan. Vui lòng xóa các phụ thuộc trước."
          )
        );
      }

      try {
        await deleteSolution(id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("REFERENCE") || msg.includes("FK_")) {
          return next(
            Conflict(
              "Không thể xóa giải pháp đã được sử dụng trong bài khảo sát"
            )
          );
        }
        throw err;
      }

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "DELETE_SOLUTION",
        entityType: "Solution",
        entityId: String(id),
        payload: { code: existing.Code, industryId: existing.IndustryId }
      });

      return ok(res, { id, message: "Đã xóa giải pháp" });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/admin/solution-dependencies ---
const CreateDependencySchema = z
  .object({
    solutionId: z.number().int().positive(),
    dependsOnSolutionId: z.number().int().positive(),
    note: z.string().trim().max(500).nullable().optional()
  })
  .refine((d) => d.solutionId !== d.dependsOnSolutionId, {
    message: "Giải pháp không thể phụ thuộc vào chính nó",
    path: ["dependsOnSolutionId"]
  });

router.post(
  "/solution-dependencies",
  validate(CreateDependencySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof CreateDependencySchema>;

      const sol = await findSolutionById(body.solutionId);
      if (!sol) return next(NotFound("Không tìm thấy giải pháp gốc"));
      const dep = await findSolutionById(body.dependsOnSolutionId);
      if (!dep) return next(NotFound("Không tìm thấy giải pháp phụ thuộc"));

      try {
        const row = await createSolutionDependency({
          solutionId: body.solutionId,
          dependsOnSolutionId: body.dependsOnSolutionId,
          note: body.note ?? null
        });

        await writeAudit({
          actorUserId: req.user?.userId,
          action: "CREATE_SOLUTION_DEPENDENCY",
          entityType: "SolutionDependency",
          entityId: String(row.Id),
          payload: body as unknown as Record<string, unknown>
        });

        return created(res, {
          id: row.Id,
          solutionId: row.SolutionId,
          dependsOnSolutionId: row.DependsOnSolutionId,
          note: row.Note
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("UX_SD")) {
          return next(Conflict("Phụ thuộc này đã tồn tại"));
        }
        if (msg.includes("CK_SD_NoSelf")) {
          return next(
            UnprocessableEntity("Giải pháp không thể phụ thuộc vào chính nó")
          );
        }
        throw err;
      }
    } catch (err) {
      return next(err);
    }
  }
);

// --- DELETE /api/admin/solution-dependencies/:id ---
router.delete(
  "/solution-dependencies/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return next(BadRequest("ID phụ thuộc không hợp lệ"));

      const existing = await findSolutionDependencyById(id);
      if (!existing) return next(NotFound("Không tìm thấy phụ thuộc"));

      await deleteSolutionDependency(id);

      await writeAudit({
        actorUserId: req.user?.userId,
        action: "DELETE_SOLUTION_DEPENDENCY",
        entityType: "SolutionDependency",
        entityId: String(id),
        payload: {
          solutionId: existing.SolutionId,
          dependsOnSolutionId: existing.DependsOnSolutionId
        }
      });

      return ok(res, { id, message: "Đã xóa phụ thuộc" });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
