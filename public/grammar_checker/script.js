// Grammar Checker JavaScript - ASCIIFIX

// State
let currentText = '';
let errors = [];
let selectedLanguage = 'en-US';

// DOM Elements
const textEditor = document.getElementById('textEditor');
const checkBtn = document.getElementById('checkBtn');
const pasteBtn = document.getElementById('pasteBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const fixAllBtn = document.getElementById('fixAllBtn');

const languageToggle = document.getElementById('languageToggle');
const languageDropdown = document.getElementById('languageDropdown');
const currentLang = document.getElementById('currentLang');
const langOptions = document.querySelectorAll('.lang-option');

const wordCount = document.getElementById('wordCount');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
const errorsContainer = document.getElementById('errorsContainer');
const errorsList = document.getElementById('errorsList');

const totalErrorsEl = document.getElementById('totalErrors');
const grammarCountEl = document.getElementById('grammarCount');
const spellingCountEl = document.getElementById('spellingCount');

const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Grammar Checker initialized');
    updateWordCount();
    loadSavedText();
});

// Language Selector
languageToggle.addEventListener('click', () => {
    languageDropdown.classList.toggle('active');
});

langOptions.forEach(option => {
    option.addEventListener('click', () => {
        selectedLanguage = option.dataset.lang;
        currentLang.textContent = option.textContent;
        languageDropdown.classList.remove('active');
        showToast('Language changed to ' + option.textContent, 'success');
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!languageToggle.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageDropdown.classList.remove('active');
    }
});

// Text Editor - Handle contenteditable
textEditor.addEventListener('input', () => {
    updateWordCount();
    saveText();
    removeHighlights();
});

function updateWordCount() {
    const text = getPlainText();
    const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    wordCount.textContent = words;
}

function getPlainText() {
    return textEditor.innerText || textEditor.textContent || '';
}

function setPlainText(text) {
    textEditor.textContent = text;
}

// Paste Button
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setPlainText(text);
            updateWordCount();
            saveText();
            showToast('Text pasted successfully', 'success');
        } else {
            showToast('Clipboard is empty', 'error');
        }
    } catch (error) {
        showToast('Failed to paste. Please use Ctrl+V', 'error');
    }
});

// Upload Button
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['.txt', '.doc', '.docx', '.pdf', '.ppt', '.pptx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        showToast('Please upload a valid file (TXT, DOC, DOCX, PDF, PPT, PPTX)', 'error');
        return;
    }

    showToast('Processing file...', 'success');

    try {
        if (fileExtension === '.txt') {
            const text = await readTextFile(file);
            setPlainText(text);
            updateWordCount();
            saveText();
            showToast('File uploaded successfully', 'success');
        } else {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/grammar/extract-text', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to extract text');
            }

            const data = await response.json();
            setPlainText(data.text);
            updateWordCount();
            saveText();
            showToast('File uploaded successfully', 'success');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showToast('Failed to upload file: ' + error.message, 'error');
    }

    fileInput.value = '';
});

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Check Grammar
checkBtn.addEventListener('click', async () => {
    const text = getPlainText().trim();

    if (!text) {
        showToast('Please enter some text to check', 'error');
        return;
    }

    const wordCountNum = text.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCountNum < 3) {
        showToast('Please enter at least 3 words', 'error');
        return;
    }

    await checkGrammar(text);
});

