// ========================================
// IMAGE CONVERTER - FINAL VERSION
// ========================================

class ImageConverter {
    constructor() {
        this.uploadedFiles = [];
        this.convertedFile = null;
        this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'heic'];
        this.isBatchMode = false;
        this.maxFiles = 10;
        
        this.initializeElements();
        this.attachEventListeners();
        this.populateFormatDropdown();
        this.initializeScrollAnimations();
        this.initializeMobileMenu();
        this.initializeBackToTop();
        this.initializeNavbarScroll();
        this.initializeSmartAutoReveal(); // NEW: Smart auto-reveal for tool section only
    }

    initializeElements() {
        // Main elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.chooseFileBtn = document.getElementById('chooseFileBtn');
        this.formatDropdown = document.getElementById('formatDropdown');
        this.convertButton = document.getElementById('convertButton');
        this.downloadButton = document.getElementById('downloadButton');
        this.previewArea = document.getElementById('previewArea');
        this.batchButton = document.getElementById('batchButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    attachEventListeners() {
        // File upload listeners
        this.chooseFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop listeners
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target !== this.chooseFileBtn) {
                this.fileInput.click();
            }
        });
        
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Action button listeners
        this.convertButton.addEventListener('click', () => this.convertImages());
        this.downloadButton.addEventListener('click', () => this.downloadConvertedFiles());
        this.batchButton.addEventListener('click', () => this.toggleBatchMode());
        
        // Format selection listener
        this.formatDropdown.addEventListener('change', () => this.validateConvertButton());
    }

    populateFormatDropdown() {
        const formats = [
            { value: 'jpg', label: 'JPG - Joint Photographic Experts Group', icon: '🖼️' },
            { value: 'png', label: 'PNG - Portable Network Graphics', icon: '🎨' },
            { value: 'webp', label: 'WEBP - Web Picture Format', icon: '🌐' },
            { value: 'gif', label: 'GIF - Graphics Interchange Format', icon: '🎞️' },
            { value: 'bmp', label: 'BMP - Bitmap Image', icon: '🖌️' },
            { value: 'tiff', label: 'TIFF - Tagged Image File Format', icon: '📸' },
            { value: 'ico', label: 'ICO - Icon Format', icon: '⭐' }
        ];

        formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.value;
            option.textContent = `${format.icon} ${format.label}`;
            this.formatDropdown.appendChild(option);
        });
    }

    toggleBatchMode() {
        this.isBatchMode = !this.isBatchMode;
        this.batchButton.classList.toggle('active');
        
        const batchText = this.batchButton.querySelector('.batch-text');
        batchText.textContent = this.isBatchMode ? 'Batch Mode: ON' : 'Batch Mode: OFF';
        
        // Update file input to accept 10 files at once
        this.fileInput.multiple = this.isBatchMode;
        
        // Reset files
        this.uploadedFiles = [];
        this.convertedFile = null;
        this.downloadButton.style.display = 'none';
        this.updatePreview();
        this.validateConvertButton();

        // Show notification
        this.showNotification(
            this.isBatchMode ? 'Batch mode enabled - Upload up to 10 images at once' : 'Batch mode disabled - Single image upload',
            'success'
        );
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        // Filter image files
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select valid image files', 'error');
            return;
        }

        // Check batch mode limits
        if (this.isBatchMode) {
            if (imageFiles.length > this.maxFiles) {
                this.showNotification(`Maximum ${this.maxFiles} files allowed in batch mode`, 'error');
                return;
            }
            this.uploadedFiles = imageFiles;
        } else {
            if (imageFiles.length > 1) {
                this.showNotification('Please enable batch mode for multiple files or select only one image', 'warning');
                return;
            }
            this.uploadedFiles = [imageFiles[0]];
        }

        // Reset converted files
        this.convertedFile = null;
        this.downloadButton.style.display = 'none';

        this.updatePreview();
        this.validateConvertButton();
        this.showNotification(`${imageFiles.length} image(s) uploaded successfully`, 'success');
    }

    updatePreview() {
        if (this.uploadedFiles.length === 0) {
            this.previewArea.innerHTML = `
                <div class="preview-placeholder">
                    <div class="placeholder-icon">🖼️</div>
                    <p>No images selected</p>
                    <p class="placeholder-hint">Upload images to see preview</p>
                </div>
            `;
            return;
        }

        // SINGLE IMAGE MODE - Full Size Preview
        if (this.uploadedFiles.length === 1) {
            const file = this.uploadedFiles[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                this.previewArea.innerHTML = `
                    <div class="single-image-preview">
                        <img src="${e.target.result}" alt="${file.name}" class="single-preview-image">
                        <div class="single-image-info">
                            <p class="single-filename">${file.name}</p>
                            <p class="single-details">${(file.size / 1024).toFixed(2)} KB • ${file.type.split('/')[1].toUpperCase()}</p>
                            <button class="preview-remove-single" onclick="imageConverter.removeFile(0)">✕ Remove Image</button>
                        </div>
                    </div>
                `;
                
                // Animate in
                const previewImg = this.previewArea.querySelector('.single-image-preview');
                previewImg.style.opacity = '0';
                previewImg.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    previewImg.style.transition = 'all 0.4s ease';
                    previewImg.style.opacity = '1';
                    previewImg.style.transform = 'scale(1)';
                }, 50);
            };
            
            reader.readAsDataURL(file);
            return;
        }

        // BATCH MODE - Grid of Thumbnails
        const previewContainer = document.createElement('div');
        previewContainer.className = 'batch-preview-grid';

        this.uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const thumbItem = document.createElement('div');
                thumbItem.className = 'batch-thumb-item';
                thumbItem.style.opacity = '0';
                thumbItem.style.transform = 'scale(0.8)';
                
                thumbItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="batch-thumbnail">
                    <button class="batch-remove-btn" onclick="imageConverter.removeFile(${index})">✕</button>
                    <div class="batch-thumb-info">
                        <p class="batch-thumb-name">${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}</p>
                        <p class="batch-thumb-size">${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                `;
                
                previewContainer.appendChild(thumbItem);

                // Animate in with stagger
                setTimeout(() => {
                    thumbItem.style.transition = 'all 0.3s ease';
                    thumbItem.style.opacity = '1';
                    thumbItem.style.transform = 'scale(1)';
                }, index * 80);
            };
            reader.readAsDataURL(file);
        });

        this.previewArea.innerHTML = '';
        this.previewArea.appendChild(previewContainer);
    }

    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.convertedFile = null;
        this.downloadButton.style.display = 'none';
        this.updatePreview();
        this.validateConvertButton();
        this.showNotification('Image removed', 'info');
    }

    validateConvertButton() {
        const hasFiles = this.uploadedFiles.length > 0;
        const hasFormat = this.formatDropdown.value !== '';
        
        this.convertButton.disabled = !(hasFiles && hasFormat);
    }

    async convertImages() {
        const targetFormat = this.formatDropdown.value;
        
        if (!targetFormat || this.uploadedFiles.length === 0) {
            this.showNotification('Please select files and output format', 'error');
            return;
        }

        this.showLoading(true);
        this.convertButton.disabled = true;

        try {
            const convertedFiles = [];
            const totalFiles = this.uploadedFiles.length;

            for (let i = 0; i < totalFiles; i++) {
                const file = this.uploadedFiles[i];
                
                // Update loading text
                const loadingText = document.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = `Converting image ${i + 1} of ${totalFiles}...`;
                }

                const convertedBlob = await this.convertSingleImage(file, targetFormat);
                const newFileName = this.changeFileExtension(file.name, targetFormat);
                convertedFiles.push({
                    blob: convertedBlob,
                    name: newFileName
                });
            }

            this.convertedFile = convertedFiles;
            this.showLoading(false);
            this.showNotification(`${convertedFiles.length} image(s) converted successfully!`, 'success');
            
            // Show download button with animation
            this.downloadButton.style.display = 'flex';
            this.downloadButton.style.opacity = '0';
            this.downloadButton.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                this.downloadButton.style.transition = 'all 0.3s ease';
                this.downloadButton.style.opacity = '1';
                this.downloadButton.style.transform = 'scale(1)';
            }, 100);

            this.convertButton.disabled = false;

        } catch (error) {
            console.error('Conversion error:', error);
            this.showLoading(false);
            this.showNotification('Conversion failed. Please try again with a different format.', 'error');
            this.convertButton.disabled = false;
        }
    }

    convertSingleImage(file, targetFormat) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // Handle transparency for formats that don't support it
                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to target format
                    const mimeType = this.getMimeType(targetFormat);
                    const quality = (targetFormat === 'jpg' || targetFormat === 'jpeg') ? 0.95 : 1.0;
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Conversion failed'));
                        }
                    }, mimeType, quality);
                };
                
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    }

    getMimeType(format) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'ico': 'image/x-icon'
        };
        return mimeTypes[format.toLowerCase()] || 'image/png';
    }

    changeFileExtension(filename, newExtension) {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return filename + '.' + newExtension;
        }
        return filename.substring(0, lastDotIndex) + '.' + newExtension;
    }

    downloadConvertedFiles() {
        if (!this.convertedFile || this.convertedFile.length === 0) {
            this.showNotification('No converted files to download', 'error');
            return;
        }

        this.convertedFile.forEach((file, index) => {
            setTimeout(() => {
                const url = URL.createObjectURL(file.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, index * 200);
        });

        this.showNotification(`Downloading ${this.convertedFile.length} file(s)...`, 'success');
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                this.loadingOverlay.style.transition = 'opacity 0.3s ease';
                this.loadingOverlay.style.opacity = '1';
            }, 10);
        } else {
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 
                         type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                         type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 
                         'linear-gradient(135deg, #6366f1, #8b5cf6)'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            font-family: 'Courier New', monospace;
            font-weight: 600;
            font-size: 14px;
            z-index: 10001;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 350px;
            border: 2px solid ${type === 'success' ? '#10b981' : 
                                type === 'error' ? '#ef4444' : 
                                type === 'warning' ? '#f59e0b' : '#6366f1'};
        `;
        
        const icon = type === 'success' ? '✓' : 
                     type === 'error' ? '✕' : 
                     type === 'warning' ? '⚠' : 'ℹ';
        
        notification.innerHTML = `<span style="font-size: 18px; margin-right: 10px;">${icon}</span>${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 400);
        }, 3000);
    }

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================

    initializeScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });
    }

    // ========================================
    // SMART AUTO-REVEAL - Tool Section Only
    // ========================================

    initializeSmartAutoReveal() {
        let hasScrolled = false;
        let autoRevealTimer = null;

        // Track if user has scrolled
        const scrollHandler = () => {
            hasScrolled = true;
            if (autoRevealTimer) {
                clearTimeout(autoRevealTimer);
            }
        };

        window.addEventListener('scroll', scrollHandler, { once: true });

        // Auto-reveal ONLY the tool section after 3 seconds
        autoRevealTimer = setTimeout(() => {
            if (!hasScrolled) {
                // Only reveal elements in the tool section
                const toolSectionElements = document.querySelectorAll('.tool-section .scroll-reveal, .features-section .scroll-reveal:nth-child(1), .features-section .scroll-reveal:nth-child(2)');
                
                toolSectionElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('revealed');
                    }, index * 100);
                });
            }
        }, 3000);
    }

    // ========================================
    // MOBILE MENU
    // ========================================

    initializeMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Handle dropdown clicks in mobile
            const dropdowns = document.querySelectorAll('.dropdown');
            dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                if (toggle) {
                    toggle.addEventListener('click', (e) => {
                        if (window.innerWidth <= 960) {
                            e.preventDefault();
                            dropdown.classList.toggle('active');
                        }
                    });
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
    }

    // ========================================
    // BACK TO TOP BUTTON
    // ========================================

    initializeBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        
        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    // ========================================
    // NAVBAR SCROLL EFFECT
    // ========================================

    initializeNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        });
    }
}

// Global reference for onclick handlers
let imageConverter;

// ========================================
// INITIALIZE APPLICATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    imageConverter = new ImageConverter();
    
    // Initial hero animations
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero-section .scroll-reveal');
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('revealed');
            }, index * 100);
        });
    }, 100);
});
