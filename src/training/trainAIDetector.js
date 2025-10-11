// src/training/trainAIDetector.js
const fs = require("fs");
const path = require("path");

class AIDetectorTrainer {
  constructor() {
    this.trainingData = [];
    this.model = {
      weights: {},
      bias: 0,
      threshold: 0.5,
    };
  }

  loadTrainingData() {
    try {
      const dataPath = path.join(__dirname, "../data/trainingData.json");
      if (fs.existsSync(dataPath)) {
        this.trainingData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        console.log(`✅ Loaded ${this.trainingData.length} training examples`);
        return true;
      } else {
        console.log("❌ Training data file not found");
        return false;
      }
    } catch (error) {
      console.error("Error loading training data:", error.message);
      return false;
    }
  }

  // Enhanced feature extraction
  extractFeatures(text) {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const features = {
      // Length features
      avgWordLength:
        words.reduce((sum, word) => sum + word.length, 0) / words.length || 0,
      avgSentenceLength: words.length / sentences.length || 0,

      // Vocabulary complexity
      uniqueWordRatio: new Set(words).size / words.length || 0,

      // AI indicators - formal language patterns
      formalWords: this.countMatches(
        text,
        /\b(furthermore|moreover|consequently|therefore|thus|hence|additionally|specifically|particularly|essentially|comprehensive|systematic|significant|demonstrates|analysis|implementation|optimization|efficiency|operational|organizational|strategic)\b/gi
      ),

      // Human indicators - casual language
      casualWords: this.countMatches(
        text,
        /\b(really|pretty|quite|super|totally|literally|basically|actually|honestly|seriously|crazy|awesome|terrible|amazing|horrible|stuff|things|gonna|wanna|kinda|sorta)\b/gi
      ),

      // Personal pronouns (more human)
      personalPronouns: this.countMatches(
        text,
        /\b(I|my|me|myself|we|us|our|you|your)\b/gi
      ),

      // Contractions (more human)
      contractions: this.countMatches(
        text,
        /\b\w+[''](?:t|s|re|ve|ll|d|m)\b/gi
      ),

      // Exclamations (more human)
      exclamations: this.countMatches(text, /[!]{1,3}/g),

      // Perfect grammar ratio (more AI)
      grammarScore: this.assessGrammar(text),
    };

    return features;
  }

  countMatches(text, regex) {
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  assessGrammar(text) {
    // Simple grammar assessment
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let grammarScore = 0;

    sentences.forEach((sentence) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 0) {
        // Check if first word is capitalized
        if (words[0].charAt(0) === words[0].charAt(0).toUpperCase()) {
          grammarScore++;
        }
      }
    });

