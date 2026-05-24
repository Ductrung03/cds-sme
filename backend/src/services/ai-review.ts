// ===================================================================
// AiReviewService — Đánh giá đáp án "Khác"
// Providers: heuristic (fallback) | gemini (Google AI Studio) | openai
// ===================================================================

import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface AiReviewInput {
  questionContent: string;
  answerText: string;
  availableOptions: { code: string; content: string }[];
}

/**
 * Phân loại đánh giá AI cho đáp án "Khác":
 * - "not_relevant": Câu trả lời không phù hợp với câu hỏi.
 * - "matches_option": Phù hợp với câu hỏi và có thể quy về một đáp án có sẵn trong danh sách.
 * - "relevant_but_no_match": Có liên quan tới câu hỏi nhưng không khớp với đáp án nào có sẵn.
 */
export type AiReviewVerdict = "not_relevant" | "matches_option" | "relevant_but_no_match";

export interface AiReviewResult {
  suggestion: string;       // Gợi ý phân loại / nhận xét ngắn (đã chuẩn hoá tiếng Việt)
  confidence: number;       // 0–1
  isRelevant: boolean;      // Câu trả lời có liên quan đến câu hỏi không
  verdict: AiReviewVerdict; // Phân loại rõ 3 nhóm
  matchedOptionCode?: string;    // Mã đáp án phù hợp (nếu verdict = matches_option)
  matchedOptionContent?: string; // Nội dung đáp án phù hợp (nếu verdict = matches_option)
  reason?: string;          // Giải thích ngắn vì sao phù hợp / không phù hợp
}

// -------------------------------------------------------------------
// Heuristic (không cần API key — fallback an toàn)
// -------------------------------------------------------------------
function heuristicReview(input: AiReviewInput): AiReviewResult {
  const text = input.answerText.trim().toLowerCase();
  const isRelevant = text.length > 5;

  let bestOption: { code: string; content: string } | null = null;
  let bestScore = 0;
  for (const opt of input.availableOptions) {
    const optText = opt.content.toLowerCase();
    const words = optText.split(/\s+/).filter((w) => w.length > 1);
    const matches = words.filter((w) => text.includes(w)).length;
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) {
      bestScore = score;
      bestOption = opt;
    }
  }

  if (!isRelevant) {
    return {
      suggestion: "Câu trả lời không phù hợp với câu hỏi (quá ngắn hoặc không rõ nghĩa).",
      confidence: 0.3,
      isRelevant: false,
      verdict: "not_relevant",
      reason: "Nội dung quá ngắn hoặc không có thông tin rõ ràng để đối chiếu với câu hỏi.",
    };
  }

  if (bestOption && bestScore > 0.3) {
    return {
      suggestion: `Phù hợp — có thể tính tương đương đáp án [${bestOption.code}] ${bestOption.content}.`,
      confidence: Math.min(0.9, bestScore + 0.3),
      isRelevant: true,
      verdict: "matches_option",
      matchedOptionCode: bestOption.code,
      matchedOptionContent: bestOption.content,
      reason: `Nội dung trùng khớp nhiều từ khoá với đáp án "${bestOption.content}".`,
    };
  }

  return {
    suggestion: "Có liên quan tới câu hỏi nhưng không khớp với đáp án nào trong danh sách.",
    confidence: 0.5,
    isRelevant: true,
    verdict: "relevant_but_no_match",
    reason: "Không tìm thấy đáp án nào trong danh sách có nghĩa tương đương rõ rệt.",
  };
}

