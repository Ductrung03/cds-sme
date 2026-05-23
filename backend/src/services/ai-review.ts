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

export interface AiReviewResult {
  suggestion: string;       // Gợi ý phân loại / nhận xét ngắn
  confidence: number;       // 0–1
  isRelevant: boolean;      // Câu trả lời có liên quan đến câu hỏi không
}

// -------------------------------------------------------------------
// Heuristic (không cần API key — fallback an toàn)
// -------------------------------------------------------------------
function heuristicReview(input: AiReviewInput): AiReviewResult {
  const text = input.answerText.trim().toLowerCase();
  const isRelevant = text.length > 5;
  const optionTexts = input.availableOptions.map((o) => o.content.toLowerCase());

  let closestOption: string | null = null;
  let bestScore = 0;
  for (const opt of optionTexts) {
    const words = opt.split(/\s+/);
    const matches = words.filter((w) => text.includes(w)).length;
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) {
      bestScore = score;
      closestOption = opt;
    }
  }

  if (!isRelevant) {
    return {
      suggestion: "Câu trả lời quá ngắn hoặc không rõ nghĩa",
      confidence: 0.3,
      isRelevant: false,
    };
  }

  if (closestOption && bestScore > 0.3) {
    return {
      suggestion: `Có thể phân loại vào: "${closestOption}"`,
      confidence: Math.min(0.9, bestScore + 0.3),
      isRelevant: true,
    };
  }

  return {
    suggestion: "Câu trả lời có vẻ liên quan nhưng không khớp với các lựa chọn sẵn có",
    confidence: 0.5,
    isRelevant: true,
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

Các lựa chọn đáp án có sẵn:
${optionsList}

Đáp án "Khác" mà doanh nghiệp tự nhập: "${input.answerText}"

Nhiệm vụ:
1. Đánh giá xem đáp án có liên quan đến câu hỏi không (isRelevant: true/false).
2. Nếu có thể, gợi ý đáp án nào trong danh sách trên phù hợp nhất với câu trả lời này.
3. Đưa ra mức độ tin cậy từ 0.0 đến 1.0.

Trả lời CHÍNH XÁC theo định dạng JSON sau, không thêm gì khác:
{
  "isRelevant": true,
  "suggestion": "Có thể phân loại vào [mã đáp án] - [tên đáp án] vì [lý do ngắn gọn]",
  "confidence": 0.85
}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
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
      isRelevant?: boolean;
      suggestion?: string;
      confidence?: number;
    };

    return {
      isRelevant: parsed.isRelevant ?? true,
      suggestion: parsed.suggestion ?? "Không có gợi ý",
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
Trả lời CHÍNH XÁC theo JSON: {"isRelevant": bool, "suggestion": "string", "confidence": float 0-1}`;

  const userMsg = `Câu hỏi: "${input.questionContent}"
Đáp án có sẵn:\n${optionsList}
Đáp án "Khác": "${input.answerText}"`;

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
      isRelevant?: boolean;
      suggestion?: string;
      confidence?: number;
    };

    return {
      isRelevant: parsed.isRelevant ?? true,
      suggestion: parsed.suggestion ?? "Không có gợi ý",
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
