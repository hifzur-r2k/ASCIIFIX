const fs = require('fs');
const path = require('path');

function csvToJson(csvFilePath, jsonFilePath) {
    try {
        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        const lines = csvData.trim().split('\n');
        
        if (lines.length < 2) {
            console.log('❌ CSV file has insufficient data');
            return 0;
        }
        
        // Parse headers more carefully
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('📋 CSV Headers found:', headers);
        
        const jsonArray = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue; // Skip empty lines
            
            // Handle CSV with commas in text content
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/"/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/"/g, '')); // Add last value
            
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            
            jsonArray.push(obj);
        }
        
        // Show first example to verify
        console.log('📋 First example after conversion:');
        console.log(JSON.stringify(jsonArray[0], null, 2));
        
        // Ensure the directory exists
        const dir = path.dirname(jsonFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2));
        
        console.log(`✅ Successfully converted ${jsonArray.length} records`);
        console.log(`📁 Saved to: ${jsonFilePath}`);
        
        return jsonArray.length;
    } catch (error) {
        console.error('❌ Error converting CSV to JSON:', error.message);
        return 0;
    }
}

// Convert your training data
const csvPath = 'training_data/training_examples.csv';
const jsonPath = 'src/data/trainingData.json';

console.log('🔄 Converting training data with improved parser...');
const recordCount = csvToJson(csvPath, jsonPath);

if (recordCount > 0) {
    console.log('🎉 Conversion complete! Check the output above.');
    console.log('▶️  Next: Run "node checkLabels.js" to verify labels');
}
