const fs = require('fs');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { exec } = require('child_process');
const FormData = require('form-data');
require('dotenv').config();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const CONVERTAPI_KEY = process.env.CONVERTAPI_KEY;

// Helper to create logs
const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');
function logConversion(status, type, ip, filename, msg = '') {
  const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
  fs.appendFile(LOG_FILE, line, () => { });
}

// Controller for Text to PDF conversion (FIXED)
exports.textToPdf = (req, res) => {
  console.log('📝 Processing text conversion...');
  console.log('📝 req.body:', req.body);
  console.log('📝 req.file:', req.file);
  console.log('📝 Text content from body:', req.body.text);
  console.log('📝 Keys in req.body:', Object.keys(req.body));
  const ip = req.ip;
  let textContent = req.body.text || '';

  function done(buffer, filename) {
    logConversion('OK', 'TEXT', ip, filename);
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(buffer);
  }

  if (req.file) {
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);

    const doc = new PDFDocument({
      font: 'Helvetica',
      fontSize: 12
    });
    const chunks = [];

    doc.font('Helvetica')
      .fontSize(12)
      .text(fileContent, {
        width: 410,
        align: 'left'
      });

    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `${path.parse(req.file.originalname).name}.pdf`));

  } else if (textContent && textContent.trim().length > 0) {
    const doc = new PDFDocument({
      font: 'Helvetica',
      fontSize: 12
    });
    const chunks = [];

    doc.font('Helvetica')
      .fontSize(12)
      .text(textContent.trim(), {
        width: 410,
        align: 'left'
      });

    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `text.pdf`));

  } else {
    logConversion('FAIL', 'TEXT', ip, '', 'No text provided');
    res.status(400).json({ error: 'No text found.' });
  }
};

// Controller for Word to PDF conversion (ConvertAPI with FormData)
exports.wordToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;
  const fileExtension = path.extname(req.file.originalname).toLowerCase();

  try {
    console.log('📝 Starting Word conversion for:', req.file.originalname);
    console.log('🔑 API Key loaded:', CONVERTAPI_KEY ? 'YES' : 'NO');

    let endpoint;
    if (fileExtension === '.docx') {
      endpoint = 'https://v2.convertapi.com/convert/docx/to/pdf';
    } else if (fileExtension === '.doc') {
      endpoint = 'https://v2.convertapi.com/convert/doc/to/pdf';
    } else {
      throw new Error('Unsupported Word document format');
    }

    console.log('🌐 Using endpoint:', endpoint);

    // Create FormData
    console.log('📋 Creating FormData...');
    const form = new FormData();
    form.append('File', fs.createReadStream(inPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('📤 Sending request to ConvertAPI...');

    // Get JSON response from ConvertAPI
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
      console.log('✅ ConvertAPI response received');

      const responseData = response.data;

      // Check if we have the expected response structure
      if (!responseData.Files || !responseData.Files[0]) {
        throw new Error('Invalid ConvertAPI response - missing Files array');
      }

      const file = responseData.Files[0];

      // FIXED: Handle Base64 response (this is the key change!)
      if (file.FileData) {
        console.log('📄 Processing Base64 PDF data...');
        console.log('📄 Original file size from API:', file.FileSize, 'bytes');

        // Convert Base64 to Buffer - THIS IS THE IMPORTANT PART
        const pdfBuffer = Buffer.from(file.FileData, 'base64');
        const filename = `${path.parse(req.file.originalname).name}.pdf`;

        console.log('📄 Converted PDF buffer size:', pdfBuffer.length, 'bytes');
        console.log('✅ Conversion successful!');

        logConversion('OK', 'WORD', ip, req.file.originalname);

        // Send PDF to user
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(pdfBuffer);

        // Cleanup
        fs.unlinkSync(inPath);
        console.log('🗑️ Cleanup completed');

      } else {
        throw new Error('ConvertAPI response missing FileData field');
      }

    } else {
      throw new Error(`ConvertAPI error: ${response.status}`);
    }

  } catch (error) {
    console.log('❌ FULL ERROR DETAILS:');
    console.log('❌ Error message:', error.message);

    if (error.response) {
      console.log('❌ Response status:', error.response.status);
    }

    logConversion('FAIL', 'WORD', ip, req.file.originalname, error.message);

    // Cleanup
    try {
      if (fs.existsSync(inPath)) {
        fs.unlinkSync(inPath);
      }
    } catch (e) { }

    res.status(500).json({ error: 'Failed to convert Word to PDF.' });
  }
};


