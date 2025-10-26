const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { PDFDocument: PDFLib } = require('pdf-lib');
const archiver = require('archiver');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const ExcelJS = require('exceljs');
const Tesseract = require('tesseract.js');
const { execSync } = require('child_process');
const { fromPath } = require('pdf2pic');


// Platform detection
const isWindows = process.platform === 'win32';
const isProduction = process.env.NODE_ENV === 'production';

// Dynamic Puppeteer import
let puppeteer;
let chromium;

if (isWindows && !isProduction) {
  puppeteer = require('puppeteer');
} else {
  puppeteer = require('puppeteer-core');
  chromium = require('@sparticuz/chromium');
}

const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');

function logConversion(status, type, ip, filename, msg = '') {
  const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
  fs.appendFile(LOG_FILE, line, () => { });
}

async function launchBrowser() {
  if (isWindows && !isProduction) {
    console.log('💻 Using Windows Chromium');
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } else {
    console.log('🐧 Using Linux Chromium');
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
}

// ==========================================
// TEXT CONVERSIONS
// ==========================================
exports.textToPdf = (req, res) => {
  console.log('📝 TEXT → PDF');
  const ip = req.ip;
  let textContent = req.body.text || '';

  function done(buffer, filename) {
    logConversion('OK', 'TEXT-TO-PDF', ip, filename);
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(buffer);
  }

  if (req.file) {
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);
    const doc = new PDFDocument();
    const chunks = [];
    doc.text(fileContent, { width: 410 });
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `${path.parse(req.file.originalname).name}.pdf`));
  } else if (textContent.trim()) {
    const doc = new PDFDocument();
    const chunks = [];
    doc.text(textContent.trim(), { width: 410 });
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), 'text.pdf'));
  } else {
    res.status(400).json({ error: 'No text provided' });
  }
};