// -------------------------------------------------------------------
// Gemini — Google AI Studio
// -------------------------------------------------------------------
async function geminiReview(input: AiReviewInput): Promise<AiReviewResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY chưa cấu hình, dùng heuristic fallback");
    return heuristicReview(input);
  }

  const model = env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const optionsList = input.availableOptions
    .map((o, i) => `${i + 1}. [${o.code}] ${o.content}`)
    .join("\n");

  const prompt = `Bạn là chuyên gia đánh giá chuyển đổi số cho doanh nghiệp vừa và nhỏ (SME) tại Việt Nam.

Câu hỏi khảo sát: "${input.questionContent}"

Các lựa chọn đáp án có sẵn (dùng đúng mã trong [] khi tham chiếu):
${optionsList}

Đáp án "Khác" mà doanh nghiệp tự nhập: "${input.answerText}"

Nhiệm vụ:
Phân loại đáp án "Khác" thành CHÍNH XÁC một trong ba trường hợp sau và trả về kết quả:

1. "not_relevant" — Đáp án KHÔNG phù hợp với câu hỏi:
   - Nội dung lạc đề, vô nghĩa, spam, hoặc không liên quan tới chủ đề câu hỏi.
   - Khi đó: matchedOptionCode = null.

2. "matches_option" — Đáp án PHÙ HỢP với câu hỏi và có thể TÍNH TƯƠNG ĐƯƠNG với MỘT đáp án trong danh sách:
   - Nội dung doanh nghiệp nhập về bản chất giống một đáp án có sẵn (cùng nghĩa, cùng mức độ).
   - Khi đó: matchedOptionCode = mã của đáp án phù hợp nhất, matchedOptionContent = nội dung đáp án đó.

3. "relevant_but_no_match" — Đáp án PHÙ HỢP với câu hỏi nhưng KHÔNG khớp với đáp án nào có sẵn:
   - Đúng chủ đề nhưng nội dung khác biệt rõ rệt với mọi đáp án trong danh sách.
   - Khi đó: matchedOptionCode = null.

Trả lời CHÍNH XÁC theo định dạng JSON sau, không thêm bất cứ gì khác (không markdown, không giải thích ngoài JSON):
{
  "verdict": "not_relevant" | "matches_option" | "relevant_but_no_match",
  "isRelevant": true | false,
  "matchedOptionCode": "MÃ_ĐÁP_ÁN hoặc null",
  "matchedOptionContent": "Nội dung đáp án hoặc null",
  "reason": "Giải thích ngắn gọn (1-2 câu) bằng tiếng Việt",
  "suggestion": "Câu gợi ý ngắn gọn bằng tiếng Việt cho admin",
  "confidence": 0.0
}

Quy tắc:
- isRelevant = false KHI VÀ CHỈ KHI verdict = "not_relevant".
- matchedOptionCode chỉ có giá trị khi verdict = "matches_option" và phải nằm trong danh sách mã đáp án trên.
- suggestion là câu ngắn gọn để admin nhìn vào hiểu ngay (ví dụ: "Phù hợp — có thể tính tương đương đáp án [DA01] ..." hoặc "Không phù hợp với câu hỏi.").
- confidence ∈ [0.0, 1.0].`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ status: response.status, body: errBody }, "Gemini API lỗi");
      return heuristicReview(input);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON từ response (có thể có markdown code block)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn({ rawText }, "Gemini không trả JSON hợp lệ");
      return heuristicReview(input);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      verdict?: string;
      isRelevant?: boolean;
      matchedOptionCode?: string | null;
      matchedOptionContent?: string | null;
      reason?: string;
      suggestion?: string;
      confidence?: number;
    };

    // Chuẩn hoá verdict
    const allowedVerdicts: AiReviewVerdict[] = ["not_relevant", "matches_option", "relevant_but_no_match"];
    let verdict: AiReviewVerdict = allowedVerdicts.includes(parsed.verdict as AiReviewVerdict)
      ? (parsed.verdict as AiReviewVerdict)
      : (parsed.isRelevant === false ? "not_relevant" : "relevant_but_no_match");

    // Map matched option về đúng option trong danh sách (chống AI bịa)
    let matchedOptionCode: string | undefined;
    let matchedOptionContent: string | undefined;
    if (verdict === "matches_option" && parsed.matchedOptionCode) {
      const found = input.availableOptions.find(
        (o) => o.code.toLowerCase() === String(parsed.matchedOptionCode).toLowerCase()
      );
      if (found) {
        matchedOptionCode = found.code;
        matchedOptionContent = found.content;
      } else {
        // AI trả mã không tồn tại → hạ verdict
        verdict = "relevant_but_no_match";
      }
    }

    const isRelevant = verdict !== "not_relevant";

    const defaultSuggestion = (() => {
      switch (verdict) {
        case "not_relevant":
          return "Không phù hợp với câu hỏi.";
        case "matches_option":
          return matchedOptionCode && matchedOptionContent
            ? `Phù hợp — có thể tính tương đương đáp án [${matchedOptionCode}] ${matchedOptionContent}.`
            : "Phù hợp với một đáp án trong danh sách.";
        default:
          return "Có liên quan tới câu hỏi nhưng không khớp với đáp án nào có sẵn.";
      }
    })();

    return {
      verdict,
      isRelevant,
      matchedOptionCode,
      matchedOptionContent,
      reason: parsed.reason?.trim() || undefined,
      suggestion: parsed.suggestion?.trim() || defaultSuggestion,
      confidence: typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.7,
    };
  } catch (err) {
    logger.error({ err }, "Gemini review thất bại, dùng heuristic fallback");
    return heuristicReview(input);
  }
}

