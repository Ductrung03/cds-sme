import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { logger } from "./utils/logger";

// Routes
import { healthRouter } from "./modules/health/health.routes";
import authRoutes from "./modules/auth/auth.routes";
import questionnaireRoutes from "./modules/questionnaire/questionnaire.routes";
import assessmentRoutes from "./modules/assessment/assessment.routes";
import adminRoutes from "./modules/admin/admin.routes";
import adminQuestionsRoutes from "./modules/admin/admin.questions.routes";
import adminAppendixRoutes from "./modules/admin/admin.appendix.routes";
import adminScoreConfigRoutes from "./modules/admin/admin.score-config.routes";

const app = express();

// --- Security ---
app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === "production" ? undefined : false
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

// --- Body parsing ---
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// --- HTTP logging ---
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/health" },
    quietReqLogger: true
  })
);

// --- Trust proxy ---
app.set("trust proxy", 1);

// --- API Routes ---
app.get("/api/health", healthRouter);
app.use("/api/auth", authRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/assessments", assessmentRoutes);
// Mount sub-routers TRƯỚC admin.routes để tránh path collision
// (admin.routes có route /assessments/:id có thể nuốt các literal sau)
app.use("/api/admin", adminQuestionsRoutes);
app.use("/api/admin", adminAppendixRoutes);
app.use("/api/admin", adminScoreConfigRoutes);
app.use("/api/admin", adminRoutes);

// --- Error handling ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
