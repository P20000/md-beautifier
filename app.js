// State Variables (Session Only - No local storage / cookies)
let sessionMarkdown = '';
let activeFileName = '';
let isSidebarOpen = false;

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-mode-toggle');
const presetSelect = document.getElementById('preset-select');
const fontSizeRange = document.getElementById('font-size-range');
const fontSizeVal = document.getElementById('font-size-val');
const lineHeightRange = document.getElementById('line-height-range');
const lineHeightVal = document.getElementById('line-height-val');
const pageSizeSelect = document.getElementById('page-size-select');
const pageMarginSelect = document.getElementById('page-margin-select');
const clearBtn = document.getElementById('clear-btn');
const activeFileTitle = document.getElementById('active-file-title');
const layoutToggle = document.getElementById('layout-toggle');
const topUploadBtn = document.getElementById('top-upload-btn');
const dropzoneUploadBtn = document.getElementById('dropzone-upload-btn');
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const editorWorkspace = document.getElementById('editor-workspace');
const markdownTextarea = document.getElementById('markdown-textarea');
const lineNumbers = document.getElementById('line-numbers');
const beautifiedPreview = document.getElementById('beautified-preview');
const wordCountBadge = document.getElementById('word-count-badge');
const charCountBadge = document.getElementById('char-count-badge');
const readingTimeBadge = document.getElementById('reading-time-badge');
const pdfDownloadBtn = document.getElementById('pdf-download-btn');
const themePill = document.getElementById('theme-pill');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const sidebar = document.getElementById('sidebar');

// 1. Theme Configuration
themeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('m3-theme-dark');
    if (isDark) {
        body.classList.remove('m3-theme-dark');
        body.classList.add('m3-theme-light');
        themeToggle.setAttribute('aria-checked', 'false');
        // Switch HighlightJS style
        document.getElementById('hljs-style').href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
    } else {
        body.classList.remove('m3-theme-light');
        body.classList.add('m3-theme-dark');
        themeToggle.setAttribute('aria-checked', 'true');
        // Switch HighlightJS style
        document.getElementById('hljs-style').href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    }
});

// 2. Preset Document style selection
presetSelect.addEventListener('change', (e) => {
    const preset = e.target.value;
    
    // Reset existing presets
    beautifiedPreview.classList.remove(
        'preset-corporate', 
        'preset-academic', 
        'preset-nordic', 
        'preset-github', 
        'preset-minimalist'
    );
    
    // Apply selected
    const className = `preset-${preset}`;
    beautifiedPreview.classList.add(className);
    
    // Update theme pill label
    const selectedOptionText = presetSelect.options[presetSelect.selectedIndex].text;
    themePill.textContent = selectedOptionText;
});

// Initialize with default preset
beautifiedPreview.classList.add('preset-corporate');

// 3. Typography Adjustments
function updateTypography() {
    const fontSize = fontSizeRange.value;
    const lineHeight = lineHeightRange.value;
    
    fontSizeVal.textContent = `${fontSize}px`;
    lineHeightVal.textContent = lineHeight;
    
    beautifiedPreview.style.setProperty('--preview-font-size', `${fontSize}px`);
    beautifiedPreview.style.setProperty('--preview-line-height', lineHeight);
}

fontSizeRange.addEventListener('input', updateTypography);
lineHeightRange.addEventListener('input', updateTypography);
updateTypography();

// 4. Layout Mode Toggling
layoutToggle.addEventListener('click', (e) => {
    const button = e.target.closest('.segmented-item');
    if (!button) return;

    // Reset active buttons
    layoutToggle.querySelectorAll('.segmented-item').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });

    // Set new active button
    button.classList.add('active');
    button.setAttribute('aria-checked', 'true');

    // Remove old layout classes from body
    body.classList.remove('layout-split', 'layout-preview-only', 'layout-editor-only');

    // Add selected layout class to body
    const layout = button.dataset.layout;
    if (layout === 'preview') {
        body.classList.add('layout-preview-only');
    } else if (layout === 'editor') {
        body.classList.add('layout-editor-only');
    } else {
        body.classList.add('layout-split');
    }
});

// Set default layout
body.classList.add('layout-split');

// Mobile sidebar Toggle
menuToggleBtn.addEventListener('click', () => {
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
});

// Close sidebar on main content click (on mobile)
editorWorkspace.addEventListener('click', () => {
    if (window.innerWidth <= 900 && isSidebarOpen) {
        isSidebarOpen = false;
        sidebar.classList.remove('open');
    }
});

// 5. File Import Handling
function triggerFileInput() {
    fileInput.click();
}

topUploadBtn.addEventListener('click', triggerFileInput);
dropzoneUploadBtn.addEventListener('click', triggerFileInput);

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
});

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
});

function processFile(file) {
    // Only accept txt or md files
    const validExtensions = ['.md', '.markdown', '.txt'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
        alert('Invalid file format. Please upload a Markdown (.md, .markdown) or Text (.txt) file.');
        return;
    }

    activeFileName = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        sessionMarkdown = e.target.result;
        initSession();
    };
    reader.readAsText(file);
}

// 6. Session Management
function initSession() {
    markdownTextarea.value = sessionMarkdown;
    activeFileTitle.textContent = activeFileName || 'Untitled Document';
    
    // UI Transitions
    uploadZone.classList.remove('active');
    
    // Enable buttons
    clearBtn.removeAttribute('disabled');
    pdfDownloadBtn.removeAttribute('disabled');
    
    // Run initial compile
    compileMarkdown();
}

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear this session? All changes will be permanently discarded.')) {
        resetSession();
    }
});

