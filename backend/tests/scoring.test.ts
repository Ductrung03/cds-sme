import { describe, it, expect } from "vitest";
import {
  computeSolutionScore,
  normalizeTo100,
  rankScore,
  computeScore
} from "../src/services/scoring";
import type {
  AssessmentAnswerRow,
  AssessmentSolutionRow,
  AnswerOptionRow,
  RankThresholdRow,
  SolutionDependencyRow
} from "../src/types/models";

// --- Unit: computeSolutionScore ---
describe("computeSolutionScore (Phụ lục 3)", () => {
  it("trả về 1.0 nếu solution KHÔNG có dependency", () => {
    const deps = new Set<number>([2, 3]);
    expect(computeSolutionScore(1, deps)).toBe(1.0);
  });

  it("trả về 0.5 nếu solution CÓ dependency", () => {
    const deps = new Set<number>([1, 2, 3]);
    expect(computeSolutionScore(1, deps)).toBe(0.5);
  });

  it("trả về 1.0 với set dependency rỗng", () => {
    expect(computeSolutionScore(42, new Set())).toBe(1.0);
  });
});

// --- Unit: normalizeTo100 ---
describe("normalizeTo100", () => {
  it("0 -> 0", () => expect(normalizeTo100(0)).toBe(0));
  it("0.5 -> 50", () => expect(normalizeTo100(0.5)).toBe(50));
  it("1 -> 100", () => expect(normalizeTo100(1)).toBe(100));
  it("0.753 -> 75.3", () => expect(normalizeTo100(0.753)).toBe(75.3));
  it("không vượt quá 100", () => expect(normalizeTo100(2)).toBe(100));
  it("không dưới 0", () => expect(normalizeTo100(-0.5)).toBe(0));
});

// --- Unit: rankScore ---
describe("rankScore", () => {
  const ranks: RankThresholdRow[] = [
    { Id: 1, Level: 1, Code: "Y", Name: "Yếu", MinScore: 0, MaxScore: 20, Description: null },
    { Id: 2, Level: 2, Code: "TB", Name: "Trung bình", MinScore: 20.01, MaxScore: 40, Description: null },
    { Id: 3, Level: 3, Code: "K", Name: "Khá", MinScore: 40.01, MaxScore: 60, Description: null },
    { Id: 4, Level: 4, Code: "T", Name: "Tốt", MinScore: 60.01, MaxScore: 80, Description: null },
    { Id: 5, Level: 5, Code: "XS", Name: "Xuất sắc", MinScore: 80.01, MaxScore: 100, Description: null }
  ];

  it("0 điểm -> Yếu (level 1)", () => {
    expect(rankScore(0, ranks)).toEqual({ level: 1, name: "Yếu" });
  });

  it("20 điểm -> Yếu", () => {
    expect(rankScore(20, ranks)).toEqual({ level: 1, name: "Yếu" });
  });

  it("20.01 điểm -> Trung bình", () => {
    expect(rankScore(20.01, ranks)).toEqual({ level: 2, name: "Trung bình" });
  });

  it("50 điểm -> Khá", () => {
    expect(rankScore(50, ranks)).toEqual({ level: 3, name: "Khá" });
  });

  it("75 điểm -> Tốt", () => {
    expect(rankScore(75, ranks)).toEqual({ level: 4, name: "Tốt" });
  });

  it("95 điểm -> Xuất sắc", () => {
    expect(rankScore(95, ranks)).toEqual({ level: 5, name: "Xuất sắc" });
  });

  it("100 điểm -> Xuất sắc", () => {
    expect(rankScore(100, ranks)).toEqual({ level: 5, name: "Xuất sắc" });
  });

  it("fallback khi không khớp ngưỡng nào", () => {
    const empty: RankThresholdRow[] = [];
    expect(rankScore(50, empty)).toEqual({ level: 1, name: "Chưa xếp hạng" });
  });
});

