import * as THREE from 'three';
import { HELIPADS, COLLECTIBLE_STARS } from './data.js';
import { sound } from './audio.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.helipads = [];
    this.turbines = [];
    this.animatedLandmarks = [];
    this.shoreFoamRings = [];
    this.stars = [];
    this.clouds = [];
    this.collectedStarsCount = 0;
    this.totalStars = COLLECTIBLE_STARS.length;

    // Secret Sky Hangar ("67") coordinates above the clouds
    this.skyHangarPos = new THREE.Vector3(0, 34.5, -14);
    this.isInsideSkyHangar = false;

    this.buildLighting();
    this.buildSkyDome();
    this.buildTerrain();
    this.buildHelipadsAndLandmarks();
    this.buildVegetation();
    this.buildSwayingGrass();
    this.buildWindmills();
    this.buildCollectibleStars();
    this.buildClouds();
    this.buildSecretSkyHangar();
    this.buildWelcomeGuideSignboard();
  }

  buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfaf5eb, 1.08);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4dc, 1.85);
    this.sunLight.position.set(65, 78, -55);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 240;
    this.sunLight.shadow.camera.left = -105;
    this.sunLight.shadow.camera.right = 105;
    this.sunLight.shadow.camera.top = 105;
    this.sunLight.shadow.camera.bottom = -105;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x4b5563, 0.68);
    this.scene.add(this.hemiLight);
  }

  buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(420, 32, 24);
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color(0x3a7ca5) },
      uHorizonColor: { value: new THREE.Color(0xcde4f2) },
      uBottomColor: { value: new THREE.Color(0x1d4e68) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.45, -0.65).normalize() },
      uSunColor: { value: new THREE.Color(0xfff1d0) },
      uStarIntensity: { value: 0.0 },
      uTime: { value: 0 }
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uBottomColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uStarIntensity;
        uniform float uTime;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.6));
          if (dir.y < 0.0) {
            col = mix(uHorizonColor, uBottomColor, clamp(-dir.y * 3.0, 0.0, 1.0));
          }

          // Calm, soft sun disk without blinding bloom
          float sunAmt = max(dot(dir, uSunDir), 0.0);
          col += uSunColor * pow(sunAmt, 16.0) * 0.22;
          col += uSunColor * smoothstep(0.997, 0.9996, sunAmt) * 0.85;

          // Subtle stars at Sunset / Night
          if (uStarIntensity > 0.01 && dir.y > 0.05) {
            float s = hash(floor(dir * 260.0));
            if (s > 0.994) {
              float twinkle = 0.55 + 0.45 * sin(uTime * 3.0 + s * 100.0);
              col += vec3(0.88, 0.92, 0.98) * twinkle * uStarIntensity * smoothstep(0.05, 0.35, dir.y);
            }
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  // Supports boolean or 4-mode index (0: Mondstadt Day, 1: Golden Dusk, 2: Misty Dawn, 3: Starlight Night)
  setNightMode(modeOrBool) {
    const mode = typeof modeOrBool === 'boolean' ? (modeOrBool ? 3 : 0) : (modeOrBool % 4);
    if (mode === 0) {
      // 0: Mondstadt Sunny Morning (Calm Cerulean & Warm Sunlight)
      this.scene.fog.color.setHex(0xa8d0e6);
      this.scene.fog.density = 0.0032;
      this.ambientLight.color.setHex(0xfaf5eb);
      this.ambientLight.intensity = 1.08;
      this.sunLight.color.setHex(0xfff4dc);
      this.sunLight.intensity = 1.85;
      this.hemiLight.intensity = 0.68;
      this.skyUniforms.uTopColor.value.setHex(0x3a7ca5);
      this.skyUniforms.uHorizonColor.value.setHex(0xcde4f2);
      this.skyUniforms.uSunColor.value.setHex(0xfff1d0);
      this.skyUniforms.uSunDir.value.set(0.55, 0.45, -0.65).normalize();
      this.skyUniforms.uStarIntensity.value = 0.0;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x1b4d66);
        this.waterUniforms.uShallowColor.value.setHex(0x3d8596);
        this.waterUniforms.uSunColor.value.setHex(0xf5e6c8);
      }
    } else if (mode === 1) {
      // 1: Mondstadt Golden Dusk (Warm Amber & Soft Lavender)
      this.scene.fog.color.setHex(0xd99b78);
      this.scene.fog.density = 0.0038;
      this.ambientLight.color.setHex(0xf3d5b5);
      this.ambientLight.intensity = 0.95;
      this.sunLight.color.setHex(0xf59e0b);
      this.sunLight.intensity = 1.95;
      this.hemiLight.intensity = 0.6;
      this.skyUniforms.uTopColor.value.setHex(0x3b3355);
      this.skyUniforms.uHorizonColor.value.setHex(0xe29578);
      this.skyUniforms.uSunColor.value.setHex(0xfde68a);
      this.skyUniforms.uSunDir.value.set(0.65, 0.18, -0.72).normalize();
      this.skyUniforms.uStarIntensity.value = 0.25;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x1f2942);
        this.waterUniforms.uShallowColor.value.setHex(0x3b6978);
        this.waterUniforms.uSunColor.value.setHex(0xf59e0b);
      }
    } else if (mode === 2) {
      // 2: Wolvendom Misty Dawn (Calm Slate Mist)
      this.scene.fog.color.setHex(0x94a3b8);
      this.scene.fog.density = 0.0058;
      this.ambientLight.color.setHex(0xcbd5e1);
      this.ambientLight.intensity = 0.88;
      this.sunLight.color.setHex(0xfef3c7);
      this.sunLight.intensity = 1.45;
      this.hemiLight.intensity = 0.58;
      this.skyUniforms.uTopColor.value.setHex(0x475569);
      this.skyUniforms.uHorizonColor.value.setHex(0x94a3b8);
      this.skyUniforms.uSunColor.value.setHex(0xfef3c7);
      this.skyUniforms.uSunDir.value.set(-0.55, 0.22, -0.65).normalize();
      this.skyUniforms.uStarIntensity.value = 0.0;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x1e293b);
        this.waterUniforms.uShallowColor.value.setHex(0x335c67);
        this.waterUniforms.uSunColor.value.setHex(0xe2e8f0);
      }
    } else {
      // 3: Mondstadt Starlight Night (Deep Indigo & Warm Lanterns)
      this.scene.fog.color.setHex(0x0f172a);
      this.scene.fog.density = 0.0038;
      this.ambientLight.color.setHex(0x64748b);
      this.ambientLight.intensity = 0.52;
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.intensity = 0.95;
      this.hemiLight.intensity = 0.38;
      this.skyUniforms.uTopColor.value.setHex(0x090d16);
      this.skyUniforms.uHorizonColor.value.setHex(0x1e293b);
      this.skyUniforms.uSunColor.value.setHex(0x93c5fd);
      this.skyUniforms.uSunDir.value.set(0.3, 0.35, -0.85).normalize();
      this.skyUniforms.uStarIntensity.value = 0.85;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x091326);
        this.waterUniforms.uShallowColor.value.setHex(0x163a52);
        this.waterUniforms.uSunColor.value.setHex(0x93c5fd);
      }
    }
  }

  buildTerrain() {
    // 1. Cider Lake Water Shader (Calm, Painterly Waves without harsh neon glare)
    const waterGeo = new THREE.PlaneGeometry(520, 520, 128, 128);
    waterGeo.rotateX(-Math.PI / 2);

    this.waterUniforms = {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x1b4d66) },
      uShallowColor: { value: new THREE.Color(0x3d8596) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.45, -0.65).normalize() },
      uSunColor: { value: new THREE.Color(0xf5e6c8) }
    };

    const waterMat = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      transparent: true,
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vWaveHeight;

        void main() {
          vec3 pos = position;
          float w1 = sin(pos.x * 0.07 + uTime * 1.2) * cos(pos.z * 0.06 + uTime * 1.0) * 0.26;
          float w2 = sin((pos.x * 0.12 - pos.z * 0.09) + uTime * 1.7) * 0.12;
          float w3 = cos(pos.z * 0.18 + uTime * 2.1) * 0.05;
          pos.y += w1 + w2 + w3;
          vWaveHeight = w1 + w2 + w3;

          float dx = cos(pos.x * 0.07 + uTime * 1.2) * 0.07 * 0.26 + cos((pos.x * 0.12 - pos.z * 0.09) + uTime * 1.7) * 0.12 * 0.12;
          float dz = -sin(pos.z * 0.06 + uTime * 1.0) * 0.06 * 0.26 - cos((pos.x * 0.12 - pos.z * 0.09) + uTime * 1.7) * 0.09 * 0.12;
          vNormal = normalize(vec3(-dx, 1.0, -dz));

          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vWaveHeight;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 norm = normalize(vNormal);

          // Gentle Fresnel reflection
          float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 2.8);
          vec3 waterCol = mix(uShallowColor, uDeepColor, clamp(fresnel * 0.75 + 0.18, 0.0, 1.0));

          // Soft painterly wave crest highlight
          float crest = smoothstep(0.18, 0.45, vWaveHeight);
          waterCol = mix(waterCol, vec3(0.68, 0.85, 0.89), crest * 0.16);

          // Calm specular sun shimmer (capped below bloom threshold)
          vec3 halfVec = normalize(uSunDir + viewDir);
          float spec = pow(max(dot(norm, halfVec), 0.0), 110.0);
          waterCol += uSunColor * spec * 0.42;

          float dist = length(vWorldPos.xz);
          float edgeFade = smoothstep(250.0, 140.0, dist);

          gl_FragColor = vec4(waterCol, 0.93 * edgeFade);
        }
      `
    });

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -1.05;
    this.scene.add(water);

    // 2. Mondstadt Meadow Islands (Calm Sage-Olive Grass, Warm Pebble Shore & Weathered Limestone Cliffs)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x5c8d53, // Calm Mondstadt Meadow Green
      roughness: 0.78,
      metalness: 0.02,
      flatShading: true
    });

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xd6c4a2, // Warm natural sand/pebble shore
      roughness: 0.88,
      flatShading: true
    });

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6c757d, // Weathered Mondstadt Limestone Grey
      roughness: 0.86,
      metalness: 0.06,
      flatShading: true
    });

    const foamRingMat = new THREE.MeshBasicMaterial({
      color: 0xcde4f2,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    HELIPADS.forEach((pad, idx) => {
      const isHQ = pad.id === 'hq';
      const radius = isHQ ? 22 : 16.5;

      const islandGroup = new THREE.Group();
      islandGroup.position.set(pad.position.x, 0, pad.position.z);

      // Top meadow grass plateau
      const topGeo = new THREE.CylinderGeometry(radius, radius * 1.07, 1.05, 18);
      const topMesh = new THREE.Mesh(topGeo, grassMat);
      topMesh.position.y = 0.05;
      topMesh.receiveShadow = true;
      topMesh.castShadow = true;
      islandGroup.add(topMesh);

      // Warm pebble beach rim
      const sandGeo = new THREE.CylinderGeometry(radius * 1.08, radius * 1.19, 0.78, 18);
      const sandMesh = new THREE.Mesh(sandGeo, sandMat);
      sandMesh.position.y = -0.38;
      sandMesh.receiveShadow = true;
      islandGroup.add(sandMesh);

      // Sculpted limestone cliffs underneath
      const rockGeo = new THREE.CylinderGeometry(radius * 1.16, radius * 0.52, 4.8, 16, 3);
      const posAttr = rockGeo.attributes.position;
      for (let v = 0; v < posAttr.count; v++) {
        const vx = posAttr.getX(v);
        const vy = posAttr.getY(v);
        const vz = posAttr.getZ(v);
        if (vy < 2.0) {
          const n = Math.sin(vx * 0.45 + idx) * Math.cos(vz * 0.45 + vy) * 1.15;
          posAttr.setX(v, vx + (vx / radius) * n);
          posAttr.setZ(v, vz + (vz / radius) * n);
        }
      }
      rockGeo.computeVertexNormals();
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.position.y = -2.75;
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      islandGroup.add(rockMesh);

      // Weathered limestone boulders around perimeter
      for (let b = 0; b < 5; b++) {
        const ang = (b / 5) * Math.PI * 2 + idx * 0.7;
        const bDist = radius * (0.95 + (b % 2) * 0.14);
        const boulder = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.1 + (b % 3) * 0.55, 0),
          rockMat
        );
        boulder.position.set(
          Math.cos(ang) * bDist,
          b % 2 === 0 ? -0.35 : 0.45,
          Math.sin(ang) * bDist
        );
        boulder.scale.set(1.3, 0.85, 1.1);
        boulder.rotation.set(b, b * 1.2, 0);
        boulder.castShadow = true;
        boulder.receiveShadow = true;
        islandGroup.add(boulder);
      }

      // Gentle Shoreline Ripple Ring
      const foamGeo = new THREE.RingGeometry(radius * 1.14, radius * 1.25, 32);
      foamGeo.rotateX(-Math.PI / 2);
      const foamMesh = new THREE.Mesh(foamGeo, foamRingMat.clone());
      foamMesh.position.y = -0.96;
      islandGroup.add(foamMesh);
      this.shoreFoamRings.push({ mesh: foamMesh, phase: idx * 0.8 });

      this.scene.add(islandGroup);
    });

    this.buildBridges();
  }

  buildBridges() {
    // Mondstadt Carved Stone Masonry Bridges with Parapets & Warm Lanterns
    const stoneRoadMat = new THREE.MeshStandardMaterial({
      color: 0x8d8880,
      roughness: 0.82,
      flatShading: true
    });
    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0xc9c2b8,
      roughness: 0.75,
      flatShading: true
    });
    const goldInlayMat = new THREE.MeshStandardMaterial({
      color: 0xc2a878,
      roughness: 0.45,
      metalness: 0.35
    });

    const connections = [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
      [1, 6], [2, 6], [2, 3], [3, 5],
      [4, 7], [5, 8], [7, 9], [8, 9], [0, 9]
    ];

    connections.forEach(([i, j]) => {
      const from = HELIPADS[i];
      const to = HELIPADS[j];
      if (!from || !to) return;

      const vFrom = new THREE.Vector3(from.position.x, 0.22, from.position.z);
      const vTo = new THREE.Vector3(to.position.x, 0.22, to.position.z);
      const dist = vFrom.distanceTo(vTo);
      const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);

      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.copy(mid);
      bridgeGroup.lookAt(vTo);

      // Cobblestone deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.38, dist), stoneRoadMat);
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Left & Right Stone Parapet Walls
      [-1.62, 1.62].forEach((px) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.65, dist * 0.65), parapetMat);
        wall.position.set(px, 0.25, 0);
        wall.castShadow = true;
        bridgeGroup.add(wall);
      });

      // Subtle champagne-gold center masonry strip
      const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, dist * 0.85), goldInlayMat);
      bridgeGroup.add(inlay);

      this.scene.add(bridgeGroup);
    });
  }

  buildHelipadsAndLandmarks() {
    HELIPADS.forEach((padData) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(padData.position.x, padData.position.y, padData.position.z);

      // 1. Mondstadt Carved Stone Plaza Outer Ring
      const deckOuterGeo = new THREE.CylinderGeometry(6.2, 6.8, 0.42, 12);
      const deckOuterMat = new THREE.MeshStandardMaterial({
        color: 0xbcb5ab, // Warm carved limestone
        roughness: 0.72,
        metalness: 0.08
      });
      const deckOuter = new THREE.Mesh(deckOuterGeo, deckOuterMat);
      deckOuter.receiveShadow = true;
      deckOuter.castShadow = true;
      padGroup.add(deckOuter);

      // Inner Slate-Stone Landing Circle
      const deckInnerGeo = new THREE.CylinderGeometry(5.3, 5.5, 0.48, 16);
      const deckInnerMat = new THREE.MeshStandardMaterial({
        color: 0x333c4a,
        roughness: 0.65
      });
      const deckInner = new THREE.Mesh(deckInnerGeo, deckInnerMat);
      deckInner.receiveShadow = true;
      padGroup.add(deckInner);

      // 2. Genshin Champagne-Gold Ornate Trim Ring
      const borderGeo = new THREE.RingGeometry(4.85, 5.22, 32);
      borderGeo.rotateX(-Math.PI / 2);
      const borderMat = new THREE.MeshStandardMaterial({
        color: 0xd3bc8e,
        roughness: 0.35,
        metalness: 0.55,
        side: THREE.DoubleSide
      });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.y = 0.25;
      padGroup.add(border);

      // 3. Calm Theme Accent Ring (Soft opacity, no harsh glare)
      const glowGeo = new THREE.RingGeometry(3.6, 4.05, 32);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: padData.accentGlow,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const glowRing = new THREE.Mesh(glowGeo, glowMat);
      glowRing.position.y = 0.26;
      padGroup.add(glowRing);

      // 4. Warm Ivory Center H Marking
      const hMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.5 });
      const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 2.5), hMat);
      hLeft.position.set(-0.75, 0.26, 0);
      padGroup.add(hLeft);

      const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 2.5), hMat);
      hRight.position.set(0.75, 0.26, 0);
      padGroup.add(hRight);

      const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.38), hMat);
      hCross.position.set(0, 0.26, 0);
      padGroup.add(hCross);

      // 5. 4 Mondstadt Wrought-Iron & Warm Amber Plaza Lanterns (True point of warm glow!)
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 0.5, metalness: 0.6 });
      const lanternGlowMat = new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.45 // Crosses Bloom threshold 1.06 so ONLY lantern cores softly glow!
      });
      [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([lx, lz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.45, 6), ironMat);
        post.position.set(lx, 0.72, lz);
        post.castShadow = true;
        padGroup.add(post);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.25, 6), ironMat);
        cap.position.set(lx, 1.65, lz);
        padGroup.add(cap);

        const bulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), lanternGlowMat);
        bulb.position.set(lx, 1.45, lz);
        padGroup.add(bulb);
      });

      // 5b. Genshin-Style Floating Teleport Waypoint Shrine next to each plaza
      const wpGroup = new THREE.Group();
      wpGroup.position.set(-6.8, 0.2, -3.8);
      const wpPedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.9, 0.9, 6),
        deckOuterMat
      );
      wpPedestal.position.y = 0.45;
      wpGroup.add(wpPedestal);

      const wpCrown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x0284c7,
          emissiveIntensity: 1.35 // Selective Bloom on the Waypoint crystal!
        })
      );
      wpCrown.position.y = 1.9;
      wpCrown.scale.set(0.75, 1.45, 0.75);
      wpGroup.add(wpCrown);
      padGroup.add(wpGroup);

      this.animatedLandmarks.push((dt, t) => {
        wpCrown.rotation.y += dt * 1.2;
        wpCrown.position.y = 1.9 + Math.sin(t * 2.2 + padData.position.x) * 0.18;
      });

      // 6. Noble Genshin-Styled Station Signboard (Deep Slate + Champagne Gold #d3bc8e Frame)
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 640;
      bannerCanvas.height = 180;
      const bCtx = bannerCanvas.getContext('2d');

      bCtx.fillStyle = 'rgba(22, 27, 38, 0.94)';
      bCtx.beginPath();
      bCtx.roundRect(8, 8, 624, 164, 20);
      bCtx.fill();

      bCtx.lineWidth = 4;
      bCtx.strokeStyle = '#d3bc8e'; // Genshin UI Gold
      bCtx.stroke();

      // Inner subtle gold hairline
      bCtx.lineWidth = 1.5;
      bCtx.strokeStyle = 'rgba(211, 188, 142, 0.35)';
      bCtx.beginPath();
      bCtx.roundRect(16, 16, 608, 148, 14);
      bCtx.stroke();

      // Top badge line
      bCtx.font = '600 22px Inter, sans-serif';
      bCtx.fillStyle = '#d3bc8e';
      bCtx.textAlign = 'center';
      bCtx.fillText(`✦ ЛОКАЦИЯ ${padData.number} · ${padData.badge.toUpperCase()} ✦`, 320, 48);

      // Main Title
      bCtx.font = 'bold 42px Inter, sans-serif';
      bCtx.fillStyle = '#f4efe6';
      bCtx.fillText(`${padData.emoji} ${padData.shortTitle}`, 320, 104);

      // Subtitle hint
      bCtx.font = '500 19px Inter, sans-serif';
      bCtx.fillStyle = '#94a3b8';
      bCtx.fillText(padData.category, 320, 144);

      const bannerTex = new THREE.CanvasTexture(bannerCanvas);
      const bannerSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: bannerTex, transparent: true })
      );
      bannerSprite.position.set(0, 8.2, -5.8);
      bannerSprite.scale.set(9.5, 2.7, 1);
      padGroup.add(bannerSprite);

      // 7. Build Thematic 3D Landmark Structure for this location!
      this.buildThematicLandmark(padData, padGroup);

      this.scene.add(padGroup);

      this.helipads.push({
        data: padData,
        group: padGroup,
        glowRing: glowRing,
        sprite: bannerSprite
      });
    });
  }

  buildThematicLandmark(padData, padGroup) {
    // Place thematic 3D monument behind/next to the helipad
    const landmarkGroup = new THREE.Group();
    landmarkGroup.position.set(8.5, 0, -5.5);

    const accentMat = new THREE.MeshStandardMaterial({
      color: padData.accentGlow,
      roughness: 0.3,
      metalness: 0.3,
      flatShading: true
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.5,
      flatShading: true
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      flatShading: true
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: padData.accentGlow });

    switch (padData.themeType) {
      case 'hq': {
        // Command Control Tower + Rotating Radar Dish + Hologram Core
        const towerBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.5, 4.2), darkMat);
        towerBase.position.y = 2.75;
        towerBase.castShadow = true;
        landmarkGroup.add(towerBase);

        const glassDeck = new THREE.Mesh(
          new THREE.CylinderGeometry(2.8, 2.4, 1.8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
        );
        glassDeck.position.y = 6.2;
        landmarkGroup.add(glassDeck);

        const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.4, 8), whiteMat);
        roof.position.y = 7.3;
        landmarkGroup.add(roof);

        // Rotating Radar Dish
        const radarGroup = new THREE.Group();
        radarGroup.position.set(0, 8.2, 0);
        const dish = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8, 0, Math.PI), whiteMat);
        dish.rotation.x = -0.3;
        radarGroup.add(dish);
        landmarkGroup.add(radarGroup);

        this.animatedLandmarks.push((dt) => {
          radarGroup.rotation.y += dt * 1.6;
        });
        break;
      }

      case 'construction': {
        // HgStroy: Skyscraper Under Construction + Yellow Tower Crane
        const bldg = new THREE.Mesh(new THREE.BoxGeometry(3.8, 7.5, 3.8), darkMat);
        bldg.position.set(-1.5, 3.75, 0);
        bldg.castShadow = true;
        landmarkGroup.add(bldg);

        // Glowing Floor Bands
        for (let y = 1.5; y <= 6.5; y += 1.6) {
          const floorBand = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.35, 3.95), glowMat);
          floorBand.position.set(-1.5, y, 0);
          landmarkGroup.add(floorBand);
        }

        // Yellow Tower Crane
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
        const craneMast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 11.5, 0.8), yellowMat);
        craneMast.position.set(2.2, 5.75, 0);
        craneMast.castShadow = true;
        landmarkGroup.add(craneMast);

        const craneBoomGroup = new THREE.Group();
        craneBoomGroup.position.set(2.2, 11.2, 0);

        const jib = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.55, 0.55), yellowMat);
        jib.position.set(-1.5, 0, 0);
        craneBoomGroup.add(jib);

        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2), darkMat);
        cable.position.set(-4.2, -1.6, 0);
        craneBoomGroup.add(cable);

        const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), accentMat);
        block.position.set(-4.2, -3.2, 0);
        craneBoomGroup.add(block);

        landmarkGroup.add(craneBoomGroup);
        this.animatedLandmarks.push((dt, t) => {
          craneBoomGroup.rotation.y = Math.sin(t * 0.7) * 0.65;
        });
        break;
      }

      case 'military': {
        // Warpath Wiki: 3D Heavy Tank + Tactical Radar Bunker
        const tankGroup = new THREE.Group();
        const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.5, flatShading: true });

        // Tank Tracks
        [-1.3, 1.3].forEach((tx) => {
          const track = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 4.6), darkMat);
          track.position.set(tx, 0.45, 0);
          track.castShadow = true;
          tankGroup.add(track);
        });

        // Tank Hull
        const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 4.2), oliveMat);
        hull.position.set(0, 0.9, 0);
        hull.castShadow = true;
        tankGroup.add(hull);

        // Rotating Tank Turret & Main Cannon
        const turretGroup = new THREE.Group();
        turretGroup.position.set(0, 1.6, 0.2);

        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.8, 8), oliveMat);
        turret.castShadow = true;
        turretGroup.add(turret);

        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.8, 8), darkMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(0, 0.1, -2.2);
        turretGroup.add(cannon);

        // Red Star Badge on Turret
        const badge = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 0.5), accentMat);
        turretGroup.add(badge);

        tankGroup.add(turretGroup);
        landmarkGroup.add(tankGroup);

        this.animatedLandmarks.push((dt, t) => {
          turretGroup.rotation.y = Math.sin(t * 0.9) * 0.55;
        });
        break;
      }

      case 'youtube': {
        // YouTube @burgerdom6 & WarpathHub: Giant 3D YouTube Play Button + 3D Burger Mascot!
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.9, 1.2, 10), darkMat);
        base.position.y = 0.6;
        base.castShadow = true;
        landmarkGroup.add(base);

        // Giant Red YouTube Play Plaque
        const ytGroup = new THREE.Group();
        ytGroup.position.set(-1.2, 3.6, 0);

        const ytRedMat = new THREE.MeshStandardMaterial({
          color: 0xff0033,
          roughness: 0.25,
          metalness: 0.2,
          emissive: 0x990011,
          emissiveIntensity: 0.25
        });
        const plaque = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.9, 0.85), ytRedMat);
        plaque.castShadow = true;
        ytGroup.add(plaque);

        // White Play Triangle (▶) on both sides
        const playTriGeo = new THREE.ConeGeometry(0.85, 1.35, 3);
        playTriGeo.rotateZ(-Math.PI / 2);
        const playFront = new THREE.Mesh(playTriGeo, whiteMat);
        playFront.position.set(0.1, 0, 0.46);
        ytGroup.add(playFront);

        const playBack = new THREE.Mesh(playTriGeo, whiteMat);
        playBack.position.set(0.1, 0, -0.46);
        playBack.rotation.y = Math.PI;
        ytGroup.add(playBack);

        landmarkGroup.add(ytGroup);

        // 3D Burger Mascot on Pedestal (Tribute to @burgerdom6 avatar!)
        const burgerGroup = new THREE.Group();
        burgerGroup.position.set(2.4, 1.5, 0.6);

        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });

        const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.95, 0.4, 12), bunMat);
        burgerGroup.add(bottomBun);

        const patty = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.38, 12), pattyMat);
        patty.position.y = 0.38;
        burgerGroup.add(patty);

        const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.85), cheeseMat);
        cheese.position.y = 0.62;
        cheese.rotation.y = Math.PI / 4;
        burgerGroup.add(cheese);

        const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.15, 0.2, 10), lettuceMat);
        lettuce.position.y = 0.76;
        burgerGroup.add(lettuce);

        const topBun = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
        topBun.position.y = 0.82;
        burgerGroup.add(topBun);

        landmarkGroup.add(burgerGroup);

        this.animatedLandmarks.push((dt, t) => {
          ytGroup.position.y = 3.6 + Math.sin(t * 2.4) * 0.3;
          ytGroup.rotation.y = Math.sin(t * 1.1) * 0.28;
          burgerGroup.rotation.y += dt * 1.2;
          burgerGroup.position.y = 1.5 + Math.cos(t * 2.8) * 0.2;
        });
        break;
      }

      case 'edtech': {
        // Study Up & EdTech: Stack of 3D Books + Floating Graduation Cap
        const bookColors = [0x4f46e5, 0x0ea5e9, 0xec4899];
        bookColors.forEach((col, idx) => {
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(3.8 - idx * 0.3, 0.85, 2.8 - idx * 0.2),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
          );
          book.position.set(0, 0.45 + idx * 0.9, 0);
          book.rotation.y = idx * 0.18;
          book.castShadow = true;
          landmarkGroup.add(book);
        });

        // Floating Graduation Cap (Конфедератка)
        const capGroup = new THREE.Group();
        capGroup.position.set(0, 4.5, 0);

        const skullCap = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.7, 8), darkMat);
        capGroup.add(skullCap);

        const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 3.4), darkMat);
        board.position.y = 0.4;
        board.rotation.y = Math.PI / 4;
        capGroup.add(board);

        const tassel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.15, 1.2, 6),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        tassel.position.set(1.2, -0.1, 1.2);
        capGroup.add(tassel);

        landmarkGroup.add(capGroup);
        this.animatedLandmarks.push((dt, t) => {
          capGroup.rotation.y += dt * 1.2;
          capGroup.position.y = 4.5 + Math.sin(t * 2.2) * 0.35;
        });
        break;
      }

      case 'media': {
        // vertical.team: Giant 9:16 Vertical Smartphone + Floating Play Button
        const phoneFrame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 6.8, 0.5), darkMat);
        phoneFrame.position.y = 3.6;
        phoneFrame.castShadow = true;
        landmarkGroup.add(phoneFrame);

        const screen = new THREE.Mesh(new THREE.BoxGeometry(3.0, 6.2, 0.54), glowMat);
        screen.position.y = 3.6;
        landmarkGroup.add(screen);

        // Floating White Play Icon Triangle
        const playGeo = new THREE.ConeGeometry(0.95, 1.4, 3);
        playGeo.rotateZ(-Math.PI / 2);
        const playMesh = new THREE.Mesh(playGeo, whiteMat);
        playMesh.position.set(0, 3.6, 0.65);
        landmarkGroup.add(playMesh);

        this.animatedLandmarks.push((dt, t) => {
          playMesh.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.12);
        });
        break;
      }

      case 'ai': {
        // Dmitry OS Agent: Glowing AI Neural Core & Orbiting Gyro Rings
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.5, 1.4, 8), darkMat);
        pedestal.position.y = 0.7;
        landmarkGroup.add(pedestal);

        const aiCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), glowMat);
        aiCore.position.y = 4.2;
        landmarkGroup.add(aiCore);

        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.12, 8, 24), whiteMat);
        ring1.position.y = 4.2;
        landmarkGroup.add(ring1);

        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.12, 8, 24), accentMat);
        ring2.position.y = 4.2;
        landmarkGroup.add(ring2);

        this.animatedLandmarks.push((dt) => {
          aiCore.rotation.y += dt * 1.5;
          aiCore.rotation.x += dt * 0.8;
          ring1.rotation.x += dt * 1.8;
          ring1.rotation.y += dt * 1.1;
          ring2.rotation.y -= dt * 1.5;
          ring2.rotation.z += dt * 0.9;
        });
        break;
      }

      case 'product': {
        // foodiCE & Digital Garden: Giant 3D Craft Ice Cream Cone + Botanical Dome
        const iceGroup = new THREE.Group();
        iceGroup.position.set(0, 0.5, 0);

        // Waffle Cone
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7, flatShading: true });
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.45, 3.6, 10), coneMat);
        cone.rotation.x = Math.PI;
        cone.position.y = 2.0;
        cone.castShadow = true;
        iceGroup.add(cone);

        // 3 Craft Ice Cream Scoops
        const scoop1 = new THREE.Mesh(
          new THREE.SphereGeometry(1.35, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 })
        );
        scoop1.position.set(0, 4.0, 0);
        iceGroup.add(scoop1);

        const scoop2 = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.4 })
        );
        scoop2.position.set(0, 5.4, 0);
        iceGroup.add(scoop2);

        const cherry = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        cherry.position.set(0, 6.6, 0);
        iceGroup.add(cherry);

        landmarkGroup.add(iceGroup);
        this.animatedLandmarks.push((dt, t) => {
          iceGroup.rotation.y += dt * 0.8;
          iceGroup.position.y = 0.5 + Math.sin(t * 2.0) * 0.25;
        });
        break;
      }

      case 'creative': {
        // UI/UX, Merch & Roman Courtyard 3D: Classical Arch Columns + Floating 3D Cube
        [-1.8, 1.8].forEach((cx) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 5.2, 10), whiteMat);
          col.position.set(cx, 2.6, 0);
          col.castShadow = true;
          landmarkGroup.add(col);
        });

        const archTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 1.4), whiteMat);
        archTop.position.set(0, 5.5, 0);
        archTop.castShadow = true;
        landmarkGroup.add(archTop);

        const artCube = new THREE.Mesh(new THREE.TorusKnotGeometry(0.95, 0.28, 48, 8), accentMat);
        artCube.position.set(0, 2.8, 0);
        landmarkGroup.add(artCube);

        this.animatedLandmarks.push((dt) => {
          artCube.rotation.y += dt * 1.4;
          artCube.rotation.x += dt * 0.9;
        });
        break;
      }

      case 'contact': {
        // Contacts & MVP Calculator: Giant Telegram Paper Plane Monument
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.4, 1.5, 8), darkMat);
        base.position.y = 0.75;
        landmarkGroup.add(base);

        const planeGroup = new THREE.Group();
        planeGroup.position.set(0, 4.2, 0);

        const planeMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.2,
          metalness: 0.3,
          flatShading: true
        });
        const wingGeo = new THREE.ConeGeometry(1.8, 4.2, 4);
        wingGeo.rotateX(Math.PI / 2);
        wingGeo.scale(1.3, 0.35, 1.0);
        const planeMesh = new THREE.Mesh(wingGeo, planeMat);
        planeMesh.rotation.x = -0.35;
        planeMesh.castShadow = true;
        planeGroup.add(planeMesh);

        landmarkGroup.add(planeGroup);
        this.animatedLandmarks.push((dt, t) => {
          planeGroup.position.y = 4.2 + Math.sin(t * 2.5) * 0.4;
          planeGroup.rotation.y = Math.sin(t * 1.2) * 0.35;
        });
        break;
      }
    }

    padGroup.add(landmarkGroup);
  }

  buildVegetation() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c4028,
      roughness: 0.9,
      flatShading: true
    });
    // Calm Mondstadt foliage colors: sage green, forest olive, and warm golden birch
    const foliageColors = [0x4f7f48, 0x629055, 0x456e40, 0xb89246];

    // Materials for Mondstadt Tudor Cottages
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.8 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb4533c, roughness: 0.72, flatShading: true });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.35 // Warm glowing cottage window!
    });

    HELIPADS.forEach((pad, idx) => {
      const treeCount = pad.id === 'hq' ? 9 : 6;
      for (let i = 0; i < treeCount; i++) {
        const angle = (i / treeCount) * Math.PI * 1.3 + 1.25;
        const dist = 9.0 + (i % 3) * 2.3;
        const tx = pad.position.x + Math.cos(angle) * dist;
        const tz = pad.position.z + Math.sin(angle) * dist;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0.5, tz);
        const s = 0.8 + ((i + idx) % 3) * 0.22;
        treeGroup.scale.set(s, s, s);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.5, 6), trunkMat);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliageMat = new THREE.MeshStandardMaterial({
          color: foliageColors[(i + idx) % foliageColors.length],
          roughness: 0.78,
          flatShading: true
        });

        // Painterly rounded canopy puffs (Genshin style)
        const canopyPositions = [
          { x: 0, y: 2.1, z: 0, r: 1.25 },
          { x: -0.6, y: 1.75, z: 0.4, r: 0.9 },
          { x: 0.65, y: 1.8, z: -0.35, r: 0.95 },
          { x: 0, y: 2.75, z: 0.1, r: 0.85 }
        ];
        canopyPositions.forEach((cp) => {
          const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(cp.r, 1), foliageMat);
          puff.position.set(cp.x, cp.y, cp.z);
          puff.castShadow = true;
          puff.receiveShadow = true;
          treeGroup.add(puff);
        });

        this.scene.add(treeGroup);
      }

      // Add a charming Mondstadt Tudor Cottage on the left/back side of each island
      if (idx % 2 === 0) {
        const houseGroup = new THREE.Group();
        houseGroup.position.set(pad.position.x - 9.2, 0.5, pad.position.z + 4.2);
        houseGroup.rotation.y = 0.55;

        const walls = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 2.6), plasterMat);
        walls.position.y = 1.25;
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);

        // Timber framing beams
        const beamH = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.16, 2.66), timberMat);
        beamH.position.y = 1.3;
        houseGroup.add(beamH);

        // Pitched Terracotta Roof
        const roofGeo = new THREE.ConeGeometry(2.65, 1.9, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 3.4;
        roof.scale.set(1.15, 1.0, 0.95);
        roof.castShadow = true;
        houseGroup.add(roof);

        // Warm lit cottage windows
        [-0.8, 0.8].forEach((wx) => {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), windowMat);
          win.position.set(wx, 1.4, 1.32);
          houseGroup.add(win);
        });

        this.scene.add(houseGroup);
      }
    });
  }

  buildSwayingGrass() {
    // Calm Mondstadt sage-green wind-swaying grass blades
    const bladeGeo = new THREE.ConeGeometry(0.14, 0.72, 4);
    bladeGeo.translate(0, 0.35, 0);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x689a5d,
      roughness: 0.75,
      flatShading: true
    });

    const totalBlades = HELIPADS.length * 28;
    this.grassInstanced = new THREE.InstancedMesh(bladeGeo, bladeMat, totalBlades);
    this.grassTransforms = [];

    const dummy = new THREE.Object3D();
    let index = 0;
    HELIPADS.forEach((pad, pIdx) => {
      const maxR = pad.id === 'hq' ? 19.5 : 14.2;
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + pIdx * 0.4;
        const r = 7.2 + ((i * 7 + pIdx * 3) % 10) / 10 * (maxR - 7.2);
        const gx = pad.position.x + Math.cos(angle) * r;
        const gz = pad.position.z + Math.sin(angle) * r;
        const scale = 0.75 + (i % 4) * 0.22;

        dummy.position.set(gx, 0.52, gz);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.grassInstanced.setMatrixAt(index, dummy.matrix);
        this.grassTransforms.push({ x: gx, z: gz, angle, scale, phase: i * 0.5 + pIdx });
        index++;
      }
    });
    this.scene.add(this.grassInstanced);
  }

  buildWindmills() {
    // Classic Mondstadt Medieval Stone & Timber Windmills with 4 Lattice Canvas Sails
    const turbinePositions = [
      { x: -16, z: -13 }, // Right on the Grand HQ Island!
      { x: -62, z: -5 },
      { x: 62, z: -5 },
      { x: 0, z: -78 }
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a847c, roughness: 0.85, flatShading: true });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.75 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3d5a73, roughness: 0.7, flatShading: true });
    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xfaf5eb,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    turbinePositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      // Stone base + Plaster upper tower
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.4, 7.0, 8), stoneMat);
      base.position.y = 3.5;
      base.castShadow = true;
      group.add(base);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.8, 8.5, 8), plasterMat);
      upper.position.y = 11.2;
      upper.castShadow = true;
      group.add(upper);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.2, 8), roofMat);
      roof.position.y = 17.0;
      roof.castShadow = true;
      group.add(roof);

      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 13.8, 1.65);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 8), woodMat);
      hub.rotation.x = Math.PI / 2;
      rotorGroup.add(hub);

      for (let b = 0; b < 4; b++) {
        const armGroup = new THREE.Group();
        armGroup.rotation.z = (b * Math.PI) / 2;

        const spar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.2, 0.18), woodMat);
        spar.position.y = 3.6;
        armGroup.add(spar);

        const sail = new THREE.Mesh(new THREE.BoxGeometry(1.35, 5.8, 0.04), sailMat);
        sail.position.set(0.45, 4.1, 0.06);
        sail.castShadow = true;
        armGroup.add(sail);

        rotorGroup.add(armGroup);
      }

      group.add(rotorGroup);
      this.scene.add(group);

      this.turbines.push({ rotor: rotorGroup, speed: 0.75 });
    });
  }

  buildCollectibleStars() {
    const starGeo = new THREE.OctahedronGeometry(0.95, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.25 // Selective glow just on the stars!
    });

    COLLECTIBLE_STARS.forEach((starData) => {
      const starMesh = new THREE.Mesh(starGeo, starMat.clone());
      starMesh.position.set(starData.x, starData.y, starData.z);
      starMesh.castShadow = true;
      this.scene.add(starMesh);

      this.stars.push({
        id: starData.id,
        mesh: starMesh,
        collected: false,
        initialY: starData.y
      });
    });
  }

  resetStars() {
    this.collectedStarsCount = 0;
    this.stars.forEach((s) => {
      s.collected = false;
      s.mesh.visible = true;
      s.mesh.scale.set(1, 1, 1);
      s.mesh.material.opacity = 1;
    });
  }

  buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xeaeef2, // Soft off-white so clouds NEVER trigger bloom glare
      roughness: 0.92,
      flatShading: true,
      transparent: true,
      opacity: 0.84
    });

    for (let c = 0; c < 16; c++) {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(
        (Math.random() - 0.5) * 220,
        19 + Math.random() * 6,
        (Math.random() - 0.5) * 220
      );

      for (let s = 0; s < 4; s++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 + Math.random() * 1.8, 1), cloudMat);
        puff.position.set((s - 1.5) * 2.3, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2);
        cloudGroup.add(puff);
      }

      this.scene.add(cloudGroup);
      this.clouds.push({ group: cloudGroup, speed: 1.1 + Math.random() * 1.1 });
    }
  }

  createGraffitiWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Concrete / industrial hangar wall background
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 512);
    bgGrad.addColorStop(0, '#18181b');
    bgGrad.addColorStop(0.5, '#27272a');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle brick/corrugated lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Neon spray paint splatter blobs behind graffiti
    const splatters = [
      { x: 220, y: 180, r: 150, col: 'rgba(236, 72, 153, 0.35)' },
      { x: 520, y: 210, r: 190, col: 'rgba(56, 189, 248, 0.32)' },
      { x: 820, y: 190, r: 155, col: 'rgba(250, 204, 21, 0.3)' }
    ];
    splatters.forEach((sp) => {
      const g = ctx.createRadialGradient(sp.x, sp.y, 10, sp.x, sp.y, sp.r);
      g.addColorStop(0, sp.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
    });

    // Spray paint drips
    ctx.fillStyle = '#ec4899';
    [180, 235, 490, 560, 790].forEach((dx, i) => {
      ctx.fillRect(dx, 210, 8, 45 + (i % 3) * 28);
    });

    // Huge Street-Art "67" Tag at top-left & top-right
    ctx.save();
    ctx.translate(155, 165);
    ctx.rotate(-0.08);
    ctx.font = '900 135px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#09090b';
    ctx.strokeText('67', 0, 0);
    ctx.fillStyle = '#facc15';
    ctx.fillText('67', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(875, 165);
    ctx.rotate(0.08);
    ctx.font = '900 135px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#09090b';
    ctx.strokeText('67', 0, 0);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('67', 0, 0);
    ctx.restore();

    // Crown above center
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 SECRET HANGAR 67 👑', 512, 82);

    // Main Street-Art Graffiti Text: "ТЫ ЧЁ ЗАБЫЛ ЗДЕСЬ? ДАЙ ОТДОХНУТЬ НОРМАЛЬНО!"
    ctx.save();
    ctx.translate(512, 265);
    ctx.rotate(-0.025);
    ctx.font = '900 68px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('ТЫ ЧЁ ЗАБЫЛ ЗДЕСЬ?!', 0, 0);
    ctx.fillStyle = '#ff2a85';
    ctx.fillText('ТЫ ЧЁ ЗАБЫЛ ЗДЕСЬ?!', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(512, 375);
    ctx.rotate(0.02);
    ctx.font = '900 62px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 22;
    ctx.lineWidth = 13;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('ДАЙ ОТДОХНУТЬ НОРМАЛЬНО!', 0, 0);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ДАЙ ОТДОХНУТЬ НОРМАЛЬНО!', 0, 0);
    ctx.restore();

    // Bottom graffiti signature tag
    ctx.font = 'italic 800 30px Inter, sans-serif';
    ctx.fillStyle = '#a3e635';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 NOW PLAYING: GAZAN — 67 (SIX SEVEN) · BURGERDOM6 VIP CHILL ZONE 🍔', 512, 468);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  buildWelcomeGuideSignboard() {
    // 1. Noble Mondstadt 3D Instruction & Navigation Bulletin Board on the HQ Island
    this.guideBoardGroup = new THREE.Group();
    this.guideBoardGroup.position.set(-7.6, 0.5, -4.6);
    this.guideBoardGroup.rotation.y = 0.36;

    const timberMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.82 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e988e, roughness: 0.85, flatShading: true });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd3bc8e, roughness: 0.35, metalness: 0.65 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb4533c, roughness: 0.72, flatShading: true });

    // Stone plinths + timber posts
    [-2.4, 2.4].forEach((px) => {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.65), stoneMat);
      plinth.position.set(px, 0.28, 0);
      this.guideBoardGroup.add(plinth);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.8, 8), timberMat);
      post.position.set(px, 1.9, 0);
      post.castShadow = true;
      this.guideBoardGroup.add(post);
    });

    // Pitched protective wooden/terracotta awning roof over the bulletin board
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 1.15), roofMat);
    roof.position.set(0, 3.95, 0);
    roof.castShadow = true;
    this.guideBoardGroup.add(roof);

    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(5.3, 2.55, 0.16), goldMat);
    goldTrim.position.set(0, 2.45, 0);
    this.guideBoardGroup.add(goldTrim);

    // Canvas texture for the 3D Instruction & Navigation Board
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#181e2c';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.strokeStyle = '#d3bc8e';
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 988, 476);

    ctx.fillStyle = '#d3bc8e';
    ctx.font = '800 42px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧭 ПУТЕВОДИТЕЛЬ · ЧТО ЗДЕСЬ ДЕЛАТЬ?', 512, 82);

    ctx.fillStyle = 'rgba(211, 188, 142, 0.25)';
    ctx.fillRect(64, 105, 896, 3);

    ctx.textAlign = 'left';
    ctx.font = '700 32px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#f8f4ec';
    ctx.fillText('🚁 1. КЛИКАЙ ПО ОСТРОВАМ или летай на WASD (Автопилот / Ручной)', 56, 172);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('⭐ 2. СОБЕРИ ВСЕ 10 ЗВЁЗД на время для ранга пилота S+', 56, 244);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('🏛️ 3. ОТКРЫВАЙ КЕЙСЫ: подлети к площадке [H] или жми кнопки внизу', 56, 316);
    ctx.fillStyle = '#f472b6';
    ctx.fillText('☁️ 4. СЕКРЕТ 67: зажми [SPACE] и взлети ВЫШЕ ОБЛАКОВ над центром!', 56, 388);

    ctx.textAlign = 'center';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#d3bc8e';
    ctx.fillText('✨ Кликни по этому стенду или кнопке «🧭 Гид» слева для быстрой навигации ✨', 512, 456);

    const boardTex = new THREE.CanvasTexture(canvas);
    boardTex.needsUpdate = true;
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });

    const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 2.4), boardMat);
    frontPlane.position.set(0, 2.45, 0.1);
    this.guideBoardGroup.add(frontPlane);

    const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 2.4), boardMat);
    backPlane.position.set(0, 2.45, -0.1);
    backPlane.rotation.y = Math.PI;
    this.guideBoardGroup.add(backPlane);

    this.scene.add(this.guideBoardGroup);

    // 2. Classic Mondstadt Directional Signpost (Указатель направлений) on the right side of HQ
    const postGroup = new THREE.Group();
    postGroup.position.set(7.6, 0.5, -4.6);
    postGroup.rotation.y = -0.32;

    const baseStone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 0.6, 8), stoneMat);
    baseStone.position.y = 0.3;
    postGroup.add(baseStone);

    const mainPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 4.2, 8), timberMat);
    mainPole.position.y = 2.1;
    mainPole.castShadow = true;
    postGroup.add(mainPole);

    const signs = [
      { y: 3.65, rot: 0.15, text: '⬆ СЕВЕР: Кейсы & YouTube', col: '#d3bc8e' },
      { y: 3.0, rot: -0.2, text: '⬅ ЗАПАД: EdTech & Контакты', col: '#7dd3fc' },
      { y: 2.35, rot: 0.25, text: '➡ ВОСТОК: AI & Продукты', col: '#86efac' },
      { y: 1.7, rot: 0.0, text: '☁️ ВВЕРХ [Space]: Ангар 67', col: '#f472b6' }
    ];

    signs.forEach((sg) => {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = 512;
      sCanvas.height = 96;
      const sCtx = sCanvas.getContext('2d');
      sCtx.fillStyle = '#1e2536';
      sCtx.fillRect(0, 0, 512, 96);
      sCtx.strokeStyle = sg.col;
      sCtx.lineWidth = 6;
      sCtx.strokeRect(4, 4, 504, 88);
      sCtx.fillStyle = '#f8f4ec';
      sCtx.font = '800 30px Inter, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText(sg.text, 256, 58);

      const sTex = new THREE.CanvasTexture(sCanvas);
      const sMat = new THREE.MeshBasicMaterial({ map: sTex });
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.48, 0.1), timberMat);
      plank.position.set(0, sg.y, 0);
      plank.rotation.y = sg.rot;

      const labelF = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 0.44), sMat);
      labelF.position.z = 0.06;
      plank.add(labelF);

      const labelB = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 0.44), sMat);
      labelB.position.z = -0.06;
      labelB.rotation.y = Math.PI;
      plank.add(labelB);

      postGroup.add(plank);
    });

    this.scene.add(postGroup);
  }

  buildSecretSkyHangar() {
    // Floating Island above the clouds at (0, 34, -14)
    this.skyIslandGroup = new THREE.Group();
    this.skyIslandGroup.position.copy(this.skyHangarPos);

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      flatShading: true
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.55
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.7
    });

    // 1. Floating Rock Island Base & Glowing Celestia Ring
    const islandTop = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 14.5, 1.2, 16), deckMat);
    islandTop.position.y = -0.5;
    islandTop.receiveShadow = true;
    this.skyIslandGroup.add(islandTop);

    const islandUnder = new THREE.Mesh(new THREE.ConeGeometry(13.8, 9.5, 12), rockMat);
    islandUnder.rotation.x = Math.PI;
    islandUnder.position.y = -5.8;
    this.skyIslandGroup.add(islandUnder);

    // Ring of fluffy clouds embracing the floating island
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.9
    });
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6 + (i % 3) * 0.7, 1), cloudMat);
      puff.position.set(Math.cos(ang) * 14.2, -1.2 + Math.sin(i) * 0.6, Math.sin(ang) * 14.2);
      this.skyIslandGroup.add(puff);
    }

    // Glowing gold/pink neon landing ring inside the hangar floor
    const padRingGeo = new THREE.RingGeometry(4.5, 5.1, 32);
    padRingGeo.rotateX(-Math.PI / 2);
    const padRingMat = new THREE.MeshBasicMaterial({
      color: 0xff2a85,
      side: THREE.DoubleSide
    });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.position.y = 0.14;
    this.skyIslandGroup.add(padRing);

    // 2. Open Military Hangar Structure (Open Front facing +Z so helicopter flies right in!)
    const hangarW = 14.0;
    const hangarH = 7.2;
    const hangarD = 13.0;

    // Back Wall with the Huge Graffiti Mural
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(hangarW, hangarH, 0.5), steelMat);
    backWall.position.set(0, hangarH / 2, -hangarD / 2);
    this.skyIslandGroup.add(backWall);

    const graffitiTex = this.createGraffitiWallTexture();
    const graffitiMat = new THREE.MeshBasicMaterial({ map: graffitiTex });

    // Inner back wall graffiti mural (13.4m x 6.4m)
    const muralFront = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 6.4), graffitiMat);
    muralFront.position.set(0, hangarH / 2, -hangarD / 2 + 0.28);
    this.skyIslandGroup.add(muralFront);

    // Outer back wall graffiti mural (visible from behind too)
    const muralBack = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 6.4), graffitiMat);
    muralBack.position.set(0, hangarH / 2, -hangarD / 2 - 0.28);
    muralBack.rotation.y = Math.PI;
    this.skyIslandGroup.add(muralBack);

    // Left and Right Hangar Walls with interior graffiti panels
    [-hangarW / 2, hangarW / 2].forEach((xSide) => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, hangarH, hangarD), steelMat);
      sideWall.position.set(xSide, hangarH / 2, 0);
      this.skyIslandGroup.add(sideWall);

      const sideMural = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 6.0), graffitiMat);
      sideMural.position.set(xSide > 0 ? xSide - 0.28 : xSide + 0.28, hangarH / 2, 0);
      sideMural.rotation.y = xSide > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.skyIslandGroup.add(sideMural);
    });

    // Arched / Sloped Hangar Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(hangarW + 1.0, 0.55, hangarD + 1.2), steelMat);
    roof.position.set(0, hangarH + 0.25, 0);
    this.skyIslandGroup.add(roof);

    // Front Entrance Neon Frame ("67 HANGAR")
    const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff2a85 });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(hangarW + 0.6, 0.35, 0.35), neonPinkMat);
    topBar.position.set(0, hangarH, hangarD / 2);
    this.skyIslandGroup.add(topBar);

    [-hangarW / 2, hangarW / 2].forEach((xSide) => {
      const postBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, hangarH, 0.35), neonCyanMat);
      postBar.position.set(xSide, hangarH / 2, hangarD / 2);
      this.skyIslandGroup.add(postBar);
    });

    // 3. Cozy Chill Zone Props inside the Hangar (Couch, Boombox pulsing to 67 beat, Lamp)
    const couchMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const couchBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 1.6), couchMat);
    couchBase.position.set(-3.8, 0.45, -4.5);
    this.skyIslandGroup.add(couchBase);
    const couchBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 0.45), couchMat);
    couchBack.position.set(-3.8, 0.95, -5.1);
    this.skyIslandGroup.add(couchBack);

    // Giant Boombox on the right side of the hangar
    this.hangarBoombox = new THREE.Group();
    this.hangarBoombox.position.set(4.2, 1.2, -4.4);
    const boxBody = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 })
    );
    this.hangarBoombox.add(boxBody);
    [-0.9, 0.9].forEach((sx) => {
      const speaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 1.26, 16),
        neonCyanMat
      );
      speaker.rotation.x = Math.PI / 2;
      speaker.position.set(sx, 0, 0);
      this.hangarBoombox.add(speaker);
    });
    this.skyIslandGroup.add(this.hangarBoombox);

    // Subtle vertical sky beacon beam below the island so players can spot it in the sky
    const beamGeo = new THREE.CylinderGeometry(0.35, 1.2, 34, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -17;
    this.skyIslandGroup.add(beam);

    this.scene.add(this.skyIslandGroup);
  }

  checkSkyHangar(heliPos, onEnter, onLeave) {
    const dist = heliPos.distanceTo(this.skyHangarPos);
    const insideNow = dist < 10.5 && heliPos.y > 28.0;
    if (insideNow && !this.isInsideSkyHangar) {
      this.isInsideSkyHangar = true;
      sound.start67MemeBeat();
      if (onEnter) onEnter();
    } else if (!insideNow && this.isInsideSkyHangar) {
      this.isInsideSkyHangar = false;
      sound.stop67MemeBeat();
      if (onLeave) onLeave();
    }
  }

  checkStarCollisions(heliPos, onStarCollected) {
    const collectRadius = 3.1;
    this.stars.forEach((star) => {
      if (!star.collected && heliPos.distanceTo(star.mesh.position) < collectRadius) {
        star.collected = true;
        this.collectedStarsCount++;
        sound.playStarCollect();
        star.mesh.scale.set(2.2, 2.2, 2.2);
        star.mesh.material.transparent = true;
        if (onStarCollected) {
          onStarCollected(this.collectedStarsCount, this.totalStars);
        }
      }
    });
  }

  getHelipadAt(pos, radius = 5.5) {
    for (const pad of this.helipads) {
      const pPos = pad.group.position;
      if (Math.hypot(pos.x - pPos.x, pos.z - pPos.z) < radius && pos.y < 14.0) {
        return pad.data;
      }
    }
    return null;
  }

  update(delta) {
    const time = performance.now() * 0.001;

    if (this.waterUniforms) {
      this.waterUniforms.uTime.value = time;
    }
    if (this.skyUniforms) {
      this.skyUniforms.uTime.value = time;
    }

    // Animate island shoreline foam rings
    this.shoreFoamRings.forEach((f) => {
      const s = 1.0 + Math.sin(time * 2.2 + f.phase) * 0.035;
      f.mesh.scale.set(s, s, 1);
      f.mesh.material.opacity = 0.38 + Math.sin(time * 2.2 + f.phase) * 0.22;
    });

    // Animate wind-swaying grass
    if (this.grassInstanced && this.grassTransforms) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.grassTransforms.length; i++) {
        const g = this.grassTransforms[i];
        dummy.position.set(g.x, 0.52, g.z);
        const sway = Math.sin(time * 2.8 + g.phase) * 0.18;
        dummy.rotation.set(sway, g.angle, sway * 0.5);
        dummy.scale.set(g.scale, g.scale, g.scale);
        dummy.updateMatrix();
        this.grassInstanced.setMatrixAt(i, dummy.matrix);
      }
      this.grassInstanced.instanceMatrix.needsUpdate = true;
    }

    // Animate Secret Sky Hangar boombox & subtle bob
    if (this.skyIslandGroup) {
      this.skyIslandGroup.position.y = this.skyHangarPos.y + Math.sin(time * 1.4) * 0.25;
    }
    if (this.hangarBoombox) {
      const beatPulse = this.isInsideSkyHangar ? (1.0 + Math.abs(Math.sin(time * 17.0)) * 0.22) : 1.0;
      this.hangarBoombox.scale.set(beatPulse, beatPulse, beatPulse);
    }

    this.turbines.forEach((t) => {
      t.rotor.rotation.z += t.speed * delta;
    });

    this.animatedLandmarks.forEach((fn) => fn(delta, time));

    this.stars.forEach((s) => {
      if (s.collected) {
        if (s.mesh.scale.x > 0.05) {
          s.mesh.scale.multiplyScalar(0.85);
          s.mesh.material.opacity = Math.max(0, s.mesh.material.opacity - 0.1);
        } else {
          s.mesh.visible = false;
        }
      } else {
        s.mesh.rotation.y += 2.2 * delta;
        s.mesh.position.y = s.initialY + Math.sin(time * 2.5 + s.id) * 0.35;
      }
    });

    this.clouds.forEach((c) => {
      c.group.position.x += c.speed * delta;
      if (c.group.position.x > 160) c.group.position.x = -160;
    });

    this.helipads.forEach((pad) => {
      pad.glowRing.material.opacity = 0.72 + Math.sin(time * 3.5) * 0.25;
    });
  }
}
