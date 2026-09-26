import { HELIPADS, PORTFOLIO_INFO } from './data.js';
import { sound } from './audio.js';

export class UI {
  constructor({ onSelectPad, onNextPad, onPrevPad, onToggleCamera, onToggleMute }) {
    this.onSelectPad = onSelectPad;
    this.onNextPad = onNextPad;
    this.onPrevPad = onPrevPad;
    this.onToggleCamera = onToggleCamera;
    this.onToggleMute = onToggleMute;

    this.activePadId = 'hq';
    this.isMuted = sound.isMuted;
    this.cameraModeName = 'Следование';

    this.initElements();
    this.renderHelipadButtons();
    this.bindEvents();
  }

  initElements() {
    this.hudPadName = document.getElementById('hud-pad-name');
    this.flightModeBadge = document.getElementById('flight-mode-badge');
    this.starsCountEl = document.getElementById('stars-count');
    this.muteBtn = document.getElementById('btn-mute');
    this.cameraBtn = document.getElementById('btn-camera');
    this.helpBtn = document.getElementById('btn-help');
    this.helpModal = document.getElementById('help-modal');
    this.projectModal = document.getElementById('project-modal');
    this.ribbonContainer = document.getElementById('ribbon-buttons');
    this.prevBtn = document.getElementById('btn-prev-pad');
    this.nextBtn = document.getElementById('btn-next-pad');
    this.touchControls = document.getElementById('touch-controls');
    this.proximityPrompt = document.getElementById('proximity-prompt');

    // Update initial mute icon
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
    // Navigation arrows
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

    // Audio Mute toggle
    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        this.isMuted = sound.toggleMute();
        this.updateMuteButtonUI();
        if (this.onToggleMute) this.onToggleMute(this.isMuted);
      });
    }

    // Camera Mode toggle
    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onToggleCamera) this.onToggleCamera();
      });
    }

    // Help Dialog
    if (this.helpBtn && this.helpModal) {
      this.helpBtn.addEventListener('click', () => {
        sound.playClick();
        this.helpModal.showModal();
      });

      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) {
          this.helpModal.close();
        }
      });
    }

    // Project Dialog Backdrop Light Dismiss
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
    this.muteBtn.innerHTML = this.isMuted ? '🔇 <span class="btn-text">Звук: Выкл</span>' : '🔊 <span class="btn-text">Звук: Вкл</span>';
  }

  updateCameraUI(modeName) {
    this.cameraModeName = modeName;
    if (this.cameraBtn) {
      this.cameraBtn.innerHTML = `🎥 <span class="btn-text">${modeName}</span>`;
    }
  }

  setActivePad(padId) {
    this.activePadId = padId;
    const pad = HELIPADS.find(p => p.id === padId);
    if (pad && this.hudPadName) {
      this.hudPadName.textContent = `${pad.emoji} ${pad.name}`;
      this.hudPadName.style.borderColor = pad.color;
    }

    // Update ribbon active state
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
      <span>📍 Рядом: <strong>${padData.emoji} ${padData.name}</strong></span>
      <button id="btn-quick-land" class="btn-pill btn-pill--accent">Смотреть проект →</button>
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

  openProjectModal(padData, onFlyNext) {
    if (!this.projectModal) return;

    const modalContent = document.getElementById('modal-card-content');
    if (!modalContent) return;

    // Build stats pills
    const statsHtml = padData.stats ? padData.stats.map(s => `
      <div class="stat-pill">
        <span class="stat-pill__label">${s.label}</span>
        <strong class="stat-pill__value">${s.value}</strong>
      </div>
    `).join('') : '';

    // Build tags
    const tagsHtml = padData.tags ? padData.tags.map(t => `
      <span class="project-tag">${t}</span>
    `).join('') : '';

    modalContent.innerHTML = `
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
        ${padData.image ? `
          <div class="modal-card__image-wrap">
            <img src="${padData.image}" alt="${padData.name}" class="modal-card__image" loading="lazy" />
          </div>
        ` : ''}

        <div class="modal-card__stats">
          ${statsHtml}
        </div>

        <div class="modal-card__desc">
          <p>${padData.description}</p>
        </div>

        <div class="modal-card__tags">
          ${tagsHtml}
        </div>
      </div>

      <div class="modal-card__actions">
        ${padData.link ? `
          <a href="${padData.link}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="background: ${padData.color};">
            <span>🔗</span> ${padData.linkText || 'Смотреть проект'}
          </a>
        ` : ''}

        ${padData.secondaryLink ? `
          <a href="${padData.secondaryLink}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary">
            <span>💻</span> ${padData.secondaryLinkText || 'Ссылка'}
          </a>
        ` : ''}

        <button class="btn btn--outline" id="btn-modal-fly-next">
          <span>🚁</span> Лететь к следующему →
        </button>
      </div>
    `;

    // Bind modal buttons
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeProjectModal();
    }

    const flyNextBtn = document.getElementById('btn-modal-fly-next');
    if (flyNextBtn) {
      flyNextBtn.onclick = () => {
        this.closeProjectModal();
        if (onFlyNext) onFlyNext();
      };
    }

    this.projectModal.showModal();
  }

  closeProjectModal() {
    if (this.projectModal && this.projectModal.open) {
      this.projectModal.close();
    }
  }
}
