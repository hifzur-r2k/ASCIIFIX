const axios = require('axios');
const BaseSearcher = require('./baseSearcher');

class PubMedSearcher extends BaseSearcher {
    constructor() {
        super('PubMed');
        this.baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.minInterval = 334; // 3 requests per second max for PubMed
    }

    async search(query, maxResults = 6) {
        try {
            await this.rateLimitDelay(this.minInterval);
            console.log(`🩺 ${this.name} search: "${query}"`);

            // First, search for IDs
            const searchResponse = await axios.get(`${this.baseUrl}/esearch.fcgi`, {
                params: {
                    db: 'pubmed',
                    term: query,
                    retmax: Math.min(maxResults, 10),
                    retmode: 'json'
                },
                timeout: 8000
            });

            const ids = searchResponse.data?.esearchresult?.idlist || [];
            if (ids.length === 0) return [];

            // Then fetch details for those IDs
            const detailsResponse = await axios.get(`${this.baseUrl}/esummary.fcgi`, {
                params: {
                    db: 'pubmed',
                    id: ids.join(','),
                    retmode: 'json'
                },
                timeout: 8000
            });

            const articles = Object.values(detailsResponse.data?.result || {})
                .filter(item => item.uid); // Filter out metadata

            console.log(`✅ ${this.name} found ${articles.length} results`);

            return this.formatResults(articles.map(item => ({
                title: item.title,
                url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}`,
                snippet: `${item.source || ''} ${item.pubdate || ''}`.trim() || 'PubMed article',
                pmid: item.uid
            })), 'PubMed');

        } catch (error) {
            console.error(`❌ ${this.name} search error:`, error.message);
            return [];
        }
    }
}

module.exports = PubMedSearcher;
