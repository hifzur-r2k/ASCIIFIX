// ========================================
// PLAGIARISM CHECKER CLASS (Enhanced)
// ========================================
class PlagiarismChecker {
  constructor() {
    this.currentMethod = "text";
    this.isChecking = false;
    this.maxWords = 25000;
    this.currentContent = "";
    this.currentMode = "plagiarism";
    this.uploadedFile = null;
    this.chartImageData = null;
    this.lastResults = null;

    this.modeConfig = {
      plagiarism: {
        title: "PLAGIARISM CHECKER",
        subtitle: "Detect copied content and ensure originality",
        placeholder: "Enter your text here and click on Check Plagiarism",
        buttonText: "Check Plagiarism",
        apiEndpoint: "/api/plagiarism/check",
        loadingMessage: "Checking for plagiarism...",
        progressText: "Analyzing content...",
      },
      "ai-detection": {
        title: "AI CONTENT DETECTOR",
        subtitle: "Detect AI-generated text with advanced analysis",
        placeholder: "Enter your text here and click on Detect AI Content",
        buttonText: "Detect AI Content",
        apiEndpoint: "/api/ai-detector/detect",
        loadingMessage: "Analyzing for AI patterns...",
        progressText: "Detecting AI content...",
      },
    };

    this.initializeElements();
    this.attachEventListeners();
    this.updateWordCount();
  }

