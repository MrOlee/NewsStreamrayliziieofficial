// ============================================================
// RAYLIZIIE APP – Main Logic
// ============================================================

const API = 'https://api-rayliziie.rayyankrens0304.workers.dev';

// State
let currentPage = 'home';
let searchActive = false;

// DOM refs
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');
const navItems = document.querySelectorAll('.nav-item');
const pages = {
  home: document.getElementById('page-home'),
  anime: document.getElementById('page-anime'),
  drama: document.getElementById('page-drama'),
  film: document.getElementById('page-film'),
  tv: document.getElementById('page-tv'),
};
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// ---- Helpers ----
function showLoader(show) {
  loader.classList.toggle('hide', !show);
}

function apiCall(path, method = 'GET', body = null) {
  return fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(res => res.json());
}

function createCard(item, type = '') {
  const card = document.createElement('div');
  card.className = 'card';
  const img = item.poster || item.thumbnail || item.image || 'https://via.placeholder.com/200x300/16161f/9a9ab0?text=No+Image';
  const title = item.title || item.name || 'Judul';
  const year = item.year || item.release_date?.slice(0,4) || '';
  const rating = item.rating || item.score || '';
  const badge = item.episode ? `EP ${item.episode}` : (item.type || '');
  card.innerHTML = `
    <img class="card-img" src="${img}" alt="${title}" loading="lazy" />
    ${badge ? `<span class="card-badge">${badge}</span>` : ''}
    ${rating ? `<span class="card-rating">⭐ ${rating}</span>` : ''}
    <div class="card-info">
      <div class="card-title">${title}</div>
      <div class="card-meta">${year ? `<span>${year}</span>` : ''}</div>
    </div>
  `;
  card.addEventListener('click', () => openPlayer(item));
  return card;
}

function renderRow(containerId, items, limit = 12) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(items) ? items.slice(0, limit) : [];
  if (!list.length) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">Tidak ada konten</p>';
    return;
  }
  list.forEach(item => {
    container.appendChild(createCard(item));
  });
}

