class BaseSearcher {
    constructor(name) {
        this.name = name;
        this.requestCount = 0;
        this.lastRequestTime = 0;
    }

    async rateLimitDelay(minInterval) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < minInterval) {
            await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch {
            return url.split('/')[2] || url;
        }
    }

    formatResults(rawResults, source) {
        return rawResults.map(item => ({
            title: item.title || 'Untitled',
            url: item.url || item.link || '',
            snippet: item.snippet || item.abstract || item.description || '',
            displayLink: this.extractDomain(item.url || item.link || ''),
            source: source,
            ...item
        }));
    }
}

module.exports = BaseSearcher;