  initializeElements() {
    // Tab elements
    this.tabs = document.querySelectorAll(".tab");
    this.inputMethods = document.querySelectorAll(".input-method");

    // Input elements
    this.textArea = document.getElementById("textArea");
    this.fileInput = document.getElementById("fileInput");
    this.urlInput = document.getElementById("urlInput");
    this.uploadArea = document.getElementById("fileUploadArea");

    // Button elements
    this.checkBtn = document.getElementById("checkPlagiarismBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.fetchUrlBtn = document.getElementById("fetchUrlBtn");
    this.chooseFileBtn = document.querySelector(".choose-file-button");

    // Display elements
    this.wordCount = document.getElementById("wordCount");
    this.charCount = document.getElementById("charCount");
    this.resultsContent = document.getElementById("resultsContent");
    this.progressContainer = document.getElementById("progressContainer");
    this.progressFill = document.getElementById("progressFill");
    this.progressText = document.getElementById("progressText");
    this.loadingOverlay = document.getElementById("loadingOverlay");

    // Button containers for styling
    this.checkButtonBox = document.querySelector(".check-button-box");
  }

  attachEventListeners() {
    // Tab switching
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", (e) =>
        this.switchInputMethod(e.target.dataset.method)
      );
    });

    // Mode buttons
    const modeButtons = document.querySelectorAll(".mode-btn");
    modeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const selectedMode = e.target.closest(".mode-btn").dataset.mode;
        this.switchMode(selectedMode);
      });
    });

    // Text area events
    this.textArea.addEventListener("input", () => this.updateWordCount());
    this.textArea.addEventListener("paste", () => {
      setTimeout(() => this.updateWordCount(), 100);
    });

    this.chooseFileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });

    this.uploadArea.addEventListener("click", (e) => {
      if (!e.target.closest(".choose-file-button")) {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

    // Drag and drop events
    this.uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener("dragleave", (e) =>
      this.handleDragLeave(e)
    );
    this.uploadArea.addEventListener("drop", (e) => this.handleFileDrop(e));

    // URL input events
    this.fetchUrlBtn.addEventListener("click", () => this.fetchUrlContent());
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.fetchUrlContent();
    });

    // Action buttons
    if (this.checkBtn) {
      this.checkBtn.addEventListener("click", () => this.checkPlagiarism());
    } else {
      console.error("Check button not found: #checkPlagiarismBtn");
    }

    this.clearBtn.addEventListener("click", () => this.clearContent());
  }

  switchInputMethod(method) {
    this.currentMethod = method;

    // Update active tab
    this.tabs.forEach((tab) => tab.classList.remove("active"));
    document.querySelector(`[data-method="${method}"]`).classList.add("active");

    // Update active input method
    this.inputMethods.forEach((input) => input.classList.remove("active"));
    document.getElementById(`${method}-input`).classList.add("active");

    this.updateWordCount();
  }

  updateWordCount() {
    let content = "";

    switch (this.currentMethod) {
      case "text":
        content = this.textArea.value;
        break;
      case "file":
      case "url":
        content = this.currentContent;
        break;
    }

    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = content.trim() === "" ? 0 : words.length;
    const charCount = content.length;

    this.wordCount.textContent = wordCount.toLocaleString();
    this.charCount.textContent = `${charCount.toLocaleString()} characters`;

    // Update word count color based on limit
    if (wordCount > this.maxWords) {
      this.wordCount.style.color = "#ff0000";
    } else if (wordCount > this.maxWords * 0.8) {
      this.wordCount.style.color = "#ff8800";
    } else {
      this.wordCount.style.color = "#666666";
    }

    // Enable/disable check button
    this.updateCheckButtonState(wordCount > 0 && wordCount <= this.maxWords);
  }

  updateCheckButtonState(enabled) {
    if (enabled && !this.isChecking) {
      this.checkButtonBox.classList.remove("disabled");
      this.checkBtn.disabled = false;
    } else {
      this.checkButtonBox.classList.add("disabled");
      this.checkBtn.disabled = true;
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(txt|pdf|doc|docx)$/i)
    ) {
      alert("Please select a valid file type (TXT, PDF, DOC, DOCX)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Store the actual file object
    this.uploadedFile = file;

    // For TXT files, also read content for preview
    if (
      file.type === "text/plain" ||
      file.name.toLowerCase().endsWith(".txt")
    ) {
      this.readTextFile(file);
    } else {
      // For other files, show estimated word count
      this.currentContent = `[File uploaded: ${file.name}]`;
      this.estimateWordCount(file);
    }

    this.updateFileUploadDisplay(file.name);
  }

  readTextFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      this.currentContent = e.target.result;
      this.updateWordCount();
    };

    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };

    reader.readAsText(file);
  }

  estimateWordCount(file) {
    const estimatedWords = Math.floor(file.size / 6);
    this.currentContent = `[File contains approximately ${estimatedWords.toLocaleString()} words]`;
    this.updateWordCount();
  }

  updateFileUploadDisplay(filename) {
    const uploadArea = this.uploadArea;
    const existingText = uploadArea.querySelector("p");
    if (existingText) {
      // Truncate long filenames on mobile
      let displayName = filename;
      if (window.innerWidth <= 768 && filename.length > 40) {
        const extension = filename.split('.').pop();
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        displayName = nameWithoutExt.substring(0, 30) + '...' + extension;
      }

      existingText.innerHTML = `✓ File uploaded: <strong title="${filename}">${displayName}</strong>`;
      uploadArea.style.borderColor = "#00aa00";
      uploadArea.style.backgroundColor = "#f0fff0";

      setTimeout(() => {
        uploadArea.style.borderColor = "#cccccc";
        uploadArea.style.backgroundColor = "#fafafa";
      }, 2000);
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.style.borderColor = "#000000";
    this.uploadArea.style.backgroundColor = "#f0f0f0";
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.uploadArea.style.borderColor = "#cccccc";
    this.uploadArea.style.backgroundColor = "#fafafa";
  }

  handleFileDrop(e) {
    e.preventDefault();
    this.uploadArea.style.borderColor = "#cccccc";
    this.uploadArea.style.backgroundColor = "#fafafa";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.fileInput.files = files;
      this.handleFileUpload({ target: { files: files } });
    }
  }

  async fetchUrlContent() {
    const url = this.urlInput.value.trim();

    if (!url) {
      alert("Please enter a valid URL");
      return;
    }

    if (!this.isValidUrl(url)) {
      alert("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    this.fetchUrlBtn.disabled = true;
    this.fetchUrlBtn.textContent = "Fetching...";

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      this.currentContent = `Sample content from ${url}\n\nThis is a demo of fetched content. In a real implementation, this would contain the actual text content from the webpage.`;
      this.updateWordCount();
      alert("Content fetched successfully!");
    } catch (error) {
      alert(
        "Failed to fetch content from URL. Please check the URL and try again."
      );
    } finally {
      this.fetchUrlBtn.disabled = false;
      this.fetchUrlBtn.textContent = "Fetch Content";
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  async checkPlagiarism() {
    if (this.isChecking) return;

    const config = this.modeConfig[this.currentMode];

    let textContent = "";
    switch (this.currentMethod) {
      case "text":
        textContent = this.textArea.value.trim();
        break;
      case "file":
      case "url":
        textContent = this.currentContent.trim();
        break;
    }

    if (!textContent) {
      alert(
        `Please enter text to ${this.currentMode === "plagiarism"
          ? "check for plagiarism"
          : "detect AI content"
        }`
      );
      return;
    }

    if (this.currentMethod !== "file") {
      if (textContent.split(" ").length < 10) {
        alert("Please enter at least 10 words for analysis");
        return;
      }
    }

    this.isChecking = true;
    this.updateCheckButtonState(false);
    this.showProgress(true);
    this.loadingOverlay.style.display = "flex";

    const wordCount = textContent
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const expectedMinutes = Math.ceil(
      this.calculateExpectedTime(wordCount) / 60
    );

    document.getElementById("loadingMessage").textContent =
      config.loadingMessage;
    document.getElementById(
      "loadingTip"
    ).textContent = `Estimated time: ${expectedMinutes} minute${expectedMinutes > 1 ? "s" : ""
    }. Please wait.`;

    const expectedTimeSeconds = this.calculateExpectedTime(wordCount);
    const stepDuration = expectedTimeSeconds / 6;

    const progressSteps =
      this.currentMode === "plagiarism"
        ? [
          { text: "Initializing analysis...", percent: 5 },
          { text: "Extracting key phrases...", percent: 15 },
          { text: "Searching web sources...", percent: 40 },
          { text: "Analyzing similarities...", percent: 70 },
          { text: "Comparing with sources...", percent: 85 },
          { text: "Finalizing report...", percent: 95 },
        ]
        : [
          { text: "Analyzing text patterns...", percent: 15 },
          { text: "Checking vocabulary complexity...", percent: 35 },
          { text: "Examining sentence structure...", percent: 55 },
          { text: "Detecting AI signatures...", percent: 75 },
          { text: "Calculating probability...", percent: 90 },
          { text: "Generating results...", percent: 95 },
        ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        const elapsedSeconds = currentStep * stepDuration;
        const remainingSeconds = Math.max(
          0,
          expectedTimeSeconds - elapsedSeconds
        );
        const remainingMinutes = Math.ceil(remainingSeconds / 60);

        this.progressText.textContent = `${step.text} (${remainingMinutes} min remaining)`;
        this.progressFill.style.width = `${step.percent}%`;
        currentStep++;
      }
    }, stepDuration * 1000);

    try {
      let response;

      if (this.currentMode === "ai-detection") {
        console.log("📤 Sending AI detection request as JSON");

        response = await fetch(config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: textContent,
          }),
          signal: AbortSignal.timeout(300000),
        });
      } else {
        console.log("📤 Sending plagiarism request as FormData");

        let formData = new FormData();

        switch (this.currentMethod) {
          case "text":
            formData.append("text", textContent);
            break;
          case "file":
            if (this.uploadedFile) {
              console.log("📎 Sending file:", this.uploadedFile.name);
              formData.append(
                "file",
                this.uploadedFile,
                this.uploadedFile.name
              );
            } else {
              alert("No file found. Please upload a file first.");
              return;
            }
            break;

          case "url":
            formData.append("url", this.urlInput.value.trim());
            break;
        }

        response = await fetch(config.apiEndpoint, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(300000),
          headers: {
            Connection: "keep-alive",
          },
        });
      }

      const result = await response.json();

      clearInterval(progressInterval);
      this.progressFill.style.width = "100%";
      this.progressText.textContent = "Analysis complete!";

      if (result.success) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (this.currentMode === "ai-detection") {
          this.displayAIResults(result);
        } else {
          this.displayPlagiarismResults(result.results || result);
        }

        this.hideLoadingOverlay();
      } else {
        console.error("Backend error:", result.error);
        alert(
          result.error ||
          `Error during ${this.currentMode === "plagiarism"
            ? "plagiarism check"
            : "AI detection"
          }`
        );
        this.hideLoadingOverlay();
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error(`${this.currentMode} check error:`, error);

      if (error.name === "TimeoutError") {
        this.showNotification(
          "Analysis is taking longer than expected. Please wait and try again in a few minutes.",
          "info"
        );
      } else if (error.message && error.message.includes("fetch")) {
        this.showNotification(
          "Connection lost. Your analysis may still be processing. Try refreshing in 2-3 minutes.",
          "warning"
        );
      } else {
        this.showNotification(
          "Network error occurred. Please try again.",
          "error"
        );
      }
      this.hideLoadingOverlay();
    }

    this.isChecking = false;
    this.updateCheckButtonState(true);
    this.showProgress(false);
    this.loadingOverlay.style.display = "none";
  }

  calculateExpectedTime(wordCount) {
    let expectedSeconds;
    if (wordCount <= 250) expectedSeconds = 65;
    else if (wordCount <= 500) expectedSeconds = 100;
    else if (wordCount <= 750) expectedSeconds = 220;
    else if (wordCount <= 1000) expectedSeconds = 350;
    else expectedSeconds = Math.min(wordCount * 0.35, 600);

    return expectedSeconds;
  }

  displayPlagiarismResults(results) {
    const riskColor =
      results.plagiarismPercentage > 30
        ? "#ff4444"
        : results.plagiarismPercentage > 15
          ? "#ff8800"
          : "#00aa00";
    const uniqueColor =
      results.uniquePercentage >= 80
        ? "#00aa00"
        : results.uniquePercentage >= 60
          ? "#ff8800"
          : "#ff4444";

    const dashboard = `
        <div class="modern-results-dashboard">
            <div class="results-header-modern">
                <h3>Plagiarism Analysis Complete</h3>
                <div class="analysis-time">Completed in ${Math.round(results.analysis?.processingTimeMs / 1000) || 0
      }s</div>
            </div>
            
            <div class="score-summary">
                <div class="score-card original">
                    <div class="score-number" style="color: ${uniqueColor}">${results.uniquePercentage
      }%</div>
                    <div class="score-label">Original</div>
                </div>
                <div class="score-card plagiarized">
                    <div class="score-number" style="color: ${riskColor}">${results.plagiarismPercentage
      }%</div>
                    <div class="score-label">Similar</div>
                </div>
            </div>

            <div class="chart-container">
                <canvas id="plagiarismChart"></canvas>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${results.sourcesFound}</span>
                    <span class="stat-label">Sources Found</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${results.wordsChecked.toLocaleString()}</span>
                    <span class="stat-label">Words Analyzed</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${results.analysis?.searchesPerformed || 0
      }</span>
                    <span class="stat-label">Searches</span>
                </div>
            </div>

            ${this.createMatchesList(results.matches)}
            ${this.createRecommendation(
        results.summary?.recommendation,
        riskColor
      )}
        </div>
    `;

    this.resultsContent.innerHTML = dashboard;
    this.createPlagiarismChart(
      results.uniquePercentage,
      results.plagiarismPercentage
    );

    setTimeout(() => {
      const canvas = document.getElementById("plagiarismChart");
      if (canvas) {
        this.chartImageData = canvas.toDataURL("image/png");
        console.log("✅ Chart image saved successfully");
      }
    }, 500);

    this.lastResults = results;
    document.getElementById("downloadReportBtn").style.display = "inline-block";
  }

  displayAIResults(results) {
    const aiData = results.data || results;
    const probability = aiData.aiProbability || 0;

    let resultColor = "#00aa00";
    let resultLabel = "Human Written";
    let resultIcon = "👤";

    if (probability >= 70) {
      resultColor = "#ff4444";
      resultLabel = "AI Generated";
      resultIcon = "🤖";
    } else if (probability >= 30) {
      resultColor = "#ff8800";
      resultLabel = "Mixed/Uncertain";
      resultIcon = "❓";
    }

    const dashboard = `
        <div class="modern-results-dashboard">
            <div class="results-header-modern">
                <h3>AI Detection Analysis Complete</h3>
                <div class="analysis-time">Completed in ${aiData.processingTime || 0
      }ms</div>
            </div>
            
            <div class="score-summary">
                <div class="score-card original">
                    <div class="score-number" style="color: #00aa00">${Math.round(
        100 - probability
      )}%</div>
                    <div class="score-label">Human</div>
                </div>
                <div class="score-card plagiarized">
                    <div class="score-number" style="color: ${resultColor}">${Math.round(
        probability
      )}%</div>
                    <div class="score-label">AI Generated</div>
                </div>
            </div>

            <div class="ai-interpretation" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
                <div style="font-size: 2rem; margin-bottom: 10px;">${resultIcon}</div>
                <h4 style="color: ${resultColor}; margin-bottom: 10px;">${resultLabel}</h4>
                <p style="color: #666;">Confidence: ${aiData.confidence || "Medium"
      }</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${Math.round(probability)}%</span>
                    <span class="stat-label">AI Probability</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${aiData.confidence || "Medium"
      }</span>
                    <span class="stat-label">Confidence</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Object.keys(aiData.breakdown || {}).length || 5
      }</span>
                    <span class="stat-label">Factors Analyzed</span>
                </div>
            </div>

            ${this.createAIBreakdown(aiData.breakdown)}
        </div>
    `;

    this.resultsContent.innerHTML = dashboard;
    this.lastResults = results;
    document.getElementById("downloadReportBtn").style.display = "inline-block";
  }

  createAIBreakdown(breakdown) {
    if (!breakdown) return "";

    return `
        <div class="matches-section">
            <h4>🔬 Analysis Breakdown</h4>
            <div class="matches-list">
                <div class="match-card">
                    <div class="match-similarity">${Math.round(
      (breakdown.repetitionPatterns || 0) * 100
    )}%</div>
                    <div class="match-details">
                        <div class="match-title">Repetition Patterns</div>
                        <div class="match-url">Repeated phrases detection</div>
                    </div>
                </div>
                <div class="match-card">
                    <div class="match-similarity">${Math.round(
      (breakdown.vocabularyComplexity || 0) * 100
    )}%</div>
                    <div class="match-details">
                        <div class="match-title">Vocabulary Complexity</div>
                        <div class="match-url">Word choice analysis</div>
                    </div>
                </div>
                <div class="match-card">
                    <div class="match-similarity">${Math.round(
      (breakdown.sentenceUniformity || 0) * 100
    )}%</div>
                    <div class="match-details">
                        <div class="match-title">Sentence Structure</div>
                        <div class="match-url">Uniformity measurement</div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  hideLoadingOverlay() {
    console.log("🔄 Hiding loading overlay...");
    this.loadingOverlay.style.display = "none";
    this.isChecking = false;
    this.updateCheckButtonState(true);
    this.showProgress(false);
  }

  createMatchesList(matches) {
    if (!matches || matches.length === 0) {
      return '<div class="no-matches-modern">✅ No significant matches found</div>';
    }

    return `
        <div class="matches-section">
            <h4>📚 Similar Sources Found</h4>
            <div class="matches-list">
                ${matches
        .slice(0, 3)
        .map(
          (match) => `
                    <div class="match-card">
                        <div class="match-similarity">${match.similarity}%</div>
                        <div class="match-details">
                            <div class="match-title">${match.title}</div>
                            <a href="${match.url
            }" target="_blank" class="match-url">
                                ${match.source || match.url} →
                            </a>
                        </div>
                    </div>
                `
        )
        .join("")}
            </div>
        </div>
    `;
  }

  createRecommendation(recommendation, color) {
    if (!recommendation) return "";

    return `
        <div class="recommendation-card" style="border-left: 4px solid ${color}">
            <div class="recommendation-title">💡 Recommendation</div>
            <div class="recommendation-text">${recommendation}</div>
        </div>
    `;
  }

  createPlagiarismChart(originalPercent, plagiarizedPercent) {
    const canvas = document.getElementById("plagiarismChart");
    const ctx = canvas.getContext("2d");

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Original Content", "Potentially Plagiarized"],
        datasets: [
          {
            data: [originalPercent, plagiarizedPercent],
            backgroundColor: ["#00aa00", "#ff4444"],
            borderWidth: 0,
            cutout: "70%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              font: {
                size: 12,
              },
            },
          },
        },
      },
    });

    canvas.style.display = "block";
  }

  showProgress(show) {
    if (show) {
      this.progressContainer.style.display = "block";
      this.progressFill.style.width = "0%";
    } else {
      this.progressContainer.style.display = "none";
    }
  }

  clearContent() {
    switch (this.currentMethod) {
      case "text":
        this.textArea.value = "";
        break;
      case "file":
        this.fileInput.value = "";
        this.uploadedFile = null;
        this.currentContent = "";

        const uploadArea = this.uploadArea;
        uploadArea.style.borderColor = "#cccccc";
        uploadArea.style.backgroundColor = "#fafafa";

        const existingText = uploadArea.querySelector("p");
        if (existingText) {
          existingText.innerHTML =
            'Drag & Drop or <span class="choose-file-button">Choose File</span>';
        }
        break;
      case "url":
        this.urlInput.value = "";
        this.currentContent = "";
        break;
    }

    this.resultsContent.innerHTML =
      '<div class="no-results"><p>Results will appear here after checking</p></div>';
    this.updateWordCount();
    document.getElementById("downloadReportBtn").style.display = "none";
  }

  showNotification(message, type = "info") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  switchMode(mode) {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    const config = this.modeConfig[mode];

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");

    document.getElementById("main-title").textContent = config.title;
    document.getElementById("main-subtitle").textContent = config.subtitle;
    document.getElementById("textArea").placeholder = config.placeholder;
    document.getElementById("checkPlagiarismBtn").textContent =
      config.buttonText;

    // Toggle SEO sections
    const plagiarismSeo = document.getElementById("plagiarism-seo");
    const aiDetectorSeo = document.getElementById("ai-detector-seo");

    if (plagiarismSeo && aiDetectorSeo) {
      if (mode === "plagiarism") {
        plagiarismSeo.style.display = "block";
        aiDetectorSeo.style.display = "none";
      } else {
        plagiarismSeo.style.display = "none";
        aiDetectorSeo.style.display = "block";
      }
    }

    this.resultsContent.innerHTML =
      '<div class="no-results"><p>Results will appear here after checking</p></div>';

    this.showProgress(false);
    this.updateWordCount();
  }
}

// ========================================
// INITIALIZE ON DOM LOAD
// ========================================
let plagiarismChecker;

document.addEventListener("DOMContentLoaded", () => {
  plagiarismChecker = new PlagiarismChecker();

  // ========================================
  // FINAL PERFECT PDF - BIGGER CHART + CLEAN TEXT
  // ========================================
  setTimeout(() => {
    const downloadBtn = document.getElementById("downloadReportBtn");
    if (downloadBtn) {
      downloadBtn.onclick = async () => {
        try {
          if (!window.jspdf || !window.html2canvas) {
            alert("PDF libraries not loaded. Please refresh the page and try again.");
            return;
          }

          const resultsContent = document.getElementById("resultsContent");
          if (!resultsContent || resultsContent.innerHTML.includes("no-results")) {
            alert("No results to export. Please run a check first.");
            return;
          }

          downloadBtn.textContent = "Generating PDF...";
          downloadBtn.disabled = true;
          downloadBtn.style.opacity = "0.6";

          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
          });

          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 12;
          const contentWidth = pageWidth - (2 * margin);

          const dashboard = resultsContent.querySelector(".modern-results-dashboard");
          if (!dashboard) throw new Error("Dashboard not found");

          const matchCards = dashboard.querySelectorAll(".match-card");
          const matchCount = matchCards.length;

          // Create temp container
          const tempContainer = document.createElement("div");
          tempContainer.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${contentWidth}mm;
          background: white;
          padding: 5mm;
          font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
        `;
          document.body.appendChild(tempContainer);

          // Helper to capture sections
          const captureSection = async (element, hideHeader = false) => {
            if (!element) return null;

            const clone = element.cloneNode(true);

            // Hide section header if requested (to avoid duplicate)
            if (hideHeader) {
              const headers = clone.querySelectorAll('h4');
              headers.forEach(h => h.style.display = 'none');
            }

            // Special chart handling with BIGGER size AND BIGGER LEGEND TEXT
            if (element.classList.contains("chart-container")) {
              const chartCanvas = element.querySelector("#plagiarismChart");
              if (chartCanvas && chartCanvas.style.display !== "none") {
                try {
                  const chartImg = clone.querySelector("#plagiarismChart");
                  if (chartImg) {
                    const imgElement = document.createElement("img");
                    imgElement.src = chartCanvas.toDataURL("image/png", 1.0);
                    imgElement.style.cssText = `
          width: 100%;
          max-width: 125mm;
          height: auto;
          display: block;
          margin: 4mm auto;
        `;
                    chartImg.replaceWith(imgElement);
                  }

                  // INCREASE LEGEND TEXT SIZE
                  const legendItems = clone.querySelectorAll('.chart-container *');
                  legendItems.forEach(item => {
                    const computedStyle = window.getComputedStyle(item);
                    if (computedStyle.fontSize) {
                      const currentSize = parseFloat(computedStyle.fontSize);
                      // Increase font size by 30%
                      item.style.fontSize = (currentSize * 1.3) + 'px';
                      item.style.fontWeight = '600'; // Make it slightly bolder
                    }
                  });

                } catch (e) {
                  console.warn("Chart capture failed:", e);
                }
              }
            }

            tempContainer.innerHTML = "";
            tempContainer.appendChild(clone);

            await new Promise(resolve => setTimeout(resolve, 80));

            const canvas = await html2canvas(tempContainer, {
              useCORS: true,
              allowTaint: true,
              scale: 2.2,
              backgroundColor: "#ffffff",
              logging: false,
              windowWidth: contentWidth * 3.78
            });

            return {
              data: canvas.toDataURL("image/jpeg", 0.93),
              width: contentWidth,
              height: (canvas.height * contentWidth) / canvas.width
            };
          };

          // ============================================
          // PAGE 1
          // ============================================
          let yPosition = margin;

          // Header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(17, 17, 17);
          doc.text(
            plagiarismChecker.currentMode === "plagiarism"
              ? "PLAGIARISM CHECK REPORT"
              : "AI DETECTION REPORT",
            pageWidth / 2,
            yPosition + 6,
            { align: "center" }
          );

          yPosition += 14;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Generated: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
          );

          yPosition += 5;
          doc.setFontSize(8);
          doc.text(
            "Powered by ASCIIFIX | Professional Content Analysis",
            pageWidth / 2,
            yPosition,
            { align: "center" }
          );

          yPosition += 4;
          doc.setLineWidth(0.6);
          doc.setDrawColor(17, 17, 17);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;

          // Score Cards (Horizontal)
          const scoreSection = dashboard.querySelector(".score-summary");
          if (scoreSection) {
            const scoreSectionClone = scoreSection.cloneNode(true);

            scoreSectionClone.style.cssText = `
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8mm !important;
            margin-bottom: 5mm !important;
          `;

            const cards = scoreSectionClone.querySelectorAll('.score-card');
            cards.forEach(card => {
              card.style.cssText = `
              padding: 12mm 8mm !important;
              text-align: center !important;
              border: 2px solid #111111 !important;
              border-radius: 10px !important;
              background: ${card.classList.contains('original') ? '#f0fdf4' : '#fff7ed'} !important;
            `;
            });

            const img = await captureSection(scoreSectionClone);
            if (img) {
              doc.addImage(img.data, "JPEG", margin, yPosition, img.width, img.height);
              yPosition += img.height + 3;
            }
          }

          // Chart Section - MOBILE RESPONSIVE FIX
          const chartSection = dashboard.querySelector(".chart-container");
          if (chartSection) {
            // Detect if mobile device
            const isMobile = window.innerWidth <= 768;

            // Create a temporary container with proper sizing
            const chartClone = chartSection.cloneNode(true);
            chartClone.style.cssText = `
    width: ${isMobile ? '85mm' : '125mm'} !important;
    max-width: ${isMobile ? '85mm' : '125mm'} !important;
    height: auto !important;
    margin: 0 auto !important;
    display: block !important;
    padding: 5mm !important;
  `;

            // Find canvas inside and resize it
            const canvasInClone = chartClone.querySelector('#plagiarismChart');
            if (canvasInClone) {
              canvasInClone.style.cssText = `
      max-width: 100% !important;
      max-height: ${isMobile ? '85mm' : '100mm'} !important;
      height: auto !important;
      width: auto !important;
      margin: 0 auto !important;
      display: block !important;
    `;
            }

            // Append to temp container for capture
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${isMobile ? '85mm' : '125mm'};
    background: white;
  `;
            tempDiv.appendChild(chartClone);
            document.body.appendChild(tempDiv);

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture with proper scale
            const canvas = await html2canvas(tempDiv, {
              useCORS: true,
              allowTaint: true,
              scale: isMobile ? 1.8 : 2.2,
              backgroundColor: '#ffffff',
              logging: false,
              windowWidth: isMobile ? 320 : 800
            });

            // Remove temp container
            document.body.removeChild(tempDiv);

            // Calculate final dimensions for PDF
            const capturedWidth = (canvas.width / (isMobile ? 1.8 : 2.2)) / 3.78; // Convert to mm
            const capturedHeight = (canvas.height / (isMobile ? 1.8 : 2.2)) / 3.78;

            // Ensure it fits within page width
            let finalWidth = Math.min(capturedWidth, contentWidth - 10);
            let finalHeight = capturedHeight * (finalWidth / capturedWidth);

            // Center the chart on page
            const xPosition = margin + (contentWidth - finalWidth) / 2;

            // Add to PDF
            const imageData = canvas.toDataURL('image/jpeg', 0.93);
            doc.addImage(imageData, 'JPEG', xPosition, yPosition, finalWidth, finalHeight);
            yPosition += finalHeight + 3;
          }

          // Stats Grid
          const statsSection = dashboard.querySelector(".stats-grid");
          if (statsSection) {
            const statsSectionClone = statsSection.cloneNode(true);

            statsSectionClone.style.cssText = `
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 5mm !important;
            margin-bottom: 0 !important;
          `;

            const statItems = statsSectionClone.querySelectorAll('.stat-item');
            statItems.forEach(item => {
              item.style.cssText = `
              padding: 8mm 6mm !important;
              border: 2px solid #111111 !important;
              border-radius: 8px !important;
              text-align: center !important;
              background: #ffffff !important;
            `;
            });

            const img = await captureSection(statsSectionClone);
            if (img) {
              doc.addImage(img.data, "JPEG", margin, yPosition, img.width, img.height);
            }
          }

          // ============================================
          // PAGE 2
          // ============================================
          doc.addPage();
          yPosition = margin;

          // Page 2 Title (PLAIN TEXT - NO EMOJI)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(17, 17, 17);
          doc.text("Similar Sources Found", margin, yPosition + 5);
          yPosition += 10;

          // First 3 matches (HIDE INTERNAL HEADING)
          const matchesSection = dashboard.querySelector(".matches-section");

          if (matchesSection && matchCount > 0) {
            const matchesClone = matchesSection.cloneNode(true);

            // REMOVE the h4 heading to avoid duplicate
            const heading = matchesClone.querySelector('h4');
            if (heading) heading.remove();

            const allMatchCards = matchesClone.querySelectorAll(".match-card");

            // Keep only first 3
            allMatchCards.forEach((card, index) => {
              if (index >= 3) card.remove();
            });

            const img = await captureSection(matchesClone, true);
            if (img) {
              doc.addImage(img.data, "JPEG", margin, yPosition, img.width, img.height);
              yPosition += img.height + 5;
            }
          }

          // Recommendation
          const recommendationSection = dashboard.querySelector(".recommendation-card");
          if (recommendationSection) {
            const img = await captureSection(recommendationSection);
            if (img) {
              if (yPosition + img.height > pageHeight - margin - 15) {
                doc.addPage();
                yPosition = margin;
              }
              doc.addImage(img.data, "JPEG", margin, yPosition, img.width, img.height);
            }
          }

          // ============================================
          // PAGE 3 (if 4+ matches)
          // ============================================
          if (matchCount > 3) {
            doc.addPage();
            yPosition = margin;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(17, 17, 17);
            doc.text("Additional Sources (Continued)", margin, yPosition + 5);
            yPosition += 10;

            const remainingMatchesSection = matchesSection.cloneNode(true);

            // REMOVE heading
            const heading = remainingMatchesSection.querySelector('h4');
            if (heading) heading.remove();

            const remainingCards = remainingMatchesSection.querySelectorAll(".match-card");

            remainingCards.forEach((card, index) => {
              if (index < 3) card.remove();
            });

            const img = await captureSection(remainingMatchesSection, true);
            if (img) {
              doc.addImage(img.data, "JPEG", margin, yPosition, img.width, img.height);
            }
          }

          document.body.removeChild(tempContainer);

          // ============================================
          // Footer
          // ============================================
          const totalPages = doc.internal.getNumberOfPages();

          doc.setProperties({
            title: plagiarismChecker.currentMode === "plagiarism"
              ? "Plagiarism Check Report - ASCIIFIX"
              : "AI Detection Report - ASCIIFIX",
            subject: "Content Analysis Report",
            author: "ASCIIFIX",
            creator: "ASCIIFIX Professional Tools"
          });

          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            doc.setLineWidth(0.3);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(
              "Generated by ASCIIFIX Professional Tools | www.asciifix.com",
              pageWidth / 2,
              pageHeight - 10,
              { align: "center" }
            );

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} of ${totalPages}`,
              pageWidth / 2,
              pageHeight - 5,
              { align: "center" }
            );
          }

          // Save
          const timestamp = new Date().getTime();
          const filename = plagiarismChecker.currentMode === "plagiarism"
            ? `ASCIIFIX-Plagiarism-Report-${timestamp}.pdf`
            : `ASCIIFIX-AI-Detection-Report-${timestamp}.pdf`;

          doc.save(filename);

          console.log(`✅ PERFECT PDF Generated: ${filename}`);
          console.log(`📊 Chart size: 125mm (BIGGER)`);
          console.log(`📄 Clean text headings (no emoji issues)`);
          console.log(`✨ Total pages: ${totalPages}`);

        } catch (error) {
          console.error("❌ PDF Error:", error);
          alert("Failed to generate PDF: " + error.message);
        } finally {
          downloadBtn.textContent = "Download Report as PDF";
          downloadBtn.disabled = false;
          downloadBtn.style.opacity = "1";
        }
      };
    }
  }, 500);


  // ========================================
  // MOBILE MENU
  // ========================================
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener("click", () => {
      hamburgerBtn.classList.toggle("active");
      mobileMenu.classList.toggle("active");
    });

    mobileMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        hamburgerBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });

    document.addEventListener("click", (e) => {
      if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburgerBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });
  }

  // ===================================
  // MOBILE TOOLS DROPDOWN
  // ===================================
  const mobileToolsHeader = document.getElementById('mobileToolsHeader');
  const mobileToolsContent = document.getElementById('mobileToolsContent');

  if (mobileToolsHeader && mobileToolsContent) {
    mobileToolsHeader.addEventListener('click', function () {
      mobileToolsHeader.classList.toggle('active');
      mobileToolsContent.classList.toggle('active');
    });
  }

  // ========================================
  // SCROLL-REVEAL ANIMATIONS
  // ========================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach((el) => observer.observe(el));

  // ========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // ========================================
  // BACK TO TOP BUTTON
  // ========================================
  const backToTopButton = document.getElementById('backToTop');

  if (backToTopButton) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopButton.style.display = 'flex';
      } else {
        backToTopButton.style.display = 'none';
      }
    });

    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});