// -------------------------------------------------------------------
// OpenAI provider (giữ nguyên logic cũ)
// -------------------------------------------------------------------
async function openaiReview(input: AiReviewInput): Promise<AiReviewResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY chưa cấu hình, dùng heuristic fallback");
    return heuristicReview(input);
  }

  const optionsList = input.availableOptions
    .map((o) => `- [${o.code}] ${o.content}`)
    .join("\n");

  const systemPrompt = `Bạn là chuyên gia đánh giá câu trả lời khảo sát chuyển đổi số SME Việt Nam.
Phân loại đáp án "Khác" thành CHÍNH XÁC một trong 3 verdict:
- "not_relevant": không phù hợp với câu hỏi.
- "matches_option": phù hợp và tương đương MỘT đáp án có sẵn (kèm mã đáp án).
- "relevant_but_no_match": có liên quan nhưng không khớp đáp án nào.
Chỉ trả JSON: {"verdict": str, "isRelevant": bool, "matchedOptionCode": str|null, "matchedOptionContent": str|null, "reason": str, "suggestion": str (tiếng Việt ngắn), "confidence": float 0-1}.
isRelevant = false KHI VÀ CHỈ KHI verdict = "not_relevant". matchedOptionCode chỉ có giá trị khi verdict = "matches_option" và phải thuộc danh sách mã đáp án được cho.`;

  const userMsg = `Câu hỏi: "${input.questionContent}"
Đáp án có sẵn:\n${optionsList}
Đáp án "Khác" doanh nghiệp tự nhập: "${input.answerText}"`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "OpenAI API lỗi");
      return heuristicReview(input);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      verdict?: string;
      isRelevant?: boolean;
      matchedOptionCode?: string | null;
      matchedOptionContent?: string | null;
      reason?: string;
      suggestion?: string;
      confidence?: number;
    };

    const allowedVerdicts: AiReviewVerdict[] = ["not_relevant", "matches_option", "relevant_but_no_match"];
    let verdict: AiReviewVerdict = allowedVerdicts.includes(parsed.verdict as AiReviewVerdict)
      ? (parsed.verdict as AiReviewVerdict)
      : (parsed.isRelevant === false ? "not_relevant" : "relevant_but_no_match");

    let matchedOptionCode: string | undefined;
    let matchedOptionContent: string | undefined;
    if (verdict === "matches_option" && parsed.matchedOptionCode) {
      const found = input.availableOptions.find(
        (o) => o.code.toLowerCase() === String(parsed.matchedOptionCode).toLowerCase()
      );
      if (found) {
        matchedOptionCode = found.code;
        matchedOptionContent = found.content;
      } else {
        verdict = "relevant_but_no_match";
      }
    }

    const isRelevant = verdict !== "not_relevant";

    const defaultSuggestion =
      verdict === "not_relevant"
        ? "Không phù hợp với câu hỏi."
        : verdict === "matches_option" && matchedOptionCode && matchedOptionContent
        ? `Phù hợp — có thể tính tương đương đáp án [${matchedOptionCode}] ${matchedOptionContent}.`
        : "Có liên quan tới câu hỏi nhưng không khớp đáp án nào có sẵn.";

    return {
      verdict,
      isRelevant,
      matchedOptionCode,
      matchedOptionContent,
      reason: parsed.reason?.trim() || undefined,
      suggestion: parsed.suggestion?.trim() || defaultSuggestion,
      confidence: typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.7,
    };
  } catch (err) {
    logger.error({ err }, "OpenAI review thất bại, dùng heuristic fallback");
    return heuristicReview(input);
  }
}

// -------------------------------------------------------------------
// Factory
// -------------------------------------------------------------------
export interface AiReviewService {
  review(input: AiReviewInput): Promise<AiReviewResult>;
}

export function createAiReviewService(
  provider: "heuristic" | "openai" | "gemini" = "heuristic",
): AiReviewService {
  return {
    review: (input) => {
      switch (provider) {
        case "gemini":
          return geminiReview(input);
        case "openai":
          return openaiReview(input);
        default:
          return Promise.resolve(heuristicReview(input));
      }
    },
  };
}
