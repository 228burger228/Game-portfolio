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
  }

  buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.25);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1e6, 2.6);
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

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.85);
    this.scene.add(this.hemiLight);
  }

  buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(420, 32, 24);
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color(0x0284c7) },
      uHorizonColor: { value: new THREE.Color(0x7dd3fc) },
      uBottomColor: { value: new THREE.Color(0x0c4a6e) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.45, -0.65).normalize() },
      uSunColor: { value: new THREE.Color(0xfff7ed) },
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
          vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.55));
          if (dir.y < 0.0) {
            col = mix(uHorizonColor, uBottomColor, clamp(-dir.y * 3.0, 0.0, 1.0));
          }

          // Sun disk & atmospheric Mie glow
          float sunAmt = max(dot(dir, uSunDir), 0.0);
          col += uSunColor * pow(sunAmt, 12.0) * 0.45;
          col += uSunColor * smoothstep(0.996, 0.9995, sunAmt) * 2.2;

          // Subtle stars at Sunset / Night
          if (uStarIntensity > 0.01 && dir.y > 0.05) {
            float s = hash(floor(dir * 260.0));
            if (s > 0.994) {
              float twinkle = 0.55 + 0.45 * sin(uTime * 3.0 + s * 100.0);
              col += vec3(0.9, 0.95, 1.0) * twinkle * uStarIntensity * smoothstep(0.05, 0.35, dir.y);
            }
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  // Supports boolean or 4-mode index (0: Day, 1: Genshin Sunset, 2: Rust Fog Dawn, 3: Cyber Night)
  setNightMode(modeOrBool) {
    const mode = typeof modeOrBool === 'boolean' ? (modeOrBool ? 3 : 0) : (modeOrBool % 4);
    if (mode === 0) {
      // 0: Genshin Azure Day
      this.scene.fog.color.setHex(0x67e8f9);
      this.scene.fog.density = 0.0042;
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 1.25;
      this.sunLight.color.setHex(0xfff7ed);
      this.sunLight.intensity = 2.6;
      this.hemiLight.intensity = 0.85;
      this.skyUniforms.uTopColor.value.setHex(0x0284c7);
      this.skyUniforms.uHorizonColor.value.setHex(0x7dd3fc);
      this.skyUniforms.uSunColor.value.setHex(0xfff7ed);
      this.skyUniforms.uSunDir.value.set(0.55, 0.45, -0.65).normalize();
      this.skyUniforms.uStarIntensity.value = 0.0;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x083344);
        this.waterUniforms.uShallowColor.value.setHex(0x06b6d4);
        this.waterUniforms.uSunColor.value.setHex(0xfef08a);
      }
    } else if (mode === 1) {
      // 1: Genshin Golden Sunset
      this.scene.fog.color.setHex(0xfb923c);
      this.scene.fog.density = 0.0052;
      this.ambientLight.color.setHex(0xfed7aa);
      this.ambientLight.intensity = 1.05;
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 2.9;
      this.hemiLight.intensity = 0.75;
      this.skyUniforms.uTopColor.value.setHex(0x3b0764);
      this.skyUniforms.uHorizonColor.value.setHex(0xfb923c);
      this.skyUniforms.uSunColor.value.setHex(0xfde047);
      this.skyUniforms.uSunDir.value.set(0.65, 0.16, -0.72).normalize();
      this.skyUniforms.uStarIntensity.value = 0.35;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x1e1b4b);
        this.waterUniforms.uShallowColor.value.setHex(0x0e7490);
        this.waterUniforms.uSunColor.value.setHex(0xfb923c);
      }
    } else if (mode === 2) {
      // 2: Rust Tactical Misty Dawn
      this.scene.fog.color.setHex(0x94a3b8);
      this.scene.fog.density = 0.0075;
      this.ambientLight.color.setHex(0xcbd5e1);
      this.ambientLight.intensity = 0.95;
      this.sunLight.color.setHex(0xfde68a);
      this.sunLight.intensity = 1.95;
      this.hemiLight.intensity = 0.65;
      this.skyUniforms.uTopColor.value.setHex(0x334155);
      this.skyUniforms.uHorizonColor.value.setHex(0x94a3b8);
      this.skyUniforms.uSunColor.value.setHex(0xfde68a);
      this.skyUniforms.uSunDir.value.set(-0.55, 0.22, -0.65).normalize();
      this.skyUniforms.uStarIntensity.value = 0.0;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x0f172a);
        this.waterUniforms.uShallowColor.value.setHex(0x155e75);
        this.waterUniforms.uSunColor.value.setHex(0xfde68a);
      }
    } else {
      // 3: Cyber Neon Night
      this.scene.fog.color.setHex(0x060b16);
      this.scene.fog.density = 0.0048;
      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.52;
      this.sunLight.color.setHex(0x818cf8);
      this.sunLight.intensity = 1.15;
      this.hemiLight.intensity = 0.4;
      this.skyUniforms.uTopColor.value.setHex(0x020617);
      this.skyUniforms.uHorizonColor.value.setHex(0x0f172a);
      this.skyUniforms.uSunColor.value.setHex(0x38bdf8);
      this.skyUniforms.uSunDir.value.set(0.3, 0.35, -0.85).normalize();
      this.skyUniforms.uStarIntensity.value = 1.0;
      if (this.waterUniforms) {
        this.waterUniforms.uDeepColor.value.setHex(0x020617);
        this.waterUniforms.uShallowColor.value.setHex(0x0369a1);
        this.waterUniforms.uSunColor.value.setHex(0x38bdf8);
      }
    }
  }

  buildTerrain() {
    // 1. Custom GLSL Ocean Water Shader (Gerstner Waves + Fresnel + Specular Sun Trail + Foam)
    const waterGeo = new THREE.PlaneGeometry(520, 520, 128, 128);
    waterGeo.rotateX(-Math.PI / 2);

    this.waterUniforms = {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x083344) },
      uShallowColor: { value: new THREE.Color(0x06b6d4) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.45, -0.65).normalize() },
      uSunColor: { value: new THREE.Color(0xfef08a) }
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
          float w1 = sin(pos.x * 0.08 + uTime * 1.6) * cos(pos.z * 0.07 + uTime * 1.3) * 0.38;
          float w2 = sin((pos.x * 0.14 - pos.z * 0.11) + uTime * 2.3) * 0.18;
          float w3 = cos(pos.z * 0.22 + uTime * 2.9) * 0.08;
          pos.y += w1 + w2 + w3;
          vWaveHeight = w1 + w2 + w3;

          // Approximate wave normal
          float dx = cos(pos.x * 0.08 + uTime * 1.6) * 0.08 * 0.38 + cos((pos.x * 0.14 - pos.z * 0.11) + uTime * 2.3) * 0.14 * 0.18;
          float dz = -sin(pos.z * 0.07 + uTime * 1.3) * 0.07 * 0.38 - cos((pos.x * 0.14 - pos.z * 0.11) + uTime * 2.3) * 0.11 * 0.18;
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

          // Fresnel reflection factor
          float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);
          vec3 waterCol = mix(uShallowColor, uDeepColor, clamp(fresnel * 0.85 + 0.15, 0.0, 1.0));

          // Wave crest turquoise highlight & subtle whitecap foam
          float crest = smoothstep(0.22, 0.58, vWaveHeight);
          waterCol = mix(waterCol, vec3(0.75, 0.96, 1.0), crest * 0.32);

          // Subtle grid/caustic shimmer
          float caustic = sin(vWorldPos.x * 0.45 + uTime * 2.0) * sin(vWorldPos.z * 0.45 - uTime * 1.7);
          waterCol += vec3(0.04, 0.12, 0.16) * smoothstep(0.65, 0.98, caustic);

          // Specular Sun Glitter Trail
          vec3 halfVec = normalize(uSunDir + viewDir);
          float spec = pow(max(dot(norm, halfVec), 0.0), 96.0);
          waterCol += uSunColor * spec * 1.35;

          // Distance atmospheric fade
          float dist = length(vWorldPos.xz);
          float edgeFade = smoothstep(250.0, 140.0, dist);

          gl_FragColor = vec4(waterCol, 0.92 * edgeFade);
        }
      `
    });

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -1.05;
    this.scene.add(water);

    // 2. Sculpted Multi-Layered Islands (Genshin Stylized Emerald Grass + Craggy Rock Cliffs + Shoreline Foam)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.68,
      metalness: 0.05,
      flatShading: true
    });

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.82,
      flatShading: true
    });

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.12,
      flatShading: true
    });

    const foamRingMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    HELIPADS.forEach((pad, idx) => {
      const isHQ = pad.id === 'hq';
      const radius = isHQ ? 22 : 16.5;

      const islandGroup = new THREE.Group();
      islandGroup.position.set(pad.position.x, 0, pad.position.z);

      // Top emerald grass plateau
      const topGeo = new THREE.CylinderGeometry(radius, radius * 1.07, 1.05, 18);
      const topMesh = new THREE.Mesh(topGeo, grassMat);
      topMesh.position.y = 0.05;
      topMesh.receiveShadow = true;
      topMesh.castShadow = true;
      islandGroup.add(topMesh);

      // Sand beach rim
      const sandGeo = new THREE.CylinderGeometry(radius * 1.08, radius * 1.19, 0.78, 18);
      const sandMesh = new THREE.Mesh(sandGeo, sandMat);
      sandMesh.position.y = -0.38;
      sandMesh.receiveShadow = true;
      islandGroup.add(sandMesh);

      // Sculpted craggy rock cliffs underneath (vertex-displaced for organic cliff facets)
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

      // Coastal rock boulders around perimeter
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

      // Animated Shoreline Foam Ring in the water around each island
      const foamGeo = new THREE.RingGeometry(radius * 1.14, radius * 1.27, 32);
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
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.45,
      flatShading: true
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

      const vFrom = new THREE.Vector3(from.position.x, 0.2, from.position.z);
      const vTo = new THREE.Vector3(to.position.x, 0.2, to.position.z);
      const dist = vFrom.distanceTo(vTo);
      const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);

      const bridgeGeo = new THREE.BoxGeometry(3.6, 0.36, dist);
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.copy(mid);
      bridge.lookAt(vTo);
      bridge.receiveShadow = true;
      this.scene.add(bridge);

      const lineGeo = new THREE.BoxGeometry(0.26, 0.39, dist * 0.9);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.copy(mid);
      line.lookAt(vTo);
      this.scene.add(line);
    });
  }

  buildHelipadsAndLandmarks() {
    HELIPADS.forEach((padData) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(padData.position.x, padData.position.y, padData.position.z);

      // 1. Armored Octagonal Landing Deck
      const deckOuterGeo = new THREE.CylinderGeometry(6.2, 6.8, 0.42, 8);
      const deckOuterMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.45,
        metalness: 0.35
      });
      const deckOuter = new THREE.Mesh(deckOuterGeo, deckOuterMat);
      deckOuter.receiveShadow = true;
      deckOuter.castShadow = true;
      padGroup.add(deckOuter);

      // Inner Elevated Pad Surface
      const deckInnerGeo = new THREE.CylinderGeometry(5.3, 5.5, 0.48, 16);
      const deckInnerMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5
      });
      const deckInner = new THREE.Mesh(deckInnerGeo, deckInnerMat);
      deckInner.receiveShadow = true;
      padGroup.add(deckInner);

      // 2. High-Visibility Hazard Border Ring
      const borderGeo = new THREE.RingGeometry(4.85, 5.25, 32);
      borderGeo.rotateX(-Math.PI / 2);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide
      });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.y = 0.25;
      padGroup.add(border);

      // 3. Glowing Theme Neon Ring
      const glowGeo = new THREE.RingGeometry(3.6, 4.15, 32);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: padData.accentGlow,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const glowRing = new THREE.Mesh(glowGeo, glowMat);
      glowRing.position.y = 0.26;
      padGroup.add(glowRing);

      // 4. Center H Marking
      const hMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 2.5), hMat);
      hLeft.position.set(-0.75, 0.26, 0);
      padGroup.add(hLeft);

      const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 2.5), hMat);
      hRight.position.set(0.75, 0.26, 0);
      padGroup.add(hRight);

      const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.38), hMat);
      hCross.position.set(0, 0.26, 0);
      padGroup.add(hCross);

      // 5. 4 Corner Illuminated Tactical Pylons
      [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([lx, lz]) => {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.85, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x334155 })
        );
        post.position.set(lx, 0.42, lz);
        post.castShadow = true;
        padGroup.add(post);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: padData.accentGlow })
        );
        bulb.position.set(lx, 0.92, lz);
        padGroup.add(bulb);
      });

      // 6. Crisp Floating 3D Station Signboard
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 640;
      bannerCanvas.height = 180;
      const bCtx = bannerCanvas.getContext('2d');

      // Dark glass background
      bCtx.fillStyle = 'rgba(9, 9, 11, 0.92)';
      bCtx.beginPath();
      bCtx.roundRect(8, 8, 624, 164, 24);
      bCtx.fill();

      bCtx.lineWidth = 5;
      bCtx.strokeStyle = padData.color;
      bCtx.stroke();

      // Top badge line
      bCtx.font = '600 24px Inter, sans-serif';
      bCtx.fillStyle = padData.color;
      bCtx.textAlign = 'center';
      bCtx.fillText(`ЛОКАЦИЯ ${padData.number} · ${padData.badge.toUpperCase()}`, 320, 48);

      // Main Title
      bCtx.font = 'bold 44px Inter, sans-serif';
      bCtx.fillStyle = '#ffffff';
      bCtx.fillText(`${padData.emoji} ${padData.shortTitle}`, 320, 105);

      // Subtitle hint
      bCtx.font = '500 20px Inter, sans-serif';
      bCtx.fillStyle = '#94a3b8';
      bCtx.fillText(padData.category, 320, 145);

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
      color: 0x78350f,
      roughness: 0.9,
      flatShading: true
    });
    const foliageColors = [0x15803d, 0x16a34a, 0x059669];

    HELIPADS.forEach((pad, idx) => {
      const treeCount = pad.id === 'hq' ? 10 : 6;
      for (let i = 0; i < treeCount; i++) {
        // Place trees along the left/back perimeter away from the landmark and pad
        const angle = (i / treeCount) * Math.PI * 1.3 + 1.2;
        const dist = 8.8 + (i % 3) * 2.2;
        const tx = pad.position.x + Math.cos(angle) * dist;
        const tz = pad.position.z + Math.sin(angle) * dist;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0.5, tz);
        const s = 0.75 + ((i + idx) % 3) * 0.2;
        treeGroup.scale.set(s, s, s);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 6), trunkMat);
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliageMat = new THREE.MeshStandardMaterial({
          color: foliageColors[(i + idx) % foliageColors.length],
          roughness: 0.7,
          flatShading: true
        });

        for (let j = 0; j < 3; j++) {
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(1.25 - j * 0.26, 1.2 - j * 0.12, 6),
            foliageMat
          );
          cone.position.y = 1.3 + j * 0.65;
          cone.castShadow = true;
          treeGroup.add(cone);
        }

        this.scene.add(treeGroup);
      }
    });
  }

  buildSwayingGrass() {
    // Genshin-style wind-swaying grass blades across all islands using InstancedMesh
    const bladeGeo = new THREE.ConeGeometry(0.14, 0.75, 4);
    bladeGeo.translate(0, 0.35, 0);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.6,
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
    const turbinePositions = [
      { x: -62, z: -5 },
      { x: 62, z: -5 },
      { x: 0, z: -78 }
    ];

    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    turbinePositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 18, 8), towerMat);
      tower.position.y = 9;
      tower.castShadow = true;
      group.add(tower);

      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 2.5), towerMat);
      nacelle.position.set(0, 18, 0);
      group.add(nacelle);

      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 18, -1.3);

      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.ConeGeometry(0.35, 7.5, 4);
        bladeGeo.rotateZ((b * Math.PI * 2) / 3);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = Math.cos((b * Math.PI * 2) / 3) * 3.5;
        blade.position.x = -Math.sin((b * Math.PI * 2) / 3) * 3.5;
        rotorGroup.add(blade);
      }

      group.add(rotorGroup);
      this.scene.add(group);

      this.turbines.push({ rotor: rotorGroup, speed: 1.0 });
    });
  }

  buildCollectibleStars() {
    const starGeo = new THREE.OctahedronGeometry(0.95, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65
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
      color: 0xffffff,
      roughness: 0.85,
      flatShading: true,
      transparent: true,
      opacity: 0.86
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
    ctx.fillText('🎵 NOW PLAYING: 67 MEME BEAT · BURGERDOM6 VIP CHILL ZONE 🍔', 512, 468);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
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