exports.textToWord = async (req, res) => {
  console.log('📝 TEXT → WORD');
  const ip = req.ip;
  let textContent = req.body.text || '';
  let filename = 'text.docx';

  try {
    if (req.file) {
      textContent = fs.readFileSync(req.file.path, 'utf-8');
      filename = `${path.parse(req.file.originalname).name}.docx`;
      fs.unlinkSync(req.file.path);
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const doc = new Document({
      sections: [{
        children: textContent.split('\n').map(line =>
          new Paragraph({ children: [new TextRun(line || ' ')] })
        ),
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    logConversion('OK', 'TEXT-TO-WORD', ip, filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  }
};

exports.textToExcel = async (req, res) => {
  console.log('📝 TEXT → EXCEL');
  const ip = req.ip;
  let textContent = req.body.text || '';
  let filename = 'text.xlsx';

  try {
    if (req.file) {
      textContent = fs.readFileSync(req.file.path, 'utf-8');
      filename = `${path.parse(req.file.originalname).name}.xlsx`;
      fs.unlinkSync(req.file.path);
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Text');
    textContent.split('\n').forEach(line => worksheet.addRow([line]));
    worksheet.getColumn(1).width = 80;

    const buffer = await workbook.xlsx.writeBuffer();
    logConversion('OK', 'TEXT-TO-EXCEL', ip, filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  }
};

exports.textToImage = async (req, res) => {
  console.log('📝 TEXT → IMAGE');
  const ip = req.ip;
  let textContent = req.body.text || '';
  let filename = 'text.png';
  let browser;

  try {
    if (req.file) {
      textContent = fs.readFileSync(req.file.path, 'utf-8');
      filename = `${path.parse(req.file.originalname).name}.png`;
      fs.unlinkSync(req.file.path);
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    browser = await launchBrowser();
    const page = await browser.newPage();
    const html = `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial; padding: 40px; background: white; width: 800px; }
        pre { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
      </style></head><body>
        <pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body></html>
    `;
    await page.setContent(html);
    await page.setViewport({ width: 880, height: 1200 });
    const imageBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();

    logConversion('OK', 'TEXT-TO-IMAGE', ip, filename);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(imageBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Conversion failed' });
  }
};

// ==========================================
// WORD CONVERSIONS
// ==========================================
exports.wordToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📘 WORD → PDF');
  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    const result = await mammoth.convertToHtml({ path: inPath });
    const html = `
      <!DOCTYPE html>
      <html><head><style>
        body { 
          font-family: Arial; 
          padding: 40px; 
          max-width: 800px; 
          margin: 0 auto; 
          -webkit-print-color-adjust: exact;
        }
        p { margin: 10px 0; line-height: 1.6; }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 15px 0;
          page-break-inside: auto;
        }
        table tr { 
          page-break-inside: avoid; 
          page-break-after: auto; 
        }
        table td, table th { 
          border: 1px solid #333 !important; 
          padding: 8px !important;
          text-align: left;
          vertical-align: top;
        }
        table th { 
          background-color: #f2f2f2 !important; 
          font-weight: bold;
        }
      </style></head><body>${result.value}</body></html>
    `;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });
    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.pdf`;
    logConversion('OK', 'WORD-TO-PDF', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.wordToText = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📘 WORD → TEXT');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const result = await mammoth.extractRawText({ path: inPath });
    const filename = `${path.parse(req.file.originalname).name}.txt`;
    logConversion('OK', 'WORD-TO-TEXT', ip, req.file.originalname);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(result.value);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.wordToExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📘 WORD → EXCEL');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const result = await mammoth.extractRawText({ path: inPath });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Content');
    result.value.split('\n').forEach(line => worksheet.addRow([line]));
    worksheet.getColumn(1).width = 80;

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${path.parse(req.file.originalname).name}.xlsx`;
    logConversion('OK', 'WORD-TO-EXCEL', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.wordToImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📘 WORD → IMAGE');
  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    const result = await mammoth.convertToHtml({ path: inPath });
    const html = `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; background: white; }
        p { margin: 10px 0; line-height: 1.6; }
      </style></head><body>${result.value}</body></html>
    `;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 880, height: 1200 });
    const imageBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.png`;
    logConversion('OK', 'WORD-TO-IMAGE', ip, req.file.originalname);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(imageBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

// ==========================================
// EXCEL CONVERSIONS
// ==========================================
exports.excelToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📗 EXCEL → PDF');
  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    const workbook = XLSX.readFile(inPath);
    let html = '';
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      html += `<h2>${sheetName}</h2>${XLSX.utils.sheet_to_html(worksheet)}`;
      if (index < workbook.SheetNames.length - 1) html += '<div style="page-break-after: always;"></div>';
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html><head><style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          -webkit-print-color-adjust: exact;
        }
        h2 {
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        table { 
          border-collapse: collapse !important; 
          width: 100% !important; 
          margin: 20px 0;
          page-break-inside: auto;
        }
        table tr { 
          page-break-inside: avoid; 
          page-break-after: auto; 
        }
        table th, table td { 
          border: 1.5px solid #333 !important; 
          padding: 6px 8px !important; 
          text-align: left !important;
          vertical-align: top !important;
          font-size: 11px;
        }
        table th { 
          background-color: #e8e8e8 !important; 
          font-weight: bold !important;
        }
      </style></head><body>${html}</body></html>
    `;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.pdf`;
    logConversion('OK', 'EXCEL-TO-PDF', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.excelToText = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📗 EXCEL → TEXT');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const workbook = XLSX.readFile(inPath);
    let textContent = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      textContent += `=== ${sheetName} ===\n${XLSX.utils.sheet_to_csv(worksheet)}\n\n`;
    });

    const filename = `${path.parse(req.file.originalname).name}.txt`;
    logConversion('OK', 'EXCEL-TO-TEXT', ip, req.file.originalname);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(textContent);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.excelToWord = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📗 EXCEL → WORD (with tables)');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const workbook = XLSX.readFile(inPath);
    const sections = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (data.length === 0) return;

      sections.push(
        new Paragraph({
          children: [new TextRun({ text: sheetName, bold: true, size: 28 })],
          spacing: { before: 200, after: 200 }
        })
      );

      const tableRows = data.map((row, rowIndex) => {
        const cells = row.map((cellValue) => {
          return new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(cellValue || ''), size: 20 })],
              })
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          });
        });

        return new TableRow({
          children: cells,
          tableHeader: rowIndex === 0,
        });
      });

      const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
      });

      sections.push(table);
      sections.push(new Paragraph({ children: [], spacing: { before: 200 } }));
    });

    const doc = new Document({
      sections: [{ children: sections }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${path.parse(req.file.originalname).name}.docx`;

    logConversion('OK', 'EXCEL-TO-WORD', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.excelToImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📗 EXCEL → IMAGE');
  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    const workbook = XLSX.readFile(inPath);
    let html = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      html += `<h2>${sheetName}</h2>${XLSX.utils.sheet_to_html(worksheet)}<br>`;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html><head><style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px;
          background: white;
        }
        h2 {
          margin-top: 30px;
          margin-bottom: 15px;
        }
        table { 
          border-collapse: collapse !important; 
          width: 100% !important; 
          margin: 20px 0;
        }
        table th, table td { 
          border: 2px solid #333 !important; 
          padding: 8px 10px !important; 
          text-align: left !important;
        }
        table th { 
          background-color: #e8e8e8 !important; 
          font-weight: bold !important;
        }
      </style></head><body>${html}</body></html>
    `;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1200, height: 1600 });
    const imageBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();

    const filename = `${path.parse(req.file.originalname).name}.png`;
    logConversion('OK', 'EXCEL-TO-IMAGE', ip, req.file.originalname);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(imageBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

// ==========================================
// IMAGE CONVERSIONS
// ==========================================
exports.imageToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('🖼️ IMAGE → PDF');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const imageBuffer = await sharp(inPath).resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    const metadata = await sharp(imageBuffer).metadata();
    const doc = new PDFDocument({ size: [metadata.width, metadata.height], margin: 0 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.image(imageBuffer, 0, 0, { width: metadata.width, height: metadata.height });
    doc.end();
    const pdfBuffer = await pdfPromise;
    const filename = `${path.parse(req.file.originalname).name}.pdf`;

    logConversion('OK', 'IMAGE-TO-PDF', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.imageToText = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('🖼️ IMAGE → TEXT (OCR)');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const { data: { text } } = await Tesseract.recognize(inPath, 'eng');
    const filename = `${path.parse(req.file.originalname).name}.txt`;
    logConversion('OK', 'IMAGE-TO-TEXT', ip, req.file.originalname);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(text);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'OCR failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.imageToWord = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('🖼️ IMAGE → WORD (OCR)');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const { data: { text } } = await Tesseract.recognize(inPath, 'eng');
    const doc = new Document({
      sections: [{
        children: text.split('\n').map(line => new Paragraph({ children: [new TextRun(line || ' ')] })),
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${path.parse(req.file.originalname).name}.docx`;
    logConversion('OK', 'IMAGE-TO-WORD', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'OCR failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.imageToExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('🖼️ IMAGE → EXCEL (OCR)');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const { data: { text } } = await Tesseract.recognize(inPath, 'eng');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('OCR');
    text.split('\n').forEach(line => worksheet.addRow([line]));
    worksheet.getColumn(1).width = 80;

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${path.parse(req.file.originalname).name}.xlsx`;
    logConversion('OK', 'IMAGE-TO-EXCEL', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'OCR failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

// ==========================================
// PDF CONVERSIONS (python)
// ==========================================
exports.pdfToText = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📕 PDF → TEXT');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(inPath);
    const data = await pdfParse(dataBuffer);

    const filename = `${path.parse(req.file.originalname).name}.txt`;
    logConversion('OK', 'PDF-TO-TEXT', ip, req.file.originalname);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(data.text);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Text extraction failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};


// PDF TO WORD using LibreOffice
exports.pdfToWord = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });

  const ip = req.ip;
  const inPath = req.file.path;

  try {
    console.log('📕 PDF → WORD (pdf2docx - Professional Quality)');

    const outDir = path.dirname(inPath);
    const inputFileName = path.basename(inPath);
    const baseName = path.parse(inputFileName).name;
    const expectedOutput = path.join(outDir, `${baseName}.docx`);
    const originalBaseName = path.parse(req.file.originalname).name;

    console.log('📂 Input file:', inPath);
    console.log('📂 Expected output:', expectedOutput);

    // Platform-specific Python command
    const pythonCmd = (process.platform === 'win32') ? 'python' : 'python3';

    // Path to Python script
    const scriptPath = path.join(__dirname, 'pdf_to_word.py');

    // Build command
    const command = `${pythonCmd} "${scriptPath}" "${inPath}" "${expectedOutput}"`;

    console.log('🔧 Command:', command);

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 120000 // 2 minute timeout for large files
      });

      if (stdout) console.log('✅ Python output:', stdout);
      if (stderr) console.log('⚠️ Python stderr:', stderr);

    } catch (execError) {
      console.log('❌ Python execution error:', execError.message);
      throw new Error('PDF conversion failed');
    }

    // Wait a bit for file to be fully written
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if output exists
    if (!fs.existsSync(expectedOutput)) {
      const files = fs.readdirSync(outDir);
      console.log('📁 Files in directory:', files);
      throw new Error('Conversion failed - output file not created');
    }

    const stats = fs.statSync(expectedOutput);
    console.log('✅ Found DOCX at:', expectedOutput);
    console.log('✅ DOCX created:', (stats.size / 1024).toFixed(2), 'KB');

    const filename = `${originalBaseName}.docx`;

    console.log('✅ PDF converted to Word successfully with full formatting!');
    logConversion('OK', 'PDF-TO-WORD', ip, req.file.originalname);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const docxBuffer = fs.readFileSync(expectedOutput);
    res.end(docxBuffer);

    // Cleanup
    if (fs.existsSync(expectedOutput)) fs.unlinkSync(expectedOutput);

  } catch (error) {
    console.log('❌ Error:', error.message);

    logConversion('FAIL', 'PDF-TO-WORD', ip, req.file.originalname, error.message);
    res.status(500).json({
      error: 'Failed to convert PDF to Word.',
      details: error.message
    });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};


exports.pdfToExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📕 PDF → EXCEL');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(inPath);
    const data = await pdfParse(dataBuffer);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PDF Content');
    data.text.split('\n').forEach(line => worksheet.addRow([line]));
    worksheet.getColumn(1).width = 80;

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${path.parse(req.file.originalname).name}.xlsx`;

    logConversion('OK', 'PDF-TO-EXCEL', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.status(500).json({ error: 'Conversion failed' });
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};

exports.pdfToImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  console.log('📄 PDF → IMAGE');
  const ip = req.ip;
  const inPath = req.file.path;
  let browser;

  try {
    const pdfBuffer = fs.readFileSync(inPath);
    const data = new Uint8Array(pdfBuffer);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    console.log(`📄 PDF has ${pageCount} pages`);

    browser = await launchBrowser();

    // SINGLE PAGE
    if (pageCount === 1) {
      console.log('📸 Converting single page...');

      const browserPage = await browser.newPage();
      const page = await pdfDocument.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      await browserPage.setViewport({
        width: Math.ceil(viewport.width),
        height: Math.ceil(viewport.height)
      });

      const base64PDF = pdfBuffer.toString('base64');

      await browserPage.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 0; overflow: hidden; background: white; }
            canvas { display: block; }
          </style>
        </head>
        <body>
          <canvas id="canvas"></canvas>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const base64 = '${base64PDF}';
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            
            pdfjsLib.getDocument(bytes).promise.then(pdf => {
              pdf.getPage(1).then(page => {
                const scale = 2.0;
                const viewport = page.getViewport({ scale });
                const canvas = document.getElementById('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                page.render({ canvasContext: context, viewport }).promise.then(() => {
                  document.body.setAttribute('data-ready', 'true');
                });
              });
            });
          </script>
        </body>
        </html>
      `, { waitUntil: 'domcontentloaded' });

      await browserPage.waitForFunction(() => {
        return document.body.getAttribute('data-ready') === 'true';
      }, { timeout: 10000 });

      await new Promise(resolve => setTimeout(resolve, 500));

      let screenshot = await browserPage.screenshot({ type: 'png' });

      await browser.close();
      browser = null;

      // Trim white borders
      screenshot = await sharp(screenshot).png().toBuffer();

      const filename = `${path.parse(req.file.originalname).name}.png`;
      logConversion('OK', 'PDF-TO-IMAGE', ip, req.file.originalname, '1 page');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.end(screenshot);
    }

    // MULTI-PAGE
    console.log('📦 Multi-page PDF detected...');

    const tempDir = path.join(__dirname, '../../temp', `pdf_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const imageFiles = [];
    const maxPages = Math.min(pageCount, 10);

    for (let i = 1; i <= maxPages; i++) {
      console.log(`📸 Converting page ${i}/${maxPages}...`);

      try {
        // CREATE NEW PAGE FOR EACH PDF PAGE ✅
        const browserPage = await browser.newPage();
        
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        await browserPage.setViewport({
          width: Math.ceil(viewport.width),
          height: Math.ceil(viewport.height)
        });

        const pdfLibDoc = await PDFLib.load(pdfBuffer);
        const singlePagePdf = await PDFLib.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdfLibDoc, [i - 1]);
        singlePagePdf.addPage(copiedPage);
        const singlePageBytes = await singlePagePdf.save();
        const base64PDF = Buffer.from(singlePageBytes).toString('base64');

        await browserPage.setContent(`
          <!DOCTYPE html>
          <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; background: white; }
              canvas { display: block; }
            </style>
          </head>
          <body>
            <canvas id="canvas"></canvas>
            <script>
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              const base64 = '${base64PDF}';
              const binary = atob(base64);
              const len = binary.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
              
              pdfjsLib.getDocument(bytes).promise.then(pdf => {
                pdf.getPage(1).then(page => {
                  const scale = 2.0;
                  const viewport = page.getViewport({ scale });
                  const canvas = document.getElementById('canvas');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  const context = canvas.getContext('2d');
                  page.render({ canvasContext: context, viewport }).promise.then(() => {
                    document.body.setAttribute('data-ready', 'true');
                  });
                });
              });
            </script>
          </body>
          </html>
        `, { waitUntil: 'domcontentloaded' });

        // Wait for canvas to finish rendering
        await browserPage.waitForFunction(() => {
          return document.body.getAttribute('data-ready') === 'true';
        }, { timeout: 10000 });

        await new Promise(resolve => setTimeout(resolve, 500));

        let screenshot = await browserPage.screenshot({ type: 'png' });

        // CLOSE PAGE AFTER SCREENSHOT ✅
        await browserPage.close();

        // Trim borders
        screenshot = await sharp(screenshot).trim().png().toBuffer();

        const imagePath = path.join(tempDir, `page_${i}.png`);
        fs.writeFileSync(imagePath, screenshot);
        imageFiles.push({ path: imagePath, name: `page_${i}.png` });

        console.log(`  ✅ Page ${i} saved`);

      } catch (pageError) {
        console.error(`  ❌ Error on page ${i}:`, pageError.message);
      }
    }

    await browser.close();
    browser = null;

    if (imageFiles.length === 0) {
      throw new Error('No pages could be converted');
    }

    console.log(`✅ Successfully converted ${imageFiles.length} pages`);

    const filename = `${path.parse(req.file.originalname).name}_pages.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-File-Type', 'zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
      }, 2000);
    });

    archive.pipe(res);
    for (const file of imageFiles) {
      archive.file(file.path, { name: file.name });
      console.log(`  ✅ Added ${file.name} to ZIP`);
    }
    await archive.finalize();

    logConversion('OK', 'PDF-TO-IMAGE', ip, req.file.originalname, `${imageFiles.length} pages`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (browser) await browser.close();
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF to image conversion failed', details: error.message });
    }
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
};


// POWERPOINT TO PDF
exports.powerpointToPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  console.log('📊 POWERPOINT → PDF');
  const ip = req.ip;
  const inPath = req.file.path;

  try {
    const outDir = path.dirname(inPath);
    const inputFileName = path.basename(inPath);
    const baseName = path.parse(inputFileName).name;
    const expectedOutput = path.join(outDir, `${baseName}.pdf`);

    console.log('📂 Input file:', inPath);
    console.log('📂 Expected output:', expectedOutput);

    const libreOfficePath = (process.platform === 'win32')
      ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
      : 'libreoffice';

    const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${outDir}" "${inPath}"`;

    console.log('📝 Running LibreOffice conversion...');
    console.log('🔧 Command:', command);

    try {
      execSync(command, {
        timeout: 90000, // 90 seconds for large PowerPoints
        windowsHide: true,
        stdio: 'pipe'
      });
    } catch (execError) {
      console.log('⚠️ LibreOffice command returned error, checking output...');
    }

    // Wait longer for PowerPoint conversion (it's slower)
    console.log('⏳ Waiting for LibreOffice to finish writing file...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds

    // Check multiple possible output locations
    const possibleOutputs = [
      expectedOutput,
      path.join(outDir, `${baseName}.PDF`), // Uppercase extension
      path.join(outDir, `${path.parse(req.file.originalname).name}.pdf`), // Original filename
      path.join(outDir, `${path.parse(req.file.originalname).name}.PDF`)
    ];

    let foundOutput = null;
    for (const outputPath of possibleOutputs) {
      if (fs.existsSync(outputPath)) {
        foundOutput = outputPath;
        console.log('✅ Found PDF at:', outputPath);
        break;
      }
    }

    if (!foundOutput) {
      // List all files in directory for debugging
      const filesInDir = fs.readdirSync(outDir);
      console.log('📁 Files in directory:', filesInDir);
      throw new Error('PDF conversion failed - output file not created. Check if LibreOffice is installed correctly.');
    }

    const stats = fs.statSync(foundOutput);
    console.log(`✅ PDF created: ${(stats.size / 1024).toFixed(2)} KB`);

    if (stats.size < 100) {
      throw new Error('Generated PDF is too small - conversion likely failed');
    }

    const pdfBuffer = fs.readFileSync(foundOutput);
    const filename = `${path.parse(req.file.originalname).name}.pdf`;

    // Cleanup temp files
    fs.unlinkSync(inPath);
    fs.unlinkSync(foundOutput);

    console.log('✅ PowerPoint converted to PDF successfully!');
    logConversion('OK', 'POWERPOINT-TO-PDF', ip, req.file.originalname);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (error) {
    console.log('❌ Conversion Error:', error.message);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      error: 'PowerPoint to PDF conversion failed',
      details: error.message,
      solution: 'Make sure LibreOffice is installed at: C:\\Program Files\\LibreOffice\\'
    });
  } finally {
    if (fs.existsSync(inPath)) {
      try { fs.unlinkSync(inPath); } catch (e) { }
    }
  }
};


// ==========================================
// TEST ENDPOINT
// ==========================================
exports.testConvertAPI = async (req, res) => {
  res.json({
    success: true,
    platform: process.platform,
    environment: isProduction ? 'production' : 'development',
    allFree: true,
    totalConversions: 21
  });
};