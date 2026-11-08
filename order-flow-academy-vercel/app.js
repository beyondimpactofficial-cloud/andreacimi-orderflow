// Order Flow Academy App Script
document.addEventListener('DOMContentLoaded', async () => {
  let chapters = [];
  let videos = [];
  let glossary = [];
  let currentChapterIdx = 0;
  let currentFontSize = 13;
  let selectedGlossaryCat = 'all';
  let selectedGlossaryLetter = 'all';

  // DOM Elements
  const chapterListEl = document.getElementById('chapter-list');
  const readerContentEl = document.getElementById('reader-content');
  const currentChapterNumEl = document.getElementById('current-chapter-num');
  const readingTimeEl = document.getElementById('reading-time');
  const readingProgressEl = document.getElementById('reading-progress');
  const btnPrevChapter = document.getElementById('btn-prev-chapter');
  const btnNextChapter = document.getElementById('btn-next-chapter');
  const globalSearchInput = document.getElementById('global-search');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const collapseSidebarBtn = document.getElementById('collapse-sidebar');
  const sidebarEl = document.getElementById('app-sidebar');

  // Load Data
  try {
    const chRes = await fetch('chapters.json');
    chapters = await chRes.json();
    const vidRes = await fetch('videos.json');
    videos = await vidRes.json();
    const glossRes = await fetch('glossary.json');
    glossary = await glossRes.json();
    console.log(`Loaded ${chapters.length} chapters, ${videos.length} videos, ${glossary.length} glossary terms.`);
  } catch (err) {
    console.error('Error loading data:', err);
  }

  // Render Sidebar Chapters
  function renderSidebar() {
    chapterListEl.innerHTML = '';
    chapters.forEach((ch, idx) => {
      const item = document.createElement('div');
      item.className = `chapter-item ${idx === currentChapterIdx ? 'active' : ''}`;
      item.innerHTML = `
        <span class="ch-num">${ch.number}</span>
        <span class="ch-title">${ch.title}</span>
      `;
      item.addEventListener('click', () => {
        loadChapter(idx);
        switchTab('reader');
      });
      chapterListEl.appendChild(item);
    });
  }

  // Load Chapter into Reader
  function loadChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    currentChapterIdx = idx;

    const ch = chapters[idx];
    currentChapterNumEl.textContent = ch.number;
    
    // Estimate reading time (approx 200 words per minute)
    const words = ch.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 180));
    readingTimeEl.textContent = `⏱️ ~${minutes} mnt baca (${words.toLocaleString()} kata)`;

    let banner = '';
    if (ch.number.includes('16')) {
      banner = `
        <div class="callout callout-important" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
          <div>
            <strong>🔍 MODE PENCARIAN CEPAT TERSEDIA</strong><br>
            <span style="font-size: 9pt;">Akang bisa mencari kata kunci instan, memfilter per kategori, dan memilih abjad istilah di tab interaktif khusus.</span>
          </div>
          <button class="tool-btn" id="btn-jump-glossary-tab" style="background: var(--accent-gold); color: #000; font-weight: 800; padding: 8px 16px;">Buka 100 Glosarium Interaktif ↗</button>
        </div>
      `;
    }

    readerContentEl.innerHTML = `
      <h1 class="chapter-title"><span class="chapter-number">${ch.number}</span>${ch.title}</h1>
      ${banner}
      ${ch.content}
    `;

    document.getElementById('btn-jump-glossary-tab')?.addEventListener('click', () => {
      switchTab('glossary');
    });

    // Highlight active in sidebar
    document.querySelectorAll('.chapter-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    // Scroll to top
    document.getElementById('app-main').scrollTop = 0;

    // Save position in localStorage
    localStorage.setItem('saved_chapter_idx', idx);
  }

  // Switch Main Nav Tabs
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  function switchTab(tabId) {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabViews.forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    if (tabId === 'cases') renderCases();
    if (tabId === 'rules') renderRules();
    if (tabId === 'videos') renderVideos();
    if (tabId === 'glossary') {
      renderGlossary();
      setTimeout(() => {
        document.getElementById('glossary-search')?.focus();
      }, 50);
    }
    if (tabId === 'quiz') renderQuiz();
    if (tabId === 'simulator') initSimulator();
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Reading Progress on Scroll
  const appMainEl = document.getElementById('app-main');
  appMainEl.addEventListener('scroll', () => {
    const scrollTop = appMainEl.scrollTop;
    const scrollHeight = appMainEl.scrollHeight - appMainEl.clientHeight;
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      readingProgressEl.style.width = `${progress}%`;
    }
  });

  // Prev / Next Chapter Buttons
  btnPrevChapter.addEventListener('click', () => {
    if (currentChapterIdx > 0) loadChapter(currentChapterIdx - 1);
  });
  btnNextChapter.addEventListener('click', () => {
    if (currentChapterIdx < chapters.length - 1) loadChapter(currentChapterIdx + 1);
  });

  // Font Size Adjuster
  document.getElementById('btn-font-smaller').addEventListener('click', () => {
    if (currentFontSize > 11) {
      currentFontSize -= 1;
      readerContentEl.style.fontSize = `${currentFontSize}pt`;
    }
  });
  document.getElementById('btn-font-larger').addEventListener('click', () => {
    if (currentFontSize < 20) {
      currentFontSize += 1;
      readerContentEl.style.fontSize = `${currentFontSize}pt`;
    }
  });

  // Copy Chapter
  document.getElementById('btn-copy-chapter').addEventListener('click', () => {
    const text = readerContentEl.innerText;
    navigator.clipboard.writeText(text);
    alert('Teks bab berhasil disalin ke clipboard!');
  });

  // Bookmark
  document.getElementById('btn-bookmark').addEventListener('click', () => {
    const ch = chapters[currentChapterIdx];
    localStorage.setItem('bookmarked_chapter', JSON.stringify({ idx: currentChapterIdx, title: ch.title }));
    alert(`Bab "${ch.number}: ${ch.title}" berhasil ditandai sebagai bookmark!`);
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggleBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
  });

  // Sidebar Collapse
  collapseSidebarBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('collapsed');
    collapseSidebarBtn.textContent = sidebarEl.classList.contains('collapsed') ? '▶' : '◀';
  });

  // Global Search
  globalSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderSidebar();
      return;
    }
    chapterListEl.innerHTML = '';
    chapters.forEach((ch, idx) => {
      const inTitle = ch.title.toLowerCase().includes(query);
      const inContent = ch.content.toLowerCase().includes(query);
      if (inTitle || inContent) {
        const item = document.createElement('div');
        item.className = 'chapter-item';
        item.innerHTML = `
          <span class="ch-num">${ch.number}</span>
          <span class="ch-title">${ch.title}</span>
        `;
        item.addEventListener('click', () => {
          loadChapter(idx);
          switchTab('reader');
        });
        chapterListEl.appendChild(item);
      }
    });
  });

  // ================= TAB: 10 REAL CASES =================
  function renderCases() {
    const container = document.getElementById('cases-container');
    const caseChapter = chapters.find(c => c.number.includes('13B'));
    if (!caseChapter) return;

    // Split into 10 cases
    const parts = caseChapter.content.split(/<h3>/g);
    container.innerHTML = '';
    parts.forEach((p, idx) => {
      if (idx === 0) return;
      const endH3 = p.indexOf('</h3>');
      const title = p.substring(0, endH3);
      const body = p.substring(endH3 + 5).replace(/<hr[^>]*>/g, '');

      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `
        <h3>#${idx} ${title}</h3>
        <div>${body}</div>
      `;
      container.appendChild(card);
    });
  }

  // ================= TAB: 50 GOLDEN RULES =================
  function renderRules(filter = 'all') {
    const container = document.getElementById('rules-container');
    const rulesChapter = chapters.find(c => c.number.includes('15B'));
    if (!rulesChapter) return;

    container.innerHTML = '';
    // Extract list items
    const matches = [...rulesChapter.content.matchAll(/<li>(.*?)<\/li>/gs)];
    matches.forEach((m, idx) => {
      const num = idx + 1;
      let cat = 'dom';
      if (num >= 16 && num <= 30) cat = 'risk';
      if (num >= 31) cat = 'psy';

      if (filter !== 'all' && filter !== cat) return;

      const item = document.createElement('div');
      item.className = 'rule-item';
      item.innerHTML = `
        <span class="rule-badge">Rule #${num}</span>
        <div class="rule-content">${m[1]}</div>
      `;
      container.appendChild(item);
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRules(btn.getAttribute('data-cat'));
    });
  });

  // ================= TAB: 285 VIDEO VAULT =================
  function renderVideos() {
    const container = document.getElementById('videos-container');
    const searchVal = document.getElementById('video-search-input').value.toLowerCase();
    const catVal = document.getElementById('video-cat-select').value;

    container.innerHTML = '';
    const filtered = videos.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchVal);
      const matchesCat = catVal === 'all' || v.category === catVal;
      return matchesSearch && matchesCat;
    });

    filtered.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div>
          <span class="brand-badge" style="margin-bottom: 8px; display: inline-block;">${v.category}</span>
          <h4>${v.title}</h4>
        </div>
        <div>
          <div class="video-meta">
            <span>⏱️ ${v.durationFormatted}</span>
            <span>👁️ ${v.view_count ? v.view_count.toLocaleString() + ' views' : 'Official Lesson'}</span>
          </div>
          <a href="${v.url}" target="_blank" rel="noopener" class="video-btn">▶ Buka di YouTube</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  document.getElementById('video-search-input').addEventListener('input', renderVideos);
  document.getElementById('video-cat-select').addEventListener('change', renderVideos);

  // ================= TAB: 100 GLOSSARY (ENHANCED) =================
  let alphabetBarRendered = false;

  function renderAlphabetBar() {
    const bar = document.getElementById('glossary-alphabet-bar');
    if (!bar || alphabetBarRendered) return;

    // Collect distinct letters
    const letters = new Set();
    glossary.forEach(g => {
      if (g.letter) letters.add(g.letter.toUpperCase());
    });
    const sortedLetters = Array.from(letters).sort();

    bar.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = `alpha-btn ${selectedGlossaryLetter === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'ALL';
    allBtn.addEventListener('click', () => {
      selectedGlossaryLetter = 'all';
      updateAlphabetButtons();
      renderGlossary();
    });
    bar.appendChild(allBtn);

    sortedLetters.forEach(l => {
      const btn = document.createElement('button');
      btn.className = `alpha-btn ${selectedGlossaryLetter === l ? 'active' : ''}`;
      btn.textContent = l;
      btn.addEventListener('click', () => {
        selectedGlossaryLetter = l;
        updateAlphabetButtons();
        renderGlossary();
      });
      bar.appendChild(btn);
    });

    alphabetBarRendered = true;
  }

  function updateAlphabetButtons() {
    document.querySelectorAll('.alpha-btn').forEach(btn => {
      if (btn.textContent === 'ALL') {
        btn.classList.toggle('active', selectedGlossaryLetter === 'all');
      } else {
        btn.classList.toggle('active', btn.textContent === selectedGlossaryLetter);
      }
    });
  }

  function renderGlossary() {
    renderAlphabetBar();

    const container = document.getElementById('glossary-container');
    const searchInput = document.getElementById('glossary-search');
    const countBadge = document.getElementById('glossary-count-badge');
    if (!container) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    container.innerHTML = '';
    let matchCount = 0;

    glossary.forEach((item) => {
      const matchesCategory = selectedGlossaryCat === 'all' || item.category === selectedGlossaryCat;
      const matchesLetter = selectedGlossaryLetter === 'all' || (item.letter && item.letter.toUpperCase() === selectedGlossaryLetter);
      
      const termLower = item.term.toLowerCase();
      const defLower = item.def.toLowerCase();
      const catLower = item.category.toLowerCase();
      const matchesQuery = !query || termLower.includes(query) || defLower.includes(query) || catLower.includes(query);

      if (!matchesCategory || !matchesLetter || !matchesQuery) return;

      matchCount++;

      // Highlight match
      let displayTerm = item.term;
      let displayDef = item.def;
      if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const qRegex = new RegExp(`(${escaped})`, 'gi');
        displayTerm = displayTerm.replace(qRegex, '<mark>$1</mark>');
        displayDef = displayDef.replace(qRegex, '<mark>$1</mark>');
      }

      const card = document.createElement('div');
      card.className = 'glossary-card';
      card.innerHTML = `
        <div class="glossary-card-top">
          <span class="glossary-id">#${item.id}</span>
          <span class="glossary-badge-cat">${item.category}</span>
        </div>
        <strong class="glossary-term">${displayTerm}</strong>
        <p class="glossary-def">${displayDef}</p>
      `;
      container.appendChild(card);
    });

    if (countBadge) {
      countBadge.textContent = `Menampilkan ${matchCount} dari ${glossary.length} Istilah`;
    }

    if (matchCount === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>⚠️ Tidak ditemukan istilah dengan filter saat ini (Kata kunci: "<strong>${query || '-'}</strong>").</p>
          <button class="tool-btn" id="btn-reset-glossary-filters" style="padding: 8px 16px;">🔄 Reset Semua Filter</button>
        </div>
      `;
      document.getElementById('btn-reset-glossary-filters')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        selectedGlossaryCat = 'all';
        selectedGlossaryLetter = 'all';
        document.querySelectorAll('.gloss-cat-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-cat') === 'all');
        });
        updateAlphabetButtons();
        renderGlossary();
        searchInput?.focus();
      });
    }
  }

  // Glossary Search Input Event
  const glossSearchInput = document.getElementById('glossary-search');
  if (glossSearchInput) {
    glossSearchInput.addEventListener('input', () => {
      renderGlossary();
    });
    glossSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        glossSearchInput.value = '';
        renderGlossary();
      }
    });
  }

  // Clear button (X)
  const btnClearGlossary = document.getElementById('btn-clear-glossary');
  if (btnClearGlossary) {
    btnClearGlossary.addEventListener('click', () => {
      if (glossSearchInput) {
        glossSearchInput.value = '';
        glossSearchInput.focus();
      }
      renderGlossary();
    });
  }

  // Category filter tabs
  document.querySelectorAll('.gloss-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gloss-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedGlossaryCat = btn.getAttribute('data-cat');
      renderGlossary();
    });
  });

  // ================= TAB: INTERACTIVE SIMULATOR =================
  let domState = [
    { price: '5054.00', bid: 0, ask: 420 },
    { price: '5053.75', bid: 0, ask: 350 },
    { price: '5053.50', bid: 0, ask: 280 },
    { price: '5053.25', bid: 0, ask: 190 },
    { price: '5053.00', bid: 0, ask: 120 }, // Current Best Ask
    { price: '5052.75', bid: 150, ask: 0 }, // Current Best Bid
    { price: '5052.50', bid: 220, ask: 0 },
    { price: '5052.25', bid: 310, ask: 0 },
    { price: '5052.00', bid: 450, ask: 0 }
  ];

  let fpCandleState = [
    { price: '5053.00', bidVol: 15, askVol: 120, imbalance: 'none', isPOC: false },
    { price: '5052.75', bidVol: 80, askVol: 450, imbalance: 'buy', isPOC: true },
    { price: '5052.50', bidVol: 120, askVol: 620, imbalance: 'buy', isPOC: false },
    { price: '5052.25', bidVol: 210, askVol: 380, imbalance: 'none', isPOC: false },
    { price: '5052.00', bidVol: 350, askVol: 290, imbalance: 'none', isPOC: false }
  ];

  let simCVD = 1850;

  function initSimulator() {
    renderDOM();
    renderFootprint();
  }

  function renderDOM() {
    const tbody = document.getElementById('sim-dom-body');
    tbody.innerHTML = '';
    domState.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="dom-bid">${row.bid > 0 ? row.bid : '-'}</td>
        <td class="dom-price">${row.price}</td>
        <td class="dom-ask">${row.ask > 0 ? row.ask : '-'}</td>
        <td><button class="tool-btn" style="padding: 2px 6px; font-size: 7.5pt;" onclick="alert('Limit order dipasang di ${row.price}')">Order</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderFootprint() {
    const candleEl = document.getElementById('sim-fp-candle');
    candleEl.innerHTML = '';
    fpCandleState.forEach(row => {
      const rowEl = document.createElement('div');
      let extraClass = '';
      if (row.isPOC) extraClass += ' poc';
      if (row.imbalance === 'buy') extraClass += ' imbalance-buy';
      if (row.imbalance === 'sell') extraClass += ' imbalance-sell';

      rowEl.className = `fp-row ${extraClass}`;
      rowEl.innerHTML = `
        <span>${row.price}</span>
        <span>${row.bidVol} x ${row.askVol}</span>
        <span>${row.isPOC ? '⭐ POC' : (row.imbalance === 'buy' ? '▲ BUY IMB 350%' : '')}</span>
      `;
      candleEl.appendChild(rowEl);
    });

    document.getElementById('sim-cvd-val').textContent = (simCVD > 0 ? '+' : '') + simCVD;
  }

  function logSim(msg) {
    const box = document.getElementById('sim-log-box');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `⏱️ [${new Date().toLocaleTimeString()}] ${msg}`;
    box.prepend(entry);
  }

  document.getElementById('btn-sim-buy').addEventListener('click', () => {
    simCVD += 250;
    // Consume Ask at 5053.00
    domState[4].ask = Math.max(0, domState[4].ask - 100);
    fpCandleState[0].askVol += 250;
    fpCandleState[0].imbalance = 'buy';
    document.getElementById('sim-imbalance-val').textContent = 'BUY IMBALANCE (4.2x)';
    document.getElementById('sim-status-badge').textContent = 'STATUS: AGGRESSIVE BUY PRESSURE';
    document.getElementById('sim-status-badge').className = 'live-dot';
    logSim('MARKET BUY 250 lot mengeksekusi Best Ask di 5053.00. Delta meningkat.');
    renderDOM();
    renderFootprint();
  });

  document.getElementById('btn-sim-sell').addEventListener('click', () => {
    simCVD -= 300;
    fpCandleState[2].bidVol += 300;
    fpCandleState[2].imbalance = 'sell';
    document.getElementById('sim-imbalance-val').textContent = 'SELL IMBALANCE (3.1x)';
    document.getElementById('sim-status-badge').textContent = 'STATUS: SELLER PUSHING';
    logSim('MARKET SELL 300 lot menghantam Best Bid. Delta menukik turun.');
    renderDOM();
    renderFootprint();
  });

  document.getElementById('btn-sim-iceberg').addEventListener('click', () => {
    domState[3].ask = 1500; // Iceberg order appears
    document.getElementById('sim-status-badge').textContent = 'STATUS: 🧊 ICEBERG ABSORPTION DETECTED!';
    document.getElementById('sim-status-badge').className = 'brand-badge';
    logSim('ICEBERG DETECTED: Bank memasang dinding likuiditas tersembunyi 1.500 Sell Limit di 5053.25!');
    renderDOM();
  });

  document.getElementById('btn-sim-reset').addEventListener('click', () => {
    simCVD = 1850;
    document.getElementById('sim-status-badge').textContent = 'STATUS: LELANG NORMAL';
    document.getElementById('sim-status-badge').className = 'badge-neutral';
    document.getElementById('sim-imbalance-val').textContent = 'NORMAL (1.2x)';
    logSim('Simulator di-reset ke kondisi awal sesi New York.');
    initSimulator();
  });

  // ================= TAB: PROP FIRM QUIZ =================
  const quizQuestions = [
    {
      q: '1. Apa yang terjadi secara mekanis ketika harga melonjak naik menembus Swing High dan CVD mencatat lonjakan +3.000, namun lilin Footprint membentuk ekor atas dan ditutup di bawah High?',
      options: [
        'A. Terjadi Bullish Breakout sejati, wajib langsung Buy.',
        'B. Terjadi Bearish Absorption: Limit Sell institusi menelan seluruh Market Buy ritel.',
        'C. Indikator RSI sedang Golden Cross.',
        'D. Terjadi Finished Auction di sisi Bid.'
      ],
      correct: 1,
      exp: 'Jawaban B: Ini adalah textbook Bearish Absorption. Bank menggunakan antrean Stop Loss dan FOMO ritel untuk mengisi pesanan jual besar mereka tanpa mengalami slippage.'
    },
    {
      q: '2. Pada evaluasi Prop Firm (Apex/Topstep), mengapa Trailing Drawdown dihitung dari floating profit tertinggi (High Water Mark)?',
      options: [
        'A. Agar trader bisa leluasa menahan posisi loss.',
        'B. Untuk membatasi komisi broker.',
        'C. Untuk menguji disiplin penguncian profit (scaling out) dan mencegah hold posisi serakah.',
        'D. Karena aturan bursa CME mewajibkannya.'
      ],
      correct: 2,
      exp: 'Jawaban C: Trailing drawdown menguji apakah trader tahu kapan harus mengunci keuntungan. Jika floating profit dibiarkan berbalik menjadi breakeven, batas drawdown akan menjepit saldo Anda.'
    },
    {
      q: '3. Di mana batas pembatas antara rezim pasar volatilitas rendah (mean-reverting) dan volatilitas eksplosif menurut teori Gamma Exposure (GEX)?',
      options: [
        'A. Level Garis Bollinger Band 20.',
        'B. Level Strike Gamma Flip (Zero Gamma).',
        'C. Moving Average 200.',
        'D. Level Low Sesi Asia.'
      ],
      correct: 1,
      exp: 'Jawaban B: Level Gamma Flip adalah titik saklar di mana Market Maker beralih dari mode kontra-tren (+GEX) menjadi pro-tren (-GEX), memicu tren agresif.'
    },
    {
      q: '4. Apa arti formasi Stacked Buying Imbalance pada grafik Footprint 5 menit?',
      options: [
        'A. Munculnya minimal 3 level harga berurutan dengan rasio pembeli agresif >300%.',
        'B. Tiga lilin merah berturut-turut.',
        'C. Volume di Bid lebih besar dari volume di Ask.',
        'D. Lelang pasar sedang seimbang.'
      ],
      correct: 0,
      exp: 'Jawaban A: Stacked Imbalance menandakan inisiatif pembeli institusi yang kuat dan area tersebut akan bertindak sebagai benteng support kuat saat pullback.'
    },
    {
      q: '5. Mengapa data feed CME Denali (Level 3 MBO) lebih unggul daripada data Level 2 standar?',
      options: [
        'A. Karena gratis untuk pengguna Metatrader 4.',
        'B. Karena mencakup order book individual dengan ID antrean (Queue Position) asli.',
        'C. Karena bisa memprediksi masa depan dengan probabilitas 100%.',
        'D. Karena tidak memiliki selisih spread.'
      ],
      correct: 1,
      exp: 'Jawaban B: Level 3 MBO (Market By Order) memperlihatkan setiap tiket pesanan secara transparan, memungkinkan deteksi posisi antrean FIFO dan pembatalan pesanan palsu (Spoofing).'
    }
  ];

  function renderQuiz() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    quizQuestions.forEach((item, qIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      let optionsHtml = '';
      item.options.forEach((opt, oIdx) => {
        optionsHtml += `<button class="quiz-opt" data-q="${qIdx}" data-o="${oIdx}">${opt}</button>`;
      });

      card.innerHTML = `
        <h4>${item.q}</h4>
        <div class="quiz-options">${optionsHtml}</div>
        <div class="quiz-explanation" id="exp-${qIdx}">${item.exp}</div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qIdx = parseInt(e.target.getAttribute('data-q'));
        const oIdx = parseInt(e.target.getAttribute('data-o'));
        const expEl = document.getElementById(`exp-${qIdx}`);
        const allOpts = e.target.parentElement.querySelectorAll('.quiz-opt');

        allOpts.forEach((b, idx) => {
          b.disabled = true;
          if (idx === quizQuestions[qIdx].correct) b.classList.add('correct');
          if (idx === oIdx && idx !== quizQuestions[qIdx].correct) b.classList.add('wrong');
        });

        expEl.style.display = 'block';
      });
    });
  }

  // Initialize Default State
  renderSidebar();
  const savedIdx = localStorage.getItem('saved_chapter_idx');
  loadChapter(savedIdx ? parseInt(savedIdx) : 0);
});
