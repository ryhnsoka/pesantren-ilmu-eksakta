document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');
    const articleList = document.getElementById('article-list');
    const noResults = document.getElementById('no-results');

    let articles = [];
    let fuse;

    // Ambil data dari /artikel/index.json
    fetch('/artikel/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            articles = data;
            fuse = new Fuse(articles, {
                keys: ['title', 'summary'],
                includeScore: true,
                threshold: 0.4,
            });
            updateResults(); // Tampilkan semua artikel saat pertama kali dimuat
        })
        .catch(error => {
            console.error('Error fetching or parsing index.json:', error);
            articleList.innerHTML = '<p class="text-center text-red-500">Gagal memuat daftar artikel. Silakan coba lagi nanti.</p>';
        });

    function renderArticles(results) {
        articleList.innerHTML = '';
        if (results.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }
        noResults.classList.add('hidden');

        results.forEach(article => {
            const item = article.item ? article.item : article; // Fuse.js membungkus hasil dalam 'item'
            const articleHTML = `
                <article class="page-content">
                    <header>
                        <h2 class="text-2xl md:text-3xl font-bold font-serif-display mb-2">
                            <a href="${item.permalink}" class="text-gray-900 hover:text-orange-500 transition-colors">${item.title}</a>
                        </h2>
                        <div class="text-sm text-gray-500 mb-4">
                            <time>${new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                        </div>
                    </header>
                    <div class="prose max-w-none text-justify">
                        ${item.summary}
                    </div>
                    <div class="mt-4">
                        <a href="${item.permalink}" class="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            Baca Selengkapnya →
                        </a>
                    </div>
                </article>
            `;
            articleList.innerHTML += articleHTML;
        });
    }

    // Fungsi utama yang sudah diperbaiki
    function updateResults() {
        let currentResults = articles; // Selalu mulai dengan daftar artikel lengkap

        // 1. Terapkan filter PENCARIAN terlebih dahulu
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            currentResults = fuse.search(searchTerm).map(result => result.item);
        }

        // 2. Terapkan filter KATEGORI pada hasil di atas
        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
            currentResults = currentResults.filter(article => 
                article.categories && article.categories.includes(selectedCategory)
            );
        }

        // 3. Terapkan PENGURUTAN pada hasil akhir
        const sortValue = sortBy.value;
        currentResults.sort((a, b) => {
            if (sortValue === 'newest') { return new Date(b.date) - new Date(a.date); }
            if (sortValue === 'oldest') { return new Date(a.date) - new Date(b.date); }
            if (sortValue === 'title-asc') { return a.title.localeCompare(b.title); }
            if (sortValue === 'title-desc') { return b.title.localeCompare(a.title); }
            return 0;
        });

        renderArticles(currentResults);
    }

    // Tambahkan event listener ke setiap elemen kontrol
    searchInput.addEventListener('input', updateResults);
    categoryFilter.addEventListener('change', updateResults);
    sortBy.addEventListener('change', updateResults);
});