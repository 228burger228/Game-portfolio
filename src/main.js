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
    this.cameraModesList = ['🎥 Следование', '📐 Изометрия', '🚁 Кабина'];

    this.initThree();
    this.initWorld();
    this.initControls();
    this.initUI();

    window.addEventListener('click', () => sound.init(), { once: true });
    window.addEventListener('keydown', () => sound.init(), { once: true });
    window.addEventListener('touchstart', () => sound.init(), { once: true });

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    const container = document.getElementById('canvas-container');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0065);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.cameraTarget = new THREE.Vector3(0, 2, 0);

    this.camera.position.set(0, 16, 25);
    this.camera.lookAt(0, 1.5, 0);

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

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Click on any 3D island in the viewport to fly there directly
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const hitObjects = this.world.helipads.map(h => h.group);
      const intersects = this.raycaster.intersectObjects(hitObjects, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !this.world.helipads.some(h => h.group === obj)) {
          obj = obj.parent;
        }
        const matched = this.world.helipads.find(h => h.group === obj);
        if (matched) {
          const padIdx = HELIPADS.findIndex(p => p.id === matched.data.id);
          if (padIdx !== -1) {
            sound.playClick();
            this.flyToPad(padIdx);
          }
        }
      }
    });

    // Pointer cursor when hovering over a 3D island
    this.renderer.domElement.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hitObjects = this.world.helipads.map(h => h.group);
      const intersects = this.raycaster.intersectObjects(hitObjects, true);
      this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initWorld() {
    this.world = new World(this.scene);
    this.helicopter = new Helicopter(this.scene);

    const hqPad = HELIPADS[0];
    this.helicopter.teleportTo(hqPad.position);
    this.helicopter.currentPadId = hqPad.id;
  }

  initControls() {
    this.controls = new Controls();

    this.controls.onManualInputStarted = () => {
      if (this.helicopter.isAutopilot) {
        this.helicopter.cancelAutopilot();
        this.ui.setFlightMode(false);
      }
    };

    this.controls.onCameraToggle = () => {
      this.toggleCameraMode();
    };

    const joyContainer = document.getElementById('joystick-container');
    const joyStick = document.getElementById('joystick-stick');
    this.controls.bindVirtualJoystick(joyContainer, joyStick);

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
      onToggleMute: () => {},
      onToggleTheme: (isNight) => {
        this.world.setNightMode(isNight);
      }
    });

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

    this.helicopter.startAutopilotFlight(
      this.helicopter.position,
      targetPad,
      () => {
        this.ui.openProjectModal(
          targetPad,
          () => {
            const nextIdx = (this.currentPadIndex + 1) % HELIPADS.length;
            this.flyToPad(nextIdx);
          },
          () => {
            const prevIdx = (this.currentPadIndex - 1 + HELIPADS.length) % HELIPADS.length;
            this.flyToPad(prevIdx);
          }
        );
      }
    );
  }

  updateCamera(delta) {
    const heliPos = this.helicopter.position;
    const heliYaw = this.helicopter.currentYaw;

    if (this.cameraMode === 0) {
      const distBehind = 16.5;
      const heightAbove = 9.5;

      const targetCamX = heliPos.x + Math.sin(heliYaw) * distBehind;
      const targetCamZ = heliPos.z + Math.cos(heliYaw) * distBehind;
      const targetCamY = heliPos.y + heightAbove;

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      this.camera.position.lerp(targetCamPos, Math.min(1, delta * 5.0));

      const lookTarget = heliPos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 3.5,
        1.2,
        -Math.cos(heliYaw) * 3.5
      ));
      this.cameraTarget.lerp(lookTarget, Math.min(1, delta * 6.5));
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 1) {
      const targetCamPos = new THREE.Vector3(heliPos.x, heliPos.y + 34, heliPos.z + 28);
      this.camera.position.lerp(targetCamPos, Math.min(1, delta * 5.0));
      this.cameraTarget.lerp(heliPos, Math.min(1, delta * 6.0));
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 2) {
      const nosePos = heliPos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 1.4,
        1.1,
        -Math.cos(heliYaw) * 1.4
      ));
      this.camera.position.copy(nosePos);

      const lookAhead = nosePos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 22.0,
        -1.5,
        -Math.cos(heliYaw) * 22.0
      ));
      this.camera.lookAt(lookAhead);
    }
  }

  checkProximityToPads() {
    if (this.helicopter.isAutopilot) {
      this.ui.hideProximityPrompt();
      return;
    }

    const pad = this.world.getHelipadAt(this.helicopter.position, 6.2);
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

    this.helicopter.update(delta, this.controls.input);
    this.world.update(delta);

    this.world.checkStarCollisions(this.helicopter.position, (collected, total) => {
      this.ui.updateStarsCount(collected, total);
    });

    this.checkProximityToPads();
    this.updateCamera(delta);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
