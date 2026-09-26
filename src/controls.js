export class Controls {
  constructor() {
    this.input = {
      forward: false,
      back: false,
      left: false,
      right: false,
      up: false,
      down: false,
      turbo: false
    };

    this.onManualInputStarted = null;
    this.onCameraToggle = null;
    this.onMuteToggle = null;

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      let handled = false;

      // Don't capture when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          handled = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.back = true;
          handled = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          handled = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          handled = true;
          break;
        case 'Space':
        case 'KeyE':
          this.input.up = true;
          handled = true;
          break;
        case 'KeyQ':
        case 'ControlLeft':
          this.input.down = true;
          handled = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.turbo = true;
          handled = true;
          break;
        case 'KeyC':
          if (this.onCameraToggle) this.onCameraToggle();
          handled = true;
          break;
        case 'KeyM':
          if (this.onMuteToggle) this.onMuteToggle();
          handled = true;
          break;
      }

      if (handled) {
        if (this.onManualInputStarted) {
          this.onManualInputStarted();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.back = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
        case 'KeyE':
          this.input.up = false;
          break;
        case 'KeyQ':
        case 'ControlLeft':
          this.input.down = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.turbo = false;
          break;
      }
    });
  }

  setupTouch() {
    // Touch Joystick elements will be bound in UI
    this.joystickActive = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  bindVirtualJoystick(container, stick) {
    if (!container || !stick) return;

    const maxRadius = 45;

    const handleStart = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      this.touchStartX = rect.left + rect.width / 2;
      this.touchStartY = rect.top + rect.height / 2;
      this.joystickActive = true;
      if (this.onManualInputStarted) this.onManualInputStarted();
    };

    const handleMove = (clientX, clientY) => {
      if (!this.joystickActive) return;

      const dx = clientX - this.touchStartX;
      const dy = clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const clampedDist = Math.min(dist, maxRadius);
      const stickX = Math.cos(angle) * clampedDist;
      const stickY = Math.sin(angle) * clampedDist;

      stick.style.transform = `translate(${stickX}px, ${stickY}px)`;

      // Map joystick values to inputs
      const normX = stickX / maxRadius;
      const normY = stickY / maxRadius;

      this.input.forward = normY < -0.25;
      this.input.back = normY > 0.25;
      this.input.left = normX < -0.25;
      this.input.right = normX > 0.25;
    };

    const handleEnd = () => {
      this.joystickActive = false;
      stick.style.transform = 'translate(0px, 0px)';
      this.input.forward = false;
      this.input.back = false;
      this.input.left = false;
      this.input.right = false;
    };

    container.addEventListener('pointerdown', (e) => {
      container.setPointerCapture(e.pointerId);
      handleStart(e.clientX, e.clientY);
      handleMove(e.clientX, e.clientY);
    });

    container.addEventListener('pointermove', (e) => {
      if (this.joystickActive) {
        handleMove(e.clientX, e.clientY);
      }
    });

    const stopTracking = (e) => {
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
      handleEnd();
    };

    container.addEventListener('pointerup', stopTracking);
    container.addEventListener('pointercancel', stopTracking);
  }

  bindActionButton(buttonElement, inputKey) {
    if (!buttonElement) return;

    const start = (e) => {
      e.preventDefault();
      this.input[inputKey] = true;
      if (this.onManualInputStarted) this.onManualInputStarted();
    };

    const stop = (e) => {
      e.preventDefault();
      this.input[inputKey] = false;
    };

    buttonElement.addEventListener('pointerdown', start);
    buttonElement.addEventListener('pointerup', stop);
    buttonElement.addEventListener('pointercancel', stop);
  }
}
