document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const articleList = document.getElementById('article-list');
    if (!searchInput || !articleList) {
        return;
    }

    const categoryFilter = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');
    const noResults = document.getElementById('no-results');
    const pager = document.getElementById('archive-pager');
    const countInfo = document.getElementById('archive-count');

    const PER_PAGE = 8;
    let articles = [];
    let page = 0;
    let fuse;

    fetch('/artikel/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            articles = Array.isArray(data) ? data : [];
            if (window.Fuse) {
                fuse = new Fuse(articles, {
                    keys: ['title', 'summary'],
                    includeScore: true,
                    threshold: 0.4,
                });
            }
            render();
        })
        .catch(error => {
            console.error('Error fetching articles:', error);
            articleList.innerHTML = '<p class="text-center text-red-500">Gagal memuat daftar artikel.</p>';
        });

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function filtered() {
        let list = articles.slice();
        const term = searchInput ? searchInput.value.trim() : '';
        if (term && fuse) {
            list = fuse.search(term).map(r => r.item);
        }
        const cat = categoryFilter ? categoryFilter.value : '';
        if (cat) {
            list = list.filter(a =>
                Array.isArray(a.categories) &&
                a.categories.map(c => String(c).toLowerCase()).includes(cat.toLowerCase())
            );
        }
        const sortValue = sortBy ? sortBy.value : 'newest';
        list.sort((a, b) => {
            if (sortValue === 'oldest') return new Date(a.date) - new Date(b.date);
            if (sortValue === 'title-asc') return String(a.title).localeCompare(String(b.title));
            if (sortValue === 'title-desc') return String(b.title).localeCompare(String(a.title));
            return new Date(b.date) - new Date(a.date);
        });
        return list;
    }

    function cardHTML(item) {
        const cats = Array.isArray(item.categories) && item.categories.length
            ? '<span class="inline-block text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1">' + esc(item.categories[0]) + '</span><br>'
            : '';
        const date = new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const img = esc(item.image || '/images/logo_pie.jpg');
        return '' +
        '<article class="bg-white rounded-lg border border-gray-200 p-4 md:p-5 hover:border-orange-300 hover:shadow-md transition-all flex gap-4">' +
            '<div class="w-24 h-24 md:w-36 md:h-36 flex-shrink-0 overflow-hidden rounded bg-gray-100 border border-gray-200">' +
                '<a href="' + esc(item.permalink) + '"><img src="' + img + '" alt="' + esc(item.title) + '" loading="lazy" class="w-full h-full object-cover object-center"></a>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
                cats +
                '<h2 class="text-lg md:text-2xl font-bold font-serif-display mb-1 leading-snug">' +
                    '<a href="' + esc(item.permalink) + '" class="text-gray-900 hover:text-orange-500 transition-colors">' + esc(item.title) + '</a>' +
                '</h2>' +
                '<div class="text-xs md:text-sm text-gray-500 mb-2"><time>' + esc(date) + '</time></div>' +
                '<p class="text-sm md:text-base text-gray-600 text-justify">' + esc(item.summary) + '</p>' +
                '<div class="mt-3">' +
                    '<a href="' + esc(item.permalink) + '" class="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-sm">Baca Selengkapnya ' +
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg></a>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    function pagerHTML(totalPages) {
        if (!pager || totalPages <= 1) return;
        const btn = 'min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:border-orange-400 hover:text-orange-600 transition-all';
        const btnWide = 'h-10 px-4 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:border-orange-400 hover:text-orange-600 transition-all';
        const active = 'min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm shadow-sm';
        const off = ' opacity-40 pointer-events-none';
        let nums = [];
        const WIN = 7;
        let start = Math.max(0, Math.min(page - Math.floor(WIN / 2), totalPages - WIN));
        let end = Math.min(totalPages, start + WIN);
        start = Math.max(0, end - WIN);
        for (let i = start; i < end; i++) {
            nums.push(i === page
                ? '<span class="' + active + '" aria-current="page">' + (i + 1) + '</span>'
                : '<a href="#" data-pg="' + i + '" class="' + btn + '">' + (i + 1) + '</a>');
        }
        pager.innerHTML =
            '<a href="#" data-pg="0" class="' + btn + (page === 0 ? off : '') + '" aria-label="Halaman pertama">&laquo;&laquo;</a>' +
            '<a href="#" data-pg="' + (page - 1) + '" class="' + btnWide + (page === 0 ? off : '') + '" aria-label="Halaman sebelumnya">&laquo; Sebelumnya</a>' +
            nums.join('') +
            '<a href="#" data-pg="' + (page + 1) + '" class="' + btnWide + (page >= totalPages - 1 ? off : '') + '" aria-label="Halaman berikutnya">Berikutnya &raquo;</a>' +
            '<a href="#" data-pg="' + (totalPages - 1) + '" class="' + btn + (page >= totalPages - 1 ? off : '') + '" aria-label="Halaman terakhir">&raquo;&raquo;</a>' +
            '<span class="w-full text-center text-sm text-gray-500 mt-1">Halaman ' + (page + 1) + ' dari ' + totalPages + '</span>';
        pager.querySelectorAll('a[data-pg]').forEach(a => {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const n = parseInt(this.getAttribute('data-pg'), 10);
                if (!isNaN(n)) goPage(n);
            });
        });
    }

    function render() {
        const results = filtered();
        const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
        if (page > totalPages - 1) page = totalPages - 1;
        if (page < 0) page = 0;

        if (countInfo) {
            countInfo.textContent = results.length
                ? 'Menampilkan ' + (page * PER_PAGE + 1) + '-' + Math.min(results.length, (page + 1) * PER_PAGE) + ' dari ' + results.length + ' artikel'
                : '';
        }

        if (results.length === 0) {
            articleList.innerHTML = '';
            if (pager) pager.innerHTML = '';
            if (noResults) noResults.classList.remove('hidden');
            return;
        }
        if (noResults) noResults.classList.add('hidden');

        articleList.innerHTML = results
            .slice(page * PER_PAGE, (page + 1) * PER_PAGE)
            .map(cardHTML)
            .join('');
        if (pager) pager.innerHTML = '';
        pagerHTML(totalPages);
    }

    function goPage(n) {
        page = n;
        render();
        if (articleList && articleList.scrollIntoView) {
            articleList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function resetAndRender() {
        page = 0;
        render();
    }

    if (searchInput) searchInput.addEventListener('input', resetAndRender);
    if (categoryFilter) categoryFilter.addEventListener('change', resetAndRender);
    if (sortBy) sortBy.addEventListener('change', resetAndRender);
});
