// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const hdMode = document.getElementById('hdMode');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const resultContainer = document.querySelector('.result-container');
const downloadBtn = document.getElementById('downloadBtn');
const newImageBtn = document.getElementById('newImageBtn');
const themeToggle = document.getElementById('themeToggle');
const notification = document.getElementById('notification');

// Global variables
let selectedFile = null;

// Event Listeners
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropzone.addEventListener('dragover', handleDragOver);
dropzone.addEventListener('dragleave', handleDragLeave);
dropzone.addEventListener('drop', handleDrop);
processBtn.addEventListener('click', processImage);
downloadBtn.addEventListener('click', downloadImage);
newImageBtn.addEventListener('click', resetForm);
themeToggle.addEventListener('change', toggleTheme);

// Initialize theme from localStorage
initTheme();

// Functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('active');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('active');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('active');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function validateAndSetFile(file) {
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showNotification('Pilih Gambar Yang Mau Lu Hapus Background nya', 'error');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 20 * 1024 * 1024) {
        showNotification('Ukuran Gambar lu Kegedean Woy!, Maximal 20MB!', 'error');
        return;
    }
    
    selectedFile = file;
    processBtn.disabled = false;
    
    // Display preview
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Animate dropzone
    dropzone.style.animation = 'none';
    void dropzone.offsetWidth; // Trigger reflow
    dropzone.style.animation = 'pulse 0.5s ease';
}

async function processImage() {
    if (!selectedFile) return;
    
    // Show enhanced loading state
    processBtn.disabled = true;
    processBtn.innerHTML = `
        <div class="wave-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <span class="loading-text">Processing</span>
    `;
    
    // Create overlay loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-text">Proses....</p>
        <p class="loading-subtext">Tungguin sebentar ae</p>
    `;
    document.body.appendChild(loadingOverlay);
    
    try {
        const formData = new FormData();
        formData.append('image_file', selectedFile);
        formData.append('size', hdMode.checked ? 'auto' : 'regular');
        
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': REMOVE_BG_API_KEY
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.errors ? error.errors[0].message : 'Failed to remove background');
        }
        
        const blob = await response.blob();
        const resultUrl = URL.createObjectURL(blob);
        resultImage.src = resultUrl;
        
        // Show result container
        resultContainer.classList.remove('hidden');
        
        showNotification('Berhasil ✓', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'An error occurred', 'error');
    } finally {
        // Reset button state
        processBtn.disabled = false;
        processBtn.innerHTML = `
            <span class="btn-text">Remove Background</span>
        `;
        
        // Remove loading overlay
        document.body.removeChild(loadingOverlay);
    }
}

function downloadImage() {
    if (!resultImage.src) return;
    
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = `bg-removed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Mulai Mendownload..', 'success');
}

function resetForm() {
    selectedFile = null;
    fileInput.value = '';
    originalImage.src = '';
    resultImage.src = '';
    resultContainer.classList.add('hidden');
    processBtn.disabled = true;
    dropzone.style.animation = 'none';
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type, 'show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'light';
}

function toggleTheme() {
    const newTheme = themeToggle.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}