function resetSession() {
    sessionMarkdown = '';
    activeFileName = '';
    
    markdownTextarea.value = '';
    activeFileTitle.textContent = 'No file loaded';
    
    // Reset status badges
    wordCountBadge.textContent = 'Words: 0';
    charCountBadge.textContent = 'Chars: 0';
    readingTimeBadge.textContent = 'Est. Reading Time: 0 min';
    
    // Clear preview
    beautifiedPreview.innerHTML = `
        <div class="empty-preview-placeholder">
            <span class="material-symbols-outlined">description</span>
            <p>Nothing to display yet.</p>
        </div>
    `;
    
    // UI Transitions
    uploadZone.classList.add('active');
    
    // Disable buttons
    clearBtn.setAttribute('disabled', 'true');
    pdfDownloadBtn.setAttribute('disabled', 'true');
    fileInput.value = ''; // Reset input element
    
    // Reset line numbers
    updateLineNumbers();
}

// 7. Live Editor Rendering and Syncing
markdownTextarea.addEventListener('input', () => {
    sessionMarkdown = markdownTextarea.value;
    compileMarkdown();
});

// Synchronize scrolls
markdownTextarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = markdownTextarea.scrollTop;
});

function updateLineNumbers() {
    const lines = markdownTextarea.value.split('\n');
    const totalLines = lines.length;
    let numberHtml = '';
    for (let i = 1; i <= totalLines; i++) {
        numberHtml += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = numberHtml;
}

function calculateStats(text) {
    const charCount = text.length;
    
    // Word calculation: split by whitespace and filter empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(wordCount / 200);
    
    wordCountBadge.textContent = `Words: ${wordCount}`;
    charCountBadge.textContent = `Chars: ${charCount}`;
    readingTimeBadge.textContent = `Est. Reading Time: ${readingTime} min`;
}

function compileMarkdown() {
    updateLineNumbers();
    calculateStats(sessionMarkdown);
    
    if (!sessionMarkdown.trim()) {
        beautifiedPreview.innerHTML = `
            <div class="empty-preview-placeholder">
                <span class="material-symbols-outlined">description</span>
                <p>Start typing or upload a markdown file to begin.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Parse markdown using marked.js
        const rawHtml = marked.parse(sessionMarkdown);
        // Sanitize output to prevent XSS
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        
        beautifiedPreview.innerHTML = cleanHtml;
        
        // Highlight code blocks
        beautifiedPreview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        
    } catch (error) {
        console.error('Failed to parse Markdown:', error);
        beautifiedPreview.innerHTML = `
            <div class="empty-preview-placeholder text-error">
                <span class="material-symbols-outlined">error</span>
                <p>Error rendering Markdown. Please check your syntax.</p>
            </div>
        `;
    }
}

// 8. PDF Export Pipeline
pdfDownloadBtn.addEventListener('click', () => {
    if (!sessionMarkdown.trim()) return;
    
    // Set loading state
    const originalText = pdfDownloadBtn.innerHTML;
    pdfDownloadBtn.innerHTML = `
        <span class="material-symbols-outlined fab-icon spinning">sync</span>
        <span class="fab-text">Generating PDF...</span>
    `;
    pdfDownloadBtn.setAttribute('disabled', 'true');
    
    // Fetch values from settings
    const pageSize = pageSizeSelect.value;
    const marginOption = pageMarginSelect.value;
    
    // Map margins to standard values (in mm)
    let margin = 20; // Default normal (20mm)
    if (marginOption === 'narrow') {
        margin = 10;
    } else if (marginOption === 'wide') {
        margin = 30;
    }
    
    // Construct default clean file name
    let pdfFileName = 'beautified-document.pdf';
    if (activeFileName) {
        const baseName = activeFileName.substring(0, activeFileName.lastIndexOf('.'));
        pdfFileName = `${baseName}-beautified.pdf`;
    }
    
    // Configure html2pdf options
    const opt = {
        margin: margin,
        filename: pdfFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            // Capture specific elements appropriately
            windowWidth: 800
        },
        jsPDF: { 
            unit: 'mm', 
            format: pageSize, 
            orientation: 'portrait' 
        },
        // Force page break behavior based on CSS
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    // Temporarily apply special printing classes for html2pdf to process
    beautifiedPreview.classList.add('printing-active');
    
    // Export target (the preview content paper wrapper)
    html2pdf().set(opt).from(beautifiedPreview).save().then(() => {
        // Restore button state
        pdfDownloadBtn.innerHTML = originalText;
        pdfDownloadBtn.removeAttribute('disabled');
        beautifiedPreview.classList.remove('printing-active');
    }).catch(err => {
        console.error('PDF export failed:', err);
        alert('Failed to generate PDF. Please try again.');
        pdfDownloadBtn.innerHTML = originalText;
        pdfDownloadBtn.removeAttribute('disabled');
        beautifiedPreview.classList.remove('printing-active');
    });
});

// In case the user navigates away or refreshes, confirm action
window.addEventListener('beforeunload', (e) => {
    if (sessionMarkdown.trim()) {
        const msg = 'You have active changes in this session. Leaving this page will permanently erase them. Are you sure?';
        e.returnValue = msg;
        return msg;
    }
});
