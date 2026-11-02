/* ============================================================
   SCREEN 1: 3D AMBIENT STARDUST & PARALLAX ENGINE
   Adds deep artistic 3D celestial motes with smooth GPU-based
   parallax and responsive camera depth.
   ============================================================ */
import * as THREE from 'three';

export class Screen1_3DBackground {
  constructor() {
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.enabled = true;
    this.targetMouse = { x: 0, y: 0 };
    this.currentMouse = { x: 0, y: 0 };

    this.onPointerMove = this.onPointerMove.bind(this);
  }

  onMount(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    const count = window.innerWidth <= 768 ? 90 : 160;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const baseColor1 = new THREE.Color(0xff9ec7); // Rose pink
    const baseColor2 = new THREE.Color(0xffd5a5); // Warm champagne
    const baseColor3 = new THREE.Color(0xffffff); // Pure starlight

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread across 3D space with deep Z-depth
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 8 - 1;

      const mix = Math.random();
      const c = mix < 0.4 ? baseColor1 : mix < 0.75 ? baseColor2 : baseColor3;
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = Math.random() * 0.04 + 0.02;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circle texture for soft glowing particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,220,240,0.85)');
    grad.addColorStop(0.7, 'rgba(255,160,200,0.25)');
    grad.addColorStop(1, 'rgba(255,160,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
  }

  onPointerMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetMouse.x = x * 0.4;
    this.targetMouse.y = y * 0.3;
  }

  onUpdate(delta, elapsed) {
    if (!this.points || !this.enabled) return;

    // Smooth lerp mouse parallax
    this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.05;
    this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.05;

    this.points.rotation.y = elapsed * 0.03 + this.currentMouse.x * 0.3;
    this.points.rotation.x = Math.sin(elapsed * 0.04) * 0.05 + this.currentMouse.y * 0.2;

    const positions = this.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += Math.sin(elapsed + i) * 0.0015;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  disperseAndFade() {
    if (!this.material) return;
    const startOpacity = this.material.opacity;
    const startTime = performance.now();
    const duration = 800;

    const fadeStep = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      this.material.opacity = startOpacity * (1 - p);
      if (this.points) {
        this.points.scale.setScalar(1 + p * 0.5);
      }
      if (p < 1) {
        requestAnimationFrame(fadeStep);
      } else {
        this.enabled = false;
      }
    };
    requestAnimationFrame(fadeStep);
  }

  onDestroy(scene) {
    window.removeEventListener('pointermove', this.onPointerMove);
    if (this.points) {
      scene.remove(this.points);
      this.geometry.dispose();
      this.material.dispose();
      this.points = null;
    }
  }
}

