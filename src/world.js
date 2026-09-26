import * as THREE from 'three';
import { HELIPADS, COLLECTIBLE_STARS } from './data.js';
import { sound } from './audio.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.helipads = [];
    this.turbines = [];
    this.stars = [];
    this.clouds = [];
    this.collectedStarsCount = 0;
    this.totalStars = COLLECTIBLE_STARS.length;

    this.buildLighting();
    this.buildTerrain();
    this.buildHelipads();
    this.buildVegetation();
    this.buildWindmills();
    this.buildCollectibleStars();
    this.buildClouds();
  }

  buildLighting() {
    // Ambient light with soft sky hue
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.2);
    this.scene.add(ambientLight);

    // Main directional sunlight with crisp low-poly shadows
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(50, 70, 40);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 90;
    sunLight.shadow.camera.bottom = -90;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);

    // Hemisphere light for ground bounce
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.7);
    this.scene.add(hemiLight);
  }

  buildTerrain() {
    // 1. Water Plane (stylized calm ocean below)
    const waterGeo = new THREE.PlaneGeometry(350, 350, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant azure
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -1.2;
    water.receiveShadow = true;
    this.scene.add(water);

    // 2. Main Archipelago Islands (Low Poly Stylized Ground)
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Lush emerald green
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true
    });

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark slate rock base
      roughness: 0.9,
      flatShading: true
    });

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xfde047, // Golden sand shore
      roughness: 0.9,
      flatShading: true
    });

    // Create Island Clusters around Helipad centers
    HELIPADS.forEach((pad) => {
      const isHQ = pad.id === 'hq';
      const radius = isHQ ? 26 : 18;

      const islandGroup = new THREE.Group();
      islandGroup.position.set(pad.position.x, 0, pad.position.z);

      // Top green plateau
      const topGeo = new THREE.CylinderGeometry(radius, radius * 1.15, 1.2, 12);
      const topMesh = new THREE.Mesh(topGeo, islandMat);
      topMesh.position.y = 0;
      topMesh.receiveShadow = true;
      topMesh.castShadow = true;
      islandGroup.add(topMesh);

      // Rocky cliff underside
      const rockGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 0.4, 4.5, 10);
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.position.y = -2.5;
      rockMesh.receiveShadow = true;
      islandGroup.add(rockMesh);

      this.scene.add(islandGroup);
    });

    // 3. Bridges & Highways Connecting Islands
    this.buildBridges();
  }

  buildBridges() {
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      flatShading: true
    });

    // Connect HQ (0,0) to various pads
    const connections = [
      { from: HELIPADS[0], to: HELIPADS[1] },
      { from: HELIPADS[0], to: HELIPADS[2] },
      { from: HELIPADS[0], to: HELIPADS[3] },
      { from: HELIPADS[0], to: HELIPADS[4] },
      { from: HELIPADS[0], to: HELIPADS[5] },
      { from: HELIPADS[4], to: HELIPADS[6] },
      { from: HELIPADS[3], to: HELIPADS[7] },
      { from: HELIPADS[6], to: HELIPADS[7] }
    ];

    connections.forEach(({ from, to }) => {
      const vFrom = new THREE.Vector3(from.position.x, 0.2, from.position.z);
      const vTo = new THREE.Vector3(to.position.x, 0.2, to.position.z);
      const dist = vFrom.distanceTo(vTo);
      const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);

      const bridgeGeo = new THREE.BoxGeometry(4.0, 0.4, dist);
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.copy(mid);
      bridge.lookAt(vTo);
      bridge.receiveShadow = true;
      bridge.castShadow = true;
      this.scene.add(bridge);

      // Yellow centerline road markings
      const lineGeo = new THREE.BoxGeometry(0.3, 0.42, dist * 0.9);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.copy(mid);
      line.lookAt(vTo);
      this.scene.add(line);
    });
  }

  buildHelipads() {
    HELIPADS.forEach((padData) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(padData.position.x, padData.position.y, padData.position.z);

      // 1. Concrete Octagonal Pad Base
      const padBaseGeo = new THREE.CylinderGeometry(5.2, 5.6, 0.35, 8);
      const padBaseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Dark tarmac/concrete
        roughness: 0.5,
        metalness: 0.1
      });
      const padBase = new THREE.Mesh(padBaseGeo, padBaseMat);
      padBase.receiveShadow = true;
      padBase.castShadow = true;
      padGroup.add(padBase);

      // 2. Yellow Warning Border Ring
      const borderGeo = new THREE.RingGeometry(4.7, 5.15, 32);
      borderGeo.rotateX(-Math.PI / 2);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide
      });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.y = 0.19;
      padGroup.add(border);

      // 3. Glowing Neon Circle (Theme Colored)
      const glowGeo = new THREE.RingGeometry(3.6, 4.0, 32);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: padData.accentGlow,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const glowRing = new THREE.Mesh(glowGeo, glowMat);
      glowRing.position.y = 0.2;
      padGroup.add(glowRing);

      // 4. White Center Circle
      const centerCircleGeo = new THREE.RingGeometry(1.9, 2.2, 32);
      centerCircleGeo.rotateX(-Math.PI / 2);
      const centerCircleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      const centerCircle = new THREE.Mesh(centerCircleGeo, centerCircleMat);
      centerCircle.position.y = 0.2;
      padGroup.add(centerCircle);

      // 5. Helipad "H" Marking
      const hMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      // Left bar
      const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.4), hMat);
      hLeft.position.set(-0.7, 0.21, 0);
      padGroup.add(hLeft);
      // Right bar
      const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.4), hMat);
      hRight.position.set(0.7, 0.21, 0);
      padGroup.add(hRight);
      // Cross bar
      const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.35), hMat);
      hCross.position.set(0, 0.21, 0);
      padGroup.add(hCross);

      // 6. Perimeter Aviation Runway Lights (4 flashing beacons)
      const lightPositions = [
        [-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]
      ];
      lightPositions.forEach(([lx, lz]) => {
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(lx, 0.3, lz);
        post.castShadow = true;
        padGroup.add(post);

        const bulbGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const bulbMat = new THREE.MeshBasicMaterial({ color: padData.accentGlow });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(lx, 0.65, lz);
        padGroup.add(bulb);
      });

      // 7. Floating 3D Title Banner / Holographic Marker
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 512;
      bannerCanvas.height = 128;
      const bCtx = bannerCanvas.getContext('2d');
      bCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      bCtx.roundRect(10, 10, 492, 108, 20);
      bCtx.fill();
      bCtx.lineWidth = 4;
      bCtx.strokeStyle = padData.color;
      bCtx.stroke();

      bCtx.font = 'bold 44px sans-serif';
      bCtx.fillStyle = '#ffffff';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(`${padData.emoji} ${padData.shortTitle}`, 256, 64);

      const bannerTex = new THREE.CanvasTexture(bannerCanvas);
      const bannerMat = new THREE.SpriteMaterial({
        map: bannerTex,
        transparent: true,
        opacity: 0.95
      });
      const bannerSprite = new THREE.Sprite(bannerMat);
      bannerSprite.position.set(0, 5.5, 0);
      bannerSprite.scale.set(7.5, 1.9, 1);
      padGroup.add(bannerSprite);

      this.scene.add(padGroup);

      this.helipads.push({
        data: padData,
        group: padGroup,
        glowRing: glowRing,
        sprite: bannerSprite
      });
    });
  }

  buildVegetation() {
    // Low poly trees
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Wood brown
      roughness: 0.9,
      flatShading: true
    });

    const foliageColors = [0x15803d, 0x16a34a, 0x22c55e, 0x059669];

    // Seeded random tree placements on islands
    HELIPADS.forEach((pad) => {
      const treeCount = pad.id === 'hq' ? 14 : 9;
      for (let i = 0; i < treeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 7.5 + Math.random() * 8.0;
        const tx = pad.position.x + Math.cos(angle) * dist;
        const tz = pad.position.z + Math.sin(angle) * dist;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0.5, tz);

        const heightScale = 0.7 + Math.random() * 0.6;
        treeGroup.scale.set(heightScale, heightScale, heightScale);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.2, 6);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Foliage (stacked cones)
        const foliageMat = new THREE.MeshStandardMaterial({
          color: foliageColors[Math.floor(Math.random() * foliageColors.length)],
          roughness: 0.7,
          flatShading: true
        });

        for (let j = 0; j < 3; j++) {
          const coneRadius = 1.3 - j * 0.28;
          const coneHeight = 1.2 - j * 0.15;
          const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 6);
          const cone = new THREE.Mesh(coneGeo, foliageMat);
          cone.position.y = 1.3 + j * 0.65;
          cone.castShadow = true;
          treeGroup.add(cone);
        }

        this.scene.add(treeGroup);
      }
    });
  }

  buildWindmills() {
    // 3 animated modern wind turbines in the sea/island borders
    const turbinePositions = [
      { x: -55, z: 5 },
      { x: 58, z: -10 },
      { x: 5, z: -80 }
    ];

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.2
    });

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2
    });

    turbinePositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      // Tower
      const towerGeo = new THREE.CylinderGeometry(0.4, 0.9, 18, 8);
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = 9;
      tower.castShadow = true;
      group.add(tower);

      // Nacelle
      const nacelleGeo = new THREE.BoxGeometry(1.2, 1.0, 2.5);
      const nacelle = new THREE.Mesh(nacelleGeo, towerMat);
      nacelle.position.set(0, 18, 0);
      group.add(nacelle);

      // Rotor Blades Hub
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 18, -1.3);

      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.ConeGeometry(0.35, 7.5, 4);
        bladeGeo.rotateZ((b * Math.PI * 2) / 3);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = Math.cos((b * Math.PI * 2) / 3) * 3.5;
        blade.position.x = -Math.sin((b * Math.PI * 2) / 3) * 3.5;
        blade.castShadow = true;
        rotorGroup.add(blade);
      }

      group.add(rotorGroup);
      this.scene.add(group);

      this.turbines.push({
        rotor: rotorGroup,
        speed: 0.8 + Math.random() * 0.4
      });
    });
  }

  buildCollectibleStars() {
    const starGeo = new THREE.OctahedronGeometry(0.9, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Radiant gold
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xd97706,
      emissiveIntensity: 0.35
    });

    COLLECTIBLE_STARS.forEach((starData) => {
      const starMesh = new THREE.Mesh(starGeo, starMat.clone());
      starMesh.position.set(starData.x, starData.y, starData.z);
      starMesh.castShadow = true;

      // Glow halo ring
      const haloGeo = new THREE.RingGeometry(0.7, 1.1, 16);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = -0.6;
      starMesh.add(halo);

      this.scene.add(starMesh);

      this.stars.push({
        id: starData.id,
        mesh: starMesh,
        collected: false,
        initialY: starData.y
      });
    });
  }

  buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.88
    });

    for (let c = 0; c < 15; c++) {
      const cloudGroup = new THREE.Group();
      const cx = (Math.random() - 0.5) * 220;
      const cy = 24 + Math.random() * 12;
      const cz = (Math.random() - 0.5) * 220;
      cloudGroup.position.set(cx, cy, cz);

      // Puffy cloud spheres
      const sphereCount = 4 + Math.floor(Math.random() * 4);
      for (let s = 0; s < sphereCount; s++) {
        const radius = 2.0 + Math.random() * 2.2;
        const sphereGeo = new THREE.DodecahedronGeometry(radius, 1);
        const puff = new THREE.Mesh(sphereGeo, cloudMat);
        puff.position.set(
          (s - sphereCount / 2) * 2.2,
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 1.5
        );
        cloudGroup.add(puff);
      }

      this.scene.add(cloudGroup);
      this.clouds.push({
        group: cloudGroup,
        speed: 1.2 + Math.random() * 1.5
      });
    }
  }

  checkStarCollisions(heliPos, onStarCollected) {
    const collectRadius = 2.6;
    this.stars.forEach((star) => {
      if (!star.collected) {
        if (heliPos.distanceTo(star.mesh.position) < collectRadius) {
          star.collected = true;
          this.collectedStarsCount++;
          sound.playStarCollect();

          // Collection animation (pop scale & remove)
          star.mesh.scale.set(2.0, 2.0, 2.0);
          star.mesh.material.transparent = true;

          if (onStarCollected) {
            onStarCollected(this.collectedStarsCount, this.totalStars);
          }
        }
      }
    });
  }

  getHelipadAt(pos, radius = 5.0) {
    for (const pad of this.helipads) {
      const pPos = pad.group.position;
      const dist = Math.hypot(pos.x - pPos.x, pos.z - pPos.z);
      if (dist < radius) {
        return pad.data;
      }
    }
    return null;
  }

  update(delta) {
    const time = performance.now() * 0.001;

    // 1. Wind turbine rotation
    this.turbines.forEach((t) => {
      t.rotor.rotation.z += t.speed * delta;
    });

    // 2. Stars rotation & bobbing
    this.stars.forEach((s) => {
      if (s.collected) {
        if (s.mesh.scale.x > 0.05) {
          s.mesh.scale.multiplyScalar(0.85);
          s.mesh.material.opacity = Math.max(0, s.mesh.material.opacity - 0.1);
        } else {
          s.mesh.visible = false;
        }
      } else {
        s.mesh.rotation.y += 2.0 * delta;
        s.mesh.rotation.x = Math.sin(time * 2.0 + s.id) * 0.2;
        s.mesh.position.y = s.initialY + Math.sin(time * 2.5 + s.id) * 0.35;
      }
    });

    // 3. Clouds drifting
    this.clouds.forEach((c) => {
      c.group.position.x += c.speed * delta;
      if (c.group.position.x > 150) {
        c.group.position.x = -150;
      }
    });

    // 4. Helipad pulse glow
    this.helipads.forEach((pad) => {
      const pulse = 0.75 + Math.sin(time * 3.5) * 0.25;
      pad.glowRing.material.opacity = pulse;
    });
  }
}
