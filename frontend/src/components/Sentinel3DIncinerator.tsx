import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { assetUrl } from '../config/api';

export interface Sentinel3DIncineratorProps {
  /** Indicates whether an active burn transaction is executing */
  isBurning?: boolean;
  /** Active transaction stage from wallet */
  burnStage?: 'idle' | 'preparing' | 'signing' | 'confirming' | 'eating';
  /** Indicates whether the burn was successfully confirmed */
  isSuccess?: boolean;
  /** Amount of tokens being burned (for intensity scaling) */
  burnAmount?: number;
  /** Theme mode for appropriate ambient and glow coloring */
  themeMode?: 'light' | 'dark';
  /** Optional container CSS class */
  className?: string;
  /** Enable mouse parallax / orbit interaction */
  interactive?: boolean;
  /** Optional callback when the avatar or core is clicked */
  onCoreClick?: () => void;
  /** Height of the 3D viewport */
  height?: string | number;
}

export const Sentinel3DIncinerator: React.FC<Sentinel3DIncineratorProps> = ({
  isBurning = false,
  burnStage = 'idle',
  isSuccess = false,
  burnAmount = 1.0,
  themeMode = 'dark',
  className = '',
  interactive = true,
  onCoreClick,
  height = '360px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State refs to pass live props into Three.js loop without re-creating scene
  const isBurningRef = useRef(isBurning);
  isBurningRef.current = isBurning;

  const burnStageRef = useRef(burnStage);
  burnStageRef.current = burnStage;

  const isSuccessRef = useRef(isSuccess);
  isSuccessRef.current = isSuccess;

  const manualTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- 1. ULTRA-CRISP HIGH-DPI RENDERER (Native Sharpness, Zero Ghosting) ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false, // NearestFilter pixel-art needs NO MSAA, preserving razor-sharp pixels
      powerPreference: 'high-performance',
      precision: 'mediump'
    });
    // True native High-DPI support up to 2.5x for razor-sharp display
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));

    const scene = new THREE.Scene();
    // Optimal camera distance: fills viewport crisply
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
    camera.position.set(0, 0.02, 2.30);

    // --- 2. HIGH-CONTRAST VIVID LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.80);
    dirLight.position.set(1.2, 2.2, 2.0);
    scene.add(dirLight);

    // Secondary fill light from left-front for armor plate definition
    const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.60);
    fillLight.position.set(-1.5, 0.5, 1.5);
    scene.add(fillLight);

    // Dynamic PointLight (glows cyan in idle, shifts to intense crimson red during signing)
    const dynamicPointLight = new THREE.PointLight(0x00f2fe, 0.0, 5.0);
    dynamicPointLight.position.set(0, 0.20, 0.45);
    scene.add(dynamicPointLight);

    // --- 3. TEXTURES (NearestFilter for authentic razor-sharp pixel art) ---
    const loader = new THREE.TextureLoader();
    const loadPixelTex = (url: string) => {
      const t = loader.load(url);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      return t;
    };

    // Normal (Cyan Eye) Textures with v6 cache buster for restored perfect Sentinel
    const texRobotOpen = loadPixelTex(assetUrl('/agents/sentinel_quantk_principal.png?v=6'));
    const texRobotHalf = loadPixelTex(assetUrl('/agents/sentinel_quantk_blink_half.png?v=6'));
    const texRobotSlit = loadPixelTex(assetUrl('/agents/sentinel_quantk_blink_slit.png?v=6'));
    const texRobotBack = loadPixelTex(assetUrl('/agents/sentinel_quantk_espalda.png?v=6'));

    // Burn / Signing (Pixel-Perfect Symmetrical Ultra-Neon Red Eye) Textures
    const texRobotOpenRed = loadPixelTex(assetUrl('/agents/sentinel_quantk_principal_red.png?v=6'));

    // --- 4. CLEAN ZERO-GHOSTING 3D RIG (Single-surface front & back: 0% overlap/desfase) ---
    const robot3DGroup = new THREE.Group();
    scene.add(robot3DGroup);

    const aspect = 463 / 1024;
    const hh = 0.82;
    const hw = hh * aspect;
    const totalHeight = hh * 2;
    const totalWidth = hw * 2;
    const planeGeo = new THREE.PlaneGeometry(totalWidth, totalHeight);

    // Front Face Active Material (Single clean surface - ZERO parallax double contours)
    // Dark charcoal blue-steel tint preserves authentic dark metallic appearance
    const frontFaceMat = new THREE.MeshBasicMaterial({
      map: texRobotOpen,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.FrontSide,
      color: new THREE.Color(0.38, 0.42, 0.50)  // dark charcoal metal tint — true dark
    });
    const meshFront = new THREE.Mesh(planeGeo, frontFaceMat);
    meshFront.position.z = 0.002;
    robot3DGroup.add(meshFront);

    // Back Armor Material (Clean backside for 360 rotation - rotated Math.PI so it matches front silhouette perfectly)
    const backMat = new THREE.MeshBasicMaterial({
      map: texRobotBack,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.FrontSide,
      color: new THREE.Color(0.35, 0.39, 0.47)  // slightly darker on back for depth
    });
    const meshBack = new THREE.Mesh(planeGeo, backMat);
    meshBack.position.z = -0.001;
    meshBack.rotation.y = Math.PI;
    robot3DGroup.add(meshBack);

    // --- 5. HOLOGRAPHIC DUAL PLATFORM AT FEET ---
    const platformGroup = new THREE.Group();
    platformGroup.position.y = -hh - 0.02;
    scene.add(platformGroup);

    // Outer ring (cyan in idle, shifts to crimson red during signing)
    const outerRingGeo = new THREE.RingGeometry(0.56, 0.60, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    platformGroup.add(outerRing);

    // Inner ring (purple in idle, shifts to blood-orange during signing)
    const innerRingGeo = new THREE.RingGeometry(0.36, 0.38, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    platformGroup.add(innerRing);

    // 4 orbital nodes on outer ring
    const orbitalNodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      blending: THREE.AdditiveBlending
    });
    for (let i = 0; i < 4; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      platformGroup.add(node);
      orbitalNodes.push(node);
    }

    // --- 6. HOMOGENEOUS GLOWING PARTICLE SPRITE ENGINE ---
    // Procedural soft glowing radial light mote sprite
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pctx = pCanvas.getContext('2d');
    if (pctx) {
      const grad = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)'); // White-hot radiant center
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)'); // Smooth falloff
      pctx.fillStyle = grad;
      pctx.fillRect(0, 0, 64, 64);
    }
    const particleSpriteTex = new THREE.CanvasTexture(pCanvas);
    particleSpriteTex.generateMipmaps = false;

    const TOTAL_PARTICLES = 160; // Perfectly balanced count: homogeneous, dense, not noisy
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(TOTAL_PARTICLES * 3);
    const colors = new Float32Array(TOTAL_PARTICLES * 3);

    // Harmonic physics state arrays for cohesive orbital flow
    const pBaseRadius = new Float32Array(TOTAL_PARTICLES);
    const pAngle = new Float32Array(TOTAL_PARTICLES);
    const pOrbitSpeed = new Float32Array(TOTAL_PARTICLES);
    const pBaseY = new Float32Array(TOTAL_PARTICLES);
    const pVerticalSpeed = new Float32Array(TOTAL_PARTICLES);
    const pVelocityX = new Float32Array(TOTAL_PARTICLES);
    const pVelocityY = new Float32Array(TOTAL_PARTICLES);
    const pVelocityZ = new Float32Array(TOTAL_PARTICLES);
    const pSpiralOffset = new Float32Array(TOTAL_PARTICLES);

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      // Cohesive helical distribution around avatar
      const normIdx = i / TOTAL_PARTICLES;
      const radius = 0.35 + (i % 6) * 0.05;
      const angle = normIdx * Math.PI * 8.0;
      const y = -0.65 + normIdx * 1.45;

      pBaseRadius[i] = radius;
      pAngle[i] = angle;
      pOrbitSpeed[i] = 0.6 + (i % 4) * 0.2;
      pBaseY[i] = y;
      pVerticalSpeed[i] = 0.35 + (i % 3) * 0.15;
      pSpiralOffset[i] = (i % 8) * (Math.PI / 4);

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Vivid cyber cyan / electric blue in idle
      const isCyan = i % 2 === 0;
      colors[i * 3] = isCyan ? 0.0 : 0.20;
      colors[i * 3 + 1] = isCyan ? 0.95 : 0.75;
      colors[i * 3 + 2] = 1.0;
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // PointsMaterial with soft glowing radial energy texture
    const partMat = new THREE.PointsMaterial({
      size: 0.065,
      map: particleSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(partGeo, partMat);
    scene.add(particleSystem);

    // --- 7. TRANSACTION STATE MACHINE ---
    // 'idle' -> 'signing' (particles turn RED, ONLY eyes turn RED, surge) -> 'exploding' -> 'settling' -> 'idle'
    let currentMode: 'idle' | 'signing' | 'exploding' | 'settling' = 'idle';
    let modeTimer = 0.0;
    let wasSuccessHandled = false;
    let isBlinking = false;

    // Trigger the explosive burst outward
    const triggerParticleExplosion = () => {
      currentMode = 'exploding';
      modeTimer = 0.0;

      const posArray = particleSystem.geometry.attributes.position.array as Float32Array;
      const colArray = particleSystem.geometry.attributes.color.array as Float32Array;

      // Impart high radial velocity to all particles from avatar chest
      for (let i = 0; i < TOTAL_PARTICLES; i++) {
        const curX = posArray[i * 3];
        const curY = posArray[i * 3 + 1] - 0.1;
        const curZ = posArray[i * 3 + 2];

        const len = Math.hypot(curX, curY, curZ) || 1.0;
        const speed = 1.7 + Math.random() * 2.0;

        pVelocityX[i] = (curX / len) * speed + (Math.random() - 0.5) * 0.3;
        pVelocityY[i] = (curY / len) * speed + (Math.random() - 0.5) * 0.3 + 0.3;
        pVelocityZ[i] = (curZ / len) * speed + (Math.random() - 0.5) * 0.3;

        // Flash white-hot and glowing radiant red on detonation
        colArray[i * 3] = 1.0;
        colArray[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        colArray[i * 3 + 2] = 0.75;
      }
      particleSystem.geometry.attributes.color.needsUpdate = true;

      // Joyful spring recoil bounce
      robotBounceVel = 0.22;
    };

    // Manual demonstration trigger (when canvas is clicked)
    const runDemoCycle = () => {
      if (currentMode === 'idle') {
        currentMode = 'signing';
        modeTimer = 0.0;
        robotBounceVel = 0.14;
        frontFaceMat.map = texRobotOpenRed;
        frontFaceMat.needsUpdate = true;
      } else if (currentMode === 'signing') {
        triggerParticleExplosion();
      }
    };
    manualTriggerRef.current = runDemoCycle;

    // --- 8. NATURAL EYE BLINK CYCLE (Only blinks in normal idle mode, NEVER during burn/signing) ---
    const runBlinkCycle = () => {
      // Freeze blinking during signing, burn, or explosion: eyes remain locked open, intense and defiant
      if (currentMode !== 'idle' || isBlinking || !frontFaceMat) return;
      isBlinking = true;

      frontFaceMat.map = texRobotHalf;
      frontFaceMat.needsUpdate = true;
      setTimeout(() => {
        if (!frontFaceMat || currentMode !== 'idle') {
          isBlinking = false;
          return;
        }
        frontFaceMat.map = texRobotSlit;
        frontFaceMat.needsUpdate = true;
        setTimeout(() => {
          if (!frontFaceMat || currentMode !== 'idle') {
            isBlinking = false;
            return;
          }
          frontFaceMat.map = texRobotHalf;
          frontFaceMat.needsUpdate = true;
          setTimeout(() => {
            if (!frontFaceMat || currentMode !== 'idle') {
              isBlinking = false;
              return;
            }
            frontFaceMat.map = texRobotOpen;
            frontFaceMat.needsUpdate = true;
            isBlinking = false;
          }, 45);
        }, 55);
      }, 45);
    };

    const blinkInterval = setInterval(runBlinkCycle, 3800);

    // --- 9. SMOOTH INTERACTIVE ROTATION & SPRING PHYSICS ---
    let rotY = 0.0;
    let rotX = 0.0;
    let targetRotY = 0.0;
    let targetRotX = 0.0;
    let robotBounceSpring = 0.0;
    let robotBounceVel = 0.0;
    let robotTime = 0.0;
    let animFrameId: number | null = null;

    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerLastX = 0;
    let pointerLastY = 0;
    let pointerStartTime = 0;
    let hasMovedSignificantly = false;
    let lastTapTime = 0;

    const handleTap = () => {
      runBlinkCycle();
      runDemoCycle();
      if (onCoreClick) {
        onCoreClick();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isPointerDown = true;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerLastX = e.clientX;
      pointerLastY = e.clientY;
      pointerStartTime = performance.now();
      hasMovedSignificantly = false;
      try {
        if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown || !interactive) return;
      const curX = e.clientX;
      const curY = e.clientY;
      const deltaX = curX - pointerLastX;
      const deltaY = curY - pointerLastY;

      const totalDist = Math.hypot(curX - pointerStartX, curY - pointerStartY);
      if (totalDist > 8) {
        hasMovedSignificantly = true;
      }

      targetRotY += deltaX * 0.012;
      targetRotX += deltaY * 0.008;
      targetRotX = Math.max(-0.40, Math.min(0.40, targetRotX));

      pointerLastX = curX;
      pointerLastY = curY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      try {
        if (canvas.releasePointerCapture) canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      const duration = performance.now() - pointerStartTime;
      const totalDist = Math.hypot(pointerLastX - pointerStartX, pointerLastY - pointerStartY);

      if (!hasMovedSignificantly || (totalDist < 25 && duration < 500)) {
        const now = performance.now();
        if (now - lastTapTime < 350) {
          // Double tap: smooth reset to front orientation
          targetRotY = 0.0;
          targetRotX = 0.0;
          lastTapTime = 0;
        } else {
          handleTap();
          lastTapTime = now;
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);

    // --- 10. RESIZE OBSERVER (Pixel Perfect Scale) ---
    const resizeRenderer = () => {
      if (!container || !renderer || !camera) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width || 320;
      const h = rect.height || 360;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resizeRenderer();

    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer();
    });
    resizeObserver.observe(container);

    // --- 11. VISIBILITY OBSERVER ---
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // --- 12. HIGH-FPS CINEMATIC ANIMATION LOOP ---
    let lastTime = performance.now();

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);

      if (!isVisible || document.hidden) {
        lastTime = now;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      robotTime += dt;
      modeTimer += dt;

      // 1. Smooth Rotation Inertia
      rotY += (targetRotY - rotY) * 0.14;
      rotX += (targetRotX - rotX) * 0.14;

      // 2. Spring Physics
      const springK = 85;
      const springDamping = 7.5;
      const springForce = -springK * robotBounceSpring - springDamping * robotBounceVel;
      robotBounceVel += springForce * dt;
      robotBounceSpring += robotBounceVel * dt;

      // 3. Avatar Floating Motion (Clean, unified single surface, ZERO ghosting)
      const floatY = 0.026 * Math.sin(robotTime * 2.0) + robotBounceSpring;
      robot3DGroup.position.y = floatY;
      robot3DGroup.rotation.y = rotY;
      robot3DGroup.rotation.x = rotX + 0.007 * Math.cos(robotTime * 1.6);

      // 4. Holographic Platform Rotation
      platformGroup.rotation.y = robotTime * 0.45;
      const rOuter = 0.58;
      for (let i = 0; i < orbitalNodes.length; i++) {
        const ang = (i * Math.PI) / 2.0;
        orbitalNodes[i].position.set(rOuter * Math.cos(ang), 0.01, rOuter * Math.sin(ang));
      }

      // 5. SYNCHRONIZE STATE WITH WALLET PROPS
      const isExternalSigning =
        isBurningRef.current ||
        burnStageRef.current === 'preparing' ||
        burnStageRef.current === 'signing' ||
        burnStageRef.current === 'confirming';

      if (isSuccessRef.current && !wasSuccessHandled) {
        wasSuccessHandled = true;
        triggerParticleExplosion();
      } else if (!isSuccessRef.current) {
        wasSuccessHandled = false;
      }

      if (isExternalSigning && currentMode === 'idle') {
        currentMode = 'signing';
        modeTimer = 0.0;
        frontFaceMat.map = texRobotOpenRed;
        frontFaceMat.needsUpdate = true;
      }

      // In manual demo mode, auto-advance from signing to exploding after 2.8s
      if (currentMode === 'signing' && !isExternalSigning && modeTimer > 2.8) {
        triggerParticleExplosion();
      }

      // In exploding mode, transition to settling after 1.8s
      if (currentMode === 'exploding' && modeTimer > 1.8) {
        currentMode = 'settling';
        modeTimer = 0.0;
      }

      // In settling mode, return to normal idle after 1.4s
      if (currentMode === 'settling' && modeTimer > 1.4) {
        currentMode = 'idle';
        modeTimer = 0.0;
        frontFaceMat.map = texRobotOpen;
        frontFaceMat.needsUpdate = true;
      }

      // 6. UPDATE PARTICLES, EYES & LIGHTING BY CURRENT MODE
      const posArr = particleSystem.geometry.attributes.position.array as Float32Array;
      const colArr = particleSystem.geometry.attributes.color.array as Float32Array;

      if (currentMode === 'idle') {
        // --- MODE A: NORMALIDAD (CYAN EYES + Serene glowing cyan energy motes) ---
        partMat.size = 0.060;
        partMat.opacity = 0.85;

        // Ensure eyes are Cyan in normal idle
        if (!isBlinking && frontFaceMat.map !== texRobotOpen) {
          frontFaceMat.map = texRobotOpen;
          frontFaceMat.needsUpdate = true;
        }

        // Platform colors in normal state
        outerRingMat.color.setHex(0x00f2fe);
        innerRingMat.color.setHex(0xc084fc);
        nodeMat.color.setHex(0x38bdf8);
        dynamicPointLight.intensity = 0.0;

        // Homogeneous, elegant helical energy flow
        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          pAngle[i] += pOrbitSpeed[i] * dt * 0.50;
          pBaseY[i] += pVerticalSpeed[i] * dt * 0.25;
          if (pBaseY[i] > 0.80) {
            pBaseY[i] = -0.65;
          }

          const r = pBaseRadius[i] + Math.sin(robotTime * 1.5 + pSpiralOffset[i]) * 0.03;
          posArr[i * 3] = Math.cos(pAngle[i]) * r;
          posArr[i * 3 + 1] = pBaseY[i];
          posArr[i * 3 + 2] = Math.sin(pAngle[i]) * r;

          // Vivid Cyber Cyan / Neon Sky Blue with white-hot light center
          const isCyan = i % 2 === 0;
          colArr[i * 3] = THREE.MathUtils.lerp(colArr[i * 3], isCyan ? 0.0 : 0.20, dt * 4);
          colArr[i * 3 + 1] = THREE.MathUtils.lerp(colArr[i * 3 + 1], isCyan ? 0.95 : 0.75, dt * 4);
          colArr[i * 3 + 2] = THREE.MathUtils.lerp(colArr[i * 3 + 2], 1.0, dt * 4);
        }

      } else if (currentMode === 'signing') {
        // --- MODE B: SIGNING (ONLY EYES RED, NO BLINK + VIVID HOMOGENEOUS RED PLASMA VORTEX) ---
        partMat.size = 0.075 + Math.sin(robotTime * 18) * 0.008;
        partMat.opacity = 0.95;

        // Ensure ONLY eyes are glowing RED during signing
        if (frontFaceMat.map !== texRobotOpenRed) {
          frontFaceMat.map = texRobotOpenRed;
          frontFaceMat.needsUpdate = true;
        }

        // Platform rings turn pulsing fiery crimson
        const pulse = 0.8 + Math.sin(robotTime * 12) * 0.2;
        outerRingMat.color.setHex(0xff1744);
        outerRingMat.opacity = pulse;
        innerRingMat.color.setHex(0xff5722);
        nodeMat.color.setHex(0xff1744);

        // Dynamic Red PointLight illuminates avatar body
        dynamicPointLight.color.setHex(0xff1744);
        dynamicPointLight.intensity = 2.4 + Math.sin(robotTime * 16) * 0.8;

        // Homogeneous swirling crimson plasma vortex around avatar
        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          pAngle[i] += (pOrbitSpeed[i] * 3.5 + 1.2) * dt;

          pBaseY[i] += pVerticalSpeed[i] * dt * 1.5;
          if (pBaseY[i] > 0.85) {
            pBaseY[i] = -0.70;
          }

          // Smooth harmonic contraction around avatar's torso and head
          const r = Math.min(0.50, pBaseRadius[i] * 0.85 + Math.sin(robotTime * 6 + i) * 0.03);

          posArr[i * 3] = Math.cos(pAngle[i]) * r;
          posArr[i * 3 + 1] = pBaseY[i];
          posArr[i * 3 + 2] = Math.sin(pAngle[i]) * r;

          // Highly saturated, vibrant, vivid crimson red (#ff003c / #ff1744)
          colArr[i * 3] = THREE.MathUtils.lerp(colArr[i * 3], 1.0, dt * 6);
          colArr[i * 3 + 1] = THREE.MathUtils.lerp(colArr[i * 3 + 1], 0.04 + (i % 3) * 0.03, dt * 6);
          colArr[i * 3 + 2] = THREE.MathUtils.lerp(colArr[i * 3 + 2], 0.10, dt * 6);
        }

      } else if (currentMode === 'exploding') {
        // --- MODE C: SUPERNOVA EXPLOSION (Radial burst of glowing energy motes) ---
        partMat.size = 0.085;
        partMat.opacity = Math.max(0.2, 1.0 - (modeTimer / 1.8) * 0.7);

        // Blinding flash at detonation
        if (modeTimer < 0.25) {
          dynamicPointLight.color.setHex(0xffffff);
          dynamicPointLight.intensity = 5.0;
        } else {
          dynamicPointLight.color.setHex(0xff3d00);
          dynamicPointLight.intensity = Math.max(0, 3.5 - modeTimer * 2.0);
        }

        // Particles fly outward radially with air friction decay
        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          pVelocityX[i] *= 0.93;
          pVelocityY[i] *= 0.93;
          pVelocityZ[i] *= 0.93;

          posArr[i * 3] += pVelocityX[i] * dt;
          posArr[i * 3 + 1] += pVelocityY[i] * dt;
          posArr[i * 3 + 2] += pVelocityZ[i] * dt;

          if (modeTimer > 0.8) {
            colArr[i * 3] = THREE.MathUtils.lerp(colArr[i * 3], 0.2, dt * 3);
            colArr[i * 3 + 1] = THREE.MathUtils.lerp(colArr[i * 3 + 1], 0.85, dt * 3);
            colArr[i * 3 + 2] = THREE.MathUtils.lerp(colArr[i * 3 + 2], 1.0, dt * 3);
          } else {
            colArr[i * 3] = 1.0;
            colArr[i * 3 + 1] = THREE.MathUtils.lerp(colArr[i * 3 + 1], 0.35, dt * 4);
            colArr[i * 3 + 2] = THREE.MathUtils.lerp(colArr[i * 3 + 2], 0.10, dt * 4);
          }
        }

      } else if (currentMode === 'settling') {
        // --- MODE D: RETURNING TO NORMALITY (Smooth magnetic recapture) ---
        partMat.size = 0.060;
        partMat.opacity = 0.85;
        dynamicPointLight.intensity = Math.max(0, dynamicPointLight.intensity - dt * 3);

        if (!isBlinking && frontFaceMat.map !== texRobotOpen) {
          frontFaceMat.map = texRobotOpen;
          frontFaceMat.needsUpdate = true;
        }

        outerRingMat.color.lerp(new THREE.Color(0x00f2fe), dt * 4);
        innerRingMat.color.lerp(new THREE.Color(0xc084fc), dt * 4);
        nodeMat.color.lerp(new THREE.Color(0x38bdf8), dt * 4);

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          pAngle[i] += pOrbitSpeed[i] * dt * 0.5;
          const targetX = Math.cos(pAngle[i]) * pBaseRadius[i];
          const targetY = pBaseY[i];
          const targetZ = Math.sin(pAngle[i]) * pBaseRadius[i];

          posArr[i * 3] = THREE.MathUtils.lerp(posArr[i * 3], targetX, dt * 3.5);
          posArr[i * 3 + 1] = THREE.MathUtils.lerp(posArr[i * 3 + 1], targetY, dt * 3.5);
          posArr[i * 3 + 2] = THREE.MathUtils.lerp(posArr[i * 3 + 2], targetZ, dt * 3.5);

          const isCyan = i % 2 === 0;
          colArr[i * 3] = THREE.MathUtils.lerp(colArr[i * 3], isCyan ? 0.0 : 0.20, dt * 4);
          colArr[i * 3 + 1] = THREE.MathUtils.lerp(colArr[i * 3 + 1], isCyan ? 0.95 : 0.75, dt * 4);
          colArr[i * 3 + 2] = THREE.MathUtils.lerp(colArr[i * 3 + 2], 1.0, dt * 4);
        }
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // --- 13. CLEANUP ON UNMOUNT ---
    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      clearInterval(blinkInterval);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Dispose textures
      texRobotOpen.dispose();
      texRobotHalf.dispose();
      texRobotSlit.dispose();
      texRobotBack.dispose();
      texRobotOpenRed.dispose();
      particleSpriteTex.dispose();

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const mats = Array.isArray(object.material) ? object.material : [object.material];
            mats.forEach((m) => m.dispose());
          }
        }
      });
      scene.clear();
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#070a10] via-[#090e18] to-[#04070d] border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col items-center justify-center select-none ${className}`}
      style={{ height, imageRendering: 'pixelated' }}
    >
      {/* 3D WebGL Canvas - Razor-Sharp, Zero Ghosting, Homogeneous Glowing Particles */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default Sentinel3DIncinerator;
