const pdfUrl = 'WARTA JEMAAT GKI GMM EDISI 14 Tahun ke-22 (21-12-2025).pdf';
const bookElement = document.getElementById('book');
const docNameElement = document.getElementById('docName');

docNameElement.innerText = "📥 " + pdfUrl;
docNameElement.href = pdfUrl;

let pageFlip = null;
const bookElement = document.getElementById('book');

// Fungsi inisialisasi Flipbook
function initFlipbook() {
    const isMobile = window.innerWidth < 768;
    
    if (pageFlip) pageFlip.destroy();

    pageFlip = new St.PageFlip(bookElement, {
        width: 595,
        height: 842,
        size: "stretch",
        showCover: true, 
        mode: isMobile ? "portrait" : "double",
        clickEventForward: false,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: false,
        maxShadowOpacity: 0.5
    });

    const pages = document.querySelectorAll('.my-page');
    pageFlip.loadFromHTML(pages);

    pageFlip.on('flip', (e) => {
        document.getElementById('pageInfo').innerText = e.data + 1;
    });
}

async function loadPdf() {
    try {
        // Tampilkan teks loading saat proses render
        bookElement.innerHTML = `<div id="loading-status">Menyiapkan Halaman...</div>`;
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        // Simpan semua elemen halaman dalam fragment agar tidak muncul satu-satu (menghindari berantakan)
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const div = document.createElement('div');
            div.className = 'my-page';
            
            // Set Density: Hard untuk halaman 1 dan Terakhir
            div.dataset.density = (i === 1 || i === pdf.numPages) ? 'hard' : 'soft';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Gunakan scale yang konsisten
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            div.appendChild(canvas);
            fragment.appendChild(div);
        }

        // Hapus status loading dan masukkan semua halaman sekaligus
        bookElement.innerHTML = '';
        bookElement.appendChild(fragment);

        // Berikan jeda sedikit agar DOM siap sebelum Flipbook di-init
        setTimeout(() => {
            initFlipbook();
        }, 100);

    } catch (error) {
        bookElement.innerHTML = `<p style="color:white;">Gagal memuat: ${error.message}</p>`;
    }
}

// Navigasi Samping
document.querySelector('.nav-left').onclick = () => pageFlip && pageFlip.flipPrev();
document.querySelector('.nav-right').onclick = () => pageFlip && pageFlip.flipNext();

// Perbaikan: Gunakan ResizeObserver untuk menangani embed yang ukurannya berubah-ubah
const resizeObserver = new ResizeObserver(() => {
    if (pageFlip) initFlipbook();
});
resizeObserver.observe(document.body);

loadPdf();