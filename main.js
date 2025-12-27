const pdfUrl = 'WARTA JEMAAT GKI GMM EDISI 14 Tahun ke-22 (21-12-2025).pdf';
let flipBook = null;

async function loadAndRenderPdf() {
    const bookEl = document.getElementById('book');
    bookEl.innerHTML = '<div style="color:white">Memuat...</div>';

    try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        document.getElementById('pageTotal').innerText = totalPages;

        bookEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 }); // Scale tinggi agar tajam

            const div = document.createElement('div');
            div.className = 'my-page';
            
            // Logika Hard Cover: Hanya halaman 1 dan Terakhir
            div.dataset.density = (i === 1 || i === totalPages) ? 'hard' : 'soft';

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            div.appendChild(canvas);
            fragment.appendChild(div);
        }

        bookEl.appendChild(fragment);
        initFlipBook();

    } catch (e) {
        bookEl.innerHTML = `<div style="color:white">Error: ${e.message}</div>`;
    }
}

function initFlipBook() {
    const isMobile = window.innerWidth < 768;

    if (flipBook) flipBook.destroy();

    flipBook = new St.PageFlip(document.getElementById('book'), {
        width: 595,
        height: 842,
        size: "stretch",
        minWidth: 315,
        maxWidth: 1000,
        minHeight: 420,
        maxHeight: 1350,
        showCover: true, // WAJIB untuk buka-tutup rapi
        mode: isMobile ? "portrait" : "double",
        clickEventForward: false,
        useMouseEvents: true,
        maxShadowOpacity: 0.5,
    });

    flipBook.loadFromHTML(document.querySelectorAll('.my-page'));

    flipBook.on('flip', (e) => {
        document.getElementById('pageInfo').innerText = e.data + 1;
    });
}

// Event Listeners
document.getElementById('prevBtn').onclick = () => flipBook.flipPrev();
document.getElementById('nextBtn').onclick = () => flipBook.flipNext();

window.addEventListener('resize', () => {
    setTimeout(initFlipBook, 200);
});

loadAndRenderPdf();