// ---- Fetch Data ----
async function loadHome() {
  showLoader(true);
  try {
    // Trending (animekompi home)
    const trending = await apiCall('/animekompi/home');
    renderRow('trendingRow', trending?.data || trending?.items || [], 10);

    // Anime (animekompi list)
    const anime = await apiCall('/animekompi/list');
    renderRow('animeRow', anime?.data || anime?.items || [], 10);

    // Drama (dramovnime list via POST)
    const drama = await apiCall('/dramovnime/list', 'POST', { page: 1, limit: 20 });
    renderRow('dramaRow', drama?.data || drama?.items || [], 10);

    // Film (filmbox home)
    const film = await apiCall('/filmbox/home');
    renderRow('filmRow', film?.data || film?.items || [], 10);

    // Schedule
    const schedule = await apiCall('/animekompi/schedule');
    const schedList = document.getElementById('scheduleList');
    if (schedule?.data && Array.isArray(schedule.data)) {
      schedList.innerHTML = schedule.data.map(item => `
        <div class="schedule-item">
          <span class="day">${item.day || item.hari || 'Hari'}</span>
          <span class="count">${item.count || item.jumlah || 0} rilis</span>
        </div>
      `).join('');
      document.getElementById('scheduleDate').textContent = `Update: ${new Date().toLocaleDateString('id-ID')}`;
    }

    // Providers
    const providers = await apiCall('/');
    const providerGrid = document.getElementById('providerList');
    if (providers?.supported_providers) {
      const names = Object.keys(providers.supported_providers);
      providerGrid.innerHTML = names.map(name => `
        <div class="provider-item">
          <div class="name">${name}</div>
          <span class="status"></span>
          <div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">${providers.supported_providers[name].length} endpoint</div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
  showLoader(false);
}

// ---- Page Navigation ----
function navigateTo(page) {
  currentPage = page;
  // Update nav
  navItems.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  // Show page
  Object.keys(pages).forEach(key => {
    pages[key].classList.toggle('active', key === page);
  });
  // If page is not home, load content
  if (page !== 'home' && pages[page]) {
    loadCategoryPage(page);
  }
}

async function loadCategoryPage(category) {
  const container = pages[category];
  container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Memuat...</div>';
  try {
    let data;
    let endpoint;
    if (category === 'anime') {
      endpoint = '/animekompi/list';
      data = await apiCall(endpoint);
    } else if (category === 'drama') {
      endpoint = '/dramovnime/list';
      data = await apiCall(endpoint, 'POST', { page: 1, limit: 30 });
    } else if (category === 'film') {
      endpoint = '/filmbox/home';
      data = await apiCall(endpoint);
    } else if (category === 'tv') {
      endpoint = '/vidio/channels';
      data = await apiCall(endpoint);
    }
    const items = data?.data || data?.items || data?.channels || [];
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">Belum ada konten</p>';
      return;
    }
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:8px;';
    items.slice(0, 30).forEach(item => {
      grid.appendChild(createCard(item));
    });
    container.appendChild(grid);
  } catch (e) {
    container.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">Gagal memuat</p>';
  }
}

// ---- Search ----
async function performSearch(query) {
  if (!query.trim()) return;
  showLoader(true);
  try {
    // Try multiple providers
    const results = [];
    const providers = ['animekompi', 'filmbox', 'viu', 'iqiyi'];
    for (const p of providers) {
      try {
        const res = await apiCall(`/${p}/search?keyword=${encodeURIComponent(query)}`);
        const items = res?.data || res?.items || res?.results || [];
        if (items.length) results.push(...items.slice(0, 5));
      } catch (e) {}
    }
    showLoader(false);
    if (!results.length) {
      alert('Tidak ditemukan');
      return;
    }
    // Tampilkan di modal sederhana atau navigasi ke halaman hasil
    // Untuk demo, kita tampilkan di halaman home
    const homePage = document.getElementById('page-home');
    if (!homePage.classList.contains('active')) navigateTo('home');
    const row = document.getElementById('trendingRow');
    row.innerHTML = '';
    results.slice(0, 12).forEach(item => row.appendChild(createCard(item)));
  } catch (e) {
    showLoader(false);
    alert('Error saat mencari');
  }
}

// ---- Player ----
function openPlayer(item) {
  const modal = document.getElementById('playerModal');
  document.getElementById('modalTitle').textContent = item.title || item.name || 'Judul';
  document.getElementById('videoDesc').textContent = item.description || item.sinopsis || 'Deskripsi tidak tersedia';
  document.getElementById('videoYear').textContent = item.year || item.release_date?.slice(0,4) || '';
  const video = document.getElementById('videoPlayer');
  // Coba ambil stream URL
  const slug = item.slug || item.id || '';
  if (slug) {
    apiCall(`/animekompi/play?slug=${slug}`).then(res => {
      const url = res?.url || res?.stream || res?.play || '';
      if (url) {
        video.src = url;
        video.load();
      } else {
        video.src = '';
        video.poster = 'https://via.placeholder.com/800x450/16161f/9a9ab0?text=No+Stream';
      }
    }).catch(() => {});
  } else {
    video.src = '';
  }
  modal.classList.add('open');
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('playerModal').classList.remove('open');
  document.getElementById('videoPlayer').pause();
});
document.getElementById('playerModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('playerModal').classList.remove('open');
    document.getElementById('videoPlayer').pause();
  }
});

// ---- Event Listeners ----
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.page);
  });
});

// Search toggle
searchToggle.addEventListener('click', () => {
  searchActive = !searchActive;
  searchBar.classList.toggle('hidden', !searchActive);
  if (searchActive) searchInput.focus();
});
searchBtn.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') performSearch(searchInput.value);
});

// View all links
document.querySelectorAll('.view-all').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    if (page) navigateTo(page);
  });
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadHome();
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch(() => {});
  }
});
