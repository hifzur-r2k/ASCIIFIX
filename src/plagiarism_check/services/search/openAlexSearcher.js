const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class OpenAlexSearcher extends BaseSearcher {
    constructor() {
        super('OpenAlex');
        this.baseUrl = 'https://api.openalex.org/works';
        this.minInterval = 100;
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`🌟 ${this.name} search: "${query}"`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    search: query,
                    per_page: Math.min(maxResults, 25),
                    filter: 'is_oa:true',
                    sort: 'cited_by_count:desc',
                    mailto: 'asciifix.dev@gmail.com'
                },
                timeout: 8000,
                headers: {
                    'User-Agent': 'ASCIIFIX-PlagiarismChecker/8.0'
                }
            });

            const results = response.data.results || [];
            console.log(`✅ ${this.name} found ${results.length} results`);

            return this.formatResults(results.map(item => ({
                title: item.title,
                url: item.primary_location?.landing_page_url || item.doi || '#',
                snippet: item.abstract || `Academic paper with ${item.cited_by_count} citations`,
                year: item.publication_year,
                citations: item.cited_by_count,
                authors: item.authorships?.slice(0, 3).map(a => a.author?.display_name).join(', '),
                isOpenAccess: item.open_access?.is_oa || false
            })), 'OpenAlex');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = OpenAlexSearcher;