const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const CONVERTAPI_KEY = process.env.CONVERTAPI_KEY;

// Helper to create logs
const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');
function logConversion(status, type, ip, filename, msg = '') {
    const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
    fs.appendFile(LOG_FILE, line, () => { });
}

// Controller for Image to Image conversion
exports.imageToImage = async (req, res) => {
    console.log('🖼️ Starting Image-to-Image conversion...');

    if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

    const ip = req.ip;
    const inPath = req.file.path;
    const inputExtension = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const targetFormat = req.body.targetFormat; // Get target format from frontend

    if (!targetFormat) {
        return res.status(400).json({ error: 'Target format not specified.' });
    }

    // Validate supported output formats
    const supportedOutputFormats = ['jpg', 'png', 'webp', 'tiff'];
    if (!supportedOutputFormats.includes(targetFormat)) {
        return res.status(400).json({
            error: 'Unsupported output format',
            supportedFormats: supportedOutputFormats
        });
    }


    try {
        console.log('🖼️ Converting:', req.file.originalname);
        console.log('🖼️ From format:', inputExtension);
        console.log('🖼️ To format:', targetFormat);
        console.log('🔑 API Key loaded:', CONVERTAPI_KEY ? 'YES' : 'NO');

        // Build ConvertAPI endpoint - Fix format mapping
        let apiFormat = targetFormat;
        if (targetFormat === 'jpeg') {
            apiFormat = 'jpg';  // ConvertAPI uses 'jpg' not 'jpeg'
        }

        const endpoint = `https://v2.convertapi.com/convert/${inputExtension}/to/${apiFormat}`;
        console.log('🌐 Using endpoint:', endpoint);

        // Create FormData
        const form = new FormData();
        form.append('File', fs.createReadStream(inPath), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        console.log('📤 Sending request to ConvertAPI...');

        // Send request to ConvertAPI
        const response = await axios({
            method: 'POST',
            url: endpoint,
            headers: {
                'Authorization': `Bearer ${CONVERTAPI_KEY}`,
                ...form.getHeaders()
            },
            data: form,
            timeout: 45000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('📥 Response received, status:', response.status);

        if (response.status === 200 && response.data) {
            const responseData = response.data;

            if (!responseData.Files || !responseData.Files[0]) {
                throw new Error('Invalid ConvertAPI response - missing Files array');
            }

            // FIX: Get the first file object, not the array
            const file = responseData.Files[0];

            // Debug logs for the actual file object
            console.log('🔍 ConvertAPI Response Keys:', Object.keys(responseData));
            console.log('🔍 File Info:', {
                FileName: file.FileName,
                FileExt: file.FileExt,
                FileSize: file.FileSize,
                HasFileData: !!file.FileData
            });
            console.log('🔍 File Summary:', {
                FileName: file.FileName,
                FileExt: file.FileExt,
                FileSize: file.FileSize,
                HasData: !!file.FileData
            });

            console.log('🔍 File keys available:', Object.keys(file));

            // Handle Base64 response (most common)
            if (file.FileData) {
                console.log('📄 Processing Base64 image data...');
                console.log('📄 File size:', file.FileSize, 'bytes');

                // Convert Base64 to Buffer
                const imageBuffer = Buffer.from(file.FileData, 'base64');
                const filename = `${path.parse(req.file.originalname).name}.${targetFormat}`;

                console.log('📄 Converted buffer size:', imageBuffer.length, 'bytes');
                console.log('✅ Image conversion successful!');

                logConversion('OK', 'IMAGE-TO-IMAGE', ip, req.file.originalname);

                // Send converted image to user
                res.setHeader('Content-Type', `image/${targetFormat}`);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.end(imageBuffer);

                // Cleanup
                fs.unlinkSync(inPath);
                console.log('🗑️ Cleanup completed');

            } else if (file.Url) {
                console.log('📄 Downloading from URL...');
                console.log('📄 File URL:', file.Url);

                const downloadResponse = await axios({
                    url: file.Url,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                const imageBuffer = Buffer.from(downloadResponse.data);
                const filename = `${path.parse(req.file.originalname).name}.${targetFormat}`;

                console.log('✅ Image conversion successful (downloaded from URL)!');

                logConversion('OK', 'IMAGE-TO-IMAGE', ip, req.file.originalname);

                res.setHeader('Content-Type', `image/${targetFormat}`);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.end(imageBuffer);

                // Cleanup
                fs.unlinkSync(inPath);
                console.log('🗑️ Cleanup completed');

            } else if (file.FileExt && responseData.ConversionTime) {
                // Alternative response format - try different URL construction
                console.log('📄 Trying alternative URL construction...');
                const baseUrl = 'https://v2.convertapi.com/d/';
                const fileUrl = baseUrl + responseData.ConversionId + '/' + file.FileName;

                console.log('📄 Constructed URL:', fileUrl);

                const downloadResponse = await axios({
                    url: fileUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                const imageBuffer = Buffer.from(downloadResponse.data);
                const filename = `${path.parse(req.file.originalname).name}.${targetFormat}`;

                console.log('✅ Image conversion successful (alternative URL)!');

                logConversion('OK', 'IMAGE-TO-IMAGE', ip, req.file.originalname);

                res.setHeader('Content-Type', `image/${targetFormat}`);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.end(imageBuffer);

                // Cleanup
                fs.unlinkSync(inPath);
                console.log('🗑️ Cleanup completed');

            } else {
                console.log('❌ Unknown response format. Available fields:', Object.keys(file));
                console.log('❌ File object content:', JSON.stringify(file, null, 2));
                throw new Error('ConvertAPI response in unexpected format');
            }

        } else {
            throw new Error(`ConvertAPI error: ${response.status}`);
        }

    } catch (error) {
        console.log('❌ IMAGE-TO-IMAGE CONVERSION ERROR:');
        console.log('❌ Error type:', error.constructor.name);
        console.log('❌ Error message:', error.message);

        if (error.response) {
            console.log('❌ Response status:', error.response.status);
            console.log('❌ Response statusText:', error.response.statusText);

            if (error.response.data) {
                try {
                    const errorText = Buffer.from(error.response.data).toString();
                    console.log('❌ Response body:', errorText);
                } catch (e) {
                    console.log('❌ Could not read response body');
                }
            }
        }

        if (error.code === 'ENOTFOUND') {
            console.log('❌ Network error: Cannot reach ConvertAPI');
        } else if (error.code === 'ECONNABORTED') {
            console.log('❌ Timeout error: Request took too long');
        }

        logConversion('FAIL', 'IMAGE-TO-IMAGE', ip, req.file.originalname, error.message);

        // Cleanup
        try {
            if (fs.existsSync(inPath)) {
                fs.unlinkSync(inPath);
                console.log('🗑️ Cleanup completed (error case)');
            }
        } catch (e) {
            console.log('❌ Cleanup failed:', e.message);
        }

        res.status(500).json({ error: 'Failed to convert image format.' });
    }
};

// Test function for ConvertAPI
exports.testConvertAPI = async (req, res) => {
    try {
        console.log('🧪 Testing ConvertAPI connection...');
        console.log('🧪 API Key present:', !!CONVERTAPI_KEY);
        console.log('🧪 API Key length:', CONVERTAPI_KEY?.length || 0);

        const testData = Buffer.from('ConvertAPI Test', 'utf8');

        const startTime = Date.now();
        const response = await axios({
            method: 'POST',
            url: 'https://v2.convertapi.com/convert/txt/to/pdf',
            headers: {
                'Authorization': `Bearer ${CONVERTAPI_KEY}`,
                'Content-Type': 'application/octet-stream'
            },
            data: testData,
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const duration = Date.now() - startTime;

        console.log('✅ Test successful, status:', response.status);
        console.log('⏱️ Response time:', duration + 'ms');

        res.json({
            success: true,
            message: 'ConvertAPI connection working perfectly',
            responseTime: duration + 'ms',
            apiKeyLength: CONVERTAPI_KEY?.length || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('❌ Error code:', error.code);

        let errorDetails = error.message;
        if (error.response?.status === 401) {
            errorDetails = 'Invalid API key or expired token';
        } else if (error.response?.status === 429) {
            errorDetails = 'Rate limit exceeded or out of credits';
        } else if (error.code === 'ENOTFOUND') {
            errorDetails = 'Cannot reach ConvertAPI servers (network issue)';
        }

        res.status(500).json({
            success: false,
            error: 'ConvertAPI test failed',
            details: errorDetails,
            timestamp: new Date().toISOString()
        });
    }
};
