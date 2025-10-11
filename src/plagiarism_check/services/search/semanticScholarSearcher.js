const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class SemanticScholarSearcher extends BaseSearcher {
    constructor() {
        super('Semantic Scholar');
        this.baseUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
        this.minInterval = 1000;
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`📖 ${this.name} search: "${query}"`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    query: query,
                    limit: Math.min(maxResults, 10),
                    fields: 'title,abstract,url,venue,year,authors'
                },
                timeout: 8000,
                headers: {
                    'User-Agent': 'ASCIIFIX-PlagiarismChecker/8.0'
                }
            });

            const results = response.data.data || [];
            console.log(`✅ ${this.name} found ${results.length} results`);

            return this.formatResults(results.map(item => ({
                title: item.title,
                url: item.url || `https://semanticscholar.org/paper/${item.paperId}`,
                snippet: item.abstract,
                year: item.year,
                venue: item.venue
            })), 'Semantic Scholar');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = SemanticScholarSearcher;
