import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles, Move } from 'lucide-react';

// Color Mappings for Realistic Cake Materials
const BISCUIT_COLORS = {
  vanilla: 0xFBE9D0,
  chocolate: 0x3D2314,
  red_velvet: 0x8A1C24,
  honey: 0xD48E38,
  nutty: 0x7A4A28,
};

const CREAM_COLORS = {
  cream_cheese: 0xFCF8F2,
  ganache: 0x2A150A,
  berry_souffle: 0xF9A8B8,
  pistachio: 0xB2CCA0,
  caramel: 0xD99452,
};

const Cake3DViewer = ({
  weightId = '1.5kg',
  biscuitId = 'vanilla',
  creamId = 'cream_cheese',
  decorId = 'berries',
  greetingText = '',
}) => {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);

  // Scene refs to update dynamically without full re-mounting
  const sceneRef = useRef(null);
  const cakeGroupRef = useRef(null);
  const plaqueMeshRef = useRef(null);
  const isRotatingRef = useRef(true);

  isRotatingRef.current = isRotating;

  // Determine tiers count based on weight
  const getTierCount = (id) => {
    if (id === '5.0kg') return 3;
    if (id === '3.0kg') return 2;
    return 1;
  };

  const tierCount = getTierCount(weightId);

  // Helper to create text texture on chocolate plaque
  const createPlaqueTexture = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Background: dark chocolate plaque with gold border
    ctx.fillStyle = '#261408';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 140, 20);
    ctx.fill();

    // Gold border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#D4AF37';
    ctx.stroke();

    // Inner gold hairline
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#F3E5AB';
    ctx.beginPath();
    ctx.roundRect(18, 18, 476, 124, 14);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#FFF8DC';
    ctx.font = 'bold 30px "Playfair Display", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayText = text.trim() ? text.trim() : "Bol Tortlari";
    // Truncate if too long for the plaque
    const truncated = displayText.length > 28 ? displayText.slice(0, 25) + '...' : displayText;
    ctx.fillText(truncated, 256, 80);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Rebuild the 3D Cake whenever specs change
  const buildCakeModel = (scene) => {
    if (cakeGroupRef.current) {
      scene.remove(cakeGroupRef.current);
      // Clean up geometries/materials
      cakeGroupRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const cakeGroup = new THREE.Group();
    cakeGroupRef.current = cakeGroup;

    const spongeHex = BISCUIT_COLORS[biscuitId] || BISCUIT_COLORS.vanilla;
    const creamHex = CREAM_COLORS[creamId] || CREAM_COLORS.cream_cheese;

    // Pedestal / Cake Stand (White Marble + Gold Trim)
    const standGroup = new THREE.Group();
    const standBaseGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.2, 36);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xF5F2EB,
      roughness: 0.25,
      metalness: 0.15,
    });
    const standBase = new THREE.Mesh(standBaseGeo, standMat);
    standBase.position.y = -1.2;
    standGroup.add(standBase);

    const stemGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 24);
    const stem = new THREE.Mesh(stemGeo, standMat);
    stem.position.y = -0.7;
    standGroup.add(stem);

    const plateGeo = new THREE.CylinderGeometry(2.8, 2.6, 0.15, 48);
    const plate = new THREE.Mesh(plateGeo, standMat);
    plate.position.y = -0.25;
    standGroup.add(plate);

    // Gold rim around the plate
    const goldRimGeo = new THREE.TorusGeometry(2.78, 0.05, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.2,
      metalness: 0.85,
    });
    const goldRim = new THREE.Mesh(goldRimGeo, goldMat);
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = -0.22;
    standGroup.add(goldRim);

    cakeGroup.add(standGroup);

    // Cake Tiers Specs
    const tiersData = [
      { radius: 2.3, height: 1.25, y: 0.45 },
      { radius: 1.6, height: 1.05, y: 1.6 },
      { radius: 1.0, height: 0.85, y: 2.55 },
    ];

    const activeTiers = tiersData.slice(0, tierCount);

    activeTiers.forEach((tier) => {
      const tierGroup = new THREE.Group();
      tierGroup.position.y = tier.y;

      // 1. Sponge Cake Body (frosting coated)
      const frostingMat = new THREE.MeshStandardMaterial({
        color: creamHex,
        roughness: 0.45,
        metalness: 0.05,
      });

      const bodyGeo = new THREE.CylinderGeometry(tier.radius, tier.radius, tier.height, 36);
      const body = new THREE.Mesh(bodyGeo, frostingMat);
      body.castShadow = true;
      body.receiveShadow = true;
      tierGroup.add(body);

      // 2. Visible sponge accent ring in the middle
      const spongeMat = new THREE.MeshStandardMaterial({
        color: spongeHex,
        roughness: 0.85,
        metalness: 0.0,
      });
      const spongeStripGeo = new THREE.CylinderGeometry(tier.radius + 0.015, tier.radius + 0.015, 0.18, 36);
      const spongeStrip = new THREE.Mesh(spongeStripGeo, spongeMat);
      spongeStrip.position.y = 0;
      tierGroup.add(spongeStrip);

      // 3. Top Cream Layer Cap
      const topCreamGeo = new THREE.CylinderGeometry(tier.radius + 0.02, tier.radius + 0.02, 0.1, 36);
      const topCream = new THREE.Mesh(topCreamGeo, frostingMat);
      topCream.position.y = tier.height / 2 + 0.04;
      tierGroup.add(topCream);

      // 4. Cream Piped Rosettes around bottom edge of tier
      const rosetteCount = Math.round(tier.radius * 8);
      const rosetteGeo = new THREE.SphereGeometry(0.09, 12, 12);
      for (let i = 0; i < rosetteCount; i++) {
        const angle = (i / rosetteCount) * Math.PI * 2;
        const rx = Math.cos(angle) * (tier.radius + 0.02);
        const rz = Math.sin(angle) * (tier.radius + 0.02);
        const rosette = new THREE.Mesh(rosetteGeo, frostingMat);
        rosette.position.set(rx, -tier.height / 2 + 0.05, rz);
        rosette.scale.set(1, 0.8, 1);
        tierGroup.add(rosette);
      }

      // 5. Frosting Drips along the top rim
      const dripCount = Math.round(tier.radius * 6);
      for (let i = 0; i < dripCount; i++) {
        const angle = (i / dripCount) * Math.PI * 2 + (i % 2) * 0.1;
        const dx = Math.cos(angle) * (tier.radius + 0.02);
        const dz = Math.sin(angle) * (tier.radius + 0.02);
        const dripLength = 0.15 + (i % 3) * 0.1;
        const dripGeo = new THREE.ConeGeometry(0.06, dripLength, 8);
        const drip = new THREE.Mesh(dripGeo, frostingMat);
        drip.rotation.x = Math.PI;
        drip.position.set(dx, tier.height / 2 - dripLength / 2, dz);
        tierGroup.add(drip);
      }

      cakeGroup.add(tierGroup);
    });

    // Top tier for placing toppings & banner
    const topTier = activeTiers[activeTiers.length - 1];
    const topY = topTier.y + topTier.height / 2 + 0.08;

    // 3D TOPPINGS (Based on decorId)
    const toppingsGroup = new THREE.Group();
    toppingsGroup.position.y = topY;

    if (decorId === 'berries') {
      // Strawberries & Raspberries
      const berryMat = new THREE.MeshStandardMaterial({
        color: 0xC41E3A,
        roughness: 0.3,
        metalness: 0.1,
      });
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x2E7D32,
        roughness: 0.5,
      });
      const blueberryMat = new THREE.MeshStandardMaterial({
        color: 0x2D3748,
        roughness: 0.35,
      });

      const count = Math.max(5, Math.round(topTier.radius * 6));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dist = 0.2 + (i % 3) * (topTier.radius * 0.3);
        const bx = Math.cos(angle) * dist;
        const bz = Math.sin(angle) * dist;

        if (i % 2 === 0) {
          // Strawberry (Cone + calyx)
          const strawGeo = new THREE.ConeGeometry(0.16, 0.3, 16);
          const straw = new THREE.Mesh(strawGeo, berryMat);
          straw.rotation.x = Math.PI + (Math.random() - 0.5) * 0.4;
          straw.rotation.z = (Math.random() - 0.5) * 0.4;
          straw.position.set(bx, 0.14, bz);

          // Calyx leaf
          const leafGeo = new THREE.CircleGeometry(0.12, 5);
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.rotation.x = -Math.PI / 2;
          leaf.position.y = 0.16;
          straw.add(leaf);

          toppingsGroup.add(straw);
        } else {
          // Blueberry / Raspberry
          const bbGeo = new THREE.SphereGeometry(0.1, 12, 12);
          const bb = new THREE.Mesh(bbGeo, blueberryMat);
          bb.position.set(bx, 0.08, bz);
          toppingsGroup.add(bb);
        }
      }
    } else if (decorId === 'gold_macarons') {
      // French Macarons with gold dusting
      const macaronColors = [0xF8BBD0, 0xC8E6C9, 0xFFE082, 0xD1C4E9];
      const count = 4;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const mx = Math.cos(angle) * (topTier.radius * 0.55);
        const mz = Math.sin(angle) * (topTier.radius * 0.55);

        const macGroup = new THREE.Group();
        const mMat = new THREE.MeshStandardMaterial({
          color: macaronColors[i % macaronColors.length],
          roughness: 0.35,
          metalness: 0.1,
        });

        // Top Shell
        const shellGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.08, 16);
        const topShell = new THREE.Mesh(shellGeo, mMat);
        topShell.position.y = 0.05;
        macGroup.add(topShell);

        // Cream Filling
        const fillGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
        const fillMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
        const filling = new THREE.Mesh(fillGeo, fillMat);
        macGroup.add(filling);

        // Bottom Shell
        const botShell = new THREE.Mesh(shellGeo, mMat);
        botShell.position.y = -0.05;
        macGroup.add(botShell);

        macGroup.position.set(mx, 0.12, mz);
        macGroup.rotation.y = angle;
        macGroup.rotation.z = 0.35;
        toppingsGroup.add(macGroup);
      }
    } else if (decorId === 'choco_figures') {
      // Chocolate curls & golden geometric stars
      const chocoMat = new THREE.MeshStandardMaterial({
        color: 0x2A1408,
        roughness: 0.25,
        metalness: 0.2,
      });

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const cx = Math.cos(angle) * (topTier.radius * 0.5);
        const cz = Math.sin(angle) * (topTier.radius * 0.5);

        const curlGeo = new THREE.TorusGeometry(0.18, 0.04, 12, 24, Math.PI * 1.5);
        const curl = new THREE.Mesh(curlGeo, i % 2 === 0 ? chocoMat : goldMat);
        curl.position.set(cx, 0.18, cz);
        curl.rotation.x = Math.PI / 3;
        curl.rotation.y = angle;
        toppingsGroup.add(curl);
      }
    } else {
      // Minimalist: Whipped rosettes + pearl sprinkles
      const rosetteMat = new THREE.MeshStandardMaterial({
        color: creamHex,
        roughness: 0.4,
      });
      const pearlMat = new THREE.MeshStandardMaterial({
        color: 0xE8ECEF,
        roughness: 0.15,
        metalness: 0.6,
      });

      const count = 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const rx = Math.cos(angle) * (topTier.radius * 0.65);
        const rz = Math.sin(angle) * (topTier.radius * 0.65);

        const rosetteGeo = new THREE.ConeGeometry(0.14, 0.18, 12);
        const rosette = new THREE.Mesh(rosetteGeo, rosetteMat);
        rosette.position.set(rx, 0.09, rz);
        toppingsGroup.add(rosette);

        // Small pearl
        const pearlGeo = new THREE.SphereGeometry(0.04, 12, 12);
        const pearl = new THREE.Mesh(pearlGeo, pearlMat);
        pearl.position.set(rx * 0.7, 0.04, rz * 0.7);
        toppingsGroup.add(pearl);
      }
    }

    cakeGroup.add(toppingsGroup);

    // GREETING BANNER / PLAQUE
    const plaqueTexture = createPlaqueTexture(greetingText);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: plaqueTexture,
      transparent: true,
    });
    const plaqueGeo = new THREE.PlaneGeometry(1.6, 0.5);
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(0, topY + 0.35, topTier.radius * 0.35);
    plaqueMesh.rotation.x = -0.25;
    plaqueMeshRef.current = plaqueMesh;

    // Plaque support stand
    const standPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const standPoleMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8 });
    const pole1 = new THREE.Mesh(standPoleGeo, standPoleMat);
    pole1.position.set(-0.5, topY + 0.15, topTier.radius * 0.3);
    const pole2 = new THREE.Mesh(standPoleGeo, standPoleMat);
    pole2.position.set(0.5, topY + 0.15, topTier.radius * 0.3);

    cakeGroup.add(pole1);
    cakeGroup.add(pole2);
    cakeGroup.add(plaqueMesh);

    scene.add(cakeGroup);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 380;
    const height = 360;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.2);
    camera.lookAt(0, 0.8, 0);

    // 3. Renderer with antialiasing and transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting Setup (Pastry studio warm & glossy illumination)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xFFF6E8, 2.8, 25, Math.PI / 4, 0.3);
    mainSpot.position.set(5, 8, 7);
    mainSpot.castShadow = true;
    mainSpot.shadow.bias = -0.001;
    scene.add(mainSpot);

    const fillLight = new THREE.DirectionalLight(0xE0F2FE, 0.8);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xFDE68A, 1.4, 15);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    // Soft Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.25;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Build Initial Cake
    buildCakeModel(scene);

    // 6. Pointer Drag Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging || !cakeGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cakeGroupRef.current.rotation.y += deltaX * 0.009;
      cakeGroupRef.current.rotation.x = Math.max(
        -0.2,
        Math.min(0.3, cakeGroupRef.current.rotation.x + deltaY * 0.005)
      );

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 7. Render Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (cakeGroupRef.current && isRotatingRef.current && !isDragging) {
        cakeGroupRef.current.rotation.y += 0.006;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (mountRef.current && domElement) {
        mountRef.current.innerHTML = '';
      }
      renderer.dispose();
    };
  }, []);

  // Update cake model when any selection changes
  useEffect(() => {
    if (sceneRef.current) {
      buildCakeModel(sceneRef.current);
    }
  }, [weightId, biscuitId, creamId, decorId, greetingText]);

  const handleResetView = () => {
    if (cakeGroupRef.current) {
      cakeGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-100/80 via-white to-amber-50/40 dark:from-[#181B22] dark:via-[#14161C] dark:to-[#101217] border border-amber-200/50 dark:border-amber-500/20 shadow-xl transition-all">
      {/* Header Info Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 dark:bg-black/70 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60 text-[11px] font-bold text-[#2563EB] dark:text-[#93C5FD] shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse-subtle" />
          <span>Real-Vaqt 3D Studiya</span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-white/85 dark:bg-black/70 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-[#4B5563] dark:text-[#D1D5DB] text-xs cursor-pointer transition-colors shadow-xs"
            title="Kamera holatini tiklash"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs ${
              isRotating
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-white/85 dark:bg-black/70 border-stone-200/60 dark:border-stone-700/60 text-[#4B5563] dark:text-[#D1D5DB]'
            }`}
            title="Aylanishni yoqish / to‘xtatish"
          >
            <span>{isRotating ? 'Aylanmoqda' : 'To‘xtatilgan'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-[360px] cursor-grab active:cursor-grabbing flex items-center justify-center select-none touch-none"
        title="Tortni 360° aylantirib ko‘rish uchun sichqoncha bilan bosing va suring"
      />

      {/* Bottom Floating Hints */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/85 dark:bg-black/70 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60 text-[#6B7280] dark:text-[#9CA3AF]">
          <Move className="w-3 h-3 text-[#2563EB]" />
          <span>Surib aylantiring</span>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
          {tierCount} qavatli tort ({weightId})
        </div>
      </div>
    </div>
  );
};

export default Cake3DViewer;
