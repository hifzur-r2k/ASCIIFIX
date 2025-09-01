const SemanticScholarSearcher = require('./semanticScholarSearcher');
const ArxivSearcher = require('./arxivSearcher');
const PubMedSearcher = require('./pubmedSearcher');

class SearchOrchestrator {
    constructor() {
        this.academicProviders = {
            'semantic-scholar': new SemanticScholarSearcher(),
            'arxiv': new ArxivSearcher(),
            'pubmed': new PubMedSearcher()
        };
        
        this.providerNames = Object.keys(this.academicProviders);
        console.log(`🎓 Initialized ${this.providerNames.length} academic providers: ${this.providerNames.join(', ')}`);
    }

    getRandomAcademicProvider() {
        const randomIndex = Math.floor(Math.random() * this.providerNames.length);
        return this.providerNames[randomIndex];
    }

    async searchAcademicSources(phrase, maxRetries = 3) {
        console.log(`🎓 Academic search for: "${phrase}"`);
        
        const query = `"${phrase}"`;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const providerName = this.getRandomAcademicProvider();
                const provider = this.academicProviders[providerName];

                if (!provider) {
                    console.log(`⚠️ Provider ${providerName} not available`);
                    continue;
                }

                const results = await provider.search(query, 6);
                
                if (results && results.length > 0) {
                    console.log(`✅ Academic: ${providerName} found ${results.length} results`);
                    return results;
                }

            } catch (error) {
                console.log(`❌ Academic search attempt ${attempt} failed: ${error.message}`);
                continue;
            }
        }

        console.log(`⚠️ All academic search attempts failed for "${phrase}"`);
        return [];
    }

    getProviderStats() {
        const stats = {};
        for (const [name, provider] of Object.entries(this.academicProviders)) {
            stats[name] = {
                requestCount: provider.requestCount,
                lastRequestTime: provider.lastRequestTime
            };
        }
        return stats;
    }

    // Method to test a specific provider
    async testProvider(providerName, testQuery = "machine learning") {
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
