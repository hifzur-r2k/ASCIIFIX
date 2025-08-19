class PlagiarismChecker {
    constructor() {
        this.currentMethod = 'text';
        this.isChecking = false;
        this.maxWords = 25000;
        this.currentContent = '';

        this.initializeElements();
        this.attachEventListeners();
        this.updateWordCount();
    }

    initializeElements() {
        // Tab elements
        this.tabs = document.querySelectorAll('.tab');
        this.inputMethods = document.querySelectorAll('.input-method');

        // Input elements
        this.textArea = document.getElementById('textArea');
        this.fileInput = document.getElementById('fileInput');
        this.urlInput = document.getElementById('urlInput');
        this.uploadArea = document.getElementById('fileUploadArea');

        // Button elements
        this.checkBtn = document.getElementById('checkPlagiarismBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.fetchUrlBtn = document.getElementById('fetchUrlBtn');
        this.chooseFileBtn = document.querySelector('.choose-file-button');

        // Display elements
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
        this.resultsContent = document.getElementById('resultsContent');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        // Button containers for styling
        this.checkButtonBox = document.querySelector('.check-button-box');
    }

    attachEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchInputMethod(e.target.dataset.method));
        });

        // Text area events
        this.textArea.addEventListener('input', () => this.updateWordCount());
        this.textArea.addEventListener('paste', () => {
            setTimeout(() => this.updateWordCount(), 100);
        });

        this.chooseFileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.fileInput.click();
        });
        this.uploadArea.addEventListener('click', (e) => {
            // Only trigger if user didn't click the choose button
            if (!e.target.closest('.choose-file-button')) {
                this.fileInput.click();
            }
        });

        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));


        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));

        // URL input events
        this.fetchUrlBtn.addEventListener('click', () => this.fetchUrlContent());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchUrlContent();
        });

        // Action buttons
        this.checkBtn.addEventListener('click', () => this.checkPlagiarism());
        this.clearBtn.addEventListener('click', () => this.clearContent());
    }

    switchInputMethod(method) {
        this.currentMethod = method;

        // Update active tab
        this.tabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Update active input method
        this.inputMethods.forEach(input => input.classList.remove('active'));
        document.getElementById(`${method}-input`).classList.add('active');

        this.updateWordCount();
    }

    updateWordCount() {
        let content = '';

        switch (this.currentMethod) {
            case 'text':
                content = this.textArea.value;
                break;
            case 'file':
            case 'url':
                content = this.currentContent;
                break;
        }

        const words = content.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = content.trim() === '' ? 0 : words.length;
        const charCount = content.length;

        this.wordCount.textContent = wordCount.toLocaleString();
        this.charCount.textContent = `${charCount.toLocaleString()} characters`;

        // Update word count color based on limit
        if (wordCount > this.maxWords) {
            this.wordCount.style.color = '#ff0000';
        } else if (wordCount > this.maxWords * 0.8) {
            this.wordCount.style.color = '#ff8800';
        } else {
            this.wordCount.style.color = '#666666';
        }

        // Enable/disable check button
        this.updateCheckButtonState(wordCount > 0 && wordCount <= this.maxWords);
    }

    updateCheckButtonState(enabled) {
        if (enabled && !this.isChecking) {
            this.checkButtonBox.classList.remove('disabled');
            this.checkBtn.disabled = false;
        } else {
            this.checkButtonBox.classList.add('disabled');
            this.checkBtn.disabled = true;
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
            alert('Please select a valid file type (TXT, PDF, DOC, DOCX)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB');
            return;
        }

        // For TXT files only, read the content to show word count
        if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
            this.readTextFile(file);
        } else {
            // For PDF/DOC/DOCX, just store the file reference and estimate word count
            this.currentContent = `[${file.type || 'Document'} file: ${file.name}]`;
            this.estimateWordCount(file);
        }

        this.updateFileUploadDisplay(file.name);
    }


    readFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            // For demo purposes, we'll treat all files as plain text
            this.currentContent = e.target.result;
            this.updateFileUploadDisplay(file.name);
            this.updateWordCount();
        };

        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    updateFileUploadDisplay(filename) {
        // Don't destroy the file input - just update the display
        const uploadArea = this.uploadArea;
        const existingText = uploadArea.querySelector('p');

        // Update only the display text, keep the file input intact
        if (existingText) {
            existingText.innerHTML = `✓ File uploaded: <strong>${filename}</strong>`;
        }

        // Add a small success indicator
        uploadArea.style.borderColor = '#00aa00';
        uploadArea.style.backgroundColor = '#f0fff0';

        // Reset visual style after 2 seconds
        setTimeout(() => {
            uploadArea.style.borderColor = '#cccccc';
            uploadArea.style.backgroundColor = '#fafafa';
        }, 2000);
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

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileUpload({ target: { files: files } });
        }
    }

    async fetchUrlContent() {
        const url = this.urlInput.value.trim();

        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('Please enter a valid URL (starting with http:// or https://)');
            return;
        }

        this.fetchUrlBtn.disabled = true;
        this.fetchUrlBtn.textContent = 'Fetching...';

        try {
            // For demo purposes, simulate URL content fetching
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate fetched content
            this.currentContent = `Sample content from ${url}\n\nThis is a demo of fetched content. In a real implementation, this would contain the actual text content from the webpage.`;
            this.updateWordCount();

            alert('Content fetched successfully!');

        } catch (error) {
            alert('Failed to fetch content from URL. Please check the URL and try again.');
        } finally {
            this.fetchUrlBtn.disabled = false;
            this.fetchUrlBtn.textContent = 'Fetch Content';
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async checkPlagiarism() {
        if (this.isChecking) return;

        let content = '';
        let formData = new FormData();

        // Prepare data based on current method
        switch (this.currentMethod) {
            case 'text':
                content = this.textArea.value.trim();
                if (!content) {
                    alert('Please enter text to check for plagiarism');
                    return;
                }
                if (content.split(' ').length < 10) {
                    alert('Please enter at least 10 words for analysis');
                    return;
                }
                formData.append('text', content);
                break;

            case 'file':
                // Get fresh reference and properly extract the file
                const fileInput = document.getElementById('fileInput');

                // Debug logging
                console.log('File input:', fileInput);
                console.log('Files array:', fileInput?.files);
                console.log('First file:', fileInput?.files?.[0]); // ← FIXED LINE

                if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                    alert('Please select a file to check for plagiarism');
                    return;
                }

                const selectedFile = fileInput.files[0]; // Get the actual File object

                // More debug logging
                console.log('Selected file details:', {
                    name: selectedFile.name,
                    size: selectedFile.size,
                    type: selectedFile.type,
                    constructor: selectedFile.constructor.name
                });

                // Append the actual File object, not the FileList
                formData.append('file', selectedFile, selectedFile.name);

                // Verify FormData contents
                console.log('FormData contents:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ':', pair[1]);
                }
                break;




            case 'url':
                const url = this.urlInput.value.trim();
                if (!url) {
                    alert('Please enter a URL to check for plagiarism');
                    return;
                }
                if (!this.isValidUrl(url)) {
                    alert('Please enter a valid URL starting with http:// or https://');
                    return;
                }
                formData.append('url', url);
                break;
        }

        this.isChecking = true;
        this.updateCheckButtonState(false);
        this.showProgress(true);
        this.loadingOverlay.style.display = 'flex';

        // Update progress steps for real processing
        const progressSteps = [
            'Initializing analysis...',
            'Extracting text content...',
            'Processing language patterns...',
            'Searching for potential matches...',
            'Calculating similarity scores...',
            'Generating detailed report...'
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < progressSteps.length) {
                this.progressText.textContent = progressSteps[currentStep];
                this.progressFill.style.width = `${((currentStep + 1) / progressSteps.length) * 100}%`;
                currentStep++;
            }
        }, 800);

        try {
            // Debug: Log what we're sending
            console.log('Sending request with method:', this.currentMethod);
            for (let pair of formData.entries()) {
                console.log(pair + ': ' + pair[2]);

            }

            // Real API call to backend
            const response = await fetch('/api/plagiarism/check', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            clearInterval(progressInterval);
            this.progressFill.style.width = '100%';
            this.progressText.textContent = 'Analysis complete!';

            if (result.success) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
                this.displayResults(result.results);
            } else {
                console.error('Backend error:', result.error);
                alert(result.error || 'Error checking plagiarism');
            }

        } catch (error) {
            clearInterval(progressInterval);
            console.error('Plagiarism check error:', error);
            alert('Network error. Please check your connection and try again.');
        } finally {
            this.isChecking = false;
            this.updateCheckButtonState(true);
            this.showProgress(false);
            this.loadingOverlay.style.display = 'none';
        }
    }

    displayResults(results) {
        const riskColor = results.plagiarismPercentage > 30 ? '#ff0000' :
            results.plagiarismPercentage > 15 ? '#ff8800' : '#00aa00';
        const uniqueColor = results.uniquePercentage >= 80 ? '#00aa00' :
            results.uniquePercentage >= 60 ? '#ff8800' : '#ff0000';

        const dashboard = `
        <div class="results-dashboard">
            <div class="plagiarism-score">
                <div class="score-circle" style="color: ${uniqueColor}; border-color: ${uniqueColor}">
                    ${results.uniquePercentage}%
                </div>
                <span>Original Content</span>
                <div class="risk-indicator" style="color: ${riskColor}; font-size: 12px; margin-top: 5px;">
                    Risk: ${results.summary?.risk || 'Unknown'}
                </div>
            </div>
            
            <div class="results-breakdown">
                <div class="result-item">
                    <span class="percentage" style="color: ${riskColor}">${results.plagiarismPercentage}%</span>
                    <span class="label">Potentially Plagiarized</span>
                </div>
                <div class="result-item">
                    <span class="percentage" style="color: ${uniqueColor}">${results.uniquePercentage}%</span>
                    <span class="label">Original Content</span>
                </div>
                <div class="result-item">
                    <span class="percentage">${results.sourcesFound}</span>
                    <span class="label">Similar Sources</span>
                </div>
                <div class="result-item">
                    <span class="percentage">${results.wordsChecked.toLocaleString()}</span>
                    <span class="label">Words Analyzed</span>
                </div>
            </div>

            ${results.matches && results.matches.length > 0 ? `
                <div class="source-matches">
                    <h4>Potential Matches Found:</h4>
                    ${results.matches.slice(0, 3).map(match => `
                        <div class="match-item">
                            <div class="match-header">
                                <strong>${match.title}</strong>
                                <span class="similarity-badge" style="color: ${match.similarity > 30 ? '#ff0000' : match.similarity > 15 ? '#ff8800' : '#00aa00'}">
                                    ${match.similarity}% similar
                                </span>
                            </div>
                            <div class="match-snippet">${match.snippet}</div>
                            <a href="${match.url}" target="_blank" class="match-url">View Source →</a>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-matches">No significant matches found</div>'}

            ${results.summary?.recommendation ? `
                <div class="recommendation">
                    <strong>Recommendation:</strong> ${results.summary.recommendation}
                </div>
            ` : ''}

            <div class="action-buttons">
                <button class="action-btn" onclick="plagiarismChecker.exportReport()">Export Report</button>
                <button class="action-btn" onclick="plagiarismChecker.viewSources()">View All Sources</button>
                <button class="action-btn" onclick="plagiarismChecker.getSuggestions()">Get Suggestions</button>
            </div>

            <div class="analysis-details">
                <small>
                    Analysis completed in ${results.analysis?.processingTimeMs || 0}ms | 
                    ${results.analysis?.chunks || 1} text chunks processed
                </small>
            </div>
        </div>
    `;

        this.resultsContent.innerHTML = dashboard;

        // Store results for export functionality
        this.lastResults = results;
    }


    showProgress(show) {
        if (show) {
            this.progressContainer.style.display = 'block';
            this.progressFill.style.width = '0%';
        } else {
            this.progressContainer.style.display = 'none';
        }
    }

    clearContent() {
        switch (this.currentMethod) {
            case 'text':
                this.textArea.value = '';
                break;
            case 'file':
                // Clear file input value to prevent change event issues
                this.fileInput.value = '';
                this.currentContent = '';

                // Reset upload area without destroying file input
                const uploadArea = this.uploadArea;
                uploadArea.style.borderColor = '#cccccc';
                uploadArea.style.backgroundColor = '#fafafa';

                const existingText = uploadArea.querySelector('p');
                if (existingText) {
                    existingText.innerHTML = 'Drag & Drop or <span class="choose-file-button">Choose File</span>';
                }
                break;


            case 'url':
                this.urlInput.value = '';
                this.currentContent = '';
                break;
        }

        // Clear results
        this.resultsContent.innerHTML = '<div class="no-results"><p>Results will appear here after checking</p></div>';
        this.updateWordCount();
    }

    // Action button functions (placeholders for future implementation)
    exportReport() {
        alert('Export functionality coming soon! This will generate a detailed PDF report.');
    }

    viewSources() {
        alert('View Sources functionality coming soon! This will show detailed source matches.');
    }

    getSuggestions() {
        alert('Get Suggestions functionality coming soon! This will provide rewriting suggestions.');
    }
    // Method to read text files only
    readTextFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            this.currentContent = e.target.result;
            this.updateWordCount();
        };

        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    // Method to estimate word count for binary files
    estimateWordCount(file) {
        // Rough estimation: 1KB ≈ 150-200 words for documents
        const estimatedWords = Math.floor(file.size / 6); // Conservative estimate
        this.currentContent = `[File contains approximately ${estimatedWords.toLocaleString()} words]`;
        this.updateWordCount();
    }

}

// Initialize the plagiarism checker when the page loads
let plagiarismChecker;
document.addEventListener('DOMContentLoaded', () => {
    plagiarismChecker = new PlagiarismChecker();
});
