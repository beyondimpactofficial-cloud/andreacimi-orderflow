// Faber Vaale Masterclass Slide-Book Presentation Engine
// Designed for Kang Desna with Institutional UI/UX

let allSlides = [];
let filteredSlides = [];
let currentSlideIndex = 0; // 0-based
let currentMode = 'slide'; // 'slide' | 'continuous' | 'grid'
let currentModuleFilter = 'all';

// DOM Elements
const activeSlideMount = document.getElementById('active-slide-mount');
const slideFrame = document.getElementById('slide-frame');
const continuousContainer = document.getElementById('continuous-mode-container');
const gridContainer = document.getElementById('grid-mode-container');
const slidesGrid = document.getElementById('slides-grid');
const slideModeContainer = document.getElementById('slide-mode-container');
const slideControlsBar = document.getElementById('slide-controls-bar');
const slideJumpSelect = document.getElementById('slide-jump-select');
const currentSlideIndicator = document.getElementById('current-slide-indicator');
const btnPrev = document.getElementById('btn-prev-slide');
const btnNext = document.getElementById('btn-next-slide');
const btnFullscreen = document.getElementById('btn-fullscreen');
const searchInput = document.getElementById('slide-search');
const searchAlert = document.getElementById('search-alert');
const searchQueryText = document.getElementById('search-query-text');
const btnClearSearch = document.getElementById('btn-clear-search');
const modeButtons = document.querySelectorAll('.view-mode-btn');
const moduleChips = document.querySelectorAll('.module-chip');

// Module range mapping
const MODULE_RANGES = {
  all: [1, 50],
  mod1: [4, 10],
  mod2: [11, 17],
  mod3: [18, 24],
  mod4: [25, 31],
  mod5: [32, 37],
  mod6: [38, 40],
  mod7: [41, 43],
  mod8: [44, 46],
  glossary: [47, 50]
};

// Initialize
async function init() {
  try {
    const res = await fetch('faber_slides.json');
    if (!res.ok) throw new Error('Failed to load slides data');
    allSlides = await res.json();
    filteredSlides = [...allSlides];

    populateJumpSelect();
    setupEventListeners();

    // Check URL Hash for direct slide linking, e.g. #slide=15
    const hash = window.location.hash;
    if (hash && hash.startsWith('#slide=')) {
      const targetId = parseInt(hash.replace('#slide=', ''), 10);
      if (!isNaN(targetId) && targetId >= 1 && targetId <= allSlides.length) {
        currentSlideIndex = targetId - 1;
      }
    }

    renderCurrentSlide();
    renderGrid();
    renderContinuous();
  } catch (err) {
    console.error('Initialization error:', err);
    if (activeSlideMount) {
      activeSlideMount.innerHTML = `<div style="padding: 40px; color: #f43f5e; text-align: center;">
        <h2>Gagal Memuat Materi Masterclass</h2>
        <p>${err.message}</p>
      </div>`;
    }
  }
}

// Populate Jump Select
function populateJumpSelect() {
  slideJumpSelect.innerHTML = '';
  allSlides.forEach((slide, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `Slide ${String(slide.id).padStart(2, '0')}: ${slide.title}`;
    slideJumpSelect.appendChild(opt);
  });
}

// Render Single Slide in Slide Mode
function renderCurrentSlide() {
  if (!allSlides.length) return;
  const slide = allSlides[currentSlideIndex];
  if (!slide) return;

  activeSlideMount.innerHTML = slide.html;
  currentSlideIndicator.textContent = `${String(slide.id).padStart(2, '0')} / ${String(allSlides.length).padStart(2, '0')}`;
  slideJumpSelect.value = currentSlideIndex;

  btnPrev.disabled = currentSlideIndex === 0;
  btnNext.disabled = currentSlideIndex === allSlides.length - 1;

  // Update URL Hash without scroll jump
  history.replaceState(null, null, `#slide=${slide.id}`);

  // Highlight active module chip based on current slide
  updateActiveModuleChipForSlide(slide.id);
}

// Render Continuous Document View
function renderContinuous() {
  continuousContainer.innerHTML = '';
  filteredSlides.forEach(slide => {
    const div = document.createElement('div');
    div.innerHTML = slide.html;
    div.style.width = '100%';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    continuousContainer.appendChild(div);
  });
}

