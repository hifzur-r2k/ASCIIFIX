document.querySelectorAll('.convert-card').forEach(card => {
  const id = card.id;
  const uploadArea = card.querySelector('.upload-area');
  const fileNameDisplay = card.querySelector('.file-name-display');
  const convertBtn = card.querySelector('.convert-btn');
  const downloadBtn = card.querySelector('.download-btn');
  let selectedFile = null;
  let convertedBlob = null; // Store the converted PDF blob
  let convertedFilename = null; // Store the filename

  // Special for text-to-pdf: textarea input
  const isTextCard = id === 'txt2pdf';
  let textArea = isTextCard ? card.querySelector('.text-upload-box') : null;
  let hasTextInput = false;

  // Add progress bar to each card
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.innerHTML = '<div class="progress-fill"></div>';
  convertBtn.parentNode.insertBefore(progressBar, convertBtn);
  const progressFill = progressBar.querySelector('.progress-fill');

  function updateConvertBtn() {
    if (isTextCard) {
      const hasText = textArea && textArea.value.trim().length > 0;
      const hasFile = selectedFile !== null;
      const shouldEnable = hasText || hasFile;

      convertBtn.disabled = !shouldEnable;

      if (shouldEnable) {
        convertBtn.style.transform = 'scale(1)';
        convertBtn.style.opacity = '1';
      }
    } else {
      convertBtn.disabled = !selectedFile;

      if (selectedFile) {
        convertBtn.style.transform = 'scale(1)';
        convertBtn.style.opacity = '1';
      }
    }
  }

  // Reset everything with animation
  function resetCard() {
    selectedFile = null;
    hasTextInput = false;
    convertedBlob = null; // Clear stored PDF
    convertedFilename = null;

    if (fileNameDisplay) {
      fileNameDisplay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        fileNameDisplay.textContent = "";
        fileNameDisplay.style.display = "none";
        fileNameDisplay.style.animation = '';
      }, 300);
    }

    if (isTextCard && textArea) {
      textArea.value = "";
    }

    convertBtn.disabled = true;
    downloadBtn.disabled = true; // Disable download button

    // Reset progress bar
    progressBar.classList.remove('active');
    progressFill.style.width = '0%';
  }

  // Handle file selection with animations
  function handleFile(file) {
    if (!file) return;

    selectedFile = file;

    // Clear any previous conversion
    convertedBlob = null;
    convertedFilename = null;
    downloadBtn.disabled = true;

    if (fileNameDisplay) {
      fileNameDisplay.textContent = `✅ ${file.name}`;
      fileNameDisplay.style.display = "block";
      fileNameDisplay.style.animation = 'fadeIn 0.3s ease';
    }

    // Add success animation to upload area
    uploadArea.style.background = 'rgba(40, 167, 69, 0.1)';
    uploadArea.style.borderColor = '#28a745';
    setTimeout(() => {
      uploadArea.style.background = '';
      uploadArea.style.borderColor = '#007bff';
    }, 1000);

    updateConvertBtn();
    showNotification(`File "${file.name}" selected successfully!`, 'success');


    // For text files, also show content in textarea
    if (isTextCard && textArea) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          textArea.value = e.target.result;
          textArea.style.animation = 'fadeIn 0.3s ease';
          updateConvertBtn();
        };
        reader.readAsText(file);
      }
    }
  }

  // Enhanced drag and drop with better visual feedback
  if (uploadArea) {
    uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function (e) {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];

      // Add drop animation
      uploadArea.style.transform = 'scale(1.05)';
      setTimeout(() => {
        uploadArea.style.transform = '';
        handleFile(file);
      }, 150);
    });

    // File input change with animation
    const inp = uploadArea.querySelector('input[type="file"]');
    if (inp) {
      inp.addEventListener('change', function (e) {
        if (inp.files[0]) {
          handleFile(inp.files[0]);
        }
      });
    }
  }

  // Textarea input watcher with smooth feedback
  if (isTextCard && textArea) {
    textArea.addEventListener('input', function (e) {
      hasTextInput = textArea.value.trim().length > 0;
      updateConvertBtn();

      // Clear previous conversion when text changes
      convertedBlob = null;
      convertedFilename = null;
      downloadBtn.disabled = true;

      // Re-enable convert button if there's text input
      if (hasTextInput) {
        convertBtn.disabled = false;
      }


      // Visual feedback for typing
      if (hasTextInput) {
        textArea.style.borderColor = '#222';
        textArea.style.background = '#fafafa';
      } else {
        textArea.style.borderColor = '#aaa';
        textArea.style.background = '#fafafa';
      }

    });
  }

  // Enhanced convert button - NO AUTO DOWNLOAD
  convertBtn.addEventListener('click', async function () {
    // Start conversion animation
    convertBtn.disabled = true;
    convertBtn.classList.add('converting');
    convertBtn.textContent = 'Converting...';

    // Show progress bar
    progressBar.classList.add('active');

    // Simulate progress with smoother animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 85) progress = 85;
      progressFill.style.width = `${progress}%`;
    }, 500);

    try {
      // Determine endpoint
      let endpoint;
      if (id === 'img2pdf') endpoint = '/convert/image';
      else if (id === 'txt2pdf') endpoint = '/convert/text';
      else if (id === 'doc2pdf') endpoint = '/convert/word';
      else if (id === 'xls2pdf') endpoint = '/convert/excel';

      const formData = new FormData();

      if (isTextCard) {
        if (selectedFile) {
          formData.append('file', selectedFile);
        } else if (textArea && textArea.value.trim()) {
          formData.append('text', textArea.value.trim());
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
      clearInterval(progressInterval);

      // Complete progress animation
      progressFill.style.width = '100%';

      if (response.ok) {
        const blob = await response.blob();

        // Store the converted PDF (NO AUTO DOWNLOAD)
        convertedBlob = blob;

        // Set filename
        if (selectedFile) {
          convertedFilename = selectedFile.name.replace(/\.[^.]+$/, '.pdf');
        } else if (isTextCard) {
          convertedFilename = 'text.pdf';
        } else {
          convertedFilename = 'document.pdf';
        }

        // Success animation
        convertBtn.classList.remove('converting');
        convertBtn.classList.add('success-flash');
        convertBtn.textContent = '✅ Ready to Download!';

        // Enable download button
        // Enable download button
        downloadBtn.disabled = false;
        downloadBtn.style.background = '#f9f9f9';
        downloadBtn.style.borderStyle = 'solid';
        downloadBtn.textContent = "Download PDF";


        setTimeout(() => {
          convertBtn.classList.remove('success-flash');
          convertBtn.textContent = 'Convert to PDF';
          convertBtn.disabled = false;
          progressBar.classList.remove('active');
          progressFill.style.width = '0%';
        }, 2000);

        showNotification('PDF ready for download! Click the Download button.', 'success');

      } else {
        throw new Error('Conversion failed');
      }

    } catch (error) {
      console.error('Error:', error);
      clearInterval(progressInterval);

      // Error animation
      // Error animation
      convertBtn.classList.remove('converting');
      convertBtn.style.background = '#f0f0f0';
      convertBtn.style.borderColor = '#666';
      convertBtn.style.opacity = '0.7';
      convertBtn.textContent = '❌ Failed';


      setTimeout(() => {
        convertBtn.textContent = 'Convert to PDF';
        convertBtn.style.background = '';
        convertBtn.style.borderColor = '';
        convertBtn.style.opacity = '';
        convertBtn.disabled = false;
        progressBar.classList.remove('active');
        progressFill.style.width = '0%';
      }, 2000);


      if (error.name === 'AbortError') {
        showNotification('Conversion timed out. File may be too large.', 'error');
      } else {
        showNotification('Conversion failed. Please try again.', 'error');
      }
    }
  });

  // NEW: Download button click handler
  downloadBtn.addEventListener('click', function () {
    if (!convertedBlob || !convertedFilename) {
      showNotification('No file ready for download. Please convert first.', 'warning');
      return;
    }

    // Create download link and trigger download
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFilename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click(); // Only download when button is clicked

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // Download button feedback
    // Download button feedback
    downloadBtn.textContent = '✅ Downloaded!';
    downloadBtn.style.background = '#f5f5f5';
    downloadBtn.style.transform = 'scale(1.05)';

    setTimeout(() => {
      downloadBtn.textContent = "Download PDF";
      downloadBtn.style.background = '';
      downloadBtn.style.transform = '';

      // DISABLE BOTH BUTTONS after download
      downloadBtn.disabled = true;
      convertBtn.disabled = true;

      // Clear the conversion state
      convertedBlob = null;
      convertedFilename = null;
    }, 2000);




    showNotification(`${convertedFilename} downloaded successfully!`, 'success');
  });
});

// Enhanced notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.add('slideOut');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Add CSS animations for fadeOut
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);
