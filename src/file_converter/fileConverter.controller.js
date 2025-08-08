const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');
const UPLOAD_DIR = "C:\\Users\\acerf\\OneDrive\\Desktop\\ASCIIFIX\\uploads";

// Helper to create logs (you can move or improve this as needed)
const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');
function logConversion(status, type, ip, filename, msg = '') {
  const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

// Controller for Image to PDF conversion
exports.imageToPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });
  const ip = req.ip;
  const inPath = req.file.path;
  const outPath = `${inPath}.pdf`;

  exec(`convert "${inPath}" "${outPath}"`, (err) => {
    if (err) {
      logConversion('FAIL', 'IMAGE', ip, req.file.originalname, err.message);
      fs.unlinkSync(inPath);
      return res.status(500).json({ error: 'Failed to convert image to PDF.' });
    }
    logConversion('OK', 'IMAGE', ip, req.file.originalname);
    res.download(outPath, `${path.parse(req.file.originalname).name}.pdf`, () => {
      fs.unlinkSync(inPath);
      fs.unlinkSync(outPath);
    });
  });
};

// Controller for Text to PDF conversion (file upload or text)
exports.textToPdf = (req, res) => {
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
    const doc = new PDFDocument();
    const chunks = [];
    doc.text(fileContent);
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `${path.parse(req.file.originalname).name}.pdf`));
  } else if (textContent && textContent.trim().length > 0) {
    const doc = new PDFDocument();
    const chunks = [];
    doc.text(textContent.trim());
    doc.end();
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => done(Buffer.concat(chunks), `text.pdf`));
  } else {
    logConversion('FAIL', 'TEXT', ip, '', 'No text provided');
    res.status(400).json({ error: 'No text found.' });
  }
};

// Controller for Word to PDF conversion
exports.wordToPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing or invalid.' });
  const ip = req.ip;
  const inPath = req.file.path;

  exec(`soffice --headless --convert-to pdf "${inPath}" --outdir "${UPLOAD_DIR}"`, (err) => {
    if (err) {
      logConversion('FAIL', 'WORD', ip, req.file.originalname, err.message);
      fs.unlinkSync(inPath);
      return res.status(500).json({ error: 'Failed to convert Word to PDF.' });
    }
    const resultPdf = inPath.replace(/\.(docx?|DOCX?)$/, '.pdf');
    logConversion('OK', 'WORD', ip, req.file.originalname);
    res.download(resultPdf, `${path.parse(req.file.originalname).name}.pdf`, () => {
      try {
        fs.unlinkSync(inPath);
        fs.unlinkSync(resultPdf);
      } catch (e) {}
    });
  });
};

// Controller for Excel to PDF conversion
// snippet inside fileConverter.controller.js (replace excelToPdf)
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Unified upload directory
// const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Detect OS and set LibreOffice command path
let sofficeCommand = 'soffice';
if (process.platform === 'win32') {
    // Default install location for Windows LibreOffice
    const possiblePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    if (fs.existsSync(possiblePath)) {
        sofficeCommand = `"${possiblePath}"`;
    }
}

async function convertToPDF(inputFileName, outputFileName) {
    return new Promise((resolve, reject) => {
        const absoluteInput = path.resolve(UPLOAD_DIR, inputFileName);
        const absoluteOutputDir = path.resolve(UPLOAD_DIR);

        if (!fs.existsSync(absoluteInput)) {
            return reject(new Error(`Input file not found: ${absoluteInput}`));
        }

        const cmd = `${sofficeCommand} --headless --convert-to pdf "${absoluteInput}" --outdir "${absoluteOutputDir}"`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                console.error('LibreOffice stderr:', stderr);
            }
            console.log('LibreOffice stdout:', stdout);

            const finalPDF = path.join(absoluteOutputDir, outputFileName);
            if (!fs.existsSync(finalPDF)) {
                return reject(new Error(`PDF not created at: ${finalPDF}`));
            }

            resolve(finalPDF);
        });
    });
}

module.exports = { convertToPDF };