// --- Integration-style: computeScore ---
describe("computeScore", () => {
  const ranks: RankThresholdRow[] = [
    { Id: 1, Level: 1, Code: "Y", Name: "Yếu", MinScore: 0, MaxScore: 20, Description: null },
    { Id: 2, Level: 2, Code: "TB", Name: "Trung bình", MinScore: 20.01, MaxScore: 40, Description: null },
    { Id: 3, Level: 3, Code: "K", Name: "Khá", MinScore: 40.01, MaxScore: 60, Description: null },
    { Id: 4, Level: 4, Code: "T", Name: "Tốt", MinScore: 60.01, MaxScore: 80, Description: null },
    { Id: 5, Level: 5, Code: "XS", Name: "Xuất sắc", MinScore: 80.01, MaxScore: 100, Description: null }
  ];

  it("tính điểm khi tất cả câu trả lời đều đạt max và tất cả giải pháp không dependency", () => {
    const answers: AssessmentAnswerRow[] = [
      { Id: 1, AssessmentId: "A", QuestionId: 1, OptionId: 101, OtherText: null, OpenText: null, CreatedAt: "" },
      { Id: 2, AssessmentId: "A", QuestionId: 2, OptionId: 102, OtherText: null, OpenText: null, CreatedAt: "" },
    ];

    const options: AnswerOptionRow[] = [
      { Id: 101, QuestionId: 1, Code: "E", Content: "Đã triển khai hoàn thiện", Score: 1, IsOther: false, SortOrder: 4 },
      { Id: 102, QuestionId: 2, Code: "E", Content: "Đã triển khai hoàn thiện", Score: 1, IsOther: false, SortOrder: 4 },
    ];

    const solutions: AssessmentSolutionRow[] = [
      { Id: 1, AssessmentId: "A", SolutionId: 1, IsSelected: true, AdminScore: null, Note: null },
      { Id: 2, AssessmentId: "A", SolutionId: 2, IsSelected: true, AdminScore: null, Note: null },
    ];

    const deps: SolutionDependencyRow[] = []; // không dependency nào

    const result = computeScore(answers, options, solutions, deps, ranks, new Map([[1, 2]]));

    // answerNorm = (1+1)/2 = 1 -> *0.7 = 0.7
    // solutionNorm = (1+1)/2 = 1 -> *0.3 = 0.3
    // rawScore = 1.0 -> normalized = 100 -> rank 5 (Xuất sắc)
    expect(result.normalizedScore).toBe(100);
    expect(result.rankLevel).toBe(5);
    expect(result.rankName).toBe("Xuất sắc");
  });

  it("tính điểm khi tất cả đạt 0 và giải pháp có dependency", () => {
    const answers: AssessmentAnswerRow[] = [
      { Id: 1, AssessmentId: "B", QuestionId: 1, OptionId: 201, OtherText: null, OpenText: null, CreatedAt: "" },
    ];

    const options: AnswerOptionRow[] = [
      { Id: 201, QuestionId: 1, Code: "A", Content: "Chưa triển khai", Score: 0, IsOther: false, SortOrder: 0 },
    ];

    const solutions: AssessmentSolutionRow[] = [
      { Id: 3, AssessmentId: "B", SolutionId: 1, IsSelected: true, AdminScore: null, Note: null },
      { Id: 4, AssessmentId: "B", SolutionId: 2, IsSelected: true, AdminScore: null, Note: null },
    ];

    const deps: SolutionDependencyRow[] = [
      { Id: 1, SolutionId: 1, DependsOnSolutionId: 2, Note: null },
    ];

    const result = computeScore(answers, options, solutions, deps, ranks, new Map([[1, 1]]));

    // answerNorm = 0/1 = 0 -> *0.7 = 0
    // solution 1 has dep -> 0.5, solution 2 no dep -> 1.0, total = 1.5 / 2 = 0.75
    // solutionNorm = 0.75 -> *0.3 = 0.225
    // rawScore = 0.225 -> normalized = 22.5 -> rank 2 (Trung bình)
    expect(result.normalizedScore).toBe(22.5);
    expect(result.rankLevel).toBe(2);
    expect(result.rankName).toBe("Trung bình");
  });

  it("solution KHÔNG được chọn thì không tính điểm", () => {
    const answers: AssessmentAnswerRow[] = [
      { Id: 1, AssessmentId: "C", QuestionId: 1, OptionId: 301, OtherText: null, OpenText: null, CreatedAt: "" },
    ];

    const options: AnswerOptionRow[] = [
      { Id: 301, QuestionId: 1, Code: "E", Content: "Hoàn thiện", Score: 1, IsOther: false, SortOrder: 4 },
    ];

    const solutions: AssessmentSolutionRow[] = [
      { Id: 5, AssessmentId: "C", SolutionId: 1, IsSelected: false, AdminScore: null, Note: null },
      { Id: 6, AssessmentId: "C", SolutionId: 2, IsSelected: false, AdminScore: null, Note: null },
    ];

    const deps: SolutionDependencyRow[] = [];

    const result = computeScore(answers, options, solutions, deps, ranks, new Map([[1, 1]]));

    // answerNorm = 1.0 -> *0.7 = 0.7
    // solutionNorm = 0/2 = 0 -> *0.3 = 0
    // rawScore = 0.7 -> normalized = 70 -> rank 4 (Tốt)
    expect(result.normalizedScore).toBe(70);
    expect(result.rankLevel).toBe(4);
  });

  it("answer không có OptionId thì bỏ qua", () => {
    const answers: AssessmentAnswerRow[] = [
      { Id: 1, AssessmentId: "D", QuestionId: 1, OptionId: null, OtherText: "Không có ý kiến", OpenText: null, CreatedAt: "" },
    ];

    const options: AnswerOptionRow[] = [];

    const solutions: AssessmentSolutionRow[] = [
      { Id: 7, AssessmentId: "D", SolutionId: 1, IsSelected: true, AdminScore: null, Note: null },
    ];

    const deps: SolutionDependencyRow[] = [];

    const result = computeScore(answers, options, solutions, deps, ranks, new Map([[1, 1]]));

    // answerNorm = 0 (không có option) -> *0.7 = 0
    // solutionNorm = 1/1 = 1 -> *0.3 = 0.3
    // rawScore = 0.3 -> normalized = 30 -> rank 2 (Trung bình)
    expect(result.normalizedScore).toBe(30);
    expect(result.rankLevel).toBe(2);
  });
});
