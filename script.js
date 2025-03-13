// script.js
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  fileInput.files = e.dataTransfer.files;
});

document.addEventListener('DOMContentLoaded', () => {
  const navbarBurger = document.querySelector('.navbar-burger');
  const navbarMenu = document.getElementById('navbarMenu');

  navbarBurger.addEventListener('click', () => {
    navbarBurger.classList.toggle('is-active');
    navbarMenu.classList.toggle('is-active');
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const categoriesInput = document.getElementById('categories');
  const authCodeInput = document.getElementById('authCode');
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
      if (!authCodeInput.value) {
        alert('Auth code is required. Please contact us for more credits.');
        return;
    }      

      const categories = categoriesInput.value.split('\n').map(category => category.trim().replace(/[^a-zA-Z0-9\s]/g, ''));

      const filteredCategories = categories.filter(category => category !== '');
      if (filteredCategories.length > 10) {
          alert("You can only have up to 10 non-empty categories.");
          return;
      }

      if (filteredCategories.length === 0) {
          alert("Categories must contain only letters and numbers, and not be empty.");
          return;
      }

      const reader = new FileReader();

      reader.onload = async (event) => {

          submitButton.classList.add('is-loading');
          submitButton.disabled = true;
      
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
                      authCode: authCodeInput.value,
                  }),
              });

              if (!response.ok) {
                    const errorMessage = await response.text();
                    const errorJson = JSON.parse(errorMessage);
                    submitButton.classList.remove('is-loading');
                    submitButton.disabled = false;
      
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorJson.error}`);
              }

              const data = await response.json();
                resultDiv.innerHTML = `Category: ${data.category}`;
          } catch (error) {
              console.error('Error:', error);
              resultDiv.textContent = `Error: ${error.message}`;
          }
           finally {
              submitButton.classList.remove('is-loading');
              submitButton.disabled = false;
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

