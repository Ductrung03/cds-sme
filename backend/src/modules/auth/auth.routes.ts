import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { findUserByEmail, createUser } from "../../db/repository";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ok, created, fail } from "../../utils/api-response";
import { writeAudit } from "../../services/audit";
import type { JwtPayload } from "../../middleware/auth";

const router = Router();

// --- Schemas ---
const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
  matKhau: z.string().optional() // frontend sends matKhau
}).transform(data => ({
  email: data.email,
  password: data.password || data.matKhau || ""
}));

// --- POST /api/auth/login ---
router.post(
  "/login",
  validate(LoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as z.infer<typeof LoginSchema>;

      const user = await findUserByEmail(email);
      if (!user) {
        return fail(res, 401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
      }

      const valid = await bcrypt.compare(password, user.PasswordHash);
      if (!valid) {
        return fail(res, 401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
      }

      const payload: JwtPayload = {
        userId: user.Id,
        email: user.Email,
        role: user.Role
      };

      const token = jwt.sign(payload as object, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      } as jwt.SignOptions);

      await writeAudit({
        actorUserId: user.Id,
        action: "LOGIN",
        entityType: "User",
        entityId: user.Id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] ?? undefined
      });

      return ok(res, {
        token,
        user: {
          id: user.Id,
          email: user.Email,
          fullName: user.FullName,
          role: user.Role,
          organizationName: user.OrganizationName,
          phone: user.Phone
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- POST /api/auth/register ---
const RegisterSchema = z
  .object({
    email: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự").max(128).optional(),
    matKhau: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự").max(128).optional(),
    fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(255).optional(),
    hoTen: z.string().trim().min(1, "Vui lòng nhập họ tên").max(255).optional(),
    phone: z.string().trim().max(30).optional(),
    soDienThoai: z.string().trim().max(30).optional(),
    organizationName: z.string().trim().max(255).optional(),
    tenDoanhnghiep: z.string().trim().max(255).optional()
  })
  .transform((data) => ({
    email: data.email.trim().toLowerCase(),
    password: data.password ?? data.matKhau ?? "",
    fullName: (data.fullName ?? data.hoTen ?? "").trim(),
    phone: (data.phone ?? data.soDienThoai ?? "").trim() || null,
    organizationName:
      (data.organizationName ?? data.tenDoanhnghiep ?? "").trim() || null
  }))
  .refine((d) => d.password.length >= 8, {
    message: "Mật khẩu cần ít nhất 8 ký tự",
    path: ["password"]
  })
  .refine((d) => d.fullName.length > 0, {
    message: "Vui lòng nhập họ tên",
    path: ["fullName"]
  });

router.post(
  "/register",
  validate(RegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName, phone, organizationName } = req.body as z.infer<
        typeof RegisterSchema
      >;

      const existing = await findUserByEmail(email);
      if (existing) {
        return fail(
          res,
          409,
          "EMAIL_TAKEN",
          "Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập."
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await createUser({
        email,
        passwordHash,
        fullName,
        phone,
        organizationName,
        role: "user"
      });

      const payload: JwtPayload = {
        userId: user.Id,
        email: user.Email,
        role: user.Role
      };

      const token = jwt.sign(payload as object, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
      } as jwt.SignOptions);

      await writeAudit({
        actorUserId: user.Id,
        action: "REGISTER",
        entityType: "User",
        entityId: user.Id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] ?? undefined
      });

      return created(res, {
        token,
        user: {
          id: user.Id,
          email: user.Email,
          fullName: user.FullName,
          role: user.Role,
          organizationName: user.OrganizationName,
          phone: user.Phone
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

// --- GET /api/auth/me ---
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response) => {
    const { user } = req;
    if (!user) {
      return fail(res, 401, "UNAUTHORIZED", "Bạn cần đăng nhập");
    }
    const { findUserById } = await import("../../db/repository");
    const u = await findUserById(user.userId);
    if (!u) {
      return fail(res, 404, "USER_NOT_FOUND", "Người dùng không tồn tại");
    }
    return ok(res, {
      id: u.Id,
      email: u.Email,
      fullName: u.FullName,
      role: u.Role,
      organizationName: u.OrganizationName,
      phone: u.Phone
    });
  }
);

export default router;
