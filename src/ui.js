import { HELIPADS } from './data.js';
import { sound } from './audio.js';

export class UI {
  constructor({ onSelectPad, onNextPad, onPrevPad, onToggleCamera, onToggleMute, onToggleTheme }) {
    this.onSelectPad = onSelectPad;
    this.onNextPad = onNextPad;
    this.onPrevPad = onPrevPad;
    this.onToggleCamera = onToggleCamera;
    this.onToggleMute = onToggleMute;
    this.onToggleTheme = onToggleTheme;

    this.activePadId = 'hq';
    this.isMuted = sound.isMuted;
    this.isNight = false;
    this.cameraModeName = 'Следование';
    this.currentGalleryIdx = 0;

    this.initElements();
    this.renderHelipadButtons();
    this.bindEvents();
  }

  initElements() {
    this.hudPadName = document.getElementById('hud-pad-name');
    this.hudPadCounter = document.getElementById('hud-pad-counter');
    this.flightModeBadge = document.getElementById('flight-mode-badge');
    this.starsCountEl = document.getElementById('stars-count');
    this.muteBtn = document.getElementById('btn-mute');
    this.themeBtn = document.getElementById('btn-theme');
    this.cameraBtn = document.getElementById('btn-camera');
    this.helpBtn = document.getElementById('btn-help');
    this.helpModal = document.getElementById('help-modal');
    this.projectModal = document.getElementById('project-modal');
    this.ribbonContainer = document.getElementById('ribbon-buttons');
    this.prevBtn = document.getElementById('btn-prev-pad');
    this.nextBtn = document.getElementById('btn-next-pad');
    this.scrollLeftBtn = document.getElementById('btn-scroll-left');
    this.scrollRightBtn = document.getElementById('btn-scroll-right');
    this.touchControls = document.getElementById('touch-controls');
    this.proximityPrompt = document.getElementById('proximity-prompt');

    this.updateMuteButtonUI();
  }

