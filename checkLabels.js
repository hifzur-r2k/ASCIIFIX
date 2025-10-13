const fs = require('fs');

// Check what labels are actually in your training data
const data = JSON.parse(fs.readFileSync('src/data/trainingData.json', 'utf8'));

const labels = new Set();
data.slice(0, 5).forEach((item, i) => {
    console.log(`Example ${i + 1}:`, {
        label: item.label,
        text: item.text.substring(0, 50) + '...'
    });
    labels.add(item.label);
});

console.log('\n🏷️ All unique labels found:', Array.from(labels));
console.log('🔍 Total examples:', data.length);
