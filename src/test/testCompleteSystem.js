const AIDetectorTrainer = require('../training/trainAIDetector');

console.log('🧪 Testing AI Detection System with trained model...');

const detector = new AIDetectorTrainer();

// Load the saved trained model
if (!detector.loadModel()) {
    console.log('❌ No trained model found. Training first...');
    if (detector.loadTrainingData()) {
        detector.train();
    } else {
        console.log('❌ Cannot load training data. Exiting.');
        process.exit(1);
    }
}

// Test with AI-like text
const aiText = "The comprehensive analysis demonstrates significant improvements in operational efficiency across multiple organizational domains through systematic implementation of advanced methodologies.";
console.log('AI Text Result:', detector.testModel(aiText));

// Test with human-like text  
const humanText = "I can't believe how crazy my day was! First I spilled coffee everywhere, then got stuck in terrible traffic. What a mess!";
console.log('Human Text Result:', detector.testModel(humanText));

console.log('✅ Test complete!');
