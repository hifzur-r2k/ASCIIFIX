const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');

const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');

function logConversion(status, type, ip, filename, msg = '') {
  const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
  fs.appendFile(LOG_FILE, line, () => { });
}

// ==========================================
// TEXT TO PDF (Keep working version)
// ==========================================
exports.textToPdf = (req, res) => {
  console.log('📝 Processing text conversion...');
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

    const doc = new PDFDocument({ font: 'Helvetica', fontSize: 12 });
    const chunks = [];
    doc.font('Helvetica').fontSize(12).text(fileContent, { width: 410, align: 'left' });
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `${path.parse(req.file.originalname).name}.pdf`));

  } else if (textContent && textContent.trim().length > 0) {
    const doc = new PDFDocument({ font: 'Helvetica', fontSize: 12 });
    const chunks = [];
    doc.font('Helvetica').fontSize(12).text(textContent.trim(), { width: 410, align: 'left' });
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `text.pdf`));

  } else {
    logConversion('FAIL', 'TEXT', ip, '', 'No text provided');
    res.status(400).json({ error: 'No text found.' });
  }
};

// ==========================================
// WORD TO PDF (Mammoth.js + Puppeteer - 100% Node.js!)
// ==========================================
exports.wordToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    console.log('📝 [MAMMOTH] Converting DOCX to HTML...');
    
    // Step 1: Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ path: inPath });
    const html = result.value; // The generated HTML
    
    console.log('✅ [MAMMOTH] HTML generated, length:', html.length);
    console.log('📄 [PUPPETEER] Converting HTML to PDF...');

    // Step 2: Convert HTML to PDF using Puppeteer
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Create full HTML document with styling
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          p { margin: 10px 0; line-height: 1.6; }
          h1, h2, h3 { margin: 20px 0 10px 0; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.pdf`;

    console.log('✅ [PUPPETEER] Conversion successful!');
    console.log('📄 Output size:', pdfBuffer.length, 'bytes');

    logConversion('OK', 'WORD', ip, req.file.originalname);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);

  } catch (error) {
    console.log('❌ [WORD] Error:', error.message);
    
    if (browser) await browser.close();
    
    logConversion('FAIL', 'WORD', ip, req.file.originalname, error.message);
    res.status(500).json({ 
      error: 'Failed to convert Word to PDF.',
      details: error.message
    });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

// ==========================================
// EXCEL TO PDF (XLSX + Puppeteer - 100% Node.js!)
// ==========================================
exports.excelToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    console.log('📊 [XLSX] Reading Excel file...');
    
    // Step 1: Read Excel file and convert to HTML
    const workbook = XLSX.readFile(inPath);
    let html = '';

    // Convert each sheet to HTML table
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetHtml = XLSX.utils.sheet_to_html(worksheet);
      
      html += `<h2>${sheetName}</h2>${sheetHtml}`;
      
      if (index < workbook.SheetNames.length - 1) {
        html += '<div style="page-break-after: always;"></div>';
      }
    });

    console.log('✅ [XLSX] HTML generated');
    console.log('📄 [PUPPETEER] Converting HTML to PDF...');

    // Step 2: Convert HTML to PDF using Puppeteer
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 20px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          h2 {
            margin-top: 30px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true, // Excel sheets often look better in landscape
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.pdf`;

    console.log('✅ [PUPPETEER] Excel conversion successful!');
    logConversion('OK', 'EXCEL', ip, req.file.originalname);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);

  } catch (error) {
    console.log('❌ [EXCEL] Error:', error.message);
    
    if (browser) await browser.close();
    
    logConversion('FAIL', 'EXCEL', ip, req.file.originalname, error.message);
    res.status(500).json({ error: 'Failed to convert Excel to PDF.' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

// ==========================================
// IMAGE TO PDF (Keep your working version)
// ==========================================
exports.imageToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;

  try {
    console.log('🖼️ [FREE] Starting Image conversion');
    
    const imageBuffer = await sharp(inPath)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(imageBuffer).metadata();
    const doc = new PDFDocument({ size: [metadata.width, metadata.height], margin: 0 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.image(imageBuffer, 0, 0, { width: metadata.width, height: metadata.height });
    doc.end();

    const pdfBuffer = await pdfPromise;
    const filename = `${path.parse(req.file.originalname).name}.pdf`;

    console.log('✅ [PDFKIT] Conversion successful!');
    logConversion('OK', 'IMAGE', ip, req.file.originalname);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);

  } catch (error) {
    console.log('❌ [PDFKIT] Error:', error.message);
    logConversion('FAIL', 'IMAGE', ip, req.file.originalname, error.message);
    res.status(500).json({ error: 'Failed to convert image to PDF.' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.testConvertAPI = async (req, res) => {
  res.json({
    success: true,
    message: '100% FREE Node.js converters',
    converters: {
      text: 'PDFKit',
      word: 'Mammoth.js + Puppeteer',
      excel: 'XLSX + Puppeteer',
      image: 'Sharp + PDFKit'
    }
  });
};