  renderHelipadButtons() {
    if (!this.ribbonContainer) return;
    this.ribbonContainer.innerHTML = '';

    HELIPADS.forEach((pad) => {
      const btn = document.createElement('button');
      btn.className = `pad-btn ${pad.id === this.activePadId ? 'pad-btn--active' : ''}`;
      btn.dataset.padId = pad.id;
      btn.innerHTML = `
        <span class="pad-btn__num">${pad.number}</span>
        <span class="pad-btn__emoji">${pad.emoji}</span>
        <span class="pad-btn__title">${pad.shortTitle}</span>
      `;
      btn.style.setProperty('--accent-glow', pad.color);

      btn.addEventListener('click', () => {
        sound.playClick();
        this.setActivePad(pad.id);
        if (this.onSelectPad) {
          this.onSelectPad(pad);
        }
      });

      this.ribbonContainer.appendChild(btn);
    });
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onPrevPad) this.onPrevPad();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onNextPad) this.onNextPad();
      });
    }

    // Ribbon page-scroll buttons (« and »)
    if (this.scrollLeftBtn && this.ribbonContainer) {
      this.scrollLeftBtn.addEventListener('click', () => {
        sound.playClick();
        this.ribbonContainer.scrollBy({ left: -280, behavior: 'smooth' });
      });
    }

    if (this.scrollRightBtn && this.ribbonContainer) {
      this.scrollRightBtn.addEventListener('click', () => {
        sound.playClick();
        this.ribbonContainer.scrollBy({ left: 280, behavior: 'smooth' });
      });
    }

    // Mouse wheel horizontal scrolling + drag-to-scroll on navigation ribbon
    if (this.ribbonContainer) {
      this.ribbonContainer.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          this.ribbonContainer.scrollLeft += e.deltaY * 1.5;
        }
      }, { passive: false });

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      this.ribbonContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - this.ribbonContainer.offsetLeft;
        scrollLeft = this.ribbonContainer.scrollLeft;
      });
      window.addEventListener('mouseup', () => { isDown = false; });
      this.ribbonContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - this.ribbonContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        this.ribbonContainer.scrollLeft = scrollLeft - walk;
      });
    }

    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        this.isMuted = sound.toggleMute();
        this.updateMuteButtonUI();
        if (this.onToggleMute) this.onToggleMute(this.isMuted);
      });
    }

    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => {
        sound.playClick();
        this.isNight = !this.isNight;
        this.themeBtn.innerHTML = this.isNight
          ? '☀️ <span class="btn-text">День</span>'
          : '🌙 <span class="btn-text">Ночь</span>';
        if (this.onToggleTheme) this.onToggleTheme(this.isNight);
      });
    }

    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onToggleCamera) this.onToggleCamera();
      });
    }

    if (this.helpBtn && this.helpModal) {
      this.helpBtn.addEventListener('click', () => {
        sound.playClick();
        this.helpModal.showModal();
      });
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) this.helpModal.close();
      });
    }

    if (this.projectModal) {
      this.projectModal.addEventListener('click', (e) => {
        if (e.target === this.projectModal) {
          this.closeProjectModal();
        }
      });
    }
  }

  updateMuteButtonUI() {
    if (!this.muteBtn) return;
    this.muteBtn.innerHTML = this.isMuted
      ? '🔇 <span class="btn-text">Без звука</span>'
      : '🔊 <span class="btn-text">Звук</span>';
  }

  updateCameraUI(modeName) {
    this.cameraModeName = modeName;
    if (this.cameraBtn) {
      this.cameraBtn.innerHTML = `<span class="btn-text">${modeName}</span>`;
    }
  }

  setActivePad(padId) {
    this.activePadId = padId;
    const padIdx = HELIPADS.findIndex(p => p.id === padId);
    const pad = HELIPADS[padIdx];

    if (pad && this.hudPadName) {
      this.hudPadName.textContent = `${pad.emoji} ${pad.name}`;
      this.hudPadName.style.borderColor = pad.color;
    }
    if (this.hudPadCounter && padIdx !== -1) {
      this.hudPadCounter.textContent = `${padIdx + 1} / ${HELIPADS.length}`;
    }

    if (this.ribbonContainer) {
      const allBtns = this.ribbonContainer.querySelectorAll('.pad-btn');
      allBtns.forEach((btn) => {
        if (btn.dataset.padId === padId) {
          btn.classList.add('pad-btn--active');
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } else {
          btn.classList.remove('pad-btn--active');
        }
      });
    }
  }

  setFlightMode(isAutopilot) {
    if (!this.flightModeBadge) return;
    if (isAutopilot) {
      this.flightModeBadge.className = 'status-badge status-badge--autopilot';
      this.flightModeBadge.innerHTML = '<span class="pulse-dot"></span> 🚁 Автопилот';
    } else {
      this.flightModeBadge.className = 'status-badge status-badge--manual';
      this.flightModeBadge.innerHTML = '<span class="pulse-dot"></span> 🕹️ Ручной полёт';
    }
  }

  updateStarsCount(count, total) {
    if (this.starsCountEl) {
      this.starsCountEl.textContent = `⭐ ${count} / ${total}`;
      this.starsCountEl.classList.add('bounce');
      setTimeout(() => this.starsCountEl.classList.remove('bounce'), 350);
    }
  }

  showProximityPrompt(padData, onLandAction) {
    if (!this.proximityPrompt) return;
    this.proximityPrompt.style.display = 'flex';
    this.proximityPrompt.innerHTML = `
      <span>📍 Под вами: <strong>${padData.emoji} ${padData.name}</strong></span>
      <button id="btn-quick-land" class="btn-pill">Открыть локацию →</button>
    `;
    const btn = document.getElementById('btn-quick-land');
    if (btn) {
      btn.onclick = () => {
        sound.playClick();
        onLandAction();
      };
    }
  }

  hideProximityPrompt() {
    if (this.proximityPrompt) {
      this.proximityPrompt.style.display = 'none';
    }
  }

  openProjectModal(padData, onFlyNext, onFlyPrev) {
    if (!this.projectModal) return;
    const modalContent = document.getElementById('modal-card-content');
    if (!modalContent) return;

    this.currentGalleryIdx = 0;
    const padIdx = HELIPADS.findIndex(p => p.id === padData.id);
    const prevPad = HELIPADS[(padIdx - 1 + HELIPADS.length) % HELIPADS.length];
    const nextPad = HELIPADS[(padIdx + 1) % HELIPADS.length];

    const statsHtml = padData.stats ? padData.stats.map(s => `
      <div class="stat-pill">
        <span class="stat-pill__label">${s.label}</span>
        <strong class="stat-pill__value">${s.value}</strong>
      </div>
    `).join('') : '';

    const caseFlowHtml = padData.caseFlow ? `
      <div class="case-flow-box">
        <div class="case-flow-row">
          <span class="flow-badge flow-badge--was">Было:</span>
          <span>${padData.caseFlow.was}</span>
        </div>
        <div class="case-flow-row">
          <span class="flow-badge flow-badge--res">Результат:</span>
          <strong>${padData.caseFlow.result}</strong>
        </div>
        <div class="case-flow-row">
          <span class="flow-badge flow-badge--became">Что стало:</span>
          <span>${padData.caseFlow.became}</span>
        </div>
      </div>
    ` : '';

    const tagsHtml = padData.tags ? padData.tags.map(t => `
      <span class="project-tag">${t}</span>
    `).join('') : '';

    const galleryItems = padData.gallery && padData.gallery.length > 0
      ? padData.gallery
      : (padData.image ? [{ src: padData.image, caption: padData.title }] : []);

    const hasMultipleImages = galleryItems.length > 1;

    const galleryHtml = galleryItems.length > 0 ? `
      <div class="modal-gallery">
        <div class="modal-card__image-wrap">
          <img id="modal-main-img" src="${galleryItems[0].src}" alt="${padData.name}" class="modal-card__image" />
          ${hasMultipleImages ? `
            <button type="button" class="gallery-nav gallery-nav--prev" id="gal-prev" aria-label="Предыдущий кадр">‹</button>
            <button type="button" class="gallery-nav gallery-nav--next" id="gal-next" aria-label="Следующий кадр">›</button>
            <div class="gallery-caption-bar">
              <span id="gal-caption">${galleryItems[0].caption}</span>
              <span id="gal-counter">1 / ${galleryItems.length}</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    const youtubeHtml = padData.youtubeInfo ? `
      <div class="yt-showcase">
        <div class="yt-channel-banner">
          <img src="${padData.youtubeInfo.avatar}" alt="${padData.youtubeInfo.handle}" class="yt-avatar" />
          <div class="yt-channel-meta">
            <div class="yt-channel-title-row">
              <strong class="yt-handle">${padData.youtubeInfo.handle}</strong>
              <span class="yt-reg-date">На YouTube с ${padData.youtubeInfo.registered}</span>
            </div>
            <div class="yt-metrics-inline">
              <span>👥 <b>${padData.youtubeInfo.subscribers}</b> подписчиков</span>
              <span>•</span>
              <span>🎬 <b>${padData.youtubeInfo.videos}</b></span>
              <span>•</span>
              <span>👁️ <b>${padData.youtubeInfo.views}</b></span>
            </div>
          </div>
          <a href="${padData.youtubeInfo.channelUrl}" target="_blank" rel="noopener noreferrer" class="yt-sub-btn">
            ▶ Канал
          </a>
        </div>

        <a href="${padData.youtubeInfo.latestVideoUrl}" target="_blank" rel="noopener noreferrer" class="yt-latest-video-card">
          <div class="yt-video-thumb-wrap">
            <img src="https://i.ytimg.com/vi/${padData.youtubeInfo.latestVideoId}/hqdefault.jpg" onerror="this.src='${padData.youtubeInfo.avatar}'" alt="Последнее видео @burgerdom6" class="yt-video-thumb" />
            <div class="yt-play-overlay">▶</div>
          </div>
          <div class="yt-video-info">
            <span class="yt-video-tag">🔥 СВЕЖЕЕ ВИДЕО НА КАНАЛЕ</span>
            <strong>Смотреть последний выпуск Warpath: Ace Shooter на YouTube ↗</strong>
            <span class="yt-video-url">youtu.be/${padData.youtubeInfo.latestVideoId}</span>
          </div>
        </a>

        <div class="yt-ecosystem-grid">
          <a href="${padData.youtubeInfo.communityUrl}" target="_blank" rel="noopener noreferrer" class="yt-eco-card">
            <div class="yt-eco-header">
              <span class="yt-eco-icon">💬</span>
              <strong>TG-комьюнити t.me/WarpathHub</strong>
            </div>
            <p>Объединение профильных ютуберов по Warpath: Ace Shooter — помогаем игрокам, делимся гайдами и общаемся.</p>
          </a>

          <a href="${padData.youtubeInfo.wpCommanderUrl}" target="_blank" rel="noopener noreferrer" class="yt-eco-card">
            <div class="yt-eco-header">
              <span class="yt-eco-icon">🛠️</span>
              <strong>WP Commander (w/ ${padData.youtubeInfo.wpDeveloper})</strong>
            </div>
            <p>Помогаю в разработке, тестирую (QA) и консультирую по архитектуре огромной структуры портала wpcommander.netlify.app.</p>
          </a>
        </div>
      </div>
    ` : '';

    const calculatorHtml = padData.hasCalculator ? `
      <div class="mvp-calc-box">
        <div class="mvp-calc-title">⚡ Экспресс-конфигуратор задачи (Калькулятор MVP)</div>
        <div class="mvp-calc-row">
          <label>Тип задачи:</label>
          <select id="calc-task-select" class="mvp-select">
            <option value="Веб-сервис / MVP на Vue 3">Веб-сервис / MVP под ключ (Vue 3 / SPA)</option>
            <option value="Конверсионный лендинг / Промо">Лендинг / Промо-сайт (Lighthouse 95+)</option>
            <option value="Telegram-бот / AI-агент">Telegram-бот / AI-агент (Cloudflare + Gemini)</option>
            <option value="UI/UX & Дизайн-система в Figma">UI/UX Архитектура & Дизайн-система</option>
          </select>
        </div>
        <div class="mvp-calc-row">
          <label>Сроки:</label>
          <select id="calc-time-select" class="mvp-select">
            <option value="1–2 недели (Спринт)">1–2 недели (Быстрый спринт)</option>
            <option value="3–4 недели (Оптимально)" selected>3–4 недели (Оптимально)</option>
            <option value="Full-time / В команду">В продуктовую команду (Full-time / Part-time)</option>
          </select>
        </div>
        <div class="mvp-brief-preview" id="mvp-brief-preview">
          «Привет, Дмитрий! Задача: Веб-сервис / MVP на Vue 3, ориентир: 3–4 недели (Оптимально). Обсудим?»
        </div>
        <button type="button" class="btn btn--secondary" id="btn-copy-brief" style="width:100%; margin-top:8px;">
          📋 Скопировать готовое ТЗ и написать в Telegram
        </button>
      </div>
    ` : '';

    const extraLinksHtml = padData.extraLinks ? padData.extraLinks.map(item => `
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary">
        ${item.text} ↗
      </a>
    `).join('') : '';

    modalContent.innerHTML = `
      <!-- Top Station Pager Bar -->
      <div class="modal-pager-bar">
        <button type="button" class="pager-btn" id="btn-modal-prev" title="Лететь к: ${prevPad.shortTitle}">
          ◀ ${prevPad.emoji} ${prevPad.shortTitle}
        </button>
        <span class="pager-indicator">Локация ${padIdx + 1} из ${HELIPADS.length}</span>
        <button type="button" class="pager-btn" id="btn-modal-next-top" title="Лететь к: ${nextPad.shortTitle}">
          ${nextPad.emoji} ${nextPad.shortTitle} ▶
        </button>
      </div>

      <div class="modal-card__header" style="border-top-color: ${padData.color}">
        <div class="modal-card__badge-row">
          <span class="badge" style="background: ${padData.color}22; color: ${padData.color}; border: 1px solid ${padData.color}55;">
            ${padData.badge || 'Проект'}
          </span>
          <span class="badge-category">${padData.category || ''}</span>
          <button class="modal-close-btn" id="btn-close-modal" aria-label="Закрыть">✕</button>
        </div>
        <h2 class="modal-card__title">${padData.emoji} ${padData.title}</h2>
        <p class="modal-card__subtitle">${padData.subtitle || ''}</p>
      </div>

      <div class="modal-card__body">
        ${youtubeHtml}
        ${galleryHtml}
        <div class="modal-card__stats">${statsHtml}</div>
        ${caseFlowHtml}
        <div class="modal-card__desc"><p>${padData.description}</p></div>
        ${calculatorHtml}
        <div class="modal-card__tags">${tagsHtml}</div>
      </div>

      <div class="modal-card__actions">
        ${padData.link ? `
          <a href="${padData.link}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="background: ${padData.color};">
            <span>🔗</span> ${padData.linkText || 'Открыть проект'}
          </a>
        ` : ''}

        ${padData.secondaryLink ? `
          <a href="${padData.secondaryLink}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary">
            <span>🎬</span> ${padData.secondaryLinkText || 'Доп. ссылка'}
          </a>
        ` : ''}

        ${extraLinksHtml}

        <button class="btn btn--outline" id="btn-modal-fly-next">
          <span>🚁</span> Далее: ${nextPad.shortTitle} →
        </button>
      </div>
    `;

    // Bind gallery navigation if multiple images exist
    if (hasMultipleImages) {
      const imgEl = document.getElementById('modal-main-img');
      const capEl = document.getElementById('gal-caption');
      const cntEl = document.getElementById('gal-counter');
      const updateGal = (dir) => {
        sound.playClick();
        this.currentGalleryIdx = (this.currentGalleryIdx + dir + galleryItems.length) % galleryItems.length;
        const item = galleryItems[this.currentGalleryIdx];
        imgEl.src = item.src;
        capEl.textContent = item.caption;
        cntEl.textContent = `${this.currentGalleryIdx + 1} / ${galleryItems.length}`;
      };
      document.getElementById('gal-prev').onclick = () => updateGal(-1);
      document.getElementById('gal-next').onclick = () => updateGal(1);
    }

    // Bind MVP calculator if present
    if (padData.hasCalculator) {
      const taskSel = document.getElementById('calc-task-select');
      const timeSel = document.getElementById('calc-time-select');
      const previewEl = document.getElementById('mvp-brief-preview');
      const copyBtn = document.getElementById('btn-copy-brief');

      const updateBrief = () => {
        previewEl.textContent = `«Привет, Дмитрий! Задача: ${taskSel.value}, ориентир: ${timeSel.value}. Хочу обсудить реализацию!»`;
      };
      taskSel.onchange = updateBrief;
      timeSel.onchange = updateBrief;
      copyBtn.onclick = () => {
        navigator.clipboard?.writeText(previewEl.textContent);
        copyBtn.textContent = '✅ Скопировано! Открываю Telegram...';
        setTimeout(() => window.open('https://t.me/aimovl', '_blank'), 450);
      };
    }

    document.getElementById('btn-close-modal').onclick = () => this.closeProjectModal();

    document.getElementById('btn-modal-fly-next').onclick = () => {
      this.closeProjectModal();
      if (onFlyNext) onFlyNext();
    };

    document.getElementById('btn-modal-next-top').onclick = () => {
      this.closeProjectModal();
      if (onFlyNext) onFlyNext();
    };

    document.getElementById('btn-modal-prev').onclick = () => {
      this.closeProjectModal();
      if (onFlyPrev) onFlyPrev();
    };

    this.projectModal.showModal();
  }

  closeProjectModal() {
    if (this.projectModal && this.projectModal.open) {
      this.projectModal.close();
    }
  }
}
