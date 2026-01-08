import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

/**
 * Analyze dream content using LLM
 */
export async function analyzeDream(dreamContent: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的梦境分析师，精通心理学和梦境解析。请分析用户的梦境内容，提供以下三个方面的解读：
1. 象征意义：梦中出现的主要元素和符号的象征含义
2. 情感分析：梦境反映的情绪状态和心理感受
3. 心理学解读：从心理学角度分析梦境可能反映的潜意识内容

请用温和、专业的语气，避免过于绝对的判断，提供有启发性的解读。每个部分控制在100-150字。`,
      },
      {
        role: "user",
        content: `请分析这个梦境：\n\n${dreamContent}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "dream_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            symbolism: {
              type: "string",
              description: "梦境中主要元素的象征意义",
            },
            emotionalAnalysis: {
              type: "string",
              description: "梦境反映的情感状态分析",
            },
            psychologicalInsight: {
              type: "string",
              description: "从心理学角度的解读",
            },
          },
          required: ["symbolism", "emotionalAnalysis", "psychologicalInsight"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to get analysis from LLM");
  }

  return JSON.parse(content) as {
    symbolism: string;
    emotionalAnalysis: string;
    psychologicalInsight: string;
  };
}

/**
 * Generate image for dream based on description
 */
export async function generateDreamImage(dreamTitle: string, dreamContent: string) {
  // Create a concise prompt for image generation
  const prompt = `A dreamlike, surreal scene: ${dreamTitle}. ${dreamContent.substring(0, 200)}. Artistic, ethereal, magazine quality photography.`;

  const result = await generateImage({
    prompt,
  });

  return {
    url: result.url,
  };
}
