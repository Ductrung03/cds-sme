import { Router, type Request, type Response, type NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import {
  findActiveQuestionnaire,
  findQuestionGroups,
  findQuestionsByGroup,
  findAnswerOptions,
  findAllIndustries,
  findIndustryQuestions,
  findQuestionsByIds,
  findSolutionsByIndustry
} from "../../db/repository";
import { ok } from "../../utils/api-response";
import type { QuestionGroupRow, QuestionRow, AnswerOptionRow, SolutionRow } from "../../types/models";

const router = Router();

// GET /api/questionnaire/active
router.get(
  "/active",
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const qv = await findActiveQuestionnaire();
      if (!qv) {
        return ok(res, null);
      }

      const groups = await findQuestionGroups(qv.Id);
      const industries = await findAllIndustries();

      // Fetch questions per group
      const enrichedGroups: {
        id: number;
        groupNumber: number;
        name: string;
        description: string | null;
        weight: number;
        isOptional: boolean;
        isIndustrySpecific: boolean;
        questions: {
          id: number;
          code: string;
          content: string;
          questionType: string;
          allowOther: boolean;
          isOptional: boolean;
          maxScore: number;
          options: AnswerOptionRow[];
        }[];
      }[] = [];

      for (const g of groups) {
        if (g.IsIndustrySpecific) continue; // nhóm 7 xử lý riêng
        const questions = await findQuestionsByGroup(g.Id);
        const allQIds = questions.map((q) => q.Id);
        const allOptions =
          allQIds.length > 0
            ? await findAnswerOptions(allQIds[0]) // get one sample; we'll optimize later
            : [];

        // Build option map by question
        const qWithOptions = await Promise.all(
          questions.map(async (q) => {
            const opts = await findAnswerOptions(q.Id);
            return {
              id: q.Id,
              code: q.Code,
              content: q.Content,
              questionType: q.QuestionType,
              allowOther: q.AllowOther,
              isOptional: q.IsOptional,
              maxScore: q.MaxScore,
              options: opts
            };
          })
        );

        enrichedGroups.push({
          id: g.Id,
          groupNumber: g.GroupNumber,
          name: g.Name,
          description: g.Description,
          weight: g.Weight,
          isOptional: g.IsOptional,
          isIndustrySpecific: g.IsIndustrySpecific,
          questions: qWithOptions
        });
      }

      return ok(res, {
        questionnaire: {
          id: qv.Id,
          code: qv.Code,
          name: qv.Name,
          description: qv.Description
        },
        groups: enrichedGroups,
        industries: industries.map((i) => ({
          id: i.Id,
          code: i.Code,
          name: i.Name,
          description: i.Description
        }))
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/questionnaire/industry/:industryId
router.get(
  "/industry/:industryId",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const industryId = parseInt(req.params.industryId, 10);
      if (isNaN(industryId)) {
        return ok(res, { questions: [], solutions: [] });
      }

      // Industry questions (nhóm 7)
      const iqRows = await findIndustryQuestions(industryId);
      const qIds = iqRows.map((iq) => iq.QuestionId);
      const questions = await findQuestionsByIds(qIds);

      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => {
          const opts = await findAnswerOptions(q.Id);
          return {
            id: q.Id,
            code: q.Code,
            content: q.Content,
            questionType: q.QuestionType,
            allowOther: q.AllowOther,
            options: opts
          };
        })
      );

      // Solutions
      const solutions = await findSolutionsByIndustry(industryId);

      return ok(res, {
        questions: questionsWithOptions,
        solutions: solutions.map((s) => ({
          id: s.Id,
          code: s.Code,
          name: s.Name,
          description: s.Description
        }))
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
