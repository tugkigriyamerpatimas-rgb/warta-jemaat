// --- KONFIGURASI ---
const pdfUrl = 'WARTA JEMAAT GKI GMM EDISI 13 Tahun ke-22 (14-12-2025).pdf'; // Pastikan nama file ini sesuai
const bookElement = document.getElementById('book');
const docNameElement = document.getElementById('docName');

docNameElement.innerText = "📥" + pdfUrl; 
docNameElement.href = pdfUrl;

// Deteksi jika layar HP (Mobile)
const isMobile = window.innerWidth < 768;

// Inisialisasi Flipbook
const pageFlip = new St.PageFlip(bookElement, {
    // Ukuran dasar kertas A4 (Hanya sebagai rasio aspek, bukan ukuran pixel layar)
    width: 595, 
    height: 842,

    size: 'stretch', // PENTING: Melar mengikuti lebar layar/container
    
    // Batasan Zoom/Ukuran
    minWidth: 200,
    maxWidth: 2000,
    minHeight: 200,
    maxHeight: 2000,

    showCover: true,
    
    // Logic: Jika HP (isMobile) paksa 1 halaman (portrait), jika Desktop biarkan otomatis
    usePortrait: true, 
    startPage: 0,
    autoSize: true,      // Biarkan library menyesuaikan tinggi otomatis
    maxShadowOpacity: 0.5
});

async function loadPdf() {
    try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            
            const div = document.createElement('div');
            div.className = 'my-page';
            
            if (i === 1 || i === pdf.numPages) div.dataset.density = 'hard';
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Render dengan skala tinggi (2.0) agar teks tajam saat di-zoom di HP
            // Walaupun canvas besar, CSS object-fit akan membuatnya pas di layar
            const viewport = page.getViewport({ scale: 2.0 }); 
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            div.appendChild(canvas);
            bookElement.appendChild(div);
        }

        // Load halaman ke Flipbook
        pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
        
        // Update info halaman
        updatePageInfo();

    } catch (error) {
        console.error("Error: " + error);
        bookElement.innerHTML = `<p style="color:white;">Gagal: ${error.message}</p>`;
    }
}

// Navigasi
document.getElementById('btnPrev').onclick = () => pageFlip.flipPrev();
document.getElementById('btnNext').onclick = () => pageFlip.flipNext();

// Update nomor halaman
pageFlip.on('flip', (e) => {
    updatePageInfo();
});

function updatePageInfo() {
    // Mengambil index halaman + 1
    const currentPage = pageFlip.getCurrentPageIndex() + 1;
    document.getElementById('pageInfo').innerText = currentPage;
}

// Jalankan
loadPdf();