async function checkGrammar(text) {
    emptyState.style.display = 'none';
    successState.style.display = 'none';
    errorsContainer.style.display = 'none';
    loadingState.style.display = 'flex';
    checkBtn.disabled = true;

    try {
        const response = await fetch('/api/grammar/check-grammar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                language: selectedLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to check grammar');
        }

        const data = await response.json();

        // ✅ FIX #1 & #2: Store full response and show results
        if (data.success) {
            // ✅ Store all responses and errors
            errors = data.matches || [];
            window.lastCheckResponse = data;

            console.log('✅ Check complete:', {
                total: errors.length,
                critical: data.errorCounts?.critical || 0,
                warning: data.errorCounts?.warning || 0,
                suggestion: data.errorCounts?.suggestion || 0,
                grouped: data.groupedByCategory ? 'Yes' : 'No'
            });

            // Hide loading, show results
            loadingState.style.display = 'none';
            emptyState.style.display = 'none';
            successState.style.display = 'block';
            errorsContainer.style.display = 'block';

            // ✅ FIX #2: Update top statistics CORRECTLY
            if (data.errorCounts) {
                if (totalErrorsEl) totalErrorsEl.textContent = data.errorCounts.total || 0;
                if (grammarCountEl) grammarCountEl.textContent = data.errorCounts.byType?.Grammar || 0;
                if (spellingCountEl) spellingCountEl.textContent = data.errorCounts.byType?.Spelling || 0;
            } else {
                if (totalErrorsEl) totalErrorsEl.textContent = errors.length;
                if (grammarCountEl) grammarCountEl.textContent = 0;
                if (spellingCountEl) spellingCountEl.textContent = 0;
            }

            // Display all errors (critical, warning, suggestion)
            if (errors.length > 0) {
                displayErrors();
                if (toast) showToast(`Found ${errors.length} issue${errors.length > 1 ? 's' : ''}`, 'error');
            } else {
                if (errorsList) {
                    errorsList.innerHTML = '<div class="success-message">✅ No errors found! Your text looks great!</div>';
                }
                if (toast) showToast('Perfect! No errors found', 'success');
            }

            checkBtn.disabled = false;
        } else {
            throw new Error(data.message || 'Failed to check grammar');
        }


    } catch (error) {
        console.error('❌ Error checking grammar:', error);

        // ✅ FIX #5: Better error handling
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        checkBtn.disabled = false;

        if (toast) showToast('Failed to check grammar. Please try again.', 'error');
        console.error('Full error:', error);
    }
}

// Highlight errors in text with colors
function highlightErrorsInText() {
    const text = getPlainText();
    const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset);

    let highlightedHTML = '';
    let lastIndex = 0;

    sortedErrors.forEach((error, index) => {
        const errorType = getErrorType(error);
        const errorClass = errorType === 'spelling' ? 'spelling-error' :
            errorType === 'grammar' ? 'grammar-error' : 'style-error';

        // Add normal text before error
        highlightedHTML += escapeHtml(text.substring(lastIndex, error.offset));

        // Add highlighted error
        highlightedHTML += `<span class="${errorClass}" data-error-index="${index}">`;
        highlightedHTML += escapeHtml(text.substring(error.offset, error.offset + error.length));
        highlightedHTML += '</span>';

        lastIndex = error.offset + error.length;
    });

    // Add remaining text
    highlightedHTML += escapeHtml(text.substring(lastIndex));

    textEditor.innerHTML = highlightedHTML;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function removeHighlights() {
    // Only remove if there's HTML, preserve plain text
    if (textEditor.innerHTML.includes('<span')) {
        const text = getPlainText();
        setPlainText(text);
    }
}

// Show Success State
function showSuccessState(text) {
    successState.style.display = 'flex';
    errorsContainer.style.display = 'none';
    removeHighlights();

    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    document.getElementById('statsWords').textContent = words;
    document.getElementById('statsSentences').textContent = sentences;
}
// Sort errors by importance
function sortErrorsBySeverity(errorsList) {
    const priority = {
        'GRAMMAR': 1,
        'TYPOS': 2,
        'CONFUSED_WORDS': 3,
        'PUNCTUATION': 4,
        'STYLE': 5,
        'MISC': 6
    };

    return errorsList.sort((a, b) => {
        const categoryA = a.rule.category.id || 'MISC';
        const categoryB = b.rule.category.id || 'MISC';
        return (priority[categoryA] || 999) - (priority[categoryB] || 999);
    });
}

// Display Errors
function displayErrors() {
    errorsContainer.style.display = 'block';
    errorsList.innerHTML = '';

    // Check if we have grouped data from backend
    const hasGroupedData = window.lastCheckResponse && window.lastCheckResponse.groupedByCategory;
    const hasSummary = window.lastCheckResponse && window.lastCheckResponse.summary;

    if (hasGroupedData && hasSummary) {
        // ✅ FIX #3: Use grouped data
        displayGroupedErrors(window.lastCheckResponse.groupedByCategory, window.lastCheckResponse.summary);
    } else {
        // Fallback
        displaySimpleErrors();
    }
}

// ✅ COMPLETE: Display ALL errors (critical, warning, suggestion)
function displayGroupedErrors(groupedErrors, errorSummary) {
    errorsList.innerHTML = '';

    if (errorSummary.total === 0) {
        errorsList.innerHTML = '<div class="success-message">✅ No errors found! Your text looks great!</div>';
        return;
    }

    // Show summary badges at top
    const summaryHtml = `
    <div class="error-summary">
      <span class="total-badge">📊 Total: ${errorSummary.total}</span>
      <span class="critical-badge">🔴 Critical: ${errorSummary.bySeverity.critical.length}</span>
      <span class="warning-badge">🟡 Warning: ${errorSummary.bySeverity.warning.length}</span>
      <span class="suggestion-badge">💡 Suggestions: ${errorSummary.bySeverity.suggestion.length}</span>
    </div>
  `;
    errorsList.innerHTML += summaryHtml;

    // Display ALL severity levels
    const severityOrder = [
        { level: 'critical', label: '🔴 CRITICAL ISSUES', errors: errorSummary.bySeverity.critical },
        { level: 'warning', label: '🟡 WARNINGS', errors: errorSummary.bySeverity.warning },
        { level: 'suggestion', label: '💡 SUGGESTIONS', errors: errorSummary.bySeverity.suggestion }
    ];

    severityOrder.forEach(({ level, label, errors: errorsAtLevel }) => {
        let sectionHtml = `
      <div class="error-section severity-${level}">
        <h3 class="section-title">${label} (${errorsAtLevel.length})</h3>
    `;

        if (errorsAtLevel.length > 0) {
            sectionHtml += '<div class="error-group">';

            errorsAtLevel.forEach((error, index) => {
                // Get error text from input
                const errorText = getErrorTextFromOffset(error.offset, error.length);
                const suggestion = error.replacements && error.replacements.length > 0
                    ? error.replacements[0].value
                    : '';
                const globalIndex = errors.findIndex(e =>
                    e.offset === error.offset && e.length === error.length
                );

                sectionHtml += `
          <div class="error-item severity-${level}" data-offset="${error.offset}" data-length="${error.length}">
            <div class="error-header">
              <span class="error-number">#${index + 1}</span>
              <span class="error-type">${error.category || 'Other'}</span>
            </div>
            <div class="error-message">${error.message}</div>
            <div class="error-context">
              <strong>Found:</strong> <span class="error-highlight">"${escapeHtml(errorText)}"</span>

            </div>
            ${suggestion ? `
              <div class="error-suggestions">
                <strong>Suggestion:</strong> <span class="suggestion-highlight">"${escapeHtml(suggestion)}"</span>
              </div>
            ` : ''}
            <div class="error-actions">
              ${suggestion ? `<button class="btn-accept" onclick="acceptError(${globalIndex})">✓ Accept</button>` : ''}
              <button class="btn-ignore" onclick="ignoreError(${globalIndex})">✕ Ignore</button>
            </div>
          </div>
        `;
            });

            sectionHtml += '</div>';
        } else {
            sectionHtml += '<p class="no-errors-message">✓ No issues in this category</p>';
        }

        sectionHtml += '</div>';
        errorsList.innerHTML += sectionHtml;
    });

    // Show category breakdown
    errorsList.innerHTML += `
    <div class="category-breakdown">
      <h4>📊 By Category:</h4>
      ${Object.entries(groupedErrors)
            .filter(([_, errors]) => errors.length > 0)
            .map(([category, errors]) =>
                `<p><strong>${category}:</strong> ${errors.length} error(s)</p>`
            ).join('') || '<p>No errors found</p>'}
    </div>
  `;

    // Update top stats
    totalErrorsEl.textContent = errorSummary.total;
    grammarCountEl.textContent = errorSummary.byType?.Grammar || 0;
    spellingCountEl.textContent = errorSummary.byType?.Spelling || 0;
}

// Helper function to get error text
function getErrorTextFromOffset(offset, length) {
    const text = getPlainText();
    return text.substring(offset, offset + length) || '(error text)';
}


// FALLBACK: Simple error display (old way)
function displaySimpleErrors() {
    if (!errors || errors.length === 0) return;

    try {
        errors = errors.sort((a, b) => {
            const catA = a.rule?.category?.id || 'MISC';
            const catB = b.rule?.category?.id || 'MISC';
            return catA.localeCompare(catB);
        });
    } catch (e) {
        console.warn('Could not sort errors:', e);
    }


    const grammarErrors = errors.filter(e => getErrorType(e) === 'grammar').length;
    const spellingErrors = errors.filter(e => getErrorType(e) === 'spelling').length;

    totalErrorsEl.textContent = errors.length;
    grammarCountEl.textContent = grammarErrors;
    spellingCountEl.textContent = spellingErrors;

    errors.forEach((error, index) => {
        const errorItem = createErrorItem(error, index);
        errorsList.appendChild(errorItem);
    });
}


function getErrorType(error) {
    // Safety check - make sure properties exist
    if (!error || !error.rule || !error.rule.category) {
        return 'other';
    }

    const category = (error.rule.category.id || '').toLowerCase();

    if (category.includes('grammar') || category.includes('confusion')) {
        return 'grammar';
    } else if (category.includes('typo') || category.includes('spelling') || category.includes('misspelling')) {
        return 'spelling';
    }

    return 'other';
}


function createErrorItem(error, index) {
    const div = document.createElement('div');
    const errorType = getErrorType(error);
    div.className = `error-item ${errorType}`;

    // ✅ Safe property access
    const context = error.context?.text || getPlainText();
    const offset = error.context?.offset || error.offset || 0;
    const length = error.context?.length || error.length || 0;
    const errorText = context.substring(offset, offset + length) || '(error)';
    const suggestion = error.replacements?.[0]?.value || '';

    div.innerHTML = `
        <span class="error-type-badge ${errorType}">${errorType}</span>
        <div class="error-text">"${escapeHtml(errorText)}"</div>
        <div class="error-message">${error.message}</div>
        ${suggestion ? `
            <div class="suggestion">
                <span class="suggestion-label">Suggested correction:</span>
                <div class="suggestion-text">"${escapeHtml(suggestion)}"</div>
            </div>
        ` : ''}
        <div class="error-actions">
            ${suggestion ? `
                <button class="error-btn accept" onclick="acceptError(${index})">
                    <i class="fas fa-check"></i> Accept
                </button>
            ` : ''}
            <button class="error-btn ignore" onclick="ignoreError(${index})">
                <i class="fas fa-times"></i> Ignore
            </button>
        </div>
    `;

    return div;
}

// Auto-recheck function - keeps checking until no errors found
async function autoCheckUntilClean(text, maxAttempts = 5) {
    let attempt = 0;
    let currentText = text;
    let allFixedErrors = [];

    while (attempt < maxAttempts) {
        attempt++;
        console.log(`🔄 Auto-check attempt ${attempt}/${maxAttempts}`);

        try {
            const response = await fetch('/api/grammar/check-grammar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: currentText,
                    language: selectedLanguage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to check grammar');
            }

            const data = await response.json();
            const foundErrors = data.matches || [];

            if (foundErrors.length === 0) {
                console.log('✅ No more errors found!');
                break;
            }

            console.log(`📋 Found ${foundErrors.length} errors, fixing...`);

            // Apply all fixes
            const sortedErrors = [...foundErrors].sort((a, b) => b.offset - a.offset);

            sortedErrors.forEach(error => {
                if (error.replacements && error.replacements.length > 0) {
                    const replacement = error.replacements[0].value;
                    currentText = currentText.substring(0, error.offset) +
                        replacement +
                        currentText.substring(error.offset + error.length);
                    allFixedErrors.push(error);
                }
            });

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error('Error in auto-check:', error);
            break;
        }
    }

    return {
        correctedText: currentText,
        totalFixesApplied: allFixedErrors.length,
        attempts: attempt
    };
}

// Accept Error - FIX: Actually update the text
window.acceptError = function (index) {
    const error = errors[index];
    if (!error || !error.replacements || error.replacements.length === 0) return;

    const replacement = error.replacements[0].value;
    let text = getPlainText();

    // Apply the correction
    const newText = text.substring(0, error.offset) + replacement + text.substring(error.offset + error.length);

    // Update the editor
    setPlainText(newText);
    updateWordCount();
    saveText();

    // Remove this error and adjust offsets
    errors.splice(index, 1);
    adjustOffsets(error.offset, error.length, replacement.length);

    if (errors.length === 0) {
        showSuccessState(newText);
    } else {
        displayErrors();
        highlightErrorsInText();
    }

    showToast('Correction applied', 'success');
};

