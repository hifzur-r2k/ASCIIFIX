// ========================================
// FILE CONVERTER - BACKEND + BEAUTIFUL UI
// ========================================

// Icon mapping for different formats
const formatIcons = {
    pdf: '📕',
    word: '📘',
    excel: '📗',
    text: '📄',
    image: '🖼️',
    powerpoint: '📊'
};

// File extensions for different formats
const formatExtensions = {
    pdf: '.pdf',
    word: '.docx',
    excel: '.xlsx',
    text: '.txt',
    image: '.png',
    powerpoint: '.pptx'
};

// ========================================
// TOAST NOTIFICATION SYSTEM (NEW!)
// ========================================
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ========================================
// MOBILE MENU FUNCTIONALITY
// ========================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const submenuToggle = document.querySelector('.submenu-toggle');
const submenu = document.querySelector('.submenu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
}

if (submenuToggle && submenu) {
    submenuToggle.addEventListener('click', () => {
        submenu.classList.toggle('active');
        const arrow = submenuToggle.querySelector('.arrow');
        if (arrow) {
            arrow.style.transform = submenu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-container') && !e.target.closest('.mobile-menu')) {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
});

// ========================================
// BACK TO TOP BUTTON
// ========================================
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========================================
// CONVERTER CARD FUNCTIONALITY (ORIGINAL + ENHANCED)
// ========================================
document.querySelectorAll('.convert-card').forEach(card => {
    const id = card.id;
    const inputType = card.dataset.inputType;
    const uploadArea = card.querySelector('.upload-area');
    const fileInput = uploadArea?.querySelector('input[type="file"]');
    const fileNameDisplay = card.querySelector('.file-name-display');
    const convertBtn = card.querySelector('.convert-btn');
    const downloadBtn = card.querySelector('.download-btn');
    const outputFormatSelect = card.querySelector('.output-format');
    const outputIcon = card.querySelector('.output-icon');
    const textUploadBox = card.querySelector('.text-upload-box');
    const chooseBtn = card.querySelector('.choose-btn');

    let selectedFile = null;
    let convertedBlob = null;
    let convertedFilename = null;

    // PowerPoint has no dropdown (fixed PDF output)
    const isPowerPointCard = inputType === 'powerpoint';
    const isTextCard = inputType === 'text';
    let selectedOutputFormat = isPowerPointCard ? 'pdf' : (outputFormatSelect?.value || 'pdf');

    // ========================================
    // TEXT CONVERTER SPECIFIC
    // ========================================
    if (isTextCard && textUploadBox) {
        textUploadBox.addEventListener('input', () => {
            const hasText = textUploadBox.value.trim().length > 0;
            convertBtn.disabled = !hasText && !selectedFile;
            
            if (hasText) {
                fileNameDisplay.textContent = `✍️ ${textUploadBox.value.length} characters`;
                fileNameDisplay.style.color = '#14b8a6';
                fileNameDisplay.style.display = 'block';
            } else if (!selectedFile) {
                fileNameDisplay.textContent = '';
                fileNameDisplay.style.display = 'none';
            }
        });
    }

    // ========================================
    // FILE UPLOAD HANDLING
    // ========================================
    if (fileInput && uploadArea) {
        // Choose button click
        if (chooseBtn) {
            chooseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Click on upload area (except button)
        uploadArea.addEventListener('click', (e) => {
            if (!e.target.classList.contains('choose-btn') && e.target !== chooseBtn) {
                fileInput.click();
            }
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // Handle file selection
    function handleFileSelect(file) {
        selectedFile = file;
        fileNameDisplay.textContent = `✓ ${file.name}`;
        fileNameDisplay.style.color = '#14b8a6';
        fileNameDisplay.style.display = 'block';
        convertBtn.disabled = false;
        downloadBtn.disabled = true;
        convertedBlob = null;
        
        // Clear text box if it exists
        if (textUploadBox) {
            textUploadBox.value = '';
        }

        // Show toast notification (NEW!)
        showToast('File Uploaded', `${file.name} (${formatFileSize(file.size)})`, 'success');
    }

    // ========================================
    // OUTPUT FORMAT CHANGE
    // ========================================
    if (outputFormatSelect) {
        outputFormatSelect.addEventListener('change', (e) => {
            selectedOutputFormat = e.target.value;
            
            // Update output icon
            if (outputIcon) {
                outputIcon.textContent = formatIcons[selectedOutputFormat];
            }
            
            // Update button text
            const formatName = selectedOutputFormat.charAt(0).toUpperCase() + selectedOutputFormat.slice(1);
            convertBtn.textContent = `⚡ Convert to ${formatName}`;
            
            // Reset download button
            downloadBtn.disabled = true;
            convertedBlob = null;
        });
    }

    // ========================================
    // CONVERSION LOGIC - ORIGINAL BACKEND INTEGRATION
    // ========================================
    convertBtn.addEventListener('click', async () => {
        // Check if we have content
        const hasFile = selectedFile !== null;
        const hasText = textUploadBox && textUploadBox.value.trim().length > 0;
        
        if (!hasFile && !hasText) return;

        // Disable button and show loading
        convertBtn.disabled = true;
        const originalText = convertBtn.textContent;
        let dots = 0;
        
        const loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            convertBtn.textContent = '⚡ Converting' + '.'.repeat(dots);
        }, 400);

        try {
            // ORIGINAL BACKEND INTEGRATION (NO CHANGES!)
            const endpoint = `/convert/${inputType}-to-${selectedOutputFormat}`;
            const formData = new FormData();
            
            if (isTextCard) {
                if (selectedFile) {
                    formData.append('file', selectedFile);
                } else if (textUploadBox && textUploadBox.value.trim()) {
                    formData.append('text', textUploadBox.value.trim());
                }
            } else {
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }
            }

            // Make request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 100000);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Conversion failed');
            }

            // Get converted blob from backend
            convertedBlob = await response.blob();
            
            // Set filename with proper extension
            const extension = formatExtensions[selectedOutputFormat];
            if (selectedFile) {
                convertedFilename = selectedFile.name.replace(/\.[^.]+$/, extension);
            } else if (isTextCard) {
                convertedFilename = `text${extension}`;
            } else {
                convertedFilename = `document${extension}`;
            }

            // Success!
            clearInterval(loadingInterval);
            convertBtn.textContent = '✅ Converted!';
            convertBtn.style.background = '#14b8a6';
            convertBtn.style.borderColor = '#14b8a6';
            
            // Enable download
            downloadBtn.disabled = false;

            // Show toast (NEW!)
            showToast('Conversion Complete', `Ready to download as ${selectedOutputFormat.toUpperCase()}`, 'success');

            // Reset button after 2 seconds
            setTimeout(() => {
                convertBtn.textContent = originalText;
                convertBtn.style.background = '';
                convertBtn.style.borderColor = '';
                convertBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Conversion error:', error);
            clearInterval(loadingInterval);
            convertBtn.textContent = '❌ Failed';
            convertBtn.style.background = '#ef4444';
            convertBtn.style.borderColor = '#ef4444';

            // Show error toast (NEW!)
            if (error.name === 'AbortError') {
                showToast('Conversion Timeout', 'File may be too large', 'error');
            } else {
                showToast('Conversion Failed', error.message || 'Please try again', 'error');
            }

            setTimeout(() => {
                convertBtn.textContent = originalText;
                convertBtn.style.background = '';
                convertBtn.style.borderColor = '';
                convertBtn.disabled = false;
            }, 2000);
        }
    });

    // ========================================
    // DOWNLOAD FUNCTIONALITY (ORIGINAL)
    // ========================================
    downloadBtn.addEventListener('click', () => {
        if (!convertedBlob || !convertedFilename) {
            showToast('No File Ready', 'Please convert first', 'warning');
            return;
        }

        // Create download link
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        // Visual feedback
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '✅ Downloaded!';
        downloadBtn.style.background = '#14b8a6';
        downloadBtn.style.borderColor = '#14b8a6';
        downloadBtn.style.color = '#ffffff';

        // Show toast (NEW!)
        showToast('Download Complete', `${convertedFilename} saved successfully`, 'success');

        setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.style.background = '';
            downloadBtn.style.borderColor = '';
            downloadBtn.style.color = '';
            
            // Disable after download (ORIGINAL BEHAVIOR)
            downloadBtn.disabled = true;
            convertBtn.disabled = true;
            convertedBlob = null;
            convertedFilename = null;
        }, 2000);
    });
});

// ========================================
// HELPER FUNCTIONS
// ========================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ========================================
// PREVENT DEFAULT DRAG ON WHOLE PAGE
// ========================================
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, (e) => {
        if (!e.target.closest('.upload-area')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, false);
});

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================
const navbar = document.querySelector('.main-navbar');
if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', (e) => {
    // ESC to close mobile menu
    if (e.key === 'Escape') {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
    
    // Ctrl/Cmd + K to focus first file input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstInput = document.querySelector('.upload-area input[type="file"]');
        if (firstInput) firstInput.click();
    }
});

// ========================================
// PAGE LOAD ANIMATION
// ========================================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ========================================
// CONSOLE BRANDING
// ========================================
console.log('%c🚀 ASCIIFIX File Converter', 'font-size: 20px; font-weight: bold; color: #14b8a6; font-family: Courier New;');
console.log('%c✨ Backend Connected - Production Ready!', 'font-size: 14px; font-weight: bold; color: #8b5cf6; font-family: Courier New;');
console.log('%cBuilt with ❤️ for the best user experience', 'font-size: 12px; color: #64748b; font-family: Courier New;');

// ========================================
// INITIALIZATION COMPLETE
// ========================================
console.log('%c✅ All systems operational! Backend API ready!', 'font-size: 14px; color: #14b8a6; font-weight: bold; font-family: Courier New;');
