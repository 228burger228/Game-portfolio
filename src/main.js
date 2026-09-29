import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
    this.starRunStartTime = performance.now();

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
    this.scene.background = new THREE.Color(0x0284c7);
    this.scene.fog = new THREE.FogExp2(0x67e8f9, 0.0042);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      650
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
    this.renderer.toneMappingExposure = 1.12;

    // Generate HDR-like PBR Environment Reflections (IBL) for metallic armor & glass
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.65;

    // AAA Post-Processing Pipeline (RenderPass + UnrealBloomPass)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.26, // subtle bloom strength
      0.55, // radius
      0.84  // high threshold so only bright neon, sun & engines glow
    );
    this.composer.addPass(this.bloomPass);

    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Click on any 3D island (or the Floating Sky Island Hangar 67!) to fly there
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check click on Floating Sky Island Hangar 67 first
      if (this.world.skyIslandGroup) {
        const skyHits = this.raycaster.intersectObject(this.world.skyIslandGroup, true);
        if (skyHits.length > 0) {
          sound.playClick();
          this.flyToSkyHangar();
          return;
        }
      }

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

    // Pointer cursor when hovering over a 3D island or Sky Hangar
    this.renderer.domElement.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hitObjects = this.world.helipads.map(h => h.group);
      if (this.world.skyIslandGroup) hitObjects.push(this.world.skyIslandGroup);
      const intersects = this.raycaster.intersectObjects(hitObjects, true);
      this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
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
      onToggleTheme: (weatherMode) => {
        this.world.setNightMode(weatherMode);
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

  flyToSkyHangar() {
    this.ui.setFlightMode(true);
    this.ui.closeProjectModal();
    const skyPadTarget = {
      position: {
        x: this.world.skyHangarPos.x,
        y: this.world.skyHangarPos.y,
        z: this.world.skyHangarPos.z + 1.5
      }
    };
    this.helicopter.startAutopilotFlight(
      this.helicopter.position,
      skyPadTarget,
      () => {
        this.helicopter.currentYaw = 0; // Face the interior graffiti wall!
      }
    );
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

    // Dynamic FOV boost when flying fast
    const speed = this.helicopter.isAutopilot ? 48 : this.helicopter.velocity.length();
    const targetFov = 45 + Math.min(10, speed * 0.16);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 5.0);
      this.camera.updateProjectionMatrix();
    }

    if (this.cameraMode === 0) {
      const distBehind = 16.5;
      const heightAbove = heliPos.y > 26 ? 5.2 : 9.5; // Lower camera inside the Sky Hangar so graffiti is framed clearly!

      const targetCamX = heliPos.x + Math.sin(heliYaw) * distBehind;
      const targetCamZ = heliPos.z + Math.cos(heliYaw) * distBehind;
      const targetCamY = heliPos.y + heightAbove;

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      this.camera.position.lerp(targetCamPos, Math.min(1, delta * 5.0));

      const lookTarget = heliPos.clone().add(new THREE.Vector3(
        -Math.sin(heliYaw) * 4.2,
        heliPos.y > 26 ? 2.2 : 1.2,
        -Math.cos(heliYaw) * 4.2
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

    const elapsedSec = (performance.now() - this.starRunStartTime) / 1000;

    // Check collectible checkpoints (stars) & show Victory Modal when all 10 are collected!
    this.world.checkStarCollisions(this.helicopter.position, (collected, total) => {
      if (collected === 1) {
        // Start speedrun timer cleanly on first star if it was idle
      }
      this.ui.updateStarsCount(collected, total, elapsedSec);

      if (collected === total) {
        const finalTime = (performance.now() - this.starRunStartTime) / 1000;
        sound.playVictoryFanfare();
        this.ui.openVictoryModal(finalTime, () => {
          this.world.resetStars();
          this.starRunStartTime = performance.now();
          this.ui.updateStarsCount(0, total);
        });
      }
    });

    // Check if helicopter flew into the Secret Sky Hangar "67" above the clouds
    this.world.checkSkyHangar(
      this.helicopter.position,
      () => this.ui.showSkyHangarBanner(),
      () => this.ui.hideSkyHangarBanner()
    );

    // Update HUD altitude & Tactical Radar
    this.ui.updateAltitude(this.helicopter.position.y, () => this.flyToSkyHangar());
    this.ui.updateRadar(
      this.helicopter.position,
      this.helicopter.currentYaw,
      this.world.stars,
      this.world.skyHangarPos
    );

    this.checkProximityToPads();
    this.updateCamera(delta);

    this.composer.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
