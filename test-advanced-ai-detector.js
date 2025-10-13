const AIDetector = require('./src/plagiarism_check/services/aiDetector');

async function testAdvancedAIDetector() {
    console.log('🚀 Testing Advanced AI Detection System...\n');
    
    const detector = new AIDetector();
    
    const testCases = [
        {
            name: 'AI Generated - ChatGPT Style',
            text: 'Furthermore, it is important to understand that artificial intelligence has revolutionized content creation in numerous ways. Moreover, these sophisticated systems utilize advanced natural language processing techniques to generate coherent and contextually relevant text. Additionally, the implementation of transformer architectures has significantly enhanced the quality and fluency of AI-generated content, making it increasingly difficult to distinguish from human-written text.',
            expectedRange: [75, 95],
            category: 'AI'
        },
        {
            name: 'AI Generated - Academic Style',
            text: 'The integration of machine learning algorithms in contemporary data analysis has fundamentally transformed methodological approaches across various disciplines. These systems demonstrate remarkable capabilities in pattern recognition and predictive modeling. Consequently, organizations are increasingly adopting AI-driven solutions to enhance operational efficiency and decision-making processes. Thus, the implications of these technological advancements extend far beyond traditional computational applications.',
            expectedRange: [70, 90],
            category: 'AI'
        },
        {
            name: 'Human Written - Personal',
            text: "I can't believe how quickly this year has flown by! Just yesterday I was making New Year's resolutions, and now we're already thinking about the holidays again. My kids have grown so much - Sarah lost her first tooth and Tommy finally learned to ride his bike without training wheels. It's been such a rollercoaster of emotions, but I wouldn't trade these moments for anything.",
            expectedRange: [5, 25],
            category: 'Human'
        },
        {
            name: 'Human Written - Professional',
            text: 'After reviewing the quarterly reports, I noticed some concerning trends in our customer retention rates. The marketing team needs to pivot our strategy, especially in the mobile segment where we\'re losing ground to competitors. I\'ve scheduled a meeting with department heads for Thursday to brainstorm solutions. We can\'t afford to let this slide any longer.',
            expectedRange: [10, 35],
            category: 'Human'
        },
        {
            name: 'Mixed Content',
            text: 'Furthermore, the impact of social media on modern communication is significant. But honestly, I think people are just glued to their phones these days! My grandmother always says that back in her day, people actually talked to each other face-to-face. Therefore, we must consider both the benefits and drawbacks of digital communication technologies.',
            expectedRange: [45, 70],
            category: 'Mixed'
        }
    ];
    
    let totalTests = 0;
    let accurateTests = 0;
    const results = [];
    
    for (const testCase of testCases) {
        try {
            console.log(`📝 Testing: ${testCase.name}`);
            console.log(`Category: ${testCase.category}`);
            
            const startTime = Date.now();
            const result = await detector.detectAIContent(testCase.text);
            const endTime = Date.now();
            
            const probability = result.aiProbability;
            const isAccurate = probability >= testCase.expectedRange[0] && 
                             probability <= testCase.expectedRange[1];
            
            console.log(`   AI Probability: ${probability}%`);
            console.log(`   Expected Range: ${testCase.expectedRange[0]}-${testCase.expectedRange[1]}%`);
            console.log(`   Confidence: ${result.confidence}`);
            console.log(`   Processing Time: ${result.totalProcessingTime}ms`);
            console.log(`   Accuracy: ${isAccurate ? '✅ PASS' : '❌ FAIL'}`);
            
            if (result.breakdown) {
                console.log(`   Transformer Score: ${result.breakdown.transformer_score}`);
                console.log(`   Statistical Score: ${result.breakdown.statistical_score}`);
                
                if (result.breakdown.feature_breakdown) {
                    console.log(`   Feature Breakdown:`);
                    Object.entries(result.breakdown.feature_breakdown).forEach(([feature, score]) => {
                        console.log(`     ${feature}: ${score}`);
                    });
                }
            }
            
            console.log(`   Model Info: ${result.model_info ? JSON.stringify(result.model_info) : 'N/A'}`);
            console.log('');
            
            totalTests++;
            if (isAccurate) accurateTests++;
            
            results.push({
                name: testCase.name,
                category: testCase.category,
                probability: probability,
                expected: testCase.expectedRange,
                accurate: isAccurate,
                processingTime: result.totalProcessingTime
            });
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
            totalTests++;
        }
    }
    
    // Summary
    const accuracy = (accurateTests / totalTests) * 100;
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    console.log('=' .repeat(60));
    console.log('🎯 ADVANCED AI DETECTION SYSTEM RESULTS');
    console.log('=' .repeat(60));
    console.log(`Overall Accuracy: ${accurateTests}/${totalTests} (${accuracy.toFixed(1)}%)`);
    console.log(`Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log('');
    
    // Performance evaluation
    if (accuracy >= 85) {
        console.log('🏆 EXCELLENT! Your AI detector rivals commercial solutions!');
        console.log('   Accuracy is production-ready for most use cases.');
    } else if (accuracy >= 75) {
        console.log('🎉 VERY GOOD! Strong performance with room for fine-tuning.');
        console.log('   Consider collecting more training data for edge cases.');
    } else if (accuracy >= 60) {
        console.log('👍 GOOD START! System is functional but needs optimization.');
        console.log('   Check model loading and feature extraction algorithms.');
    } else {
        console.log('⚠️  NEEDS IMPROVEMENT. Check system setup and dependencies.');
        console.log('   Verify Python environment and model availability.');
    }
    
    // Performance recommendations
    if (avgProcessingTime > 10000) {
        console.log('⏱️  Consider GPU acceleration for better performance.');
    } else if (avgProcessingTime > 5000) {
        console.log('⏱️  Processing time is acceptable for most applications.');
    } else {
        console.log('⚡ Excellent processing speed!');
    }
}

// Run the test
testAdvancedAIDetector().catch(console.error);