// Controller for Excel to PDF conversion
exports.excelToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;
  const fileExtension = path.extname(req.file.originalname).toLowerCase();

  try {
    console.log('📊 Starting Excel conversion for:', req.file.originalname);
    console.log('🔑 API Key loaded:', CONVERTAPI_KEY ? 'YES' : 'NO');
    console.log('📂 File size:', req.file.size, 'bytes');
    console.log('📂 File extension:', fileExtension);

    // Choose correct API endpoint based on file type
    let endpoint;
    if (fileExtension === '.xlsx') {
      endpoint = 'https://v2.convertapi.com/convert/xlsx/to/pdf';
    } else if (fileExtension === '.xls') {
      endpoint = 'https://v2.convertapi.com/convert/xls/to/pdf';
    } else if (fileExtension === '.xlsm') {
      endpoint = 'https://v2.convertapi.com/convert/xlsm/to/pdf';
    } else if (fileExtension === '.csv') {
      endpoint = 'https://v2.convertapi.com/convert/csv/to/pdf';
    } else if (fileExtension === '.xlsb') {
      endpoint = 'https://v2.convertapi.com/convert/xlsb/to/pdf';
    } else if (fileExtension === '.xlt') {
      endpoint = 'https://v2.convertapi.com/convert/xlt/to/pdf';
    } else if (fileExtension === '.xltx') {
      endpoint = 'https://v2.convertapi.com/convert/xltx/to/pdf';
    } else {
      throw new Error('Unsupported Excel document format');
    }

    console.log('🌐 Using endpoint:', endpoint);

    // Create FormData (same approach as Word)
    console.log('📋 Creating FormData...');
    const form = new FormData();

    // Check if file exists before creating stream
    if (!fs.existsSync(inPath)) {
      throw new Error('Uploaded file not found');
    }

    form.append('File', fs.createReadStream(inPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('📤 Sending request to ConvertAPI...');

    // Send request to ConvertAPI (same as Word)
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
      console.log('✅ ConvertAPI response received');

      const responseData = response.data;

      if (!responseData.Files || !responseData.Files[0]) {
        throw new Error('Invalid ConvertAPI response - missing Files array');
      }

      const file = responseData.Files[0];

      // Handle Base64 response (same as Word conversion)
      if (file.FileData) {
        console.log('📄 Processing Base64 PDF data...');
        console.log('📄 Original file size from API:', file.FileSize, 'bytes');

        // Convert Base64 to Buffer
        const pdfBuffer = Buffer.from(file.FileData, 'base64');
        const filename = `${path.parse(req.file.originalname).name}.pdf`;

        console.log('📄 Converted PDF buffer size:', pdfBuffer.length, 'bytes');
        console.log('✅ Excel conversion successful!');

        logConversion('OK', 'EXCEL', ip, req.file.originalname);

        // Send PDF to user
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(pdfBuffer);

        // Cleanup
        fs.unlinkSync(inPath);
        console.log('🗑️ Cleanup completed');

      } else {
        throw new Error('ConvertAPI response missing FileData field');
      }

    } else {
      throw new Error(`ConvertAPI error: ${response.status}`);
    }

  } catch (error) {
    console.log('❌ EXCEL CONVERSION ERROR:');
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

    logConversion('FAIL', 'EXCEL', ip, req.file.originalname, error.message);

    // Cleanup
    try {
      if (fs.existsSync(inPath)) {
        fs.unlinkSync(inPath);
      }
    } catch (e) { }

    res.status(500).json({ error: 'Failed to convert Excel to PDF.' });
  }
};

