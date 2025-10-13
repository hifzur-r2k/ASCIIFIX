const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const LOG_FILE = path.join(__dirname, '../../logs/conversions.log');

function logConversion(status, type, ip, filename, msg = '') {
    const line = `${new Date().toISOString()} [${status}] [${type}] [${ip}] [${filename}] ${msg}\n`;
    fs.appendFile(LOG_FILE, line, () => { });
}

exports.imageToImage = async (req, res) => {
    console.log('🖼️ [NEW CODE] Starting Sharp image conversion...');
    
    if (!req.file) {
        return res.status(400).json({ error: 'File missing or invalid.' });
    }

    const ip = req.ip;
    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    let targetFormat = req.body.targetFormat;

    if (!targetFormat) {
        fs.unlinkSync(inputPath);
        return res.status(400).json({ error: 'Target format not specified.' });
    }

    targetFormat = targetFormat.toLowerCase();
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff'];

    if (!supportedFormats.includes(targetFormat)) {
        fs.unlinkSync(inputPath);
        return res.status(400).json({
            error: 'Unsupported output format',
            supportedFormats: supportedFormats
        });
    }

    try {
        console.log('🖼️ [SHARP] Converting:', originalName);
        console.log('🖼️ [SHARP] To format:', targetFormat);

        let sharpInstance = sharp(inputPath);

        // Normalize jpg to jpeg for sharp
        if (targetFormat === 'jpg') {
            targetFormat = 'jpeg';
        }

        // Apply format-specific conversion
        switch (targetFormat) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality: 90 });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ compressionLevel: 9 });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality: 90 });
                break;
            case 'tiff':
                sharpInstance = sharpInstance.tiff({ quality: 90 });
                break;
        }

        // Convert to buffer
        const outputBuffer = await sharpInstance.toBuffer();
        const filename = `${path.parse(originalName).name}.${targetFormat}`;

        console.log('✅ [SHARP] Conversion successful!');
        console.log('📄 [SHARP] Output size:', outputBuffer.length, 'bytes');

        logConversion('OK', 'IMAGE-TO-IMAGE', ip, originalName);

        // Send converted image to user
        res.setHeader('Content-Type', `image/${targetFormat}`);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(outputBuffer);

    } catch (error) {
        console.log('❌ [SHARP] CONVERSION ERROR:', error.message);
        logConversion('FAIL', 'IMAGE-TO-IMAGE', ip, originalName, error.message);
        res.status(500).json({ 
            error: 'Image conversion failed.', 
            details: error.message 
        });
    } finally {
        // Cleanup uploaded file
        try {
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
                console.log('🗑️ [SHARP] Cleanup completed');
            }
        } catch (cleanupError) {
            console.log('❌ [SHARP] Cleanup failed:', cleanupError.message);
        }
    }
};
