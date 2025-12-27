const currentPdfPath = 'WARTA JEMAAT GKI GMM EDISI 14 Tahun ke-22 (21-12-2025).pdf';
let flipObject = null;
let pdfDocument = null;
let isLoading = false;
const elBook = document.getElementById('book');

// Variabel untuk tracking state
let currentPageIndex = 0;
let totalPages = 0;

async function startApp() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        elBook.innerHTML = '<div class="loading">Memuat PDF...</div>';
        
        // Load PDF
        pdfDocument = await pdfjsLib.getDocument(currentPdfPath).promise;
        totalPages = pdfDocument.numPages;
        document.getElementById('pageTotal').innerText = totalPages;
        
        // Render halaman pertama terlebih dahulu
        await renderPages();
        
        setupFlipbook();
        
    } catch (err) {
        console.error('Error loading PDF:', err);
        elBook.innerHTML = `
            <div class="error">
                <p>Gagal memuat PDF.</p>
                <p>Pastikan file "${currentPdfPath}" tersedia di server.</p>
                <p>Error: ${err.message}</p>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

async function renderPages() {
    const fragment = document.createDocumentFragment();
    const pagesToRender = Math.min(3, totalPages); // Render 3 halaman pertama dulu
    
    for (let i = 1; i <= pagesToRender; i++) {
        const pageDiv = await createPage(i);
        fragment.appendChild(pageDiv);
    }
    
    elBook.innerHTML = '';
    elBook.appendChild(fragment);
    
    // Render halaman lainnya secara lazy
    if (totalPages > pagesToRender) {
        setTimeout(() => renderRemainingPages(pagesToRender + 1), 1000);
    }
}

async function renderRemainingPages(startIndex) {
    for (let i = startIndex; i <= totalPages; i++) {
        const pageDiv = await createPage(i);
        elBook.appendChild(pageDiv);
    }
}

async function createPage(pageNumber) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 }); // Skala optimal
    
    const div = document.createElement('div');
    div.className = 'my-page';
    div.dataset.page = pageNumber;
    div.dataset.density = (pageNumber === 1 || pageNumber === totalPages) ? 'hard' : 'soft';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    div.appendChild(canvas);
    
    return div;
}

function setupFlipbook() {
    const isMobile = window.innerWidth < 768;
    
    // Destroy existing instance
    if (flipObject) {
        currentPageIndex = flipObject.getCurrentPageIndex();
        flipObject.destroy();
    }
    
    // Get appropriate dimensions
    const viewportWidth = document.getElementById('book-viewport').offsetWidth;
    const viewportHeight = document.getElementById('book-viewport').offsetHeight;
    
    const bookWidth = isMobile ? Math.min(viewportWidth - 40, 400) : 600;
    const bookHeight = isMobile ? Math.min(viewportHeight - 40, 500) : 800;
    
    // Create new flipbook instance
    flipObject = new St.PageFlip(elBook, {
        width: bookWidth,
        height: bookHeight,
        size: "fixed",
        showCover: true,
        mobileScrollSupport: true,
        clickEventForward: true,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: !isMobile,
        maxShadowOpacity: 0.3,
        startPage: currentPageIndex,
        mode: isMobile ? "portrait" : "double"
    });
    
    flipObject.loadFromHTML(document.querySelectorAll('.my-page'));
    
    // Update page number display
    flipObject.on('flip', (e) => {
        currentPageIndex = e.data;
        document.getElementById('pageInfo').innerText = currentPageIndex + 1;
    });
    
    // Handle state changes
    flipObject.on('changeState', (e) => {
        console.log('Flipbook state:', e.data);
    });
}

// Navigation handlers
document.getElementById('prevBtn').addEventListener('click', () => {
    if (flipObject) {
        flipObject.flipPrev();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (flipObject) {
        flipObject.flipNext();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!flipObject) return;
    
    if (e.key === 'ArrowLeft') {
        flipObject.flipPrev();
    } else if (e.key === 'ArrowRight') {
        flipObject.flipNext();
    }
});

// Handle resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (flipObject && !isLoading) {
            setupFlipbook();
        }
    }, 250);
});

// Touch events for mobile
let touchStartX = 0;
let touchEndX = 0;

elBook.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

elBook.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && flipObject) {
            flipObject.flipNext(); // Swipe left
        } else if (flipObject) {
            flipObject.flipPrev(); // Swipe right
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if St.PageFlip is available
    if (typeof St === 'undefined' || !St.PageFlip) {
        console.error('PageFlip library not loaded!');
        elBook.innerHTML = '<div class="error">PageFlip library gagal dimuat. Periksa koneksi internet.</div>';
        return;
    }
    
    startApp();
});

// Fallback for St.PageFlip if not globally available
if (typeof St === 'undefined') {
    window.St = {
        PageFlip: class PageFlip {
            constructor(element, options) {
                console.error('PageFlip library not properly loaded');
            }
        }
    };
}