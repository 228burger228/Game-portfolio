import * as THREE from 'three';
import { sound } from './audio.js';

export class Helicopter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Physics & State
    this.position = new THREE.Vector3(0, 0.9, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');

    this.currentYaw = 0;
    this.currentPitch = 0;
    this.currentRoll = 0;

    this.rotorRpm = 0;
    this.maxRpm = 45;
    this.isLanded = true;
    this.currentPadId = 'hq';

    // Autopilot state
    this.isAutopilot = false;
    this.autopilotProgress = 0;
    this.autopilotPath = null;
    this.onAutopilotComplete = null;

    // Build 3D mesh
    this.buildModel();
    this.buildDownwashEffect();
    this.buildSearchlight();

    this.scene.add(this.group);
  }

  buildModel() {
    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Electric cyan
      roughness: 0.3,
      metalness: 0.2,
      flatShading: true
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Slate dark
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true
    });

    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange stripe
      roughness: 0.4,
      flatShading: true
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.9
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85
    });

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.4
    });

    // 1. Fuselage (Cabin)
    const cabinGeo = new THREE.CylinderGeometry(0.85, 0.7, 2.2, 8);
    cabinGeo.rotateX(Math.PI / 2);
    cabinGeo.scale(1.0, 0.85, 1.0);
    this.cabin = new THREE.Mesh(cabinGeo, bodyMat);
    this.cabin.castShadow = true;
    this.cabin.receiveShadow = true;
    this.cabin.position.set(0, 0.8, 0.2);
    this.group.add(this.cabin);

    // Front Nose Dome
    const noseGeo = new THREE.SphereGeometry(0.82, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.0, 0.82, 0.9);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 0.8, -0.9);
    nose.castShadow = true;
    this.group.add(nose);

    // Cockpit Windshield (Glass)
    const windowGeo = new THREE.CylinderGeometry(0.78, 0.78, 1.1, 8, 1, false, -Math.PI / 2, Math.PI);
    windowGeo.rotateX(Math.PI / 2);
    windowGeo.scale(0.98, 0.82, 0.85);
    const windshield = new THREE.Mesh(windowGeo, glassMat);
    windshield.position.set(0, 0.88, -0.5);
    this.group.add(windshield);

    // Body Stripe (Orange Accent)
    const stripeGeo = new THREE.BoxGeometry(1.72, 0.15, 1.8);
    const stripe = new THREE.Mesh(stripeGeo, orangeMat);
    stripe.position.set(0, 0.65, 0.2);
    this.group.add(stripe);

    // 2. Tail Boom
    const tailBoomGeo = new THREE.CylinderGeometry(0.2, 0.45, 3.2, 6);
    tailBoomGeo.rotateX(-Math.PI / 2);
    const tailBoom = new THREE.Mesh(tailBoomGeo, accentMat);
    tailBoom.castShadow = true;
    tailBoom.position.set(0, 0.85, 2.7);
    this.group.add(tailBoom);

    // Vertical Tail Fin
    const tailFinGeo = new THREE.BoxGeometry(0.12, 1.3, 0.75);
    const tailFin = new THREE.Mesh(tailFinGeo, bodyMat);
    tailFin.position.set(0, 1.25, 4.2);
    tailFin.rotation.x = -0.3;
    tailFin.castShadow = true;
    this.group.add(tailFin);

    // Horizontal Mini-Stablizers
    const tailWingGeo = new THREE.BoxGeometry(1.2, 0.08, 0.4);
    const tailWing = new THREE.Mesh(tailWingGeo, orangeMat);
    tailWing.position.set(0, 0.9, 4.0);
    this.group.add(tailWing);

    // 3. Landing Skids
    const skidGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
    skidGeo.rotateX(Math.PI / 2);

    // Left Skid
    const leftSkid = new THREE.Mesh(skidGeo, metalMat);
    leftSkid.position.set(-0.85, 0.08, 0.2);
    leftSkid.castShadow = true;
    this.group.add(leftSkid);

    // Right Skid
    const rightSkid = new THREE.Mesh(skidGeo, metalMat);
    rightSkid.position.set(0.85, 0.08, 0.2);
    rightSkid.castShadow = true;
    this.group.add(rightSkid);

    // Curved Skid Tips
    [-0.85, 0.85].forEach((xPos) => {
      const tipGeo = new THREE.TorusGeometry(0.22, 0.06, 6, 8, Math.PI / 2);
      tipGeo.rotateY(xPos > 0 ? 0 : Math.PI);
      const tip = new THREE.Mesh(tipGeo, metalMat);
      tip.position.set(xPos, 0.25, -1.1);
      this.group.add(tip);
    });

    // Skid Struts (Vertical supports)
    const strutGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
    [-0.75, 0.75].forEach((x) => {
      [-0.4, 0.8].forEach((z) => {
        const strut = new THREE.Mesh(strutGeo, metalMat);
        strut.position.set(x * 0.75, 0.45, z);
        strut.rotation.z = x > 0 ? -0.25 : 0.25;
        this.group.add(strut);
      });
    });

    // 4. Main Rotor Assembly
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const mast = new THREE.Mesh(mastGeo, metalMat);
    mast.position.set(0, 1.8, 0.1);
    this.group.add(mast);

    this.mainRotorGroup = new THREE.Group();
    this.mainRotorGroup.position.set(0, 2.1, 0.1);

    // Rotor Hub
    const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
    const hub = new THREE.Mesh(hubGeo, accentMat);
    this.mainRotorGroup.add(hub);

    // 3 Rotor Blades
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = angle;

      const bladeGeo = new THREE.BoxGeometry(0.24, 0.03, 3.2);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0, 0, 1.6);
      blade.castShadow = true;

      // Yellow blade tip
      const tipGeo = new THREE.BoxGeometry(0.24, 0.035, 0.35);
      const tip = new THREE.Mesh(tipGeo, orangeMat);
      tip.position.set(0, 0, 3.05);

      bladeArm.add(blade);
      bladeArm.add(tip);
      this.mainRotorGroup.add(bladeArm);
    }

    // Motion Blur Rotor Disc (fades in at high speed)
    const discGeo = new THREE.RingGeometry(0.3, 3.25, 32);
    discGeo.rotateX(Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.rotorDisc = new THREE.Mesh(discGeo, discMat);
    this.rotorDisc.position.set(0, 0.05, 0);
    this.mainRotorGroup.add(this.rotorDisc);

    this.group.add(this.mainRotorGroup);

    // 5. Tail Rotor Assembly
    this.tailRotorGroup = new THREE.Group();
    this.tailRotorGroup.position.set(0.18, 1.45, 4.3);

    const tailHubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 6);
    tailHubGeo.rotateZ(Math.PI / 2);
    const tailHub = new THREE.Mesh(tailHubGeo, metalMat);
    this.tailRotorGroup.add(tailHub);

    for (let i = 0; i < 2; i++) {
      const tailBladeGeo = new THREE.BoxGeometry(0.02, 0.8, 0.12);
      const tailBlade = new THREE.Mesh(tailBladeGeo, orangeMat);
      tailBlade.rotation.x = (i * Math.PI) / 2;
      this.tailRotorGroup.add(tailBlade);
    }
    this.group.add(this.tailRotorGroup);

    // 6. Navigation Lights
    // Red (Port / Left)
    const redLightGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const portLight = new THREE.Mesh(redLightGeo, redMat);
    portLight.position.set(-0.95, 0.7, 0.2);
    this.group.add(portLight);

    // Green (Starboard / Right)
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const stbdLight = new THREE.Mesh(redLightGeo, greenMat);
    stbdLight.position.set(0.95, 0.7, 0.2);
    this.group.add(stbdLight);

    // Flashing White Beacon on Top of Fin
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.beaconLight = new THREE.Mesh(redLightGeo, whiteMat);
    this.beaconLight.position.set(0, 1.95, 4.3);
    this.group.add(this.beaconLight);
  }

  buildSearchlight() {
    // Spotlight attached to nose of helicopter
    this.searchlight = new THREE.SpotLight(0xffffff, 4.5, 40, Math.PI / 5, 0.35, 1.5);
    this.searchlight.position.set(0, 0.5, -0.9);
    this.searchlight.target.position.set(0, -10, -15);

    this.group.add(this.searchlight);
    this.group.add(this.searchlight.target);

    // Visual cone lens
    const lensGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.15, 8);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.5, -0.9);
    this.group.add(lens);
  }

  buildDownwashEffect() {
    // Animated ring on ground showing wind particles/shockwaves from rotor
    const ringGeo = new THREE.RingGeometry(1.5, 4.2, 32);
    ringGeo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    this.downwashMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    this.downwashRing = new THREE.Mesh(ringGeo, this.downwashMat);
    this.downwashRing.position.set(0, 0.05, 0);
    this.scene.add(this.downwashRing);
  }

  startAutopilotFlight(fromPos, toPad, onComplete) {
    this.isAutopilot = true;
    this.autopilotProgress = 0;
    this.onAutopilotComplete = onComplete;
    this.isLanded = false;

    const start = fromPos.clone();
    const end = new THREE.Vector3(toPad.position.x, toPad.position.y + 0.5, toPad.position.z);
    const cruiseAlt = 15.0;

    // Create 3D flight trajectory curve (takeoff arc -> cruise -> landing descent)
    const mid1 = new THREE.Vector3(
      THREE.MathUtils.lerp(start.x, end.x, 0.25),
      Math.max(start.y, cruiseAlt),
      THREE.MathUtils.lerp(start.z, end.z, 0.25)
    );

    const mid2 = new THREE.Vector3(
      THREE.MathUtils.lerp(start.x, end.x, 0.75),
      Math.max(end.y, cruiseAlt),
      THREE.MathUtils.lerp(start.z, end.z, 0.75)
    );

    this.autopilotCurve = new THREE.CubicBezierCurve3(start, mid1, mid2, end);
    this.autopilotTotalDist = start.distanceTo(end);
    // Flight time proportional to distance (approx 2.5 - 4.5 seconds)
    this.autopilotDuration = Math.max(2.8, Math.min(5.2, this.autopilotTotalDist * 0.06 + 2.2));
  }

  cancelAutopilot() {
    if (this.isAutopilot) {
      this.isAutopilot = false;
      this.autopilotCurve = null;
    }
  }

  update(delta, input) {
    const time = performance.now() * 0.001;

    // 1. Beacon strobe light (flashes every 1 sec)
    if (this.beaconLight) {
      this.beaconLight.material.color.setHex((Math.floor(time * 3) % 2 === 0) ? 0xffffff : 0x222222);
    }

    // 2. Autopilot Mode Progression
    if (this.isAutopilot && this.autopilotCurve) {
      this.autopilotProgress += delta / this.autopilotDuration;

      // Desired rotor speed
      this.rotorRpm = THREE.MathUtils.lerp(this.rotorRpm, this.maxRpm, delta * 3.5);

      if (this.autopilotProgress >= 1.0) {
        // Arrived at destination pad!
        this.autopilotProgress = 1.0;
        this.isAutopilot = false;
        this.position.copy(this.autopilotCurve.getPoint(1.0));
        this.isLanded = true;
        this.velocity.set(0, 0, 0);

        sound.playLanding();

        if (this.onAutopilotComplete) {
          this.onAutopilotComplete();
        }
      } else {
        // Smooth easing in and out (smoothstep)
        const t = THREE.MathUtils.smoothstep(this.autopilotProgress, 0, 1);
        const currentPt = this.autopilotCurve.getPoint(t);
        const nextPt = this.autopilotCurve.getPoint(Math.min(1.0, t + 0.02));

        this.position.copy(currentPt);

        // Direction & banking towards path
        const dir = nextPt.clone().sub(currentPt).normalize();
        if (dir.lengthSq() > 0.0001) {
          const targetHeading = Math.atan2(-dir.x, -dir.z);
          // Angle interpolation
          let angleDiff = targetHeading - this.currentYaw;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          this.currentYaw += angleDiff * delta * 4.0;

          // Banking (roll) based on turn rate
          const bankTarget = -angleDiff * 1.5;
          this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, bankTarget, delta * 5.0);

          // Forward pitch based on speed/cruise
          const isCruise = (t > 0.15 && t < 0.85);
          const pitchTarget = isCruise ? 0.28 : 0.05;
          this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, pitchTarget, delta * 4.0);
        }
      }
    } else {
      // 3. Manual Flight Physics
      this.updateManualFlight(delta, input);
    }

    // 4. Rotor Blade Spinning & Disc Blur
    this.mainRotorGroup.rotation.y += this.rotorRpm * delta;
    this.tailRotorGroup.rotation.x += this.rotorRpm * delta * 1.4;

    const blurOpacity = THREE.MathUtils.smoothstep(this.rotorRpm, 15, this.maxRpm) * 0.45;
    this.rotorDisc.material.opacity = blurOpacity;

    // 5. Apply helicopter transform
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.currentYaw);
    this.group.rotateX(this.currentPitch);
    this.group.rotateZ(this.currentRoll);

    // 6. Update Ground Downwash Effect
    if (this.downwashRing) {
      this.downwashRing.position.set(this.position.x, 0.08, this.position.z);
      // More intense when low to ground
      const altitude = Math.max(0.1, this.position.y);
      const intensity = Math.max(0, 1 - altitude / 12) * (this.rotorRpm / this.maxRpm);
      this.downwashMat.opacity = intensity * 0.65;
      const pulse = 1.0 + Math.sin(time * 18) * 0.08;
      this.downwashRing.scale.set(pulse, pulse, pulse);
    }

    // 7. Update procedural sound
    const speed = this.velocity.length();
    sound.updateRotorSound(this.rotorRpm / this.maxRpm * (1.0 + speed * 0.05), this.position.y);
  }

  updateManualFlight(delta, input) {
    const isMovingForward = input.forward;
    const isMovingBack = input.back;
    const isTurningLeft = input.left;
    const isTurningRight = input.right;
    const isAscending = input.up;
    const isDescending = input.down;

    // Check if player took manual control
    if (isMovingForward || isMovingBack || isTurningLeft || isTurningRight || isAscending || isDescending) {
      this.isLanded = false;
      this.rotorRpm = THREE.MathUtils.lerp(this.rotorRpm, this.maxRpm, delta * 3.5);
    }

    // Turn (Yaw)
    const turnSpeed = 2.4;
    let turnInput = 0;
    if (isTurningLeft) turnInput += 1;
    if (isTurningRight) turnInput -= 1;
    this.currentYaw += turnInput * turnSpeed * delta;

    // Banking Roll based on turning
    const targetRoll = -turnInput * 0.35;
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, delta * 5.0);

    // Forward Thrust & Pitch
    const forwardVec = new THREE.Vector3(
      -Math.sin(this.currentYaw),
      0,
      -Math.cos(this.currentYaw)
    );

    let throttle = 0;
    if (isMovingForward) throttle += 1;
    if (isMovingBack) throttle -= 0.6;

    const acceleration = 35.0;
    if (throttle !== 0) {
      this.velocity.addScaledVector(forwardVec, throttle * acceleration * delta);
    }

    // Forward pitch tilt
    const targetPitch = throttle * 0.32;
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, delta * 4.0);

    // Vertical Thrust (Altitude)
    let vertThrottle = 0;
    if (isAscending) vertThrottle += 1;
    if (isDescending) vertThrottle -= 1;

    // Natural hover altitude
    const hoverBaseY = 4.5;
    if (!this.isLanded && vertThrottle === 0) {
      // Gentle spring towards comfortable cruise altitude
      const dy = hoverBaseY - this.position.y;
      this.velocity.y += dy * 2.5 * delta;
    } else {
      this.velocity.y += vertThrottle * 22.0 * delta;
    }

    // Drag & Damping
    this.velocity.x *= Math.pow(0.92, delta * 60);
    this.velocity.z *= Math.pow(0.92, delta * 60);
    this.velocity.y *= Math.pow(0.90, delta * 60);

    // Speed Cap
    const maxSpeed = input.turbo ? 40.0 : 25.0;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    // Apply movement
    this.position.addScaledVector(this.velocity, delta);

    // Ground Collision & Landing
    const groundFloor = 0.9;
    if (this.position.y < groundFloor) {
      this.position.y = groundFloor;
      if (this.velocity.y < -0.5) {
        sound.playLanding();
      }
      this.velocity.y = 0;
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;

      if (this.velocity.length() < 0.2 && !isMovingForward && !isAscending) {
        this.isLanded = true;
        this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, 0, delta * 6);
        this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, 0, delta * 6);
      }
    }

    // Subtle gentle idle hover bobbing when in air
    if (!this.isLanded && Math.abs(this.velocity.y) < 0.2) {
      this.position.y += Math.sin(performance.now() * 0.003) * 0.008;
    }
  }

  teleportTo(pos) {
    this.position.set(pos.x, pos.y + 0.8, pos.z);
    this.velocity.set(0, 0, 0);
    this.currentPitch = 0;
    this.currentRoll = 0;
    this.isLanded = true;
    this.rotorRpm = 10;
  }
}
