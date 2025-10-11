// File: src/plagiarism_check/services/transformerDetector.js
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TransformerDetector {
    constructor() {
        this.pythonScript = path.join(__dirname, 'ai_detector.py');
        this.ensureModelSetup();
    }
    
    async ensureModelSetup() {
        // Check if Python script exists, create if not
        const scriptExists = await fs.access(this.pythonScript).then(() => true).catch(() => false);
        
        if (!scriptExists) {
            await this.createPythonScript();
        }
    }
    
    async detectAI(text) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            // Spawn Python process with the text
            const pythonProcess = spawn('python', [this.pythonScript], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let error = '';
            
            // Send text to Python script
            pythonProcess.stdin.write(JSON.stringify({ text: text }));
            pythonProcess.stdin.end();
            
            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error:', error);
                    // Fallback to statistical method if transformer fails
                    return this.fallbackDetection(text).then(resolve).catch(reject);
                }
                
                try {
                    const result = JSON.parse(output);
                    resolve({
                        aiProbability: result.probability * 100,
                        confidence: result.confidence,
                        processingTime: Date.now() - startTime,
                        breakdown: result.breakdown,
                        method: 'Transformer + Statistical Hybrid'
                    });
                } catch (parseError) {
                    console.error('Failed to parse Python output:', parseError);
                    this.fallbackDetection(text).then(resolve).catch(reject);
                }
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                pythonProcess.kill();
                this.fallbackDetection(text).then(resolve).catch(reject);
            }, 30000);
        });
    }
    
    async fallbackDetection(text) {
        // Your existing statistical detection as fallback
        const SaplingDetector = require('./saplingDetector');
        const sapling = new SaplingDetector();
        return await sapling.detectAI(text);
    }
    
    async createPythonScript() {
        const pythonCode = `
import sys
import json
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel, AutoConfig
import numpy as np
import re
from collections import Counter
import math

class AIDetectionModel(nn.Module):
    def __init__(self, model_name="microsoft/deberta-v3-base"):
        super().__init__()
        self.config = AutoConfig.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.classifier = nn.Linear(self.config.hidden_size, 1)
        
    def forward(self, input_ids, attention_mask=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs.last_hidden_state
        
        # Mean pooling
        if attention_mask is not None:
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
            sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
            sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
            pooled_output = sum_embeddings / sum_mask
        else:
            pooled_output = torch.mean(last_hidden_state, dim=1)
            
        logits = self.classifier(pooled_output)
        return torch.sigmoid(logits)

class HybridAIDetector:
    def __init__(self):
        self.device = torch.device("cpu")  # Use CPU to avoid GPU requirements
        self.tokenizer = None
        self.model = None
        self.setup_model()
        
    def setup_model(self):
        try:
            # Try to load a lightweight model first
            model_name = "microsoft/deberta-v3-base"  # Smaller than large version
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            # Load or create model
            self.model = AIDetectionModel(model_name)
            self.model.eval()
            
        except Exception as e:
            print(f"Model loading failed: {e}", file=sys.stderr)
            self.tokenizer = None
            self.model = None
    
    def extract_statistical_features(self, text):
        """Extract statistical features similar to your existing method"""
        words = re.findall(r'\\b\\w+\\b', text.lower())
        sentences = re.split(r'[.!?]+', text)
        
        if len(words) < 5:
            return [0.5, 0.5, 0.5, 0.5]  # Neutral features for short text
        
        # 1. Vocabulary diversity
        unique_words = len(set(words))
        vocab_diversity = unique_words / len(words) if words else 0.5
        
        # 2. Average sentence length variance
        sent_lengths = [len(s.split()) for s in sentences if s.strip()]
        if len(sent_lengths) > 1:
            avg_len = np.mean(sent_lengths)
            variance = np.var(sent_lengths)
            burstiness = math.sqrt(variance) / avg_len if avg_len > 0 else 0.5
        else:
            burstiness = 0.5
        
        # 3. Common AI phrases
        ai_phrases = [
            'furthermore', 'moreover', 'additionally', 'in conclusion',
            'it is important', 'therefore', 'thus', 'consequently'
        ]
        ai_phrase_count = sum(1 for phrase in ai_phrases if phrase in text.lower())
        ai_phrase_density = ai_phrase_count / len(sentences) if sentences else 0
        
        # 4. Repetition score
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        if trigrams:
            trigram_counts = Counter(trigrams)
            repeated_trigrams = sum(1 for count in trigram_counts.values() if count > 1)
            repetition_score = repeated_trigrams / len(trigrams)
        else:
            repetition_score = 0
        
        return [vocab_diversity, burstiness, ai_phrase_density, repetition_score]
    
    def predict(self, text):
        # Get statistical features
        stat_features = self.extract_statistical_features(text)
        
        # Try transformer prediction
        transformer_prob = 0.5  # Default neutral
        
        if self.model and self.tokenizer:
            try:
                # Tokenize and predict
                inputs = self.tokenizer(
                    text, 
                    max_length=512, 
                    truncation=True, 
                    padding=True, 
                    return_tensors="pt"
                )
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    transformer_prob = outputs.item()
                    
            except Exception as e:
                print(f"Transformer prediction failed: {e}", file=sys.stderr)
        
        # Combine predictions (weighted ensemble)
        stat_score = np.mean(stat_features)  # Simple average of statistical features
        
        # Weighted combination: 70% transformer, 30% statistical
        if self.model:
            final_prob = 0.7 * transformer_prob + 0.3 * stat_score
        else:
            # Fallback to statistical only with enhanced weighting
            final_prob = stat_score
        
        # Determine confidence
        confidence_score = abs(final_prob - 0.5) * 2  # Distance from neutral
        
        if confidence_score > 0.6:
            confidence = "High"
        elif confidence_score > 0.3:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        return {
            'probability': final_prob,
            'confidence': confidence,
            'breakdown': {
                'transformer_score': transformer_prob,
                'vocabulary_diversity': stat_features[0],
                'sentence_burstiness': stat_features[1],
                'ai_phrases': stat_features[2],
                'repetition_patterns': stat_features[3],
                'statistical_score': stat_score
            }
        }

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        text = data.get('text', '')
        
        if not text:
            print(json.dumps({'error': 'No text provided'}))
            return
        
        # Initialize detector
        detector = HybridAIDetector()
        
        # Get prediction
        result = detector.predict(text)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
        
        await fs.writeFile(this.pythonScript, pythonCode);
        console.log('✅ Python AI detection script created');
    }
}

module.exports = TransformerDetector;
