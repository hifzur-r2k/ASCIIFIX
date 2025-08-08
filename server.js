const express = require('express');
const path = require('path');
const fileConverterRoutes = require('./src/file_converter/fileConverter.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve homepage (adjust in case your homepage is elsewhere)
app.use('/', express.static(path.join(__dirname, 'public')));

// Serve static frontend per tool (example)
app.use('/file_converter', express.static(path.join(__dirname, 'public/file_converter')));

// Mount File Converter API routes
app.use('/convert', fileConverterRoutes);

const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const LOGS_DIR = path.join(__dirname, 'logs');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });


// Add your other tools' routers similarly...

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
