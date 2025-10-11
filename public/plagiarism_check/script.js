class PlagiarismChecker {
  constructor() {
    this.currentMethod = "text";
    this.isChecking = false;
    this.maxWords = 25000;
    this.currentContent = "";
    this.currentMode = "plagiarism";
    this.uploadedFile = null;
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
      e.stopPropagation(); // Prevent event bubbling
      this.fileInput.click();
    });
    this.uploadArea.addEventListener("click", (e) => {
      // Only trigger if user didn't click the choose button
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

    // ✅ FIXED: Store the actual file object
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

  readFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      // For demo purposes, we'll treat all files as plain text
      this.currentContent = e.target.result;
      this.updateFileUploadDisplay(file.name);
      this.updateWordCount();
    };

    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };

    reader.readAsText(file);
  }

  updateFileUploadDisplay(filename) {
    // Don't destroy the file input - just update the display
    const uploadArea = this.uploadArea;
    const existingText = uploadArea.querySelector("p");

    // Update only the display text, keep the file input intact
    if (existingText) {
      existingText.innerHTML = `✓ File uploaded: <strong>${filename}</strong>`;
    }

    // Add a small success indicator
    uploadArea.style.borderColor = "#00aa00";
    uploadArea.style.backgroundColor = "#f0fff0";

    // Reset visual style after 2 seconds
    setTimeout(() => {
      uploadArea.style.borderColor = "#cccccc";
      uploadArea.style.backgroundColor = "#fafafa";
    }, 2000);
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
      // For demo purposes, simulate URL content fetching
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate fetched content
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

    // Get content based on current method
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

    // Validate content
    if (!textContent) {
      alert(
        `Please enter text to ${
          this.currentMode === "plagiarism"
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

    // Calculate timing
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
    ).textContent = `Estimated time: ${expectedMinutes} minute${
      expectedMinutes > 1 ? "s" : ""
    }. Please wait.`;

    const expectedTimeSeconds = this.calculateExpectedTime(wordCount);
    const stepDuration = expectedTimeSeconds / 6;

    // Dynamic progress steps
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

      // ✅ DIFFERENT API CALLS BASED ON MODE
      if (this.currentMode === "ai-detection") {
        // 🤖 AI DETECTION - SEND JSON
        console.log("📤 Sending AI detection request as JSON");

        response = await fetch(config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // ✅ JSON for AI
          },
          body: JSON.stringify({
            text: textContent, // ✅ Simple JSON object
          }),
          signal: AbortSignal.timeout(300000),
        });
      } else {
        // 🔍 PLAGIARISM - SEND FORMDATA (for file support)
        console.log("📤 Sending plagiarism request as FormData");

        let formData = new FormData();

        switch (this.currentMethod) {
          case "text":
            formData.append("text", textContent);
            break;
          case "file":
            // Use the saved file instead of trying to read from input
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
          body: formData, // ✅ FormData for plagiarism
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

        // ✅ ROUTE TO CORRECT DISPLAY METHOD
        if (this.currentMode === "ai-detection") {
          this.displayAIResults(result); // AI results
        } else {
          this.displayPlagiarismResults(result.results || result); // Plagiarism results
        }

        this.hideLoadingOverlay();
      } else {
        console.error("Backend error:", result.error);
        alert(
          result.error ||
            `Error during ${
              this.currentMode === "plagiarism"
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

    // Reset UI state
    this.isChecking = false;
    this.updateCheckButtonState(true);
    this.showProgress(false);
    this.loadingOverlay.style.display = "none";
  }

  calculateExpectedTime(wordCount) {
    // Based on your timing data
    let expectedSeconds;
    if (wordCount <= 250) expectedSeconds = 65;
    else if (wordCount <= 500) expectedSeconds = 100;
    else if (wordCount <= 750) expectedSeconds = 220;
    else if (wordCount <= 1000) expectedSeconds = 350;
    else expectedSeconds = Math.min(wordCount * 0.35, 600); // Max 10 minutes

    return expectedSeconds;
  }

  displayResults(results) {
    if (this.currentMode === "plagiarism") {
      this.displayPlagiarismResults(results);
    } else {
      this.displayAIResults(results);
    }
  }

  displayPlagiarismResults(results) {
    // Keep your existing plagiarism results display code
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

    // Create the chart
    this.createPlagiarismChart(
      results.uniquePercentage,
      results.plagiarismPercentage
    );

    const dashboard = `
        <div class="modern-results-dashboard">
            <div class="results-header-modern">
                <h3>Plagiarism Analysis Complete</h3>
                <div class="analysis-time">Completed in ${
                  Math.round(results.analysis?.processingTimeMs / 1000) || 0
                }s</div>
            </div>
            
            <div class="score-summary">
                <div class="score-card original">
                    <div class="score-number" style="color: ${uniqueColor}">${
      results.uniquePercentage
    }%</div>
                    <div class="score-label">Original</div>
                </div>
                <div class="score-card plagiarized">
                    <div class="score-number" style="color: ${riskColor}">${
      results.plagiarismPercentage
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
                    <span class="stat-number">${
                      results.analysis?.searchesPerformed || 0
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

    // Wait for chart to fully render, then save image
    setTimeout(() => {
      const canvas = document.getElementById("plagiarismChart");
      if (canvas) {
        this.chartImageData = canvas.toDataURL("image/png");
        console.log("✅ Chart image saved successfully");
      } else {
        console.error("❌ Chart canvas not found");
      }
    }, 500);

    this.lastResults = results;
    document.getElementById("downloadReportBtn").style.display = "inline-block";
  }

  displayAIResults(results) {
    // NEW METHOD for AI detection results
    const aiData = results.data || results;
    const probability = aiData.aiProbability || 0;

    let resultColor = "#00aa00"; // Green for human
    let resultLabel = "Human Written";
    let resultIcon = "👤";

    if (probability >= 70) {
      resultColor = "#ff4444"; // Red for AI
      resultLabel = "AI Generated";
      resultIcon = "🤖";
    } else if (probability >= 30) {
      resultColor = "#ff8800"; // Orange for mixed
      resultLabel = "Mixed/Uncertain";
      resultIcon = "❓";
    }

    const dashboard = `
        <div class="modern-results-dashboard">
            <div class="results-header-modern">
                <h3>AI Detection Analysis Complete</h3>
                <div class="analysis-time">Completed in ${
                  aiData.processingTime || 0
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
                <p style="color: #666;">Confidence: ${
                  aiData.confidence || "Medium"
                }</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${Math.round(probability)}%</span>
                    <span class="stat-label">AI Probability</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${
                      aiData.confidence || "Medium"
                    }</span>
                    <span class="stat-label">Confidence</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${
                      Object.keys(aiData.breakdown || {}).length || 5
                    }</span>
                    <span class="stat-label">Factors Analyzed</span>
                </div>
            </div>

            ${this.createAIBreakdown(aiData.breakdown)}
        </div>
    `;
    this.resultsContent.innerHTML = dashboard;
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
                      breakdown.repetitionPatterns || 0
                    )*100}%</div>
                    <div class="match-details">
                        <div class="match-title">Repetition Patterns</div>
                        <div class="match-url">Repeated phrases detection</div>
                    </div>
                </div>
                <div class="match-card">
                    <div class="match-similarity">${Math.round(
                      breakdown.vocabularyComplexity || 0
                    )*100}%</div>
                    <div class="match-details">
                        <div class="match-title">Vocabulary Complexity</div>
                        <div class="match-url">Word choice analysis</div>
                    </div>
                </div>
                <div class="match-card">
                    <div class="match-similarity">${Math.round(
                      breakdown.sentenceUniformity || 0
                    )*100}%</div>
                    <div class="match-details">
                        <div class="match-title">Sentence Structure</div>
                        <div class="match-url">Uniformity measurement</div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  // ADD THIS NEW METHOD TO YOUR PlagiarismChecker CLASS
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
                            <a href="${
                              match.url
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

    // Destroy existing chart if it exists
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
            backgroundColor: [
              "#00aa00", // Green for original
              "#ff4444", // Red for plagiarized
            ],
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
        // Clear file input value to prevent change event issues
        this.fileInput.value = "";
        this.uploadedFile = null;
        this.currentContent = "";

        // Reset upload area without destroying file input
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

    // Clear results
    this.resultsContent.innerHTML =
      '<div class="no-results"><p>Results will appear here after checking</p></div>';
    this.updateWordCount();
    document.getElementById("downloadReportBtn").style.display = "none";
  }
  showNotification(message, type = "info") {
    // Remove existing notifications
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

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
  // Action button functions (placeholders for future implementation)
  exportReport() {
    alert(
      "Export functionality coming soon! This will generate a detailed PDF report."
    );
  }

  viewSources() {
    alert(
      "View Sources functionality coming soon! This will show detailed source matches."
    );
  }

  getSuggestions() {
    alert(
      "Get Suggestions functionality coming soon! This will provide rewriting suggestions."
    );
  }
  // Method to read text files only
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

  // Method to estimate word count for binary files
  estimateWordCount(file) {
    const estimatedWords = Math.floor(file.size / 6); // Conservative estimate
    this.currentContent = `[File contains approximately ${estimatedWords.toLocaleString()} words]`;
    this.updateWordCount();
  }
  switchMode(mode) {
    // Don't switch if already in this mode
    if (this.currentMode === mode) return;

    // Update current mode
    this.currentMode = mode;
    const config = this.modeConfig[mode];

    // Update active button
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");

    // Update UI elements
    document.getElementById("main-title").textContent = config.title;
    document.getElementById("main-subtitle").textContent = config.subtitle;
    document.getElementById("textArea").placeholder = config.placeholder;
    document.getElementById("checkPlagiarismBtn").textContent =
      config.buttonText;

    // Clear any existing results
    this.resultsContent.innerHTML =
      '<div class="no-results"><p>Results will appear here after checking</p></div>';

    // Hide progress if visible
    this.showProgress(false);

    // Update word count display
    this.updateWordCount();
  }
}

let plagiarismChecker;
document.addEventListener("DOMContentLoaded", () => {
  plagiarismChecker = new PlagiarismChecker();

  // Wait a moment for libraries to load
  setTimeout(() => {
    const downloadBtn = document.getElementById("downloadReportBtn");
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        if (!window.jspdf || !window.html2canvas) {
          alert("PDF libraries not loaded. Please refresh the page.");
          return;
        }

        // ✅ Only check for chart if in plagiarism mode
        if (
          plagiarismChecker.currentMode === "plagiarism" &&
          !plagiarismChecker.chartImageData
        ) {
          alert("Chart is still loading. Please wait a moment and try again.");
          return;
        }

        const { jsPDF } = window.jspdf;
        const results = document.getElementById("resultsContent");

        html2canvas(results, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
        })
          .then((canvas) => {
            const doc = new jsPDF("p", "pt", "a4");

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              doc.addPage();
              doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            doc.save(`${plagiarismChecker.currentMode}-report.pdf`);
          })
          .catch((error) => {
            console.error("PDF generation error:", error);
            alert("Failed to generate PDF. Please try again.");
          });
      };
    }
  }, 500);

  // Initialize mobile menu
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener("click", () => {
      hamburgerBtn.classList.toggle("active");
      mobileMenu.classList.toggle("active");
    });

    // Close menu when clicking on a link
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        hamburgerBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburgerBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });
  }
});
