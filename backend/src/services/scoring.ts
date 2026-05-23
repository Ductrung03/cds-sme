// ===================================================================
// scoring.ts — Dịch vụ tính điểm TOPSIS & Phụ lục 3
// ===================================================================
// Phụ lục 3 rule:
//   - Nếu solution có dependency (tồn tại trong SolutionDependencies với
//     vai trò solution được dependency) → điểm giải pháp = 0.5
//   - Ngược lại → điểm giải pháp = 1.0
//   - KHÔNG xét đã chọn giải pháp nền hay chưa.
// TOPSIS:
//   - Điểm thô = avg(các câu nhóm 1-6) * 70% + avg(giải pháp) * 30%
//   - Chuẩn hóa 0-100, xếp hạng 5 cấp theo RankThresholds
// ===================================================================

import type {
  AssessmentAnswerRow,
  AssessmentSolutionRow,
  AnswerOptionRow,
  RankThresholdRow,
  SolutionDependencyRow
} from "../types/models";

export interface GroupScoreDetail {
  groupId: number;
  groupName: string;
  weight: number;
  questions: number;
  answered: number;
  rawScore: number;
  maxScore: number;
  normalizedGroupScore: number;
}

export interface SolutionScoreDetail {
  solutionId: number;
  solutionCode: string;
  solutionName: string;
  hasDependency: boolean;
  score: number; // 0.5 hoặc 1.0
}

export interface ScoringResult {
  groupBreakdown: GroupScoreDetail[];
  solutionBreakdown: SolutionScoreDetail[];
  rawScore: number; // 0..1
  solutionScore: number; // 0..1
  topsisScore: number; // C* closeness coefficient
  normalizedScore: number; // 0..100
  rankLevel: number;
  rankName: string;
  details: Record<string, unknown>;
}

// Trọng số chung giữa nhóm 1-6 và nhóm 7
const GROUP_WEIGHT = 0.70;
const SOLUTION_WEIGHT = 0.30;

/**
 * Tính điểm cho một assessment đã có đầy đủ câu trả lời và giải pháp.
 */
export const computeScore = (
  answers: AssessmentAnswerRow[],
  options: AnswerOptionRow[],
  solutions: AssessmentSolutionRow[],
  solutionDeps: SolutionDependencyRow[],
  ranks: RankThresholdRow[],
  groupQuestionCounts: Map<number, number> // groupId -> total questions
): ScoringResult => {
  // --- 1. Điểm nhóm 1-6 từ câu trả lời ---
  const optionMap = new Map<number, AnswerOptionRow>();
  for (const o of options) optionMap.set(o.Id, o);

  // Nhóm theo group (từ options)
  const groupScores = new Map<number, { sum: number; count: number }>();
  const groupAnswered = new Map<number, number>();

  const answerMap = new Map<number, AssessmentAnswerRow>();
  for (const a of answers) answerMap.set(a.QuestionId, a);

  for (const o of options) {
    // Tìm group cho question → sẽ join từ question nên không có ở đây
    // Thay vào đó, ta sẽ nhận group từ mapping bên ngoài
  }

  // Phần này sẽ được điền khi có dữ liệu đầy đủ
  // Tạm thời để hàm cho test

  // --- 2. Điểm giải pháp (Phụ lục 3) ---
  const solutionDepSet = new Set<number>();
  for (const d of solutionDeps) {
    solutionDepSet.add(d.SolutionId);
  }

  const solutionBreakdown: SolutionScoreDetail[] = solutions.map((s) => {
    const hasDep = solutionDepSet.has(s.SolutionId);
    return {
      solutionId: s.SolutionId,
      solutionCode: "",
      solutionName: "",
      hasDependency: hasDep,
      score: s.IsSelected ? (hasDep ? 0.5 : 1.0) : 0
    };
  });

  // --- 3. Điểm nhóm 1-6 (answer-based) ---
  const maxPossibleSolutions = solutions.filter((s) => s.IsSelected).length || 1;
  const totalSolutionScore = solutionBreakdown.reduce((sum, s) => sum + s.score, 0);
  const solutionNorm = totalSolutionScore / maxPossibleSolutions;

  // Điểm nhóm 1-6 từ câu trả lời
  let answeredCount = 0;
  let totalAnswerScore = 0;

  for (const answer of answers) {
    if (answer.OptionId) {
      const opt = optionMap.get(answer.OptionId);
      if (opt) {
        totalAnswerScore += opt.Score;
        answeredCount++;
      }
    }
  }

  const answerNorm = answeredCount > 0 ? totalAnswerScore / answeredCount : 0;

  // --- 4. Raw score ---
  const rawScore =
    answerNorm * GROUP_WEIGHT + solutionNorm * SOLUTION_WEIGHT;

  // --- 5. TOPSIS  ---
  // Trong context đơn đánh giá, C* = rawScore (vì chỉ có 1 phương án)
  const topsisScore = rawScore;
  const normalizedScore = Math.round(rawScore * 100 * 100) / 100; // 2 decimal

  // --- 6. Xếp hạng ---
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

  // --- 7. Group breakdown ---
  const groupBreakdown: GroupScoreDetail[] = [];

  return {
    groupBreakdown,
    solutionBreakdown,
    rawScore,
    solutionScore: solutionNorm,
    topsisScore,
    normalizedScore,
    rankLevel,
    rankName,
    details: {
      answerNorm,
      solutionNorm,
      totalAnswers: answers.length,
      answeredCount,
      totalSolutions: solutions.length,
      selectedSolutions: solutions.filter((s) => s.IsSelected).length
    }
  };
};

/**
 * Dựa trên Phụ lục 3: giải pháp có dependency thì điểm = 0.5, ngược lại = 1.
 */
export const computeSolutionScore = (
  solutionId: number,
  dependencyIds: Set<number>
): number => {
  return dependencyIds.has(solutionId) ? 0.5 : 1.0;
};

/**
 * Chuẩn hóa điểm về thang 0-100.
 */
export const normalizeTo100 = (rawScore: number): number => {
  return Math.min(100, Math.max(0, Math.round(rawScore * 100 * 100) / 100));
};

/**
 * Xếp hạng dựa trên ngưỡng.
 */
export const rankScore = (
  normalizedScore: number,
  ranks: RankThresholdRow[]
): { level: number; name: string } => {
  const sorted = [...ranks].sort((a, b) => a.Level - b.Level);
  for (const r of sorted) {
    if (normalizedScore >= r.MinScore && normalizedScore <= r.MaxScore) {
      return { level: r.Level, name: r.Name };
    }
  }
  return { level: 1, name: "Chưa xếp hạng" };
};