// Render Grid Overview View
function renderGrid() {
  slidesGrid.innerHTML = '';
  filteredSlides.forEach(slide => {
    const card = document.createElement('div');
    card.className = 'grid-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="grid-card-num">SLIDE ${String(slide.id).padStart(2, '0')}</span>
        <span class="grid-card-badge">${slide.badge}</span>
      </div>
      <div class="grid-card-mod">${slide.module}</div>
      <div class="grid-card-title">${slide.title}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: auto;">Klik untuk membuka slide â†—</div>
    `;
    card.addEventListener('click', () => {
      currentSlideIndex = allSlides.findIndex(s => s.id === slide.id);
      switchViewMode('slide');
      renderCurrentSlide();
    });
    slidesGrid.appendChild(card);
  });
}

// Switch View Modes
function switchViewMode(mode) {
  currentMode = mode;
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'slide') {
    slideModeContainer.style.display = 'flex';
    slideControlsBar.style.display = 'flex';
    continuousContainer.style.display = 'none';
    gridContainer.style.display = 'none';
    renderCurrentSlide();
  } else if (mode === 'continuous') {
    slideModeContainer.style.display = 'none';
    slideControlsBar.style.display = 'none';
    continuousContainer.style.display = 'flex';
    gridContainer.style.display = 'none';
    renderContinuous();
  } else if (mode === 'grid') {
    slideModeContainer.style.display = 'none';
    slideControlsBar.style.display = 'none';
    continuousContainer.style.display = 'none';
    gridContainer.style.display = 'block';
    renderGrid();
  }
}

// Module Filtering
function filterByModule(modKey) {
  currentModuleFilter = modKey;
  moduleChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.mod === modKey);
  });

  if (modKey === 'all') {
    filteredSlides = [...allSlides];
  } else {
    const [start, end] = MODULE_RANGES[modKey] || [1, 50];
    filteredSlides = allSlides.filter(s => s.id >= start && s.id <= end);
  }

  if (currentMode === 'slide') {
    // Jump to the first slide of the filtered module
    if (filteredSlides.length > 0) {
      currentSlideIndex = allSlides.findIndex(s => s.id === filteredSlides[0].id);
      renderCurrentSlide();
    }
  } else if (currentMode === 'grid') {
    renderGrid();
  } else if (currentMode === 'continuous') {
    renderContinuous();
  }
}

function updateActiveModuleChipForSlide(slideId) {
  for (const [key, range] of Object.entries(MODULE_RANGES)) {
    if (key === 'all') continue;
    if (slideId >= range[0] && slideId <= range[1]) {
      moduleChips.forEach(chip => {
        if (chip.dataset.mod === key) {
          chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
      break;
    }
  }
}

// Live Search
function handleSearch(query) {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    searchAlert.style.display = 'none';
    filterByModule(currentModuleFilter);
    return;
  }

  filteredSlides = allSlides.filter(slide => {
    const text = (slide.title + ' ' + slide.subtitle + ' ' + slide.module + ' ' + slide.html).toLowerCase();
    return text.includes(clean);
  });

  searchQueryText.textContent = `"${query}" (${filteredSlides.length} slide ditemukan)`;
  searchAlert.style.display = 'flex';

  if (currentMode === 'grid') {
    renderGrid();
  } else if (currentMode === 'continuous') {
    renderContinuous();
  } else if (currentMode === 'slide') {
    if (filteredSlides.length > 0) {
      currentSlideIndex = allSlides.findIndex(s => s.id === filteredSlides[0].id);
      renderCurrentSlide();
    }
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Mode switcher
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchViewMode(btn.dataset.mode));
  });

  // Module filter chips
  moduleChips.forEach(chip => {
    chip.addEventListener('click', () => filterByModule(chip.dataset.mod));
  });

  // Prev / Next controls
  btnPrev.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      renderCurrentSlide();
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentSlideIndex < allSlides.length - 1) {
      currentSlideIndex++;
      renderCurrentSlide();
    }
  });

  // Jump select
  slideJumpSelect.addEventListener('change', (e) => {
    currentSlideIndex = parseInt(e.target.value, 10);
    renderCurrentSlide();
  });

  // Fullscreen button
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      slideFrame.requestFullscreen().catch(err => {
        console.warn('Gagal masuk mode layar penuh:', err.message);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Live Search
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch(e.target.value);
    }, 250);
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch('');
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    // Ignore if input is focused
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
      return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentSlideIndex < allSlides.length - 1) {
        currentSlideIndex++;
        renderCurrentSlide();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderCurrentSlide();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      currentSlideIndex = 0;
      renderCurrentSlide();
    } else if (e.key === 'End') {
      e.preventDefault();
      currentSlideIndex = allSlides.length - 1;
      renderCurrentSlide();
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        slideFrame.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    } else if (e.key === 'g' || e.key === 'G') {
      switchViewMode(currentMode === 'grid' ? 'slide' : 'grid');
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
