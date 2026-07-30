// ============================================================
// KONFIGURASI & VARIABEL GLOBAL
// ============================================================
const API_ENDPOINT = 'https://api.example.com/trending'; // Ganti dengan URL API Anda
const CONTAINER_ID = 'trending-container'; // Ganti dengan ID container HTML Anda

// ============================================================
// 1. FUNGSI UTAMA: getImage (Memperbaiki Error TypeError)
// ============================================================
function getImage(url) {
    // CEK KEAMANAN: Cegah error 'url.startsWith is not a function'
    // Jika url null, undefined, atau bukan string, langsung kasih gambar default
    if (!url || typeof url !== 'string') {
        return 'https://placehold.co/300x450/1a1a1a/FFFFFF?text=No+Image'; // Bisa diganti URL lokal Anda
    }

    // LOGIKA ASLI: Cek apakah url diawali dengan '/'
    // Anda bisa menambahkan logika lain di sini (misal cek http/https)
    if (url.startsWith('/')) {
        // Jika url relatif, gabungkan dengan domain utama
        return window.location.origin + url;
    }

    // Jika url sudah lengkap (http/https), return apa adanya
    return url;
}

// ============================================================
// 2. FUNGSI PEMBUAT KARTU (createCard)
// ============================================================
function createCard(item) {
    // 1. Ambil data dengan aman (Gunakan '||' untuk fallback jika data kosong)
    const title = item.title || item.name || 'Judul Tidak Diketahui';
    const imageUrl = item.image || item.poster || item.poster_path || '';
    
    // 2. Buat elemen HTML container (div)
    const card = document.createElement('div');
    card.className = 'movie-card'; // Sesuaikan class CSS Anda

    // 3. Susun HTML di dalam kartu menggunakan Template Literal
    // Perhatikan: Kita panggil getImage() di sini dengan aman
    card.innerHTML = `
        <div class="card-image-container">
            <img 
                src="${getImage(imageUrl)}" 
                alt="${title}" 
                loading="lazy"
                onerror="this.onerror=null; this.src='https://placehold.co/300x450/1a1a1a/FFFFFF?text=Gagal+Load';"
            >
        </div>
        <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <p class="card-subtitle">${item.type || item.media_type || 'Unknown'}</p>
        </div>
    `;

    return card;
}

// ============================================================
// 3. FUNGSI RENDER (renderRow)
// ============================================================
function renderRow(containerId, items) {
    // 1. Ambil container HTML berdasarkan ID
    const container = document.getElementById(containerId);
    
    // 2. Validasi: Jika container tidak ada, atau items kosong/null, keluar dari fungsi
    if (!container) {
        console.error(`Element dengan ID '${containerId}' tidak ditemukan di HTML.`);
        return;
    }
    
    if (!items || !Array.isArray(items)) {
        console.warn('Data items bukan array atau kosong.');
        container.innerHTML = `<p style="color: red; padding: 20px;">Data tidak tersedia atau format salah.</p>`;
        return;
    }

    // 3. Kosongkan container agar tidak double (jika di-refresh)
    container.innerHTML = '';

    // 4. Loop data dan buat kartu
    items.forEach((item, index) => {
        // Validasi: Pastikan item tidak null
        if (item) {
            const card = createCard(item);
            container.appendChild(card);
        }
    });
}

// ============================================================
// 4. FUNGSI LOAD DATA DARI API (loadHome)
// ============================================================
async function loadHome() {
    console.log("Memuat data...");
    
    // Tampilkan loading indicator (opsional)
    const container = document.getElementById(CONTAINER_ID);
    if (container) container.innerHTML = '<div style="padding:20px; color:white;">Sedang memuat data...</div>';

    try {
        // Fetch data dari API
        const response = await fetch(API_ENDPOINT);
        
        // Cek apakah response sukses (200 OK)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Cek struktur JSON Anda. 
        // Mungkin data ada di result.data, result.results, atau langsung result itu sendiri
        let items = result.data || result.results || result; 

        // Jika items bukan array, coba jadikan array
        if (!Array.isArray(items)) {
            items = [items]; 
        }

        // Panggil fungsi render
        renderRow(CONTAINER_ID, items);

    } catch (error) {
        console.error("Gagal memuat home:", error);
        
        // Tampilkan pesan error di layar jika gagal fetch
        const container = document.getElementById(CONTAINER_ID);
        if (container) {
            container.innerHTML = `
                <div style="color: #ff6b6b; background: #2d2d2d; padding: 20px; border-radius: 8px; text-align: center;">
                    <h3>Terjadi Kesalahan</h3>
                    <p>${error.message}</p>
                    <button onclick="loadHome()" style="margin-top:10px; padding: 8px 16px; cursor:pointer;">Coba Lagi</button>
                </div>
            `;
        }
    }
}

// ============================================================
// 5. JALANKAN SAAT HALAMAN DIMUAT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
});
