const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class DoajSearcher extends BaseSearcher {
    constructor() {
        super('DOAJ');
        this.baseUrl = 'https://doaj.org/api/v2/search/articles';
        this.minInterval = 500; // Conservative rate limiting
        // No API key needed!
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`📖 ${this.name} search: "${query}"`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    ref: 'ASCIIFIX', // Optional but good practice
                    query: query,
                    pageSize: Math.min(maxResults, 10),
                    page: 1
                },
                timeout: 8000,
                headers: {
                    'User-Agent': 'ASCIIFIX-PlagiarismChecker/8.0'
                }
            });

            const results = response.data.results || [];
            console.log(`✅ ${this.name} found ${results.length} results`);

            return this.formatResults(results.map(item => ({
                title: item.bibjson?.title,
                url: item.bibjson?.link?.[0]?.url || '#',
                snippet: item.bibjson?.abstract || 'Open access academic article',
                journal: item.bibjson?.journal?.title,
                year: item.bibjson?.year
            })), 'DOAJ');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = DoajSearcher;
