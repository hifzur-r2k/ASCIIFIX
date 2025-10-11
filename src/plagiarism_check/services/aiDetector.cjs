const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const { checkWithGemini } = require('./geminiHelper');

class AdvancedAIDetector {
  constructor() {
    // Use the enhanced Python script
    this.pythonScript = path.resolve(__dirname, "ai_detector.py");
    this.cacheDir = path.resolve(__dirname, "../../../cache/ai-detection");

    // Advanced performance tracking
    this.activeProcesses = 0;
    this.maxConcurrentProcesses = 2;
    this.processQueue = [];
    this.statistics = {
      totalDetections: 0,
      cacheHits: 0,
      averageProcessingTime: 0,
      neuralDetections: 0,
      statisticalFallbacks: 0,
    };

    console.log("🚀 Advanced Neural AI Detector v2.0 initialized");
    console.log("🐍 Python script path:", this.pythonScript);
    this.init();
  }

  async init() {
    await this.ensureCacheDir();
    await this.validateEnhancedSetup();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log("📁 Cache directory ready:", this.cacheDir);
    } catch (error) {
      console.error("❌ Failed to create cache directory:", error);
    }
  }

  async validateEnhancedSetup() {
    try {
      const scriptExists = await fs
        .access(this.pythonScript)
        .then(() => true)
        .catch(() => false);
      if (!scriptExists) {
        console.error(
          "❌ Enhanced AI detection script not found at:",
          this.pythonScript
        );
        throw new Error("Enhanced Python script not found");
      } else {
        console.log("✅ Enhanced AI detection script found and ready");

        // Test enhanced capabilities with comprehensive validation
        try {
          console.log("🔬 Testing enhanced neural detection capabilities...");
          const testResult = await this.runEnhancedDetection(
            "Furthermore, artificial intelligence is revolutionizing content creation with sophisticated algorithms and advanced neural networks."
          );
          console.log(
            "🎯 Enhanced test - AI probability:",
            testResult.probability + "%"
          );

          // Validate enhanced features
          if (testResult.breakdown && testResult.breakdown.neural_breakdown) {
            console.log("🧠 Neural models confirmed active!");
            console.log(
              "🔢 Perplexity analysis:",
              testResult.breakdown.neural_breakdown.perplexity_score
            );
            console.log(
              "🔗 Coherence analysis:",
              testResult.breakdown.neural_breakdown.coherence_score
            );
            console.log(
              "🧮 Embedding analysis:",
              testResult.breakdown.neural_breakdown.embedding_score
            );
            console.log(
              "✍️ Style analysis:",
              testResult.breakdown.neural_breakdown.style_score
            );
            this.statistics.neuralDetections++;
          } else {
            console.log("📊 Fallback to enhanced statistical + style analysis");
            this.statistics.statisticalFallbacks++;
          }

          // Validate method version
          if (
            testResult.model_info &&
            testResult.model_info.method.includes("v2.0")
          ) {
            console.log("🎉 Enhanced detection v2.0 confirmed active!");
          }
        } catch (testError) {
          console.warn(
            "⚠️ Enhanced test failed, but detector is functional:",
            testError.message
          );
        }
      }
    } catch (error) {
      console.error("❌ Enhanced setup validation failed:", error.message);
    }
  }

  async detectAIContent(text) {
    const startTime = Date.now();
    this.statistics.totalDetections++;

    // Enhanced input validation
    if (!text || typeof text !== "string") {
      throw new Error("Invalid input: text must be a non-empty string");
    }

    if (text.trim().length === 0) {
      throw new Error("Input text cannot be empty");
    }

    // Advanced concurrency control with queuing
    if (this.activeProcesses >= this.maxConcurrentProcesses) {
      if (this.processQueue.length > 5) {
        throw new Error(
          "AI detection service is overloaded. Please try again in a moment."
        );
      }
      // Add to queue and wait
      await this.waitInQueue();
    }

    // Smart cache check with enhanced versioning
    const textHash = this.getTextHash(text);
    const cachedResult = await this.getEnhancedCachedResult(textHash);
    if (cachedResult) {
      this.statistics.cacheHits++;
      console.log("💨 Enhanced cache hit for neural AI detection");
      return {
        ...cachedResult,
        cached: true,
        totalProcessingTime: Date.now() - startTime,
      };
    }

    const cleanedText = this.cleanText(text);
    const wordCount = this.getWordCount(cleanedText);

    if (wordCount < 10) {
      return {
        aiProbability: 0,
        confidence: "Low",
        message:
          "Text too short for reliable analysis (minimum 10 words required)",
        processingTime: Date.now() - startTime,
        breakdown: {
          transformer_score: null,
          statistical_score: 0,
          feature_breakdown: {
            ai_phrase_density: 0,
            sentence_uniformity: 0,
            vocabulary_complexity: 0,
            transition_density: 0,
            repetition_score: 0,
          },
          neural_breakdown: {
            perplexity_score: 0,
            coherence_score: 0,
            embedding_score: 0,
            style_score: 0,
            ensemble_score: 0,
          },
          method: "Insufficient Input Length",
        },
        model_info: {
          transformer_available: false,
          fallback_mode: false,
          method: "Insufficient Input Length",
        },
        cached: false,
        wordCount: wordCount,
      };
    }

    // Increment active processes for enhanced concurrency control
    this.activeProcesses++;

    try {
      console.log(
        `🧠 Processing enhanced neural AI detection for ${wordCount} words...`
      );
      console.log(
        `⚡ Active processes: ${this.activeProcesses}/${this.maxConcurrentProcesses}`
      );

      const result = await this.runEnhancedDetection(cleanedText);

      // Add comprehensive metadata
      result.wordCount = wordCount;
      result.textLength = cleanedText.length;
      result.totalProcessingTime = Date.now() - startTime;
      result.cached = false;

      // Map probability for consistency with existing API
      if (result.probability !== undefined) {
        result.aiProbability = result.probability;
        delete result.probability;
      }

      // Update statistics
      this.updateStatistics(result);

      // Enhanced logging with complete breakdown
      console.log(
        `🎯 Enhanced AI Detection Complete: ${result.aiProbability}% (${result.confidence}) - ${result.totalProcessingTime}ms`
      );
      if (result.breakdown && result.breakdown.neural_breakdown) {
        console.log(`📊 Enhanced Breakdown:`);
        console.log(
          `   🔢 Perplexity: ${result.breakdown.neural_breakdown.perplexity_score}%`
        );
        console.log(
          `   🔗 Coherence: ${result.breakdown.neural_breakdown.coherence_score}%`
        );
        console.log(
          `   🧮 Embedding: ${result.breakdown.neural_breakdown.embedding_score}%`
        );
        console.log(
          `   ✍️ Style: ${result.breakdown.neural_breakdown.style_score}%`
        );
        console.log(
          `   ⚖️ Ensemble: ${result.breakdown.neural_breakdown.ensemble_score}%`
        );
      }
      const geminiScore = await checkWithGemini(cleanedText);
      console.log("🤖 Gemini AI score:", geminiScore);

      // Blend Gemini with Python result
      result.geminiScore = geminiScore;
      result.aiProbability = Math.round(
        result.aiProbability * 0.7 + geminiScore * 0.3
      );
      // Cache the result with enhanced versioning
      await this.cacheEnhancedResult(textHash, result, "neural-v2.0");

      return result;
    } catch (error) {
      console.error("❌ Enhanced neural AI detection error:", error);

      // Enhanced error categorization with specific handling
      if (error.message.includes("timeout")) {
        throw new Error(
          "Enhanced neural analysis is taking longer than expected. Please try with shorter text or try again later."
        );
      } else if (error.message.includes("Python script exited")) {
        throw new Error(
          "Enhanced AI detection service encountered an error. Please try again."
        );
      } else if (error.message.includes("Failed to parse")) {
        throw new Error(
          "Enhanced AI detection service returned invalid data. Please try again."
        );
      } else if (error.message.includes("Neural libraries")) {
        throw new Error(
          "Neural libraries are loading. Please try again in a moment."
        );
      } else {
        throw new Error("Enhanced AI detection failed: " + error.message);
      }
    } finally {
      // Always decrement active processes and process queue
      this.activeProcesses--;
      this.processNextInQueue();
    }
  }

  async runEnhancedDetection(text) {
    return new Promise((resolve, reject) => {
      // Extended timeout for enhanced neural processing
      const timeout = setTimeout(() => {
        pythonProcess.kill("SIGTERM");
        reject(new Error("Enhanced neural detection timeout (90s exceeded)"));
      }, 90000);

      const pythonProcess = spawn("python", [this.pythonScript], {
        cwd: path.dirname(this.pythonScript),
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          PYTHONDONTWRITEBYTECODE: "1", 
        },
      });

      let output = "";
      let errorOutput = "";

      // Enhanced output handling for comprehensive analysis
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        const errorMsg = data.toString();
        // Filter out enhanced logging messages, only show actual errors
        if (
          !errorMsg.includes("🐍") &&
          !errorMsg.includes("✅") &&
          !errorMsg.includes("🧠") &&
          !errorMsg.includes("📚") &&
          !errorMsg.includes("🔧") &&
          !errorMsg.includes("🔍") &&
          !errorMsg.includes("🎯") &&
          !errorMsg.includes("📊") &&
          !errorMsg.includes("⚖️") &&
          !errorMsg.includes("🔢") &&
          !errorMsg.includes("🔗") &&
          !errorMsg.includes("🧮") &&
          !errorMsg.includes("✍️") &&
          !errorMsg.includes("🚀")
        ) {
          console.log("🐍 Python stderr:", errorMsg.trim());
        }
        errorOutput += errorMsg;
      });

      pythonProcess.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error(`❌ Enhanced Python process failed with code: ${code}`);
          if (errorOutput) {
            console.error(
              "❌ Enhanced error details:",
              errorOutput.substring(0, 500)
            );
          }
          return reject(
            new Error(`Enhanced Python script exited with code ${code}`)
          );
        }

        try {
          const trimmedOutput = output.trim();
          if (!trimmedOutput) {
            return reject(
              new Error("Enhanced Python script returned empty output")
            );
          }

          const result = JSON.parse(trimmedOutput);

          if (result.error) {
            return reject(
              new Error(`Enhanced Python script error: ${result.error}`)
            );
          }

          // Enhanced result validation
          if (
            typeof result.probability !== "number" ||
            result.probability < 0 ||
            result.probability > 100
          ) {
            return reject(
              new Error("Invalid probability value from enhanced script")
            );
          }

          if (!result.confidence) {
            result.confidence = "Medium"; // Default fallback
          }

          // Validate enhanced breakdown structure
          if (result.breakdown && result.breakdown.neural_breakdown) {
            const neural = result.breakdown.neural_breakdown;
            if (
              typeof neural.perplexity_score !== "number" ||
              typeof neural.coherence_score !== "number" ||
              typeof neural.style_score !== "number"
            ) {
              console.warn(
                "⚠️ Enhanced neural breakdown data incomplete, but continuing..."
              );
            }
          }

          // Validate method version
          if (result.model_info && result.model_info.method) {
            if (result.model_info.method.includes("v2.0")) {
              this.statistics.neuralDetections++;
            } else {
              this.statistics.statisticalFallbacks++;
            }
          }

          resolve(result);
        } catch (parseError) {
          console.error(
            "❌ Failed to parse enhanced output:",
            output.substring(0, 200) + "..."
          );
          reject(new Error("Failed to parse enhanced AI detection result"));
        }
      });

      pythonProcess.on("error", (error) => {
        clearTimeout(timeout);
        console.error("❌ Enhanced Python process spawn error:", error);
        reject(new Error("Failed to start enhanced detection process"));
      });

      // Send input with enhanced error handling
      try {
        const inputData = JSON.stringify({ text: text });
        pythonProcess.stdin.write(inputData);
        pythonProcess.stdin.end();
      } catch (writeError) {
        clearTimeout(timeout);
        pythonProcess.kill();
        reject(new Error("Failed to send data to enhanced script"));
      }
    });
  }

  // Enhanced queue management
  async waitInQueue() {
    return new Promise((resolve) => {
      this.processQueue.push(resolve);
    });
  }

  processNextInQueue() {
    if (
      this.processQueue.length > 0 &&
      this.activeProcesses < this.maxConcurrentProcesses
    ) {
      const nextResolve = this.processQueue.shift();
      nextResolve();
    }
  }

  // Enhanced statistics tracking
  updateStatistics(result) {
    const processingTime =
      result.totalProcessingTime || result.processingTime || 0;
    this.statistics.averageProcessingTime =
      (this.statistics.averageProcessingTime *
        (this.statistics.totalDetections - 1) +
        processingTime) /
      this.statistics.totalDetections;
  }

  // Utility methods (enhanced)
  cleanText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  getWordCount(text) {
    return (text.match(/\b\w+\b/g) || []).length;
  }

  getTextHash(text) {
    return crypto
      .createHash("md5")
      .update(text + "v2.0")
      .digest("hex");
  }

  // Enhanced caching with comprehensive version support
  async getEnhancedCachedResult(hash) {
    try {
      const cacheFile = path.join(this.cacheDir, `${hash}.json`);
      const data = await fs.readFile(cacheFile, "utf8");
      const cached = JSON.parse(data);

      // Enhanced cache validity and version checking
      const cacheAge = Date.now() - cached.timestamp;
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

      if (
        cacheAge < maxCacheAge &&
        cached.version === "neural-v2.0" &&
        cached.result &&
        cached.result.model_info
      ) {
        return cached.result;
      } else {
        // Clean up expired or outdated cache
        await fs.unlink(cacheFile).catch(() => {});
      }
    } catch (error) {
    }
    return null;
  }

  async cacheEnhancedResult(hash, result, version = "neural-v2.0") {
    try {
      const cacheFile = path.join(this.cacheDir, `${hash}.json`);
      const cacheData = {
        timestamp: Date.now(),
        version: version,
        result: result,
        metadata: {
          wordCount: result.wordCount,
          confidence: result.confidence,
          processingTime: result.totalProcessingTime,
          neuralAvailable: result.model_info?.transformer_available || false,
        },
      };
      await fs.writeFile(cacheFile, JSON.stringify(cacheData), "utf8");
    } catch (error) {
      console.warn("⚠️ Failed to cache enhanced result:", error.message);
    }
  }

  // Enhanced health check with comprehensive monitoring
  async healthCheck() {
    try {
      const testResult = await this.detectAIContent(
        "This is a comprehensive test sentence for health checking the enhanced neural AI detection system with advanced capabilities."
      );
      return {
        status: "healthy",
        version: "neural-v2.0",
        neuralAvailable: testResult.model_info?.transformer_available || false,
        testResults: {
          probability: testResult.aiProbability,
          confidence: testResult.confidence,
          processingTime: testResult.processingTime,
          method: testResult.model_info?.method,
        },
        performance: {
          activeProcesses: this.activeProcesses,
          maxProcesses: this.maxConcurrentProcesses,
          queueLength: this.processQueue.length,
          statistics: this.statistics,
        },
        features: {
          perplexityAnalysis:
            testResult.breakdown?.neural_breakdown?.perplexity_score !==
            undefined,
          coherenceAnalysis:
            testResult.breakdown?.neural_breakdown?.coherence_score !==
            undefined,
          styleAnalysis:
            testResult.breakdown?.neural_breakdown?.style_score !== undefined,
          ensembleScoring:
            testResult.breakdown?.neural_breakdown?.ensemble_score !==
            undefined,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        version: "neural-v2.0",
        error: error.message,
        performance: {
          activeProcesses: this.activeProcesses,
          queueLength: this.processQueue.length,
          statistics: this.statistics,
        },
      };
    }
  }

  // Enhanced system status with detailed metrics
  getEnhancedStatus() {
    return {
      pythonScriptPath: this.pythonScript,
      cacheDirectory: this.cacheDir,
      performance: {
        activeProcesses: this.activeProcesses,
        maxConcurrentProcesses: this.maxConcurrentProcesses,
        queueLength: this.processQueue.length,
        statistics: this.statistics,
      },
      capabilities: {
        neuralEnabled: true,
        stylisticAnalysis: true,
        perplexityScoring: true,
        semanticCoherence: true,
        ensemblePrediction: true,
      },
      ready: true,
      version: "neural-v2.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  // Performance optimization method
  async optimizePerformance() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      let cleaned = 0;

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.cacheDir, file);
          try {
            const data = JSON.parse(await fs.readFile(filePath, "utf8"));
            const age = now - data.timestamp;

            // Remove cache older than 48 hours or wrong version
            if (age > 48 * 60 * 60 * 1000 || data.version !== "neural-v2.0") {
              await fs.unlink(filePath);
              cleaned++;
            }
          } catch (e) {
            await fs.unlink(filePath);
            cleaned++;
          }
        }
      }

      console.log(
        `🧹 Performance optimization: cleaned ${cleaned} cache files`
      );
      if (this.statistics.totalDetections > 10000) {
        this.statistics = {
          totalDetections: 0,
          cacheHits: 0,
          averageProcessingTime: 0,
          neuralDetections: 0,
          statisticalFallbacks: 0,
        };
        console.log("📊 Statistics reset after 10k detections");
      }

      return {
        cleaned,
        statisticsReset: this.statistics.totalDetections === 0,
      };
    } catch (error) {
      console.error("❌ Performance optimization failed:", error);
      return { error: error.message };
    }
  }
}

module.exports = AdvancedAIDetector;
