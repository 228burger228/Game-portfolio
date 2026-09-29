import * as THREE from 'three';
import { sound } from './audio.js';

export class Helicopter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Physics & State
    this.position = new THREE.Vector3(0, 0.85, 0);
    this.velocity = new THREE.Vector3();
    this.currentYaw = 0;
    this.currentPitch = 0;
    this.currentRoll = 0;

    this.rotorRpm = 22;
    this.maxRpm = 52;
    this.isLanded = true;
    this.currentPadId = 'hq';

    // Autopilot state
    this.isAutopilot = false;
    this.autopilotProgress = 0;
    this.autopilotCurve = null;
    this.onAutopilotComplete = null;

    this.buildCombatModel();
    this.buildDownwashEffect();
    this.buildSearchlight();

    this.scene.add(this.group);
  }

  buildCombatModel() {
    // Materials matching the attached Red Combat Helicopter (Haymaker / Tiger / Apache style)
    const redArmorMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Tactical Crimson Red
      roughness: 0.32,
      metalness: 0.25,
      flatShading: true
    });

    const darkRedMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true
    });

    const gunmetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark gunmetal armor & weapons
      roughness: 0.35,
      metalness: 0.65,
      flatShading: true
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.8
    });

    const whiteCowlingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // White engine nacelle cowling & fin tips
      roughness: 0.3,
      metalness: 0.15,
      flatShading: true
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.78,
      reflectivity: 0.95
    });

    const seatMat = new THREE.MeshStandardMaterial({
      color: 0xb4825a, // Tan tactical seats visible inside cockpit
      roughness: 0.7
    });

    const goldStripeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.4
    });

    const blueStripeMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85
    });

    // ─── 1. CORE FUSELAGE (Angular Faceted Combat Hull) ───
    const lowerHullGeo = new THREE.BoxGeometry(1.15, 0.62, 3.0);
    const lowerHull = new THREE.Mesh(lowerHullGeo, redArmorMat);
    lowerHull.position.set(0, 0.72, -0.1);
    lowerHull.castShadow = true;
    lowerHull.receiveShadow = true;
    this.group.add(lowerHull);

    // Side Sloped Chines (Faceted armor plates along left & right sides)
    [-0.62, 0.62].forEach((xPos) => {
      const chineGeo = new THREE.BoxGeometry(0.18, 0.48, 2.7);
      const chine = new THREE.Mesh(chineGeo, darkRedMat);
      chine.position.set(xPos, 0.68, -0.1);
      chine.rotation.z = xPos > 0 ? 0.22 : -0.22;
      chine.castShadow = true;
      this.group.add(chine);
    });

    // Tapered Nose Section (Front -Z)
    const noseUpperGeo = new THREE.BoxGeometry(0.95, 0.52, 1.15);
    const noseUpper = new THREE.Mesh(noseUpperGeo, redArmorMat);
    noseUpper.position.set(0, 0.68, -1.9);
    noseUpper.rotation.x = 0.18;
    noseUpper.castShadow = true;
    this.group.add(noseUpper);

    const noseTipGeo = new THREE.ConeGeometry(0.48, 0.85, 4);
    noseTipGeo.rotateY(Math.PI / 4);
    noseTipGeo.rotateX(-Math.PI / 2);
    noseTipGeo.scale(1.1, 0.7, 1.0);
    const noseTip = new THREE.Mesh(noseTipGeo, redArmorMat);
    noseTip.position.set(0, 0.58, -2.7);
    noseTip.castShadow = true;
    this.group.add(noseTip);

    // Nose Optical Sensors (Dual front lenses)
    [-0.18, 0.18].forEach((xPos) => {
      const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const eye = new THREE.Mesh(eyeGeo, darkSteelMat);
      eye.position.set(xPos, 0.58, -2.98);
      this.group.add(eye);
    });

    // Gold emblem plaques on nose sides
    [-0.49, 0.49].forEach((xPos) => {
      const decalGeo = new THREE.BoxGeometry(0.04, 0.22, 0.28);
      const decal = new THREE.Mesh(decalGeo, goldStripeMat);
      decal.position.set(xPos, 0.68, -1.95);
      this.group.add(decal);
    });

    // ─── 2. CHIN FLIR TURRET & AUTOCANNON (Under Nose) ───
    const flirBallGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.34, 8);
    const flirBall = new THREE.Mesh(flirBallGeo, whiteCowlingMat);
    flirBall.position.set(0, 0.34, -2.15);
    this.group.add(flirBall);

    const gunMountGeo = new THREE.BoxGeometry(0.28, 0.18, 0.45);
    const gunMount = new THREE.Mesh(gunMountGeo, redArmorMat);
    gunMount.position.set(0, 0.30, -2.45);
    this.group.add(gunMount);

    // Long Autocannon Barrel extending forward
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.35, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, darkSteelMat);
    barrel.position.set(0, 0.28, -3.15);
    barrel.castShadow = true;
    this.group.add(barrel);

    // Muzzle brake on tip of cannon
    const muzzleGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.18, 8);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, gunmetalMat);
    muzzle.position.set(0, 0.28, -3.82);
    this.group.add(muzzle);

    // ─── 3. STEPPED TANDEM ARMORED COCKPIT (Gunner Front + Pilot Rear) ───
    // Front Gunner Canopy
    const frontCanopyGeo = new THREE.BoxGeometry(0.84, 0.48, 0.95);
    const frontCanopy = new THREE.Mesh(frontCanopyGeo, glassMat);
    frontCanopy.position.set(0, 1.12, -1.1);
    frontCanopy.rotation.x = 0.22;
    this.group.add(frontCanopy);

    // Front Seat
    const frontSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.35), seatMat);
    frontSeat.position.set(0, 1.05, -0.95);
    this.group.add(frontSeat);

    // Rear Elevated Pilot Canopy
    const rearCanopyGeo = new THREE.BoxGeometry(0.88, 0.56, 1.05);
    const rearCanopy = new THREE.Mesh(rearCanopyGeo, glassMat);
    rearCanopy.position.set(0, 1.32, -0.2);
    rearCanopy.rotation.x = 0.12;
    this.group.add(rearCanopy);

    // Rear Pilot Seat
    const rearSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.46, 0.35), seatMat);
    rearSeat.position.set(0, 1.25, -0.15);
    this.group.add(rearSeat);

    // Armored Canopy Frames (Dark gunmetal bars)
    const frameBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.06, 0.06), gunmetalMat);
    frameBar1.position.set(0, 1.32, -0.68);
    this.group.add(frameBar1);

    const frameBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.06), gunmetalMat);
    frameBar2.position.set(0, 1.56, 0.22);
    this.group.add(frameBar2);

    // ─── 4. UPPER MAST HOUSING & TWIN TURBOSHAFT ENGINES ───
    const mastSpineGeo = new THREE.BoxGeometry(0.86, 0.58, 1.55);
    const mastSpine = new THREE.Mesh(mastSpineGeo, redArmorMat);
    mastSpine.position.set(0, 1.48, 0.85);
    mastSpine.castShadow = true;
    this.group.add(mastSpine);

    // Top Forward Radar/Sensor Box under rotor
    const topSensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.72), redArmorMat);
    topSensorBox.position.set(0, 1.82, 0.35);
    this.group.add(topSensorBox);

    // Twin Engine Nacelles (Left & Right with White Rear Cowlings like in the photo)
    [-0.58, 0.58].forEach((xPos) => {
      // Front Red Intake Housing
      const intakeGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.65, 8);
      intakeGeo.rotateX(Math.PI / 2);
      const intake = new THREE.Mesh(intakeGeo, redArmorMat);
      intake.position.set(xPos, 1.38, 0.45);
      intake.castShadow = true;
      this.group.add(intake);

      // Dark Intake Grille
      const grilleGeo = new THREE.CircleGeometry(0.23, 8);
      const grille = new THREE.Mesh(grilleGeo, darkSteelMat);
      grille.position.set(xPos, 1.38, 0.12);
      grille.rotation.y = Math.PI;
      this.group.add(grille);

      // White Rear Engine Cowling (Distinctive feature from photo)
      const whiteCowlGeo = new THREE.CylinderGeometry(0.27, 0.23, 0.75, 8);
      whiteCowlGeo.rotateX(Math.PI / 2);
      const whiteCowl = new THREE.Mesh(whiteCowlGeo, whiteCowlingMat);
      whiteCowl.position.set(xPos, 1.38, 1.1);
      whiteCowl.castShadow = true;
      this.group.add(whiteCowl);

      // Exhaust Nozzle
      const exhaustGeo = new THREE.CylinderGeometry(0.16, 0.20, 0.35, 8);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaust = new THREE.Mesh(exhaustGeo, darkSteelMat);
      exhaust.position.set(xPos, 1.42, 1.55);
      this.group.add(exhaust);
    });

    // ─── 5. STUB WINGS & WEAPON PYLONS (4-Tube Missile Pods + Rocket Pods) ───
    [-1, 1].forEach((side) => {
      // Stub Wing
      const wingGeo = new THREE.BoxGeometry(1.35, 0.14, 0.68);
      const wing = new THREE.Mesh(wingGeo, whiteCowlingMat);
      wing.position.set(side * 1.15, 0.96, 0.25);
      wing.rotation.z = -side * 0.08;
      wing.castShadow = true;
      this.group.add(wing);

      // Wingtip Pylon
      const tipFinGeo = new THREE.BoxGeometry(0.10, 0.26, 0.65);
      const tipFin = new THREE.Mesh(tipFinGeo, redArmorMat);
      tipFin.position.set(side * 1.78, 0.86, 0.25);
      this.group.add(tipFin);

      // Outer Weapon: 4-Tube Rectangular ATGM Missile Box (Just like in photo!)
      const missileBoxGeo = new THREE.BoxGeometry(0.46, 0.46, 1.18);
      const missileBox = new THREE.Mesh(missileBoxGeo, gunmetalMat);
      missileBox.position.set(side * 1.58, 0.62, 0.22);
      missileBox.castShadow = true;
      this.group.add(missileBox);

      // 4 Missile Warheads inside the box front
      [-0.11, 0.11].forEach((mx) => {
        [-0.11, 0.11].forEach((my) => {
          const tubeGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.22, 8);
          tubeGeo.rotateX(Math.PI / 2);
          const tube = new THREE.Mesh(tubeGeo, whiteCowlingMat);
          tube.position.set(side * 1.58 + mx, 0.62 + my, 0.22);
          this.group.add(tube);
        });
      });

      // Inner Weapon: Cylindrical Rocket Pod / Drop Tank with Nose Cone
      const podGroup = new THREE.Group();
      podGroup.position.set(side * 1.02, 0.62, 0.15);

      const podBodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.25, 10);
      podBodyGeo.rotateX(Math.PI / 2);
      const podBody = new THREE.Mesh(podBodyGeo, darkSteelMat);
      podBody.castShadow = true;
      podGroup.add(podBody);

      const podNoseGeo = new THREE.ConeGeometry(0.18, 0.45, 10);
      podNoseGeo.rotateX(-Math.PI / 2);
      const podNose = new THREE.Mesh(podNoseGeo, darkSteelMat);
      podNose.position.set(0, 0, -0.85);
      podGroup.add(podNose);

      this.group.add(podGroup);
    });

    // ─── 6. TAIL BOOM, BAND STRIPES & H-STABILIZER ───
    const tailBoomGeo = new THREE.CylinderGeometry(0.22, 0.46, 2.9, 6);
    tailBoomGeo.rotateX(-Math.PI / 2);
    const tailBoom = new THREE.Mesh(tailBoomGeo, redArmorMat);
    tailBoom.position.set(0, 1.08, 2.75);
    tailBoom.castShadow = true;
    this.group.add(tailBoom);

    // Tactical Blue & Gold Stripes on Tail Boom (as in photo)
    const blueBandGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.35, 6);
    blueBandGeo.rotateX(-Math.PI / 2);
    const blueBand = new THREE.Mesh(blueBandGeo, blueStripeMat);
    blueBand.position.set(0, 1.08, 2.55);
    this.group.add(blueBand);

    const goldBandGeo = new THREE.CylinderGeometry(0.29, 0.32, 0.28, 6);
    goldBandGeo.rotateX(-Math.PI / 2);
    const goldBand = new THREE.Mesh(goldBandGeo, goldStripeMat);
    goldBand.position.set(0, 1.08, 2.9);
    this.group.add(goldBand);

    // Horizontal Stabilizer with White Endplate Fins
    const hStabGeo = new THREE.BoxGeometry(1.75, 0.06, 0.35);
    const hStab = new THREE.Mesh(hStabGeo, whiteCowlingMat);
    hStab.position.set(0, 1.12, 3.85);
    this.group.add(hStab);

    [-0.88, 0.88].forEach((xPos) => {
      const endPlateGeo = new THREE.BoxGeometry(0.06, 0.52, 0.38);
      const endPlate = new THREE.Mesh(endPlateGeo, whiteCowlingMat);
      endPlate.position.set(xPos, 1.22, 3.85);
      endPlate.rotation.x = -0.25;
      this.group.add(endPlate);
    });

    // Swept Vertical Tail Fin
    const vFinGeo = new THREE.BoxGeometry(0.14, 1.25, 0.65);
    const vFin = new THREE.Mesh(vFinGeo, redArmorMat);
    vFin.position.set(0, 1.55, 4.15);
    vFin.rotation.x = -0.32;
    vFin.castShadow = true;
    this.group.add(vFin);

    // ─── 7. WHEELED LANDING GEAR (Main Wheels + Tail Wheel) ───
    [-0.78, 0.78].forEach((xPos) => {
      // Angled Strut
      const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6);
      const strut = new THREE.Mesh(strutGeo, gunmetalMat);
      strut.position.set(xPos * 0.78, 0.42, -0.55);
      strut.rotation.z = xPos > 0 ? 0.48 : -0.48;
      this.group.add(strut);

      // Rubber Wheel Tire
      const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(xPos, 0.22, -0.55);
      wheel.castShadow = true;
      this.group.add(wheel);

      // Wheel Rim Hub
      const rimGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.15, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, whiteCowlingMat);
      rim.position.set(xPos, 0.22, -0.55);
      this.group.add(rim);
    });

    // Rear Tail Wheel
    const tailStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), gunmetalMat);
    tailStrut.position.set(0, 0.68, 3.85);
    this.group.add(tailStrut);

    const tailWheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.10, 10);
    tailWheelGeo.rotateZ(Math.PI / 2);
    const tailWheel = new THREE.Mesh(tailWheelGeo, tireMat);
    tailWheel.position.set(0, 0.42, 3.92);
    this.group.add(tailWheel);

    // ─── 8. 4-BLADED MAIN ROTOR & 3-BLADED TAIL ROTOR ───
    const mastGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.35, 8);
    const mast = new THREE.Mesh(mastGeo, gunmetalMat);
    mast.position.set(0, 2.02, 0.35);
    this.group.add(mast);

    this.mainRotorGroup = new THREE.Group();
    this.mainRotorGroup.position.set(0, 2.18, 0.35);

    // White Aerodynamic Rotor Dome Cap (just like in the photo!)
    const domeCapGeo = new THREE.SphereGeometry(0.34, 12, 8);
    domeCapGeo.scale(1.0, 0.38, 1.0);
    const domeCap = new THREE.Mesh(domeCapGeo, whiteCowlingMat);
    domeCap.position.y = 0.06;
    this.mainRotorGroup.add(domeCap);

    // 4 Wide Composite Blades
    for (let i = 0; i < 4; i++) {
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = (i * Math.PI) / 2;

      const bladeGeo = new THREE.BoxGeometry(0.28, 0.025, 3.65);
      const blade = new THREE.Mesh(bladeGeo, gunmetalMat);
      blade.position.set(0, 0, 1.95);
      blade.rotation.z = 0.08; // Slight blade pitch
      blade.castShadow = true;

      // Swept White/Silver Blade Tip
      const tipGeo = new THREE.BoxGeometry(0.28, 0.028, 0.35);
      const tip = new THREE.Mesh(tipGeo, whiteCowlingMat);
      tip.position.set(-0.04, 0, 3.85);
      tip.rotation.y = 0.25;

      bladeArm.add(blade);
      bladeArm.add(tip);
      this.mainRotorGroup.add(bladeArm);
    }

    // Motion Blur Disc
    const discGeo = new THREE.RingGeometry(0.4, 3.95, 32);
    discGeo.rotateX(Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.rotorDisc = new THREE.Mesh(discGeo, discMat);
    this.rotorDisc.position.set(0, 0.02, 0);
    this.mainRotorGroup.add(this.rotorDisc);

    this.group.add(this.mainRotorGroup);

    // Tail Rotor (3 Blades)
    this.tailRotorGroup = new THREE.Group();
    this.tailRotorGroup.position.set(-0.16, 2.02, 4.32);

    const tailHubGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.12, 8);
    tailHubGeo.rotateZ(Math.PI / 2);
    const tailHub = new THREE.Mesh(tailHubGeo, redArmorMat);
    this.tailRotorGroup.add(tailHub);

    for (let i = 0; i < 3; i++) {
      const tArm = new THREE.Group();
      tArm.rotation.x = (i * Math.PI * 2) / 3;
      const tBlade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.68, 0.11), gunmetalMat);
      tBlade.position.y = 0.36;
      tArm.add(tBlade);
      this.tailRotorGroup.add(tArm);
    }
    this.group.add(this.tailRotorGroup);

    // ─── 9. TACTICAL NAVIGATION & STROBE LIGHTS ───
    const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const portLight = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xff2244 }));
    portLight.position.set(-1.82, 0.92, 0.25);
    this.group.add(portLight);

    const stbdLight = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    stbdLight.position.set(1.82, 0.92, 0.25);
    this.group.add(stbdLight);

    this.beaconLight = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.beaconLight.position.set(0, 2.18, 4.35);
    this.group.add(this.beaconLight);
  }

  buildSearchlight() {
    this.searchlight = new THREE.SpotLight(0xfffbeb, 5.0, 45, Math.PI / 5, 0.4, 1.4);
    this.searchlight.position.set(0, 0.45, -2.5);
    this.searchlight.target.position.set(0, -8, -16);
    this.group.add(this.searchlight);
    this.group.add(this.searchlight.target);
  }

  buildDownwashEffect() {
    const ringGeo = new THREE.RingGeometry(1.8, 4.6, 32);
    ringGeo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
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
    this.downwashRing.position.set(0, 0.06, 0);
    this.scene.add(this.downwashRing);
  }

  startAutopilotFlight(fromPos, toPad, onComplete) {
    this.isAutopilot = true;
    this.autopilotProgress = 0;
    this.onAutopilotComplete = onComplete;
    this.isLanded = false;

    sound.playTakeoff();

    const start = fromPos.clone();
    const end = new THREE.Vector3(toPad.position.x, toPad.position.y + 0.35, toPad.position.z);
    this.autopilotTotalDist = start.distanceTo(end);

    // Lower arc for short hops, sleek combat arc for long flights
    const cruiseAlt = Math.min(13.5, Math.max(6.5, this.autopilotTotalDist * 0.14 + 4.5));

    const mid1 = new THREE.Vector3(
      THREE.MathUtils.lerp(start.x, end.x, 0.25),
      Math.max(start.y + 2, cruiseAlt),
      THREE.MathUtils.lerp(start.z, end.z, 0.25)
    );

    const mid2 = new THREE.Vector3(
      THREE.MathUtils.lerp(start.x, end.x, 0.75),
      Math.max(end.y + 2, cruiseAlt),
      THREE.MathUtils.lerp(start.z, end.z, 0.75)
    );

    this.autopilotCurve = new THREE.CubicBezierCurve3(start, mid1, mid2, end);

    // MUCH FASTER flight duration even to the farthest pads (0.95s to 1.65s max!)
    this.autopilotDuration = Math.max(0.9, Math.min(1.65, this.autopilotTotalDist * 0.011 + 0.72));
  }

  cancelAutopilot() {
    if (this.isAutopilot) {
      this.isAutopilot = false;
      this.autopilotCurve = null;
    }
  }

  update(delta, input) {
    const time = performance.now() * 0.001;

    if (this.beaconLight) {
      this.beaconLight.material.color.setHex((Math.floor(time * 4) % 2 === 0) ? 0xffffff : 0xdc2626);
    }

    if (this.isAutopilot && this.autopilotCurve) {
      this.autopilotProgress += delta / this.autopilotDuration;
      this.rotorRpm = THREE.MathUtils.lerp(this.rotorRpm, this.maxRpm, delta * 8.0);

      if (this.autopilotProgress >= 1.0) {
        this.autopilotProgress = 1.0;
        this.isAutopilot = false;
        this.position.copy(this.autopilotCurve.getPoint(1.0));
        this.isLanded = true;
        this.velocity.set(0, 0, 0);
        this.currentPitch = 0;
        this.currentRoll = 0;

        sound.playLanding();

        if (this.onAutopilotComplete) {
          this.onAutopilotComplete();
        }
      } else {
        const t = THREE.MathUtils.smoothstep(this.autopilotProgress, 0, 1);
        const currentPt = this.autopilotCurve.getPoint(t);
        const nextPt = this.autopilotCurve.getPoint(Math.min(1.0, t + 0.025));

        this.position.copy(currentPt);

        const dir = nextPt.clone().sub(currentPt).normalize();
        if (dir.lengthSq() > 0.0001) {
          const targetHeading = Math.atan2(-dir.x, -dir.z);
          let angleDiff = targetHeading - this.currentYaw;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          this.currentYaw += angleDiff * Math.min(1, delta * 9.0);

          const bankTarget = THREE.MathUtils.clamp(-angleDiff * 1.4, -0.45, 0.45);
          this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, bankTarget, delta * 8.0);

          // Combat heli aggressive forward nose-down pitch during sprint, flare on landing
          const pitchTarget = t < 0.78 ? -0.28 : (t < 0.94 ? 0.14 : 0.0);
          this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, pitchTarget, delta * 7.0);
        }
      }
    } else {
      this.updateManualFlight(delta, input);
    }

    // Spin Main & Tail Rotors
    this.mainRotorGroup.rotation.y += this.rotorRpm * delta;
    this.tailRotorGroup.rotation.x += this.rotorRpm * delta * 1.6;

    const blurOpacity = THREE.MathUtils.smoothstep(this.rotorRpm, 18, this.maxRpm) * 0.38;
    this.rotorDisc.material.opacity = blurOpacity;

    // Apply transform
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.currentYaw);
    this.group.rotateX(this.currentPitch);
    this.group.rotateZ(this.currentRoll);

    // Downwash ring
    if (this.downwashRing) {
      this.downwashRing.position.set(this.position.x, 0.08, this.position.z);
      const altitude = Math.max(0.1, this.position.y);
      const intensity = Math.max(0, 1 - altitude / 14) * (this.rotorRpm / this.maxRpm);
      this.downwashMat.opacity = intensity * 0.6;
      const pulse = 1.0 + Math.sin(time * 20) * 0.08;
      this.downwashRing.scale.set(pulse, pulse, pulse);
    }
  }

  updateManualFlight(delta, input) {
    const isMovingForward = input.forward;
    const isMovingBack = input.back;
    const isTurningLeft = input.left;
    const isTurningRight = input.right;
    const isAscending = input.up;
    const isDescending = input.down;

    if (isMovingForward || isMovingBack || isTurningLeft || isTurningRight || isAscending || isDescending) {
      this.isLanded = false;
      this.rotorRpm = THREE.MathUtils.lerp(this.rotorRpm, this.maxRpm, delta * 5.0);
    } else if (this.isLanded) {
      this.rotorRpm = THREE.MathUtils.lerp(this.rotorRpm, 20, delta * 2.0);
    }

    const turnSpeed = 2.8;
    let turnInput = 0;
    if (isTurningLeft) turnInput += 1;
    if (isTurningRight) turnInput -= 1;
    this.currentYaw += turnInput * turnSpeed * delta;

    const targetRoll = -turnInput * 0.38;
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, delta * 6.0);

    const forwardVec = new THREE.Vector3(-Math.sin(this.currentYaw), 0, -Math.cos(this.currentYaw));

    let throttle = 0;
    if (isMovingForward) throttle += 1;
    if (isMovingBack) throttle -= 0.65;

    const acceleration = input.turbo ? 85.0 : 52.0;
    if (throttle !== 0) {
      this.velocity.addScaledVector(forwardVec, throttle * acceleration * delta);
    }

    // Forward tilt when flying forward (-X rotation pitches nose down since nose is -Z)
    const targetPitch = -throttle * 0.28;
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, delta * 5.0);

    let vertThrottle = 0;
    if (isAscending) vertThrottle += 1;
    if (isDescending) vertThrottle -= 1;

    const hoverBaseY = 4.8;
    if (!this.isLanded && vertThrottle === 0) {
      const dy = hoverBaseY - this.position.y;
      this.velocity.y += dy * 3.0 * delta;
    } else {
      this.velocity.y += vertThrottle * 26.0 * delta;
    }

    this.velocity.x *= Math.pow(0.91, delta * 60);
    this.velocity.z *= Math.pow(0.91, delta * 60);
    this.velocity.y *= Math.pow(0.89, delta * 60);

    const maxSpeed = input.turbo ? 68.0 : 42.0;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    this.position.addScaledVector(this.velocity, delta);

    const groundFloor = 0.85;
    if (this.position.y < groundFloor) {
      this.position.y = groundFloor;
      if (this.velocity.y < -1.0) {
        sound.playLanding();
      }
      this.velocity.y = 0;
      this.velocity.x *= 0.78;
      this.velocity.z *= 0.78;

      if (this.velocity.length() < 0.25 && !isMovingForward && !isAscending) {
        this.isLanded = true;
        this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, 0, delta * 7);
        this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, 0, delta * 7);
      }
    }

    if (!this.isLanded && Math.abs(this.velocity.y) < 0.2) {
      this.position.y += Math.sin(performance.now() * 0.0035) * 0.008;
    }
  }

  teleportTo(pos) {
    this.position.set(pos.x, pos.y + 0.35, pos.z);
    this.velocity.set(0, 0, 0);
    this.currentPitch = 0;
    this.currentRoll = 0;
    this.isLanded = true;
    this.rotorRpm = 22;
  }
}
