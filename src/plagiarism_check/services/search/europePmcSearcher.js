const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class EuropePmcSearcher extends BaseSearcher {
    constructor() {
        super('EuropePMC');
        this.baseUrl = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
        this.minInterval = 200; // 5 requests per second max
        // No API key needed!
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`🏥 ${this.name} search: "${query}"`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    query: `"${query}"`,
                    pageSize: Math.min(maxResults, 25),
                    format: 'json',
                    resultType: 'core'
                },
                timeout: 8000,
                headers: {
                    'User-Agent': 'ASCIIFIX-PlagiarismChecker/8.0'
                }
            });

            const results = response.data.resultList?.result || [];
            console.log(`✅ ${this.name} found ${results.length} results`);

            return this.formatResults(results.map(item => ({
                title: item.title,
                url: item.fullTextUrlList?.fullTextUrl?.[0]?.url || `https://europepmc.org/article/MED/${item.pmid}`,
                snippet: item.abstractText || 'Europe PMC academic article',
                pmid: item.pmid,
                source: item.source,
                isOpenAccess: item.isOpenAccess === 'Y'
            })), 'EuropePMC');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = EuropePmcSearcher;
