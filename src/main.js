import * as THREE from 'three';
import { Helicopter } from './helicopter.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { sound } from './audio.js';
import { HELIPADS } from './data.js';

class App {
  constructor() {
    this.currentPadIndex = 0;
    this.cameraMode = 0; // 0: Follow, 1: High Isometric, 2: Cockpit / Nose
    this.cameraModesList = ['Следование 🎥', 'Изометрия 📐', 'Кабина 🚁'];

    this.initThree();
    this.initWorld();
    this.initControls();
    this.initUI();

    // Interaction hint sound unlock
    window.addEventListener('click', () => sound.init(), { once: true });
    window.addEventListener('keydown', () => sound.init(), { once: true });
    window.addEventListener('touchstart', () => sound.init(), { once: true });

    // Start render loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    const container = document.getElementById('canvas-container');

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.cameraTarget = new THREE.Vector3(0, 2, 0);

    // Initial position looking at HQ
    this.camera.position.set(0, 18, 28);
    this.camera.lookAt(0, 1, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    container.appendChild(this.renderer.domElement);

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initWorld() {
    this.world = new World(this.scene);
    this.helicopter = new Helicopter(this.scene);

    // Start at HQ pad (0,0)
    const hqPad = HELIPADS[0];
    this.helicopter.teleportTo(hqPad.position);
    this.helicopter.currentPadId = hqPad.id;
  }

  initControls() {
    this.controls = new Controls();

    // When manual keys/joystick touched:
    this.controls.onManualInputStarted = () => {
      if (this.helicopter.isAutopilot) {
        this.helicopter.cancelAutopilot();
        this.ui.setFlightMode(false);
      }
    };

    this.controls.onCameraToggle = () => {
      this.toggleCameraMode();
    };

    this.controls.onMuteToggle = () => {
      // Audio handled directly in UI/audio
    };

    // Virtual joystick binding
    const joyContainer = document.getElementById('joystick-container');
    const joyStick = document.getElementById('joystick-stick');
    this.controls.bindVirtualJoystick(joyContainer, joyStick);

    // Lift and descend mobile buttons
    this.controls.bindActionButton(document.getElementById('btn-touch-up'), 'up');
    this.controls.bindActionButton(document.getElementById('btn-touch-down'), 'down');
  }

  initUI() {
    this.ui = new UI({
      onSelectPad: (pad) => {
        const padIdx = HELIPADS.findIndex(p => p.id === pad.id);
        if (padIdx !== -1) {
          this.flyToPad(padIdx);
        }
      },
      onNextPad: () => {
        const nextIdx = (this.currentPadIndex + 1) % HELIPADS.length;
        this.flyToPad(nextIdx);
      },
      onPrevPad: () => {
        const prevIdx = (this.currentPadIndex - 1 + HELIPADS.length) % HELIPADS.length;
        this.flyToPad(prevIdx);
      },
      onToggleCamera: () => {
        this.toggleCameraMode();
      },
      onToggleMute: (isMuted) => {
        // UI handles text
      }
    });

    // Set initial mode & pad
    this.ui.setActivePad(HELIPADS[0].id);
    this.ui.setFlightMode(true);
    this.ui.updateCameraUI(this.cameraModesList[this.cameraMode]);
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode + 1) % this.cameraModesList.length;
    this.ui.updateCameraUI(this.cameraModesList[this.cameraMode]);
  }

  flyToPad(padIndex) {
    this.currentPadIndex = padIndex;
    const targetPad = HELIPADS[padIndex];
    this.ui.setActivePad(targetPad.id);
    this.ui.setFlightMode(true);
    this.ui.closeProjectModal();

    sound.playClick();

    // Start smooth helicopter autopilot flight
    this.helicopter.startAutopilotFlight(
      this.helicopter.position,
      targetPad,
      () => {
        // When landing sequence is complete:
        this.ui.openProjectModal(targetPad, () => {
          // Callback when user clicks "Лететь к следующему" in the modal
          const nextIdx = (this.currentPadIndex + 1) % HELIPADS.length;
          this.flyToPad(nextIdx);
        });
      }
    );
  }

  updateCamera(delta) {
    const heliPos = this.helicopter.position;
    const heliYaw = this.helicopter.currentYaw;

    if (this.cameraMode === 0) {
      // 1. Cinematic Follow Camera
      const distBehind = 18.0;
      const heightAbove = 10.0;

      // Position behind helicopter based on yaw
      const targetCamX = heliPos.x + Math.sin(heliYaw) * distBehind;
      const targetCamZ = heliPos.z + Math.cos(heliYaw) * distBehind;
      const targetCamY = heliPos.y + heightAbove;

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      this.camera.position.lerp(targetCamPos, delta * 3.5);

      // Look slightly ahead of helicopter
      const lookTarget = heliPos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 4.0,
        1.5,
        -Math.cos(heliYaw) * 4.0
      ));
      this.cameraTarget.lerp(lookTarget, delta * 4.5);
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 1) {
      // 2. High Isometric Overview
      const targetCamPos = new THREE.Vector3(heliPos.x, heliPos.y + 35, heliPos.z + 28);
      this.camera.position.lerp(targetCamPos, delta * 4.0);
      this.cameraTarget.lerp(heliPos, delta * 5.0);
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 2) {
      // 3. Cockpit / Nose View
      const nosePos = heliPos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 1.2,
        0.9,
        -Math.cos(heliYaw) * 1.2
      ));
      this.camera.position.copy(nosePos);

      const lookAhead = nosePos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 20.0,
        -1.5,
        -Math.cos(heliYaw) * 20.0
      ));
      this.camera.lookAt(lookAhead);
    }
  }

  checkProximityToPads() {
    if (this.helicopter.isAutopilot) {
      this.ui.hideProximityPrompt();
      return;
    }

    const pad = this.world.getHelipadAt(this.helicopter.position, 6.0);
    if (pad) {
      this.ui.showProximityPrompt(pad, () => {
        const padIdx = HELIPADS.findIndex(p => p.id === pad.id);
        if (padIdx !== -1) {
          this.flyToPad(padIdx);
        }
      });
    } else {
      this.ui.hideProximityPrompt();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update helicopter physics
    this.helicopter.update(delta, this.controls.input);

    // Update 3D world elements (turbines, clouds, stars)
    this.world.update(delta);

    // Check collectible stars
    this.world.checkStarCollisions(this.helicopter.position, (collected, total) => {
      this.ui.updateStarsCount(collected, total);
    });

    // Check proximity to helipads for landing prompt
    this.checkProximityToPads();

    // Smooth camera motion
    this.updateCamera(delta);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
