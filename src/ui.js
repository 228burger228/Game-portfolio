import { HELIPADS } from './data.js';
import { sound } from './audio.js';

export class UI {
  constructor({ onSelectPad, onNextPad, onPrevPad, onToggleCamera, onToggleMute, onToggleTheme, onFlyToSkyHangar }) {
    this.onSelectPad = onSelectPad;
    this.onNextPad = onNextPad;
    this.onPrevPad = onPrevPad;
    this.onToggleCamera = onToggleCamera;
    this.onToggleMute = onToggleMute;
    this.onToggleTheme = onToggleTheme;
    this.onFlyToSkyHangar = onFlyToSkyHangar;

    this.activePadId = 'hq';
    this.isMuted = sound.isMuted;
    this.weatherMode = 0; // 0: Day, 1: Sunset, 2: Fog Dawn, 3: Night
    this.weatherLabels = [
      '🌇 <span class="btn-text">Закат</span>',
      '🌫️ <span class="btn-text">Туман</span>',
      '🌌 <span class="btn-text">Ночь</span>',
      '☀️ <span class="btn-text">День</span>'
    ];
    this.cameraModeName = 'Следование';
    this.currentGalleryIdx = 0;

    this.initElements();
    this.renderHelipadButtons();
    this.bindEvents();
  }

