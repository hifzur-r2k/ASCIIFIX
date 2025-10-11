const TrainingDataHelper = require('../utils/trainingDataHelper');

async function verifyTrainingData() {
  console.log('🔍 VERIFYING YOUR TRAINING DATA...\n');
  
  const helper = new TrainingDataHelper();
  
  try {
    const stats = await helper.getStats();
    
    console.log('📊 TRAINING DATA STATISTICS:');
    console.log('═══════════════════════════════════════');
    console.log(`📁 Total examples: ${stats.total}`);
    console.log(`🤖 AI examples: ${stats.ai}`);
    console.log(`👤 Human examples: ${stats.human}`);
    console.log(`⭐ High confidence: ${stats.highConfidence}`);
    console.log('═══════════════════════════════════════');
    
    // Quality checks
    const checks = [];
    
    if (stats.total >= 30) {
      checks.push('✅ Sufficient data volume');
    } else {
      checks.push('❌ Need more examples');
    }
    
    if (Math.abs(stats.ai - stats.human) <= 2) {
      checks.push('✅ Well-balanced dataset');
    } else {
      checks.push('⚠️  Imbalanced dataset');
    }
    
    if (stats.highConfidence / stats.total >= 0.8) {
      checks.push('✅ High confidence examples');
    } else {
      checks.push('⚠️  Review confidence levels');
    }
    
    console.log('\n🎯 QUALITY ASSESSMENT:');
    checks.forEach(check => console.log(`   ${check}`));
    
    if (checks.filter(c => c.startsWith('✅')).length === checks.length) {
      console.log('\n🎉 EXCELLENT! Your training data is ready!');
      console.log('🚀 Next: Start using this data to improve AI detection accuracy');
    } else {
      console.log('\n⚠️  Consider addressing the issues above');
    }
    
  } catch (error) {
    console.error('❌ Error verifying training data:', error);
  }
}

verifyTrainingData();
