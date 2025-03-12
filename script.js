// script.js
document.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const categoriesInput = document.getElementById('categories');
  const submitButton = document.getElementById('submitButton');
  const resultDiv = document.getElementById('result');
  let file;

  dropArea.addEventListener('click', () => {
      fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
      file = event.target.files[0];
      handleFile(file);
  });

  dropArea.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropArea.classList.add('drag-over');
  });

  dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('drag-over');
  });

  dropArea.addEventListener('drop', (event) => {
      event.preventDefault();
      dropArea.classList.remove('drag-over');
      file = event.dataTransfer.files[0];
      handleFile(file);
  });

  submitButton.addEventListener('click', () => {
      if (!file) {
          alert('Please select a file.');
          return;
      }

      const categories = categoriesInput.value.split('\n').map(category => category.trim().replace(/[^a-zA-Z0-9\s]/g, ''));

      if (categories.some(category => category === '')) {
          alert("Categories must contain only letters and numbers, and not be empty.");
          return;
      }

      const reader = new FileReader();

      reader.onload = async (event) => {
          const base64Pdf = event.target.result.split(',')[1];
          try {
              const response = await fetch('/.netlify/functions/categorize', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      pdf: base64Pdf,
                      categories: categories,
                  }),
              });

              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              resultDiv.textContent = `Category: ${data.category}`;
          } catch (error) {
              console.error('Error:', error);
              resultDiv.textContent = `Error: ${error.message}`;
          }
      };

      reader.readAsDataURL(file);
  });

  function handleFile(file) {
      if (!file) return;
      if (file.type !== 'application/pdf') {
          alert('Please upload a PDF file.');
          fileInput.value = '';
          file = null;
          return;
      }
      if (file.size > 1024 * 1024) { // 1MB
          alert('File size must be less than 1MB.');
          fileInput.value = '';
          file = null;
          return;
      }
      dropArea.textContent = `File: ${file.name}`;
  }
});