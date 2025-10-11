import sys
import json
import time
import re
import math
import numpy as np
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

# Try to import neural libraries
try:
    from transformers import GPT2LMHeadModel, GPT2TokenizerFast
    import torch
    from sentence_transformers import SentenceTransformer
    NEURAL_AVAILABLE = True
    print("🧠 Neural libraries loaded successfully", file=sys.stderr)
except ImportError as e:
    NEURAL_AVAILABLE = False
    print(f"⚠️ Neural libraries not available: {e}", file=sys.stderr)
    print("📊 Falling back to enhanced statistical analysis", file=sys.stderr)

print("🐍 Advanced Hybrid Neural AI Detector Starting...", file=sys.stderr)

class HybridNeuralAIDetector:
    """Advanced hybrid AI detection using neural + statistical + style methods"""
    
    def __init__(self):
        print("🔧 Initializing advanced hybrid neural detector...", file=sys.stderr)
        
        # Enhanced AI detection patterns (comprehensive academic + conversational)
        self.ai_phrases = [
            'furthermore', 'moreover', 'additionally', 'in conclusion', 'therefore',
            'thus', 'hence', 'consequently', 'in summary', 'as a result',
            'on the other hand', 'in contrast', 'similarly', 'likewise',
            'for instance', 'for example', 'such as', 'in particular',
            'it is important to note', 'it should be noted', 'as mentioned',
            'as previously stated', 'in other words', 'to summarize', 
            'it can be argued', 'it is worth noting', 'it is evident that',
            'research indicates', 'studies suggest', 'analysis reveals',
            'findings demonstrate', 'results show', 'data indicates',
            # Additional academic AI phrases
            'based on the analysis', 'the results indicate', 'it can be concluded',
            'the findings suggest', 'according to research', 'studies have shown',
            'evidence suggests', 'research demonstrates', 'analysis shows',
            # Conversational AI patterns
            'it\'s worth mentioning', 'let me explain', 'here\'s the thing',
            'what\'s interesting is', 'the key point is', 'importantly'
        ]
        
        # Initialize neural components
        self.neural_ready = False
        if NEURAL_AVAILABLE:
            self.setup_neural_models()
    
    def setup_neural_models(self):
        """Initialize neural models for advanced detection"""
        try:
            print("📚 Loading neural models...", file=sys.stderr)
            
            # Load sentence transformer for semantic analysis
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Sentence transformer loaded", file=sys.stderr)
            
            # Load GPT-2 for perplexity calculation
            self.gpt2_model = GPT2LMHeadModel.from_pretrained('gpt2')
            self.gpt2_tokenizer = GPT2TokenizerFast.from_pretrained('gpt2')
            self.gpt2_model.eval()
            
            # Set pad token
            if self.gpt2_tokenizer.pad_token is None:
                self.gpt2_tokenizer.pad_token = self.gpt2_tokenizer.eos_token
            
            print("✅ GPT-2 perplexity model loaded", file=sys.stderr)
            self.neural_ready = True
            
        except Exception as e:
            print(f"❌ Error loading neural models: {e}", file=sys.stderr)
            self.neural_ready = False
    
    def detect(self, text):
        """Main detection method using advanced hybrid approach"""
        print(f"🔍 Analyzing text: {text[:50]}...", file=sys.stderr)
        start_time = time.time()
        
        # 1. Statistical Analysis (enhanced existing method)
        statistical_features = self.extract_statistical_features(text)
        statistical_score = self.calculate_statistical_probability(statistical_features)
        
        # 2. Neural Analysis (advanced methods)
        if self.neural_ready:
            print("🧠 Performing neural analysis...", file=sys.stderr)
            perplexity_score = self.calculate_perplexity_score(text)
            coherence_score = self.analyze_semantic_coherence(text)
            neural_embedding_score = self.analyze_neural_embeddings(text)
        else:
            print("📊 Neural models unavailable, using statistical + style", file=sys.stderr)
            perplexity_score = 50
            coherence_score = 50
            neural_embedding_score = 50
        
        # 3. Writing Style Analysis (new advanced method)
        print("✍️ Analyzing writing style patterns...", file=sys.stderr)
        style_score = self.analyze_writing_style(text)
        
        # 4. Ensemble Prediction (combine all methods)
        ensemble_scores = {
            'statistical': statistical_score,
            'perplexity': perplexity_score,
            'coherence': coherence_score,
            'neural_embedding': neural_embedding_score,
            'writing_style': style_score
        }
        
        raw_probability = self.ensemble_prediction(ensemble_scores)
        
        # 5. Enhanced Calibration based on text characteristics
        word_count = len(self.tokenize_words(text))
        ai_probability = self.calibrate_prediction(raw_probability, len(text), word_count)
        
        # 6. Enhanced Confidence calculation
        confidence = self.calculate_confidence(ai_probability, ensemble_scores)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        print(f"🎯 Advanced hybrid detection complete: {ai_probability}%", file=sys.stderr)
        
        # Enhanced output format with complete analysis breakdown
        return {
            'probability': round(ai_probability, 1),
            'confidence': confidence,
            'breakdown': {
                'transformer_score': perplexity_score if self.neural_ready else None,
                'statistical_score': round(statistical_score, 1),
                'feature_breakdown': {k: round(v, 1) for k, v in statistical_features.items()},
                'neural_breakdown': {
                    'perplexity_score': round(perplexity_score, 1),
                    'coherence_score': round(coherence_score, 1),
                    'embedding_score': round(neural_embedding_score, 1),
                    'style_score': round(style_score, 1),
                    'ensemble_score': round(raw_probability, 1)
                },
                'method': 'Advanced Hybrid Neural + Statistical + Style Analysis'
            },
            'model_info': {
                'transformer_available': self.neural_ready,
                'model_name': 'GPT-2 + SentenceTransformer + Statistical + Style' if self.neural_ready else 'Enhanced Statistical + Style',
                'fallback_mode': not self.neural_ready,
                'method': 'Advanced Hybrid Detection v2.0' if self.neural_ready else 'Enhanced Statistical + Style Detection v2.0'
            },
            'processing_time': processing_time
        }
    
    # PHASE 2: ADVANCED PERPLEXITY ANALYSIS
    def split_into_chunks(self, text, max_length=256):
        """Split text into smaller chunks for better perplexity analysis"""
        words = text.split()
        chunks = []
        current_chunk = []
        
        for word in words:
            current_chunk.append(word)
            if len(' '.join(current_chunk)) > max_length:
                chunks.append(' '.join(current_chunk[:-1]))
                current_chunk = [word]
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks if chunks else [text]
    
    def calculate_perplexity_score(self, text):
        """Enhanced perplexity calculation with chunking - KEY AI DETECTION METRIC"""
        if not self.neural_ready:
            return 50
        
        try:
            # Split text into manageable chunks for better analysis
            chunks = self.split_into_chunks(text, max_length=256)
            perplexities = []
            
            for chunk in chunks:
                inputs = self.gpt2_tokenizer(chunk, return_tensors='pt', truncation=True, max_length=256)
                with torch.no_grad():
                    outputs = self.gpt2_model(**inputs, labels=inputs['input_ids'])
                    loss = outputs.loss
                    perplexity = torch.exp(loss).item()
                    perplexities.append(perplexity)
            
            # Average perplexity across all chunks for robust scoring
            avg_perplexity = np.mean(perplexities)
            print(f"🔢 Average perplexity across {len(chunks)} chunks: {avg_perplexity:.2f}", file=sys.stderr)
            
            # Enhanced scoring with tighter thresholds
            return self.map_perplexity_to_score(avg_perplexity)
            
        except Exception as e:
            print(f"❌ Enhanced perplexity calculation failed: {e}", file=sys.stderr)
            return 50
    
    def map_perplexity_to_score(self, avg_perplexity):
        """Convert average perplexity to AI probability score with enhanced thresholds"""
        if avg_perplexity < 20:
            return 98  # Almost certainly AI - extremely low perplexity
        elif avg_perplexity < 30:
            return 92  # Very likely AI - low perplexity
        elif avg_perplexity < 45:
            return 80  # Likely AI - moderate-low perplexity
        elif avg_perplexity < 65:
            return 40  # Uncertain - moderate perplexity
        elif avg_perplexity < 100:
            return 22  # Likely human - higher perplexity
        else:
            return 10  # Almost certainly human - very high perplexity
    
    # PHASE 3: WRITING STYLE ANALYSIS
    def analyze_writing_style(self, text):
        """Analyze writing style patterns specific to AI vs human writing"""
        try:
            sentences = self.tokenize_sentences(text)
            if len(sentences) < 3:
                return 50
            
            # 1. Sentence starter variety (AI tends to be more repetitive)
            starters = [s.split()[0].lower() for s in sentences if s.split()]
            starter_diversity = len(set(starters)) / len(starters) if starters else 0.5
            
            # 2. Punctuation patterns analysis
            punct_variety_score = self.analyze_punctuation_variety(text)
            
            # 3. Paragraph structure uniformity
            paragraphs = text.split('\n\n')
            paragraph_uniformity_score = self.analyze_paragraph_uniformity(paragraphs)
            
            # 4. Word choice sophistication patterns
            sophistication_score = self.analyze_word_sophistication(text)
            
            # Combine all style indicators with optimized weights
            style_score = (
                (1 - starter_diversity) * 25 +  # Less variety = more AI-like
                punct_variety_score * 20 +       # Limited punctuation = AI-like
                paragraph_uniformity_score * 30 + # Too uniform = AI-like
                sophistication_score * 25        # Consistent sophistication = AI-like
            )
            
            print(f"✍️ Style analysis - starters: {starter_diversity:.2f}, punct: {punct_variety_score:.1f}, para: {paragraph_uniformity_score:.1f}, soph: {sophistication_score:.1f}", file=sys.stderr)
            
            return min(100, max(0, style_score))
            
        except Exception as e:
            print(f"❌ Style analysis failed: {e}", file=sys.stderr)
            return 50
    
    def analyze_punctuation_variety(self, text):
        """AI tends to use limited punctuation variety"""
        punct_chars = ['.', ',', '!', '?', ';', ':', '-', '(', ')', '"', "'"]
        used_punct = sum(1 for p in punct_chars if p in text)
        max_punct = len(punct_chars)
        
        variety_ratio = used_punct / max_punct
        # Lower variety suggests AI (inverted scoring)
        return max(0, (0.7 - variety_ratio) * 100)
    
    def analyze_paragraph_uniformity(self, paragraphs):
        """AI paragraphs tend to be more uniform in length"""
        if len(paragraphs) < 2:
            return 50
        
        lengths = [len(p.split()) for p in paragraphs if p.strip()]
        if not lengths:
            return 50
        
        avg_length = np.mean(lengths)
        std_length = np.std(lengths)
        
        if avg_length == 0:
            return 50
        
        cv = std_length / avg_length  # Coefficient of variation
        # Lower variation = more uniform = more AI-like
        return max(0, min(100, (0.5 - cv) * 200))
    
    def analyze_word_sophistication(self, text):
        """Analyze vocabulary sophistication consistency patterns"""
        words = self.tokenize_words(text)
        if len(words) < 20:
            return 50
        
        # Count sophisticated words (7+ characters)
        long_words = [w for w in words if len(w) >= 7]
        sophistication_ratio = len(long_words) / len(words)
        
        # AI often maintains consistent vocabulary sophistication
        if sophistication_ratio > 0.35:
            return 85  # Very high sophistication - likely AI
        elif sophistication_ratio > 0.25:
            return 70  # High sophistication - possibly AI
        elif sophistication_ratio > 0.15:
            return 45  # Medium sophistication - uncertain
        else:
            return 25  # Low sophistication - more human-like
    
    def analyze_semantic_coherence(self, text):
        """Analyze semantic coherence using sentence embeddings"""
        if not self.neural_ready:
            return 50
        
        try:
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip() and len(s) > 10]
            
            if len(sentences) < 2:
                return 50
            
            # Get sentence embeddings
            embeddings = self.sentence_model.encode(sentences)
            
            # Calculate average cosine similarity between adjacent sentences
            similarities = []
            for i in range(len(embeddings) - 1):
                sim = np.dot(embeddings[i], embeddings[i+1]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i+1])
                )
                similarities.append(sim)
            
            avg_similarity = np.mean(similarities)
            print(f"🔗 Average semantic similarity: {avg_similarity:.3f}", file=sys.stderr)
            
            # AI text often has unnaturally high semantic coherence
            if avg_similarity > 0.85:
                return 92  # Extremely coherent - very likely AI
            elif avg_similarity > 0.75:
                return 78  # Very coherent - likely AI
            elif avg_similarity > 0.6:
                return 58  # Quite coherent - possibly AI
            elif avg_similarity > 0.4:
                return 32  # Normal coherence - likely human
            else:
                return 18  # Low coherence - very likely human
                
        except Exception as e:
            print(f"❌ Semantic coherence analysis failed: {e}", file=sys.stderr)
            return 50
    
    def analyze_neural_embeddings(self, text):
        """Advanced neural embedding analysis with enhanced heuristics"""
        if not self.neural_ready:
            return 50
        
        try:
            # Get text embedding
            embedding = self.sentence_model.encode([text])[0]
            
            # Analyze embedding characteristics
            embedding_norm = np.linalg.norm(embedding)
            embedding_mean = np.mean(embedding)
            embedding_std = np.std(embedding)
            
            print(f"🧮 Embedding stats - norm: {embedding_norm:.3f}, mean: {embedding_mean:.3f}, std: {embedding_std:.3f}", file=sys.stderr)
            
            # Enhanced heuristics based on AI vs human embedding patterns
            score = 50  # Start neutral
            
            # Adjust based on embedding norm (AI text often has different distribution)
            if embedding_norm > 1.15:
                score += 20  # High norm might indicate AI
            elif embedding_norm < 0.85:
                score -= 15  # Low norm might indicate human
            
            # Adjust based on embedding distribution characteristics
            if embedding_std < 0.12:
                score += 15  # Very low variance might indicate AI consistency
            elif embedding_std > 0.28:
                score -= 10  # High variance might indicate human variability
            
            # Adjust based on mean (empirical observation)
            if abs(embedding_mean) < 0.02:
                score += 10  # Very centered might indicate AI
            
            return max(0, min(100, score))
            
        except Exception as e:
            print(f"❌ Neural embedding analysis failed: {e}", file=sys.stderr)
            return 50
    
    # PHASE 4: ENHANCED ENSEMBLE AND CALIBRATION
    def ensemble_prediction(self, scores):
        """Enhanced ensemble prediction with optimized weights"""
        if self.neural_ready:
            # Full neural ensemble with optimized weights
            weights = {
                'statistical': 0.10,         # Reduced - less reliable alone
                'perplexity': 0.45,          # Increased - most important metric
                'coherence': 0.20,           # Strong neural indicator
                'neural_embedding': 0.10,    # Supporting neural evidence
                'writing_style': 0.15        # Important style patterns
            }
        else:
            # Fallback ensemble without neural components
            weights = {
                'statistical': 0.60,         # Primary method without neural
                'writing_style': 0.40,       # Important style analysis
                'perplexity': 0.0,
                'coherence': 0.0,
                'neural_embedding': 0.0
            }
        
        weighted_score = sum(scores.get(method, 50) * weight for method, weight in weights.items())
        
        print(f"📊 Ensemble scores: {scores}", file=sys.stderr)
        print(f"⚖️ Weighted ensemble score: {weighted_score:.1f}", file=sys.stderr)
        
        # More aggressive sigmoid for clearer decision boundaries
        calibrated = 1 / (1 + math.exp(-(weighted_score - 42) / 8))  # Tighter sigmoid
        return calibrated * 100
    
    def calibrate_prediction(self, raw_probability, text_length, word_count):
        """Enhanced calibration for different text characteristics"""
        print(f"🎯 Calibrating: raw={raw_probability:.1f}%, words={word_count}", file=sys.stderr)
        
        if word_count < 30:
            # Very short texts - conservative but not too neutral
            calibrated = raw_probability * 0.75 + 20
            print(f"📏 Very short text: {calibrated:.1f}%", file=sys.stderr)
        elif word_count < 100:
            # Short texts - mild conservative adjustment
            calibrated = raw_probability * 0.9 + 10
            print(f"📏 Short text: {calibrated:.1f}%", file=sys.stderr)
        elif word_count > 300:
            # Long texts - more confident, better signal
            calibrated = raw_probability * 1.12 - 6
            print(f"📏 Long text: {calibrated:.1f}%", file=sys.stderr)
        else:
            # Medium length - slight confidence boost
            calibrated = raw_probability * 1.05 - 2
        
        return max(0, min(100, calibrated))
    
    def calculate_confidence(self, probability, ensemble_scores):
        """Enhanced confidence calculation using method agreement"""
        distance = abs(probability - 50)
        
        # Check consistency across different methods
        method_scores = list(ensemble_scores.values())
        score_std = np.std(method_scores)
        score_range = max(method_scores) - min(method_scores)
        
        # Enhanced confidence logic
        if distance > 35 and score_std < 15:
            return "High"  # Far from neutral AND methods agree strongly
        elif distance > 30 and score_std < 25:
            return "High"  # Quite far from neutral with good agreement
        elif distance > 20 and score_range < 40:
            return "Medium"  # Moderate distance with reasonable agreement
        elif distance > 10:
            return "Medium"  # Some distance from neutral
        else:
            return "Low"   # Close to neutral - uncertain
    
    # EXISTING STATISTICAL METHODS (ENHANCED)
    def extract_statistical_features(self, text):
        """Enhanced statistical feature extraction"""
        words = self.tokenize_words(text)
        sentences = self.tokenize_sentences(text)
        
        if len(words) < 10:
            return self.get_neutral_features()
        
        features = {}
        
        # Enhanced feature extraction
        features['ai_phrase_density'] = self.calculate_ai_phrase_density(text, sentences)
        features['sentence_uniformity'] = self.calculate_sentence_uniformity(sentences)
        features['vocabulary_complexity'] = self.calculate_vocabulary_complexity(words)
        features['transition_density'] = self.calculate_transition_density(text, sentences)
        features['repetition_score'] = self.calculate_repetition_patterns(words)
        
        return features
    
    def calculate_statistical_probability(self, features):
        """Enhanced statistical probability calculation"""
        # Optimized weights for statistical features
        weights = {
            'ai_phrase_density': 0.35,      # Increased - very strong indicator
            'sentence_uniformity': 0.25,    # Strong AI indicator
            'vocabulary_complexity': 0.15,  # Moderate indicator
            'transition_density': 0.20,     # Strong indicator
            'repetition_score': 0.05        # Weak indicator
        }
        
        weighted_score = sum(
            features.get(feature, 50) * weight 
            for feature, weight in weights.items()
        )
        
        # More decisive sigmoid for statistical signals
        normalized_score = 1 / (1 + math.exp(-(weighted_score - 52) / 9))
        return normalized_score * 100
    
    def calculate_ai_phrase_density(self, text, sentences):
        """Enhanced AI phrase density calculation"""
        text_lower = text.lower()
        phrase_count = 0
        
        for phrase in self.ai_phrases:
            phrase_count += len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))
        
        density = phrase_count / max(len(sentences), 1)
        return min(100, density * 180)  # Slightly adjusted multiplier
    
    def calculate_sentence_uniformity(self, sentences):
        """Enhanced sentence uniformity analysis"""
        if len(sentences) < 2:
            return 50
        
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if not lengths:
            return 50
        
        mean_length = np.mean(lengths)
        std_length = np.std(lengths)
        
        if mean_length == 0:
            return 50
        
        cv = std_length / mean_length
        # Enhanced uniformity scoring
        uniformity_score = max(0, min(100, (0.65 - cv) * 120))
        return uniformity_score
    
    def calculate_vocabulary_complexity(self, words):
        """Enhanced vocabulary complexity analysis"""
        if len(words) < 10:
            return 50
        
        unique_words = len(set(words))
        lexical_diversity = unique_words / len(words)
        avg_word_length = np.mean([len(word) for word in words])
        
        # Enhanced complexity scoring
        complexity_score = (avg_word_length / 6.5) * 50
        diversity_factor = (lexical_diversity - 0.42) * -45
        
        return max(0, min(100, complexity_score + diversity_factor + 52))
    
    def calculate_transition_density(self, text, sentences):
        """Enhanced transition density calculation"""
        transition_patterns = [
            r'\b(however|nevertheless|furthermore|moreover|therefore|thus|hence)\b',
            r'\b(in addition|in conclusion|as a result|on the other hand)\b',
            r'\b(similarly|likewise|consequently|meanwhile|thereafter|notably)\b',
            r'\b(specifically|particularly|essentially|ultimately|indeed)\b'
        ]
        
        transition_count = 0
        for pattern in transition_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            transition_count += len(matches)
        
        density = transition_count / max(len(sentences), 1)
        return min(100, density * 140)  # Adjusted multiplier
    
    def calculate_repetition_patterns(self, words):
        """Enhanced repetition pattern analysis"""
        if len(words) < 10:
            return 0
        
        # Analyze both trigrams and bigrams
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words) - 2)]
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words) - 1)]
        
        if not trigrams:
            return 0
        
        # Count repetitions in both n-grams
        trigram_counts = Counter(trigrams)
        bigram_counts = Counter(bigrams)
        
        repeated_trigrams = sum(1 for count in trigram_counts.values() if count > 1)
        repeated_bigrams = sum(1 for count in bigram_counts.values() if count > 2)
        
        trigram_score = (repeated_trigrams / len(trigrams)) * 100
        bigram_score = (repeated_bigrams / len(bigrams)) * 50
        
        return (trigram_score + bigram_score) / 2
    
    def tokenize_words(self, text):
        """Enhanced word tokenization"""
        return re.findall(r'\b\w+\b', text.lower())
    
    def tokenize_sentences(self, text):
        """Enhanced sentence tokenization"""
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def get_neutral_features(self):
        """Return neutral feature values for short text"""
        return {
            'ai_phrase_density': 50,
            'sentence_uniformity': 50,
            'vocabulary_complexity': 50,
            'transition_density': 50,
            'repetition_score': 50
        }
    
    # PHASE 5: PERFORMANCE MONITORING
    def get_detection_summary(self, result):
        """Generate detection summary for performance monitoring"""
        return {
            'probability': result['probability'],
            'confidence': result['confidence'],
            'processing_time': result['processing_time'],
            'method': result['model_info']['method'],
            'neural_available': result['model_info']['transformer_available'],
            'accuracy_indicators': {
                'high_confidence': result['confidence'] == 'High',
                'clear_decision': abs(result['probability'] - 50) > 30,
                'fast_processing': result['processing_time'] < 2000
            }
        }

def main():
    """Main execution function with enhanced error handling"""
    try:
        print("📖 Reading input...", file=sys.stderr)
        input_data = sys.stdin.read()
        
        if not input_data.strip():
            print(json.dumps({'error': 'No input provided'}))
            sys.exit(1)
        
        data = json.loads(input_data)
        text = data.get('text', '')
        
        if not text or not isinstance(text, str):
            print(json.dumps({'error': 'Invalid or missing text'}))
            sys.exit(1)
        
        print(f"🎯 Processing text with {len(text)} characters...", file=sys.stderr)
        
        detector = HybridNeuralAIDetector()
        result = detector.detect(text)
        
        # Generate performance summary
        summary = detector.get_detection_summary(result)
        print(f"📊 Detection summary: {summary['accuracy_indicators']}", file=sys.stderr)
        
        print("📤 Sending result...", file=sys.stderr)
        print(json.dumps(result))
        
    except Exception as e:
        print(f"💥 Critical error: {str(e)}", file=sys.stderr)
        print(json.dumps({'error': f'Processing failed: {str(e)}'}))
        sys.exit(1)

if __name__ == "__main__":
    main()
