document.addEventListener('DOMContentLoaded', function () {
    // --- PERBAIKAN DIMULAI DI SINI ---
    // Elemen-elemen ini adalah inti dari fungsionalitas pencarian.
    const searchInput = document.getElementById('search-input');
    const articleList = document.getElementById('article-list');

    // Jika salah satu elemen inti ini tidak ada, hentikan eksekusi skrip.
    // Ini mencegah error terjadi di halaman yang tidak memiliki fitur pencarian.
    if (!searchInput || !articleList) {
        return; 
    }
    // --- PERBAIKAN SELESAI ---

    // Elemen-elemen opsional lainnya
    const categoryFilter = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');
    const noResults = document.getElementById('no-results');

    let articles = [];
    let fuse;

    // Ambil data JSON untuk pencarian
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
            // Tampilkan hasil awal setelah data dimuat
            updateResults();
        })
        .catch(error => {
            console.error('Error fetching articles:', error);
            if (articleList) {
                articleList.innerHTML = '<p class="text-center text-red-500">Gagal memuat daftar artikel.</p>';
            }
        });

    function renderArticles(results) {
        // Pastikan elemen ada sebelum memanipulasinya
        if (!articleList || !noResults) return;

        articleList.innerHTML = '';
        if (results.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }
        noResults.classList.add('hidden');

        results.forEach(article => {
            const item = article.item ? article.item : article;
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
                    <div class="prose max-w-none text-justify">${item.summary}</div>
                    <div class="mt-4">
                        <a href="${item.permalink}" class="font-semibold text-orange-500 hover:text-orange-600 transition-colors">Baca Selengkapnya →</a>
                    </div>
                </article>
            `;
            articleList.innerHTML += articleHTML;
        });
    }

    function updateResults() {
        let currentResults = articles;
        // Gunakan null-safe access dengan optional chaining (?) jika elemen mungkin tidak ada
        const searchTerm = searchInput?.value.trim();

        if (searchTerm && fuse) {
            currentResults = fuse.search(searchTerm).map(result => result.item);
        }

        const selectedCategory = categoryFilter?.value;
        if (selectedCategory) {
            currentResults = currentResults.filter(article => 
                Array.isArray(article.categories) && article.categories.map(c => c.toLowerCase()).includes(selectedCategory.toLowerCase())
            );
        }
        
        const sortValue = sortBy?.value;
        if(sortValue) {
            currentResults.sort((a, b) => {
                if (sortValue === 'newest') return new Date(b.date) - new Date(a.date);
                if (sortValue === 'oldest') return new Date(a.date) - new Date(b.date);
                if (sortValue === 'title-asc') return a.title.localeCompare(b.title);
                if (sortValue === 'title-desc') return b.title.localeCompare(a.title);
                return 0;
            });
        }

        renderArticles(currentResults);
    }

    // Tambahkan event listener hanya jika elemennya ada
    if (searchInput) searchInput.addEventListener('input', updateResults);
    if (categoryFilter) categoryFilter.addEventListener('change', updateResults);
    if (sortBy) sortBy.addEventListener('change', updateResults);
});
