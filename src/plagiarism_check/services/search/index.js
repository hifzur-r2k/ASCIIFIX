const OpenAlexSearcher = require('./openAlexSearcher');         // 🆕 FREE Semantic Scholar replacement
const DoajSearcher = require('./doajSearcher');                 // 🆕 FREE CORE replacement  
const EuropePmcSearcher = require('./europePmcSearcher');        // 🆕 FREE medical/academic
const ArxivSearcher = require('./arxivSearcher');               // ✅ Already free
const PubMedSearcher = require('./pubmedSearcher');             // ✅ Already free

class SearchOrchestrator {
    constructor() {
        this.academicProviders = {
            'openalex': new OpenAlexSearcher(),           
            'doaj': new DoajSearcher(),                  
            'europe-pmc': new EuropePmcSearcher(),       
            'arxiv': new ArxivSearcher(),
            'pubmed': new PubMedSearcher()
        };
        
        this.providerWeights = {
            'openalex': 50,
            'doaj': 25,
            'europe-pmc': 15,
            'arxiv': 7,
            'pubmed': 3
        };
        
        this.providerNames = Object.keys(this.academicProviders);
        console.log(`🎓 Initialized ${this.providerNames.length} FREE academic providers: ${this.providerNames.join(', ')}`);
        console.log(`🆓 ALL PROVIDERS ARE COMPLETELY FREE - NO API KEYS NEEDED!`);
    }

    // Weighted provider selection (favors economics-strong sources)
    getWeightedAcademicProvider() {
        const totalWeight = Object.values(this.providerWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [provider, weight] of Object.entries(this.providerWeights)) {
            random -= weight;
            if (random <= 0) {
                console.log(`🎯 Selected FREE academic provider: ${provider} (weight: ${weight})`);
                return provider;
            }
        }
        
        return 'openalex'; // Fallback to best provider
    }

    async searchAcademicSources(phrase, maxRetries = 3) {
        console.log(`🎓 FREE academic search for: "${phrase}"`);
        
        const query = `"${phrase}"`;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const providerName = this.getWeightedAcademicProvider();
                const provider = this.academicProviders[providerName];

                if (!provider) {
                    console.log(`⚠️ Provider ${providerName} not available`);
                    continue;
                }

                const results = await provider.search(query, 6);
                
                if (results && results.length > 0) {
                    console.log(`✅ FREE Academic: ${providerName} found ${results.length} results`);
                    return results;
                }

            } catch (error) {
                console.log(`❌ Academic search attempt ${attempt} failed: ${error.message}`);
                continue;
            }
        }

        console.log(`⚠️ All FREE academic search attempts failed for "${phrase}"`);
        return [];
    }

    // Test all providers
    async testAllProviders() {
        console.log(`🧪 Testing all FREE academic providers...`);
        
        const testQueries = [
            'machine learning economics',
            'supply demand theory',
            'inflation monetary policy'
        ];

        for (const [name, provider] of Object.entries(this.academicProviders)) {
            try {
                console.log(`🧪 Testing ${name}...`);
                const results = await provider.search(testQueries[0], 3);
                console.log(`✅ ${name}: ${results.length} results`);
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
            }
            
            // Wait 1 second between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    getProviderStats() {
        const stats = {};
        for (const [name, provider] of Object.entries(this.academicProviders)) {
            stats[name] = {
                requestCount: provider.requestCount,
                lastRequestTime: provider.lastRequestTime,
                weight: this.providerWeights[name],
                apiKeyRequired: false, // 🆕 All are free!
                restrictions: 'None - Completely free for commercial use'
            };
        }
        return stats;
    }

    // Method to test a specific provider
    async testProvider(providerName, testQuery = "machine learning economics") {
        const provider = this.academicProviders[providerName];
        if (!provider) {
            console.log(`❌ Provider ${providerName} not found`);
            return [];
        }

        console.log(`🧪 Testing ${providerName} with query: "${testQuery}"`);
        return await provider.search(testQuery, 3);
    }
}

module.exports = SearchOrchestrator;