// Ignore Error
window.ignoreError = function (index) {
    errors.splice(index, 1);

    if (errors.length === 0) {
        showSuccessState(getPlainText());
    } else {
        displayErrors();
        highlightErrorsInText();
    }

    showToast('Error ignored', 'success');
};

// Adjust Offsets
function adjustOffsets(changedOffset, oldLength, newLength) {
    const diff = newLength - oldLength;
    errors.forEach(error => {
        if (error.offset > changedOffset) {
            error.offset += diff;
        }
    });
}

// Fix All Errors
// Fix All Errors - Enhanced with auto-recheck
fixAllBtn.addEventListener('click', async () => {
    if (errors.length === 0) return;

    console.log('🔧 Starting comprehensive fix...');
    showToast('Fixing all errors thoroughly...', 'success');

    // Show loading
    loadingState.style.display = 'flex';
    errorsContainer.style.display = 'none';
    fixAllBtn.disabled = true;

    try {
        const currentText = getPlainText();
        const result = await autoCheckUntilClean(currentText);

        setPlainText(result.correctedText);
        updateWordCount();
        saveText();

        errors = [];
        loadingState.style.display = 'none';
        showSuccessState(result.correctedText);
        fixAllBtn.disabled = false;

        showToast(`Fixed ${result.totalFixesApplied} errors in ${result.attempts} pass${result.attempts > 1 ? 'es' : ''}!`, 'success');
        console.log(`✅ Comprehensive fix complete: ${result.totalFixesApplied} fixes in ${result.attempts} attempts`);

    } catch (error) {
        console.error('Error in comprehensive fix:', error);
        loadingState.style.display = 'none';
        fixAllBtn.disabled = false;
        showToast('Error during comprehensive fix. Please try again.', 'error');
    }
});


// Clear Button
clearBtn.addEventListener('click', () => {
    if (!getPlainText().trim()) {
        showToast('Nothing to clear', 'error');
        return;
    }

    setPlainText('');
    errors = [];
    updateWordCount();
    saveText();

    emptyState.style.display = 'flex';
    successState.style.display = 'none';
    errorsContainer.style.display = 'none';

    showToast('Text cleared', 'success');
});

// Copy Button
copyBtn.addEventListener('click', async () => {
    const text = getPlainText().trim();

    if (!text) {
        showToast('No text to copy', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('Text copied to clipboard', 'success');
    } catch (error) {
        showToast('Failed to copy text', 'error');
    }
});

// Download Button
downloadBtn.addEventListener('click', () => {
    const text = getPlainText().trim();

    if (!text) {
        showToast('No text to download', 'error');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Text downloaded', 'success');
});

// Save & Load Text
function saveText() {
    try {
        localStorage.setItem('grammarCheckerText', getPlainText());
    } catch (error) {
        console.error('Failed to save text:', error);
    }
}

function loadSavedText() {
    try {
        const saved = localStorage.getItem('grammarCheckerText');
        if (saved) {
            setPlainText(saved);
            updateWordCount();
        }
    } catch (error) {
        console.error('Failed to load text:', error);
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ✅ FIX #4: Highlight errors in the input text with colors
function highlightErrorsInText() {
    const text = getPlainText();
    let highlightedHTML = '';
    let lastIndex = 0;

    // Sort errors by offset
    const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset);

    sortedErrors.forEach(error => {
        const offset = error.offset;
        const length = error.length;
        const severity = error.severity || 'suggestion';

        // Add text before error
        highlightedHTML += escapeHtml(text.substring(lastIndex, offset));

        // Add highlighted error text
        const errorText = text.substring(offset, offset + length);
        const colorClass = `highlight-${severity}`;
        highlightedHTML += `<span class="${colorClass}" title="${error.message}">${escapeHtml(errorText)}</span>`;

        lastIndex = offset + length;
    });

    // Add remaining text
    highlightedHTML += escapeHtml(text.substring(lastIndex));

    // Add data attributes for styling
    sortedErrors.forEach(error => {
        const severity = error.severity || 'suggestion';
        textEditor.setAttribute(`data-error-${error.offset}`, severity);
    });
}

// ✅ Helper: Escape HTML to prevent problems
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        checkBtn.click();
    }
});
