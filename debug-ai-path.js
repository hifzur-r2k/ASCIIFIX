const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Debugging AI Detector Path Issues...\n');

// Test different path constructions
const pathOptions = [
    path.resolve(__dirname, 'src', 'plagiarism_check', 'services', 'ai_detector.py'),
    path.join(__dirname, 'src/plagiarism_check/services/ai_detector.py'),
    path.join(__dirname, 'src\\plagiarism_check\\services\\ai_detector.py'),
    './src/plagiarism_check/services/ai_detector.py'
];

console.log('📍 Testing different path constructions:');
pathOptions.forEach((testPath, index) => {
    const exists = fs.existsSync(testPath);
    console.log(`${index + 1}. ${testPath} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
});

// Test with the first working path
const workingPath = pathOptions.find(p => fs.existsSync(p));

if (!workingPath) {
    console.log('❌ No valid Python script found!');
    process.exit(1);
}

console.log(`\n🎯 Using working path: ${workingPath}\n`);

// Test Python execution
console.log('📤 Testing Python script execution...');

const testInput = {
    text: "Furthermore, it is important to understand that artificial intelligence has revolutionized content creation."
};

const pythonProcess = spawn('python', [workingPath], {
    cwd: __dirname,  // Set working directory explicitly
    stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    stdout += output;
    console.log('📥 Python stdout:', output);
});

pythonProcess.stderr.on('data', (data) => {
    const error = data.toString();
    stderr += error;
    console.log('🚨 Python stderr:', error);
});

pythonProcess.on('close', (code) => {
    console.log(`\n🏁 Python process closed with code: ${code}`);
    
    if (code === 0 && stdout.trim()) {
        try {
            const result = JSON.parse(stdout.trim());
            console.log('✅ SUCCESS! Python script working correctly');
            console.log('📊 AI Probability:', result.probability);
            console.log('🔧 Features:', Object.keys(result.breakdown?.feature_breakdown || {}));
            
            // Check if we're getting NEW features (not old ones)
            const expectedFeatures = ['ai_phrase_density', 'sentence_uniformity', 'vocabulary_complexity'];
            const actualFeatures = Object.keys(result.breakdown?.feature_breakdown || {});
            
            if (expectedFeatures.some(f => actualFeatures.includes(f))) {
                console.log('🎉 NEW ENHANCED SCRIPT IS WORKING!');
            } else {
                console.log('⚠️  Still running OLD script with features:', actualFeatures);
            }
            
        } catch (e) {
            console.log('❌ Failed to parse JSON output:', e.message);
            console.log('📄 Raw stdout:', stdout);
        }
    } else {
        console.log('❌ Python script execution failed');
        console.log('📄 Stdout:', stdout);
        console.log('📄 Stderr:', stderr);
    }
});

pythonProcess.on('error', (error) => {
    console.log('💥 Failed to start Python process:', error.message);
});

// Send test input
console.log('📤 Sending test input to Python...');
pythonProcess.stdin.write(JSON.stringify(testInput));
pythonProcess.stdin.end();

// Add timeout
setTimeout(() => {
    console.log('⏰ Test timeout - killing process');
    pythonProcess.kill();
}, 10000);