    return sentences.length > 0 ? grammarScore / sentences.length : 0;
  }

  train() {
    console.log("🔄 Training AI detector...");

    if (this.trainingData.length === 0) {
      console.log("❌ No training data loaded!");
      return;
    }

    const aiFeatures = [];
    const humanFeatures = [];

    // Process training data
    this.trainingData.forEach((example) => {
      const features = this.extractFeatures(example.text);
      if (example.label === "ai" || example.label === "AI") {
        aiFeatures.push(features);
      } else if (example.label === "human" || example.label === "Human") {
        humanFeatures.push(features);
      }
    });

    console.log(
      `📊 AI examples: ${aiFeatures.length}, Human examples: ${humanFeatures.length}`
    );

    if (aiFeatures.length === 0 || humanFeatures.length === 0) {
      console.log("❌ Need both AI and human examples to train!");
      return;
    }

    // Calculate weights based on feature differences
    const featureNames = Object.keys(aiFeatures[0]);
    this.model.weights = {};

    featureNames.forEach((feature) => {
      const aiAvg =
        aiFeatures.reduce((sum, f) => sum + f[feature], 0) / aiFeatures.length;
      const humanAvg =
        humanFeatures.reduce((sum, f) => sum + f[feature], 0) /
        humanFeatures.length;

      // Calculate base difference
      let weight = aiAvg - humanAvg;

      // Rebalance problematic features
      if (feature === "avgSentenceLength" && Math.abs(weight) > 2) {
        weight = weight > 0 ? 1 : -1;
      }
      if (feature === "formalWords") {
        weight = weight * 3;
      }
      if (feature === "casualWords") {
        weight = weight * 2;
      }

      this.model.weights[feature] = weight;
    });

    console.log("📈 Feature weights:", this.model.weights);
    console.log("✅ Training completed!");
    this.saveModel();
  }

  testModel(testText) {
    if (!testText || testText.trim().length === 0) {
      return {
        probability: 0.5,
        isAI: false,
        confidence: 0,
        error: "Empty text",
      };
    }

    const features = this.extractFeatures(testText);
    let score = this.model.bias;

    // Calculate weighted score with feature amplification
    Object.keys(features).forEach((feature) => {
      if (this.model.weights[feature]) {
        let amplifiedWeight = this.model.weights[feature];

        // Amplify the most important distinguishing features
        if (feature === "formalWords" && features[feature] > 0) {
          amplifiedWeight *= 5; // Strongly favor formal words for AI
        }
        if (feature === "casualWords" && features[feature] > 0) {
          amplifiedWeight *= 4; // Strongly favor casual words for human
        }
        if (feature === "personalPronouns" && features[feature] > 0) {
          amplifiedWeight *= 3; // Personal pronouns = human
        }

        score += features[feature] * amplifiedWeight;
      }
    });

    // More aggressive normalization
    const normalizedScore = score / 20; // Divide by 20 instead of 50

    // Convert to probability using sigmoid
    const probability = 1 / (1 + Math.exp(-normalizedScore));
    const isAI = probability > 0.4; // Lower threshold from 0.5 to 0.4
    const confidence = Math.abs(probability - 0.5) * 2;

    return {
      probability: Math.round(probability * 100) / 100,
      isAI: isAI,
      confidence: Math.round(confidence * 100) / 100,
      rawScore: score,
      normalizedScore: normalizedScore,
      keyFeatures: {
        // Show which features influenced the decision
        formalWords: features.formalWords,
        casualWords: features.casualWords,
        personalPronouns: features.personalPronouns,
      },
    };
  }

  saveModel() {
    const modelPath = path.join(__dirname, "../models/aiDetector.json");

    const modelsDir = path.dirname(modelPath);
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    fs.writeFileSync(modelPath, JSON.stringify(this.model, null, 2));
    console.log("💾 Model saved to:", modelPath);
  }

  loadModel() {
    try {
      const modelPath = path.join(__dirname, "../models/aiDetector.json");
      if (fs.existsSync(modelPath)) {
        this.model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
        console.log("✅ Model loaded from file");
        return true;
      }
    } catch (error) {
      console.error("Error loading model:", error.message);
    }
    return false;
  }
}

// Main execution
async function main() {
  console.log("🤖 AI DETECTOR TRAINER");
  console.log("═".repeat(50));

  const trainer = new AIDetectorTrainer();

  if (trainer.loadTrainingData()) {
    trainer.train();

    // Enhanced testing
    console.log("\n🧪 Testing improved model...");

    const tests = [
      {
        text: "The comprehensive analysis demonstrates significant improvements in operational efficiency across multiple organizational domains through systematic implementation of advanced methodologies.",
        expected: "AI",
      },
      {
        text: "I can't believe how crazy my day was! First I spilled coffee everywhere, then got stuck in terrible traffic. What a mess!",
        expected: "Human",
      },
    ];

    tests.forEach((test, i) => {
      const result = trainer.testModel(test.text);
      console.log(`Test ${i + 1} (Expected: ${test.expected}):`, result);
    });

    console.log("\n🎉 Training complete! Your AI detector is ready to use.");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AIDetectorTrainer;
