const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class ArxivSearcher extends BaseSearcher {
    constructor() {
        super('arXiv');
        this.baseUrl = 'http://export.arxiv.org/api/query';
        this.minInterval = 3000; // 3 seconds (arXiv is strict about rate limits)
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`🔬 ${this.name} search: "${query}"`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    search_query: `all:${query}`,
                    start: 0,
                    max_results: Math.min(maxResults, 10)
                },
                timeout: 10000
            });

            // Parse XML response (arXiv returns XML)
            const xml2js = require('xml2js');
            const result = await xml2js.parseStringPromise(response.data);
            const entries = result.feed?.entry || [];

            console.log(`✅ ${this.name} found ${entries.length} results`);

            return this.formatResults(entries.map(item => ({
                title: item.title?.[0],
                url: item.id?.[0],
                snippet: item.summary?.[0]?.substring(0, 200) + '...',
                published: item.published?.[0]
            })), 'arXiv');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = ArxivSearcher;
