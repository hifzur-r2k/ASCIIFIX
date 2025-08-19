require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleCustomSearch() {
    console.log('🔍 Testing Google Custom Search API...');
    
    try {
        const customSearch = google.customsearch('v1');
        
        const response = await customSearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: 'Wikipedia plagiarism example',
            num: 3
        });

        if (response.data.items && response.data.items.length > 0) {
            console.log('✅ SUCCESS! Google API is working perfectly!');
            console.log(`📊 Found ${response.data.items.length} results`);
            console.log('📝 First result:', response.data.items[0].title);
            console.log('🔗 URL:', response.data.items[0].link); // ← Correct

        } else {
            console.log('⚠️  API working but no results found');
        }
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        if (error.message.includes('API key not valid')) {
            console.log('💡 Check: Is your API key correct in .env file?');
        }
        if (error.message.includes('Custom Search API has not been used')) {
            console.log('💡 Check: Did you enable Custom Search API in Google Cloud Console?');
        }
    }
}

testGoogleCustomSearch();