// Controller for Image to PDF conversion (ConvertAPI)
exports.imageToPdf = async (req, res) => {
  console.log('🔥 DEBUG: IMAGE FUNCTION STARTED - IF YOU SEE THIS, FUNCTION IS CALLED');

  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;
  const fileExtension = path.extname(req.file.originalname).toLowerCase();

  try {
    console.log('🖼️ Starting Image conversion for:', req.file.originalname);
    console.log('🔑 API Key loaded:', CONVERTAPI_KEY ? 'YES' : 'NO');
    console.log('📂 File size:', req.file.size, 'bytes');
    console.log('📂 File extension:', fileExtension);

    // Choose correct API endpoint based on file type
    let endpoint;
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      endpoint = 'https://v2.convertapi.com/convert/jpg/to/pdf';
    } else if (fileExtension === '.png') {
      endpoint = 'https://v2.convertapi.com/convert/png/to/pdf';
    } else if (fileExtension === '.gif') {
      endpoint = 'https://v2.convertapi.com/convert/gif/to/pdf';
    } else if (fileExtension === '.bmp') {
      endpoint = 'https://v2.convertapi.com/convert/bmp/to/pdf';
    } else if (fileExtension === '.tiff' || fileExtension === '.tif') {
      endpoint = 'https://v2.convertapi.com/convert/tiff/to/pdf';
    } else if (fileExtension === '.webp') {
      endpoint = 'https://v2.convertapi.com/convert/webp/to/pdf';
    } else {
      throw new Error('Unsupported image format');
    }

    console.log('🌐 Using endpoint:', endpoint);

    // Create FormData (same approach as Word/Excel)
    console.log('📋 Creating FormData...');
    const form = new FormData();

    // Check if file exists before creating stream
    if (!fs.existsSync(inPath)) {
      throw new Error('Uploaded file not found');
    }

    form.append('File', fs.createReadStream(inPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('📤 Sending request to ConvertAPI...');

    // Send request to ConvertAPI (same as Word/Excel)
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
      console.log('✅ ConvertAPI response received');

      const responseData = response.data;

      if (!responseData.Files || !responseData.Files[0]) {
        throw new Error('Invalid ConvertAPI response - missing Files array');
      }

      const file = responseData.Files[0];

      // Handle Base64 response (same as Word/Excel conversion)
      if (file.FileData) {
        console.log('📄 Processing Base64 PDF data...');
        console.log('📄 Original file size from API:', file.FileSize, 'bytes');

        // Convert Base64 to Buffer
        const pdfBuffer = Buffer.from(file.FileData, 'base64');
        const filename = `${path.parse(req.file.originalname).name}.pdf`;

        console.log('📄 Converted PDF buffer size:', pdfBuffer.length, 'bytes');
        console.log('✅ Image conversion successful!');

        logConversion('OK', 'IMAGE', ip, req.file.originalname);

        // Send PDF to user
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(pdfBuffer);

        // Cleanup
        fs.unlinkSync(inPath);
        console.log('🗑️ Cleanup completed');

      } else {
        throw new Error('ConvertAPI response missing FileData field');
      }

    } else {
      throw new Error(`ConvertAPI error: ${response.status}`);
    }

  } catch (error) {
    console.log('❌ IMAGE CONVERSION ERROR:');
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

    logConversion('FAIL', 'IMAGE', ip, req.file.originalname, error.message);

    // Cleanup
    try {
      if (fs.existsSync(inPath)) {
        fs.unlinkSync(inPath);
        console.log('🗑️ Cleanup completed (error case)');
      }
    } catch (e) {
      console.log('❌ Cleanup failed:', e.message);
    }

    res.status(500).json({ error: 'Failed to convert image to PDF.' });
  }
};

// ConvertAPI test function (ADD THIS TO THE END OF YOUR CONTROLLER FILE)
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



