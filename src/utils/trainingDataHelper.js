const fs = require('fs').promises;
const path = require('path');

class TrainingDataHelper {
  constructor() {
    this.trainingDataDir = path.join(__dirname, '../../training_data');
    this.dataFile = path.join(this.trainingDataDir, 'training_examples.csv');
  }

  async init() {
    try {
      await fs.mkdir(this.trainingDataDir, { recursive: true });
      const exists = await fs.access(this.dataFile).then(() => true).catch(() => false);
      if (!exists) {
        await fs.writeFile(this.dataFile, 'id,text,label,confidence,signals,explanation\n');
        console.log('✅ Created training_examples.csv with headers');
      }
    } catch (error) {
      console.error('❌ Error initializing training data:', error);
    }
  }

  async addExample(example) {
    const id = Date.now() + Math.random();
    const { text, label, confidence = 'High', signals = '', explanation = '' } = example;
    
    // Clean text for CSV format
    const cleanText = (text || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 1000);
    const cleanSignals = (signals || '').replace(/"/g, '""');
    const cleanExplanation = (explanation || '').replace(/"/g, '""');
    
    const csvLine = `${id},"${cleanText}",${label},${confidence},"${cleanSignals}","${cleanExplanation}"\n`;
    
    await fs.appendFile(this.dataFile, csvLine);
    console.log(`✅ Added ${label} example: ${text.substring(0, 50)}...`);
    return id;
  }

  async getStats() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('id'));
      
      const stats = {
        total: lines.length,
        ai: lines.filter(line => line.includes(',AI,')).length,
        human: lines.filter(line => line.includes(',Human,')).length,
        highConfidence: lines.filter(line => line.includes(',High,')).length
      };

      return stats;
    } catch (error) {
      console.error('❌ Error reading training data:', error);
      return { total: 0, ai: 0, human: 0, highConfidence: 0 };
    }
  }
}

module.exports = TrainingDataHelper;