  initElements() {
    this.hudPadName = document.getElementById('hud-pad-name');
    this.hudPadCounter = document.getElementById('hud-pad-counter');
    this.hudAltitude = document.getElementById('hud-altitude');
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
    this.hangarBanner = document.getElementById('hangar-67-banner');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.guideWidget = document.getElementById('guide-widget');
    this.guideWidgetBody = document.getElementById('guide-widget-body');
    this.toggleGuideBtn = document.getElementById('btn-toggle-guide');
    this.guideHqBtn = document.getElementById('btn-guide-hq');
    this.guideCaseBtn = document.getElementById('btn-guide-case');
    this.guideAiBtn = document.getElementById('btn-guide-ai');
    this.guideContactBtn = document.getElementById('btn-guide-contact');
    this.guide67Btn = document.getElementById('btn-guide-67');

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
        this.weatherMode = (this.weatherMode + 1) % 4;
        this.themeBtn.innerHTML = this.weatherLabels[this.weatherMode];
        if (this.onToggleTheme) this.onToggleTheme(this.weatherMode);
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

    if (this.toggleGuideBtn && this.guideWidget) {
      this.toggleGuideBtn.addEventListener('click', () => {
        sound.playClick();
        const isCollapsed = this.guideWidget.classList.toggle('guide-widget--collapsed');
        this.toggleGuideBtn.textContent = isCollapsed ? '＋' : '—';
      });
    }

    const bindGuideJump = (btn, padId, fallbackIdx) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        sound.playClick();
        const pad = HELIPADS.find(p => p.id === padId) || HELIPADS[fallbackIdx];
        if (pad && this.onSelectPad) this.onSelectPad(pad);
      });
    };

    bindGuideJump(this.guideHqBtn, 'hq', 0);
    bindGuideJump(this.guideCaseBtn, 'hgstroy', 1);
    bindGuideJump(this.guideAiBtn, 'ai', 6);
    bindGuideJump(this.guideContactBtn, 'contact', 9);

    if (this.guide67Btn) {
      this.guide67Btn.addEventListener('click', () => {
        sound.playClick();
        if (this.onFlyToSkyHangar) this.onFlyToSkyHangar();
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

  updateAltitude(altY, onFlyToSkyHangar) {
    if (!this.hudAltitude) return;
    const meters = Math.max(1, Math.round(altY * 2.5));
    const aboveClouds = altY > 18.0;
    this.hudAltitude.textContent = aboveClouds ? `☁️ ${meters}м (В облаках!)` : `📏 ${meters}м`;
    this.hudAltitude.style.borderColor = aboveClouds ? '#ff2a85' : 'rgba(255,255,255,0.14)';
    this.hudAltitude.style.color = aboveClouds ? '#fbcfe8' : '#a1a1aa';
    if (onFlyToSkyHangar && !this.hudAltitude._boundClick) {
      this.hudAltitude._boundClick = true;
      this.hudAltitude.style.cursor = 'pointer';
      this.hudAltitude.onclick = () => {
        sound.playClick();
        onFlyToSkyHangar();
      };
    }
  }

  showSkyHangarBanner() {
    if (!this.hangarBanner) return;
    this.hangarBanner.style.display = 'flex';
    this.hangarBanner.innerHTML = `
      <div class="hangar-67-card">
        <div class="hangar-67-top">
          <span class="hangar-67-tag">👑 ПАСХАЛКА НАЙДЕНА · SECRET HANGAR 67</span>
          <span class="hangar-67-eq">🎵 GAZAN — 67 (20s FADE) ▂▄▆█▃</span>
        </div>
        <div class="hangar-67-graffiti">«ТЫ ЧЁ ЗАБЫЛ ЗДЕСЬ?! ДАЙ ОТДОХНУТЬ НОРМАЛЬНО!»</div>
        <div class="hangar-67-actions">
          <button type="button" id="btn-toggle-67" class="btn-pill">🔇 Пауза / Вкл трек Gazan — 67</button>
        </div>
      </div>
    `;
    const btn = document.getElementById('btn-toggle-67');
    if (btn) {
      btn.onclick = () => {
        if (sound.isPlaying67) {
          sound.stop67MemeBeat();
          btn.textContent = '🔊 Включить Gazan — 67';
        } else {
          sound.start67MemeBeat();
          btn.textContent = '🔇 Пауза Gazan — 67';
        }
      };
    }
  }

  hideSkyHangarBanner() {
    if (this.hangarBanner) {
      this.hangarBanner.style.display = 'none';
    }
  }

  openVictoryModal(elapsedSeconds, onResetStars) {
    if (!this.projectModal) return;
    const modalContent = document.getElementById('modal-card-content');
    if (!modalContent) return;

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = (elapsedSeconds % 60).toFixed(1);
    const timeStr = mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`;
    const rank = elapsedSeconds < 45 ? 'S+ · Бог Пилотажа ⚡' : (elapsedSeconds < 90 ? 'S · Ас Неба 🏆' : 'A · Опытный Пилот ⭐');

    modalContent.innerHTML = `
      <div class="modal-card__header" style="border-top-color: #facc15; text-align: center; padding-top: 16px;">
        <div style="font-size: 3rem; margin-bottom: 6px;">🏆✨</div>
        <h2 class="modal-card__title" style="color: #fde047; font-size: 1.5rem;">
          Красавчик! Ты молодец — собрал все 10 чекпоинтов!
        </h2>
        <p class="modal-card__subtitle" style="margin-top: 4px;">
          Все золотые звёзды архипелага портфолио собраны!
        </p>
      </div>

      <div class="modal-card__body" style="text-align: center;">
        <div class="modal-card__stats" style="justify-content: center; margin: 14px 0;">
          <div class="stat-pill" style="border-color: rgba(250, 204, 21, 0.45); background: rgba(250, 204, 21, 0.1);">
            <span class="stat-pill__label">⏱️ Твоё время</span>
            <strong class="stat-pill__value" style="color: #fde047; font-size: 1.2rem;">${timeStr}</strong>
          </div>
          <div class="stat-pill" style="border-color: rgba(56, 189, 248, 0.45); background: rgba(56, 189, 248, 0.1);">
            <span class="stat-pill__label">🎖️ Ранг пилота</span>
            <strong class="stat-pill__value" style="color: #38bdf8; font-size: 1.05rem;">${rank}</strong>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__label">⭐ Чекпоинтов</span>
            <strong class="stat-pill__value">10 / 10 (100%)</strong>
          </div>
        </div>
        <p style="font-size: 0.86rem; color: #d4d4d8; margin-bottom: 14px;">
          💡 <em>Секретная подсказка:</em> А ты уже взлетал на клавишу <b>Space</b> выше облаков над центром карты? Там на высоте <b>85+ метров</b> спрятан парящий остров с ангаром <b>«67»</b>!
        </p>
      </div>

      <div class="modal-card__actions" style="justify-content: center;">
        <button class="btn btn--primary" id="btn-victory-reset" style="background: #eab308; color: #09090b;">
          🔄 Собрать заново на новый рекорд
        </button>
        <button class="btn btn--secondary" id="btn-victory-close">
          🚁 Продолжить полёт
        </button>
      </div>
    `;

    document.getElementById('btn-victory-close').onclick = () => this.closeProjectModal();
    document.getElementById('btn-victory-reset').onclick = () => {
      this.closeProjectModal();
      if (onResetStars) onResetStars();
    };

    this.projectModal.showModal();
  }

  updateRadar(heliPos, heliYaw, stars, skyHangarPos) {
    if (!this.radarCanvas) return;
    const ctx = this.radarCanvas.getContext('2d');
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = cx - 4;
    const scale = r / 95; // 95 world units radius on radar

    ctx.clearRect(0, 0, w, h);

    // Radar circular background
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
    ctx.fillRect(0, 0, w, h);

    // Radar concentric rings & crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    [0.35, 0.7, 1.0].forEach((frac) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Draw islands (HELIPADS)
    HELIPADS.forEach((pad) => {
      const px = cx + pad.position.x * scale;
      const py = cy + pad.position.z * scale;
      ctx.fillStyle = pad.color || '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, pad.id === this.activePadId ? 4.2 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw uncollected stars (yellow dots)
    if (stars) {
      ctx.fillStyle = '#fde047';
      stars.forEach((s) => {
        if (!s.collected) {
          const sx = cx + s.mesh.position.x * scale;
          const sy = cy + s.mesh.position.z * scale;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw Secret Sky Hangar "67" marker
    if (skyHangarPos) {
      const hx = cx + skyHangarPos.x * scale;
      const hz = cy + skyHangarPos.z * scale;
      ctx.fillStyle = '#ff2a85';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('67', hx, hz - 3);
    }

    // Draw Helicopter position & heading cone
    const heliX = cx + heliPos.x * scale;
    const heliY = cy + heliPos.z * scale;

    ctx.save();
    ctx.translate(heliX, heliY);
    ctx.rotate(-heliYaw);

    // View cone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -22);
    ctx.lineTo(10, -22);
    ctx.closePath();
    ctx.fill();

    // Heli pointer triangle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3.5, 4);
    ctx.lineTo(3.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  updateStarsCount(count, total, elapsedSec = null) {
    if (this.starsCountEl) {
      const timeBadge = (elapsedSec !== null && count > 0 && count < total)
        ? ` · ⏱️ ${Math.floor(elapsedSec)}с`
        : '';
      this.starsCountEl.textContent = `⭐ ${count} / ${total}${timeBadge}`;
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
