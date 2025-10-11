const AdvancedAIDetector = require('../services/aiDetector.cjs');
const aiDetector = new AdvancedAIDetector();
const rateLimit = require("express-rate-limit");
// Rate limiting for AI detection endpoint
const aiDetectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many AI detection requests, please try again later.",
    success: false,
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced controller with performance optimizations AND debug logging
const detectAIContent = async (req, res) => {
  console.log("🔍 Received request body:", req.body);
  console.log("🔍 Content-Type header:", req.headers["content-type"]);
  console.log("🔍 Method:", req.method);

  const startTime = Date.now();

  try {
    const { text } = req.body;

    // ✅ DEBUG LOGGING FOR TEXT
    console.log(
      "📝 Extracted text:",
      text ? `"${text.substring(0, 50)}..."` : "undefined/null"
    );

    // Input validation
    if (!text || typeof text !== "string") {
      console.log("❌ Validation failed: No text or wrong type");
      return res.status(400).json({
        error: "No text provided for AI detection or invalid format",
        success: false,
        details: "Text must be a non-empty string",
      });
    }

    const textLength = text.length;
    const wordCount = (text.match(/\b\w+\b/g) || []).length;

    console.log(`📊 Text stats - Length: ${textLength}, Words: ${wordCount}`);

    // Text length validation
    if (textLength > 200000) {
      // 200KB limit
      return res.status(400).json({
        error: "Text too long. Maximum 200,000 characters allowed.",
        success: false,
        provided: textLength,
        maximum: 200000,
      });
    }

    if (textLength < 10) {
      return res.status(400).json({
        error:
          "Text too short. Minimum 10 characters required for reliable analysis.",
        success: false,
        provided: textLength,
        minimum: 10,
      });
    }

    // Word count validation
    if (wordCount < 3) {
      return res.status(400).json({
        error: "Text must contain at least 3 words for analysis.",
        success: false,
        wordCount: wordCount,
        minimum: 3,
      });
    }

    // Set up processing timeout (30 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Processing timeout")), 30000)
    );

    console.log(
      `🤖 Starting AI detection for ${wordCount} words (${textLength} chars)`
    );

    // Race between detection and timeout
    const result = await Promise.race([
      aiDetector.detectAIContent(text),
      timeoutPromise,
    ]);

    const totalProcessingTime = Date.now() - startTime;

    // Log performance metrics
    console.log(
      `✅ AI detection completed in ${totalProcessingTime}ms (${
        result.cached ? "cached" : "fresh"
      })`
    );

    // Enhanced response with additional metadata
    const response = {
      success: true,
      data: {
        // Core results
        aiProbability: result.aiProbability,
        confidence: result.confidence,
        breakdown: result.breakdown || {},

        // Metadata
        textLength: textLength,
        wordCount: wordCount,
        processingTime: result.processingTime || totalProcessingTime,
        totalProcessingTime: totalProcessingTime,
        cached: result.cached || false,
        method: result.method || "Hybrid Sapling Detection",
        analysisVersion: "2.0.0",
        timestamp: new Date().toISOString(),

        // Performance info
        performance: {
          wordsPerSecond: Math.round((wordCount / totalProcessingTime) * 1000),
          averageTimePerWord: Math.round(totalProcessingTime / wordCount),
          cacheHit: result.cached || false,
        },
      },
    };

    // Add interpretation
    response.data.interpretation = generateInterpretation(
      result.aiProbability,
      result.confidence
    );

    // Add recommendations
    response.data.recommendations = generateRecommendations(
      result.aiProbability,
      result.confidence
    );

    res.json(response);
  } catch (error) {
    const totalProcessingTime = Date.now() - startTime;

    console.error("❌ AI Detection controller error:", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      processingTime: totalProcessingTime,
    });

    // Handle specific error types
    if (error.message === "Processing timeout") {
      return res.status(408).json({
        error:
          "Analysis is taking longer than expected. Please try with shorter text or try again later.",
        success: false,
        timeout: 30000,
        processingTime: totalProcessingTime,
        suggestion: "Consider breaking large texts into smaller chunks",
      });
    }

    if (error.message.includes("Memory") || error.message.includes("ENOMEM")) {
      return res.status(507).json({
        error:
          "Server is currently overloaded. Please try again in a few minutes.",
        success: false,
        retryAfter: 300, // 5 minutes
      });
    }

    // Generic server error
    res.status(500).json({
      error: "Internal server error during AI detection. Please try again.",
      success: false,
      errorId: generateErrorId(),
      processingTime: totalProcessingTime,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Health check endpoint for monitoring
const healthCheck = async (req, res) => {
  const startTime = Date.now();

  try {
    // Test with a simple sentence
    const testResult = await Promise.race([
      aiDetector.detectAIContent(
        "This is a simple test sentence for health check purposes."
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Health check timeout")), 5000)
      ),
    ]);

    const processingTime = Date.now() - startTime;

    res.json({
      status: "healthy",
      service: "AI Content Detection",
      version: "2.0.0",
      processingTime: processingTime,
      testResult: {
        aiProbability: testResult.aiProbability,
        confidence: testResult.confidence,
        cached: testResult.cached,
      },
      performance: {
        avgProcessingTime: processingTime,
        status:
          processingTime < 2000
            ? "excellent"
            : processingTime < 5000
            ? "good"
            : "slow",
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("❌ Health check failed:", error.message);

    res.status(503).json({
      status: "unhealthy",
      service: "AI Content Detection",
      error: error.message,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
};

// Get detection statistics
const getStats = async (req, res) => {
  try {
    const stats = {
      service: "AI Content Detection",
      version: "2.0.0",
      features: [
        "Sapling-based detection",
        "Statistical validation",
        "Hybrid scoring",
        "Performance caching",
        "Real-time processing",
      ],
      accuracy: "75-80%",
      averageProcessingTime: "<2 seconds",
      supportedTextLength: {
        minimum: 10,
        maximum: 200000,
        optimal: "100-5000 characters",
      },
      confidenceLevels: ["High", "Medium", "Low"],
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics",
    });
  }
};

// Batch detection endpoint (for multiple texts)
const batchDetect = async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: "Texts must be provided as a non-empty array",
        success: false,
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        error: "Maximum 10 texts allowed per batch request",
        success: false,
        provided: texts.length,
        maximum: 10,
      });
    }

    const startTime = Date.now();

    // Process all texts concurrently
    const promises = texts.map(async (text, index) => {
      try {
        const result = await aiDetector.detectAIContent(text);
        return {
          index: index,
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          index: index,
          success: false,
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.all(promises);
    const totalProcessingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        results: batchResults,
        batchSize: texts.length,
        processingTime: totalProcessingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Batch detection error:", error);
    res.status(500).json({
      success: false,
      error: "Batch processing failed",
    });
  }
};

// Helper function to generate interpretation
function generateInterpretation(probability, confidence) {
  let category, icon, description, color;

  if (probability < 30) {
    category = "Likely Human-Written";
    icon = "👤";
    description =
      "This content shows characteristics typical of human writing with natural variation and creativity.";
    color = "#059669";
  } else if (probability < 70) {
    category = "Mixed or Uncertain";
    icon = "❓";
    description =
      "Content may be AI-assisted, heavily edited, or shows mixed characteristics. Further review recommended.";
    color = "#d97706";
  } else {
    category = "Likely AI-Generated";
    icon = "🤖";
    description =
      "This content shows strong indicators of AI generation with typical patterns and structures.";
    color = "#dc2626";
  }

  return {
    category,
    icon,
    description,
    color,
    confidence: confidence,
  };
}

// Helper function to generate recommendations
function generateRecommendations(probability, confidence) {
  const recommendations = [];

  if (probability >= 70) {
    recommendations.push(
      "Consider reviewing and adding more personal insights or experiences"
    );
    recommendations.push(
      "Add specific examples or case studies from your domain expertise"
    );
    recommendations.push(
      "Include more varied sentence structures and unique perspectives"
    );
  } else if (probability >= 30) {
    recommendations.push("Review flagged sections for potential AI assistance");
    recommendations.push("Add more personal voice and unique insights");
    recommendations.push(
      "Ensure proper attribution if AI tools were used for assistance"
    );
  } else {
    recommendations.push(
      "Content appears to have strong human characteristics"
    );
    recommendations.push(
      "Maintain the natural writing style and personal voice"
    );
  }

  if (confidence === "Low") {
    recommendations.push(
      "Consider adding more content for more reliable analysis"
    );
    recommendations.push(
      "Longer texts generally provide more accurate detection results"
    );
  }

  return recommendations;
}

// Helper function to generate error ID
function generateErrorId() {
  return (
    "ERR_" +
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

module.exports = {
  detectAIContent: [aiDetectionLimiter, detectAIContent],
  healthCheck,
  getStats,
  batchDetect: [aiDetectionLimiter, batchDetect],
};
