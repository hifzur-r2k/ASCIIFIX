class ImageConverter {
    constructor() {
        this.uploadedFiles = [];
        this.convertedFile = null;
        this.supportedFormats = ['jpg', 'png', 'webp', 'tiff'];
        this.isBatchMode = false;
        this.maxFiles = 10;

        this.initializeElements();
        this.attachEventListeners();
        this.resetToInitialState();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.chooseFileBtn = document.getElementById('chooseFileBtn');
        this.formatDropdown = document.getElementById('formatDropdown');
        this.convertButton = document.getElementById('convertButton');
        this.downloadButton = document.getElementById('downloadButton');
        this.previewArea = document.getElementById('previewArea');
        this.batchButton = document.getElementById('batchButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        // Button containers for styling
        this.convertButtonBox = document.querySelector('.convert-button-box');
        this.downloadButtonBox = document.querySelector('.download-button-box');
        this.batchButtonBox = document.querySelector('.batch-button-box');
    }

    attachEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.chooseFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));

        // Format and action events
        this.formatDropdown.addEventListener('change', () => this.updateConvertButtonState());
        this.convertButton.addEventListener('click', () => this.performConversion());
        this.downloadButton.addEventListener('click', () => this.performDownload());
        this.batchButton.addEventListener('click', () => this.toggleBatchMode());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.style.borderColor = '#000000';
        this.uploadArea.style.backgroundColor = '#f0f0f0';
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.style.borderColor = '#cccccc';
        this.uploadArea.style.backgroundColor = '#fafafa';
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.uploadArea.style.borderColor = '#cccccc';
        this.uploadArea.style.backgroundColor = '#fafafa';
        this.handleFileSelection(e.dataTransfer.files);
    }

    handleFileSelection(files) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => this.isValidImageFile(file));

        if (validFiles.length === 0) {
            alert('Please select valid image files (JPG, PNG, WEBP, GIF, TIFF, HEIC).');
            return;
        }

        if (!this.isBatchMode && validFiles.length > 1) {
            alert('Single mode: Please select only one image file.');
            return;
        }

        if (this.isBatchMode && validFiles.length > this.maxFiles) {
            alert(`Maximum ${this.maxFiles} files allowed in batch mode.`);
            return;
        }

        this.uploadedFiles = validFiles;
        this.convertedFile = null; // Reset converted file
        this.downloadButtonBox.style.display = 'none'; // Hide download button
        this.updatePreviewArea();

        this.populateFormatDropdown();
        this.updateConvertButtonState();
    }

    isValidImageFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension) && file.type.startsWith('image/');
    }

    updatePreviewArea() {
        if (this.uploadedFiles.length === 0) {
            this.previewArea.innerHTML = 'No images selected';
            this.previewArea.style.fontStyle = 'italic';
            this.previewArea.style.color = '#999999';
            return;
        }

        this.previewArea.innerHTML = '';
        this.previewArea.style.fontStyle = 'normal';
        this.previewArea.style.color = '#000000';

        if (this.uploadedFiles.length === 1) {
            // ONE image - fills entire box
            const file = this.uploadedFiles[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = document.createElement('div');
                container.className = 'single-image-container';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Preview';

                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '×';
                removeBtn.className = 'remove-btn';
                removeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 25px;
                height: 25px;
                border: 2px solid #ff0000;
                border-radius: 50%;
                background: white;
                color: #ff0000;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
            `;
                removeBtn.onclick = () => this.removeFileAtIndex(0);

                container.appendChild(img);
                container.appendChild(removeBtn);
                this.previewArea.appendChild(container);
            };
            reader.readAsDataURL(file);

        } else {
            // MULTIPLE images - grid fills box
            const grid = document.createElement('div');
            grid.className = 'preview-grid';

            this.uploadedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const item = document.createElement('div');
                    item.className = 'preview-item';

                    const fileName = file.name.length > 12 ?
                        file.name.substring(0, 8) + '...' + file.name.split('.').pop() : file.name;

                    item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" class="preview-image">
                    <div class="preview-info">
                        <div title="${file.name}">${fileName}</div>
                        <div>${this.formatFileSize(file.size)}</div>
                    </div>
                    <button class="remove-btn" onclick="imageConverter.removeFileAtIndex(${index})">×</button>
                `;

                    grid.appendChild(item);
                };
                reader.readAsDataURL(file);
            });

            this.previewArea.appendChild(grid);
        }
    }


    populateFormatDropdown() {
        this.formatDropdown.innerHTML = '<option value="">--Select Format--</option>';

        const currentFormats = [...new Set(this.uploadedFiles.map(file =>
            file.name.split('.').pop().toLowerCase()
        ))];

        this.supportedFormats.forEach(format => {
            if (!currentFormats.includes(format) || this.isBatchMode) {
                const option = document.createElement('option');
                option.value = format;
                option.textContent = format.toUpperCase();
                this.formatDropdown.appendChild(option);
            }
        });
    }



    updateConvertButtonState() {
        const hasFiles = this.uploadedFiles.length > 0;
        const hasSelectedFormat = this.formatDropdown.value !== '';
        const canConvert = hasFiles && hasSelectedFormat;

        if (canConvert) {
            this.convertButtonBox.classList.remove('disabled');
            this.convertButton.disabled = false;
        } else {
            this.convertButtonBox.classList.add('disabled');
            this.convertButton.disabled = true;
        }
    }

    async performConversion() {
        const selectedFormat = this.formatDropdown.value;

        if (!selectedFormat || this.uploadedFiles.length === 0) {
            alert('Please select files and output format.');
            return;
        }

        this.showLoadingOverlay(true);

        try {
            if (this.uploadedFiles.length === 1) {
                // Single file conversion
                const formData = new FormData();
                formData.append('file', this.uploadedFiles[0]);
                formData.append('targetFormat', selectedFormat);

                const response = await fetch('/image-convert/convert', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Conversion failed');
                }

                // Get converted image as blob
                const imageBlob = await response.blob();

                // Store for download
                this.convertedFile = {
                    blob: imageBlob,
                    filename: `${this.uploadedFiles[0].name.split('.')}.${selectedFormat}`
                };

                this.downloadButtonBox.style.display = 'block';
                alert(`Image successfully converted to ${selectedFormat.toUpperCase()}!`);

            } else {
                // Multiple files - show message for now
                alert('Batch conversion coming soon! Please convert one image at a time.');
            }

        } catch (error) {
            console.error('Conversion error:', error);

            let errorMessage = 'Conversion failed: ';
            if (error.message.includes('File too large')) {
                errorMessage += 'File too large. Maximum size is 20MB.';
            } else if (error.message.includes('Invalid file type')) {
                errorMessage += 'Unsupported image format.';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    performDownload() {
        if (!this.convertedFile) {
            alert('No converted file to download.');
            return;
        }

        // Create download link
        const url = window.URL.createObjectURL(this.convertedFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.convertedFile.filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Download completed!');
    }



    removeFileAtIndex(index) {
        this.uploadedFiles.splice(index, 1);
        this.updatePreviewArea();
        this.populateFormatDropdown();
        this.updateConvertButtonState();

        if (this.uploadedFiles.length === 0) {
            this.downloadButtonBox.style.display = 'none';
            this.fileInput.value = '';
        }
    }

    toggleBatchMode() {
        this.isBatchMode = !this.isBatchMode;

        if (this.isBatchMode) {
            this.batchButton.textContent = 'Single Mode';
            this.batchButtonBox.classList.add('active');
            this.fileInput.setAttribute('multiple', '');
        } else {
            this.batchButton.textContent = 'Batch Upload';
            this.batchButtonBox.classList.remove('active');
            this.fileInput.removeAttribute('multiple');

            // Keep only first file when switching to single mode
            if (this.uploadedFiles.length > 1) {
                this.uploadedFiles = [this.uploadedFiles[0]];
                this.updatePreviewArea();
                this.populateFormatDropdown();
            }
        }
    }

    showLoadingOverlay(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    resetToInitialState() {
        this.convertButtonBox.classList.add('disabled');
        this.convertButton.disabled = true;
        this.downloadButtonBox.style.display = 'none';
        this.previewArea.innerHTML = 'No images selected';
        this.previewArea.style.fontStyle = 'italic';
        this.previewArea.style.color = '#999999';
    }
}

// Initialize the image converter
let imageConverter;
document.addEventListener('DOMContentLoaded', () => {
    imageConverter = new ImageConverter();
});
