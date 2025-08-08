    // Reusable create dummy PDF
    function createDummyPDF(filename = "document.pdf", text = "Sample PDF Content") {
      // Simple, not a real PDF -- just for illustration
      const blob = new Blob([text], {type: "application/pdf"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }

    document.querySelectorAll('.convert-card').forEach(card => {
      const id = card.id;
      const uploadArea = card.querySelector('.upload-area');
      const fileNameDisplay = card.querySelector('.file-name-display');
      const convertBtn = card.querySelector('.convert-btn');
      const downloadBtn = card.querySelector('.download-btn');
      let fileLoaded = false;
      let tempText = '';

      // Special for text-to-pdf: textarea input
      const isTextCard = id === 'txt2pdf';
      let textArea = isTextCard ? card.querySelector('.text-upload-box') : null;
      let textFileLoaded = false;

      function updateConvertBtn() {
        if(isTextCard) {
          if ((textArea.value.trim().length > 0 || textFileLoaded)) {
            convertBtn.disabled = false;
          } else {
            convertBtn.disabled = true;
          }
        } else {
          convertBtn.disabled = !fileLoaded;
        }
      }
      // Reset everything
      function resetCard() {
        fileLoaded = false;
        textFileLoaded = false;
        if (fileNameDisplay) {
          fileNameDisplay.textContent = "";
          fileNameDisplay.style.display = "none";
        }
        if (isTextCard && textArea) {
          textArea.value = "";
        }
        convertBtn.disabled = true;
        downloadBtn.disabled = true;
      }
      // Handle file input
      function handleFile(file) {
        if (!file) return;
        fileLoaded = true;
        textFileLoaded = false;
        if (fileNameDisplay) {
          fileNameDisplay.textContent = file.name;
          fileNameDisplay.style.display = "block";
        }
        updateConvertBtn();
        // For text, read contents to textarea
        if(isTextCard && textArea) {
          if(file.type === "text/plain" || file.name.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = function(e) {
              textArea.value = e.target.result;
              textFileLoaded = true;
              updateConvertBtn();
            };
            reader.readAsText(file);
          }
        }
      }
      // Drag and Drop
      if(uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
          e.preventDefault();
          uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', function(e) {
          uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', function(e) {
          e.preventDefault();
          uploadArea.classList.remove('drag-over');
          const file = e.dataTransfer.files[0];
          handleFile(file);
        });
        // File input change
        const inp = uploadArea.querySelector('input[type="file"]');
        if(inp) {
          inp.addEventListener('change', function(e) {
            if(inp.files[0]) {
              handleFile(inp.files[0]);
            }
          });
        }
      }
      // Textarea input watcher (for txt2pdf)
      if(isTextCard && textArea) {
        textArea.addEventListener('input', function(e){
          tempText = textArea.value;
          updateConvertBtn();
        });
      }
      // Convert button logic
      convertBtn.addEventListener('click', function() {
        convertBtn.disabled = true;
        setTimeout(() => {
          downloadBtn.disabled = false;
          convertBtn.disabled = false;
        }, 800); // fake "processing"
      });
      // Download button logic
      downloadBtn.addEventListener('click', function() {
        let fn = "document.pdf";
        let content = "Sample PDF generated from AsciiFix";
        if(id === "img2pdf" && fileNameDisplay && fileNameDisplay.textContent.trim()) {
          fn = fileNameDisplay.textContent.replace(/\.[a-z]+$/i, "") + ".pdf";
          content = "Dummy PDF for image: " + fn;
        }
        else if(id === "txt2pdf") {
          fn = "text.pdf";
          content = (textArea && textArea.value.length > 0) ? textArea.value : "PDF from uploaded text file";
        }
        else if(id === "doc2pdf" && fileNameDisplay && fileNameDisplay.textContent.trim()) {
          fn = fileNameDisplay.textContent.replace(/\.[a-z]+$/i, "") + ".pdf";
          content = "Dummy PDF for document: " + fn;
        }
        else if(id === "xls2pdf" && fileNameDisplay && fileNameDisplay.textContent.trim()) {
          fn = fileNameDisplay.textContent.replace(/\.[a-z]+$/i, "") + ".pdf";
          content = "Dummy PDF for spreadsheet: " + fn;
        }
        createDummyPDF(fn, content);
      });
    });
