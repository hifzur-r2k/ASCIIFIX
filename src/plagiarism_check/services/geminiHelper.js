const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkWithGeminiExplained(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an AI content detection expert. Analyze this text and respond ONLY with valid JSON:

{
  "probability": [number 0-100],
  "explanation": "[2-3 specific signals you found]",
  "confidence": "[High/Medium/Low]"
}

Key AI signals to look for:
- Repetitive sentence structures
- Academic buzzwords without context
- Perfect grammar with no personality
- Generic transitions (furthermore, moreover, etc.)
- Lack of personal experience or specific examples

Text to analyze:
"""${text.substring(0, 800)}"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch);

    // Validate and sanitize
    const probability = Math.max(0, Math.min(100, parseInt(parsed.probability) || 50));
    const explanation = parsed.explanation || "Analysis unavailable";
    const confidence = parsed.confidence || "Medium";

    return {
      probability,
      explanation,
      confidence,
      source: "gemini-explained"
    };

  } catch (error) {
    console.error("❌ Gemini explanation error:", error.message);
    return {
      probability: 50,
      explanation: "Unable to provide explanation due to processing error.",
      confidence: "Low",
      source: "fallback"
    };
  }
}

// Keep your original function for compatibility
async function checkWithGemini(text) {
  const result = await checkWithGeminiExplained(text);
  return result.probability;
}

module.exports = { checkWithGemini, checkWithGeminiExplained };
