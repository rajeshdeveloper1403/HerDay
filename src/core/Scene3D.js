/* ============================================================
   CORE 3D ENGINE — THREE.JS ORCHESTRATOR
   Responsive, high-performance WebGL manager with dynamic camera
   frustum, tone mapping, and seamless screen hooks.
   ============================================================ */
import * as THREE from 'three';

class Scene3DManager {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.activeModules = new Map();
    this.rafId = 0;
    this.isRunning = false;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.onResize = this.onResize.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.animate = this.animate.bind(this);
  }

  init(canvasElement) {
    if (!canvasElement) {
      console.warn('[Scene3D] Canvas element not provided.');
      return;
    }
    this.canvas = canvasElement;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera with dynamic Frustum
    this.camera = new THREE.PerspectiveCamera(
      this.getResponsiveFOV(),
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Default Ambient & Directional Lighting for romantic artistic tone
    this.ambientLight = new THREE.AmbientLight(0xffe6f0, 1.2);
    this.scene.add(this.ambientLight);

    this.mainLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    this.mainLight.position.set(5, 8, 5);
    this.scene.add(this.mainLight);

    this.rimLight = new THREE.PointLight(0xff7da7, 3.0, 15);
    this.rimLight.position.set(-4, -2, -2);
    this.scene.add(this.rimLight);

    // 5. Listeners
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('orientationchange', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.start();
    console.log('[Scene3D] Initialized successfully with Three.js', THREE.REVISION);
  }

  getResponsiveFOV() {
    const aspect = this.width / this.height;
    // On vertical/mobile screens (aspect < 1), zoom camera out dynamically
    // so 3D objects are never cropped or clipped.
    if (aspect < 1) {
      return 50 + (1 - aspect) * 22;
    }
    return 45;
  }

  registerModule(name, moduleInstance) {
    if (this.activeModules.has(name)) {
      this.unregisterModule(name);
    }
    this.activeModules.set(name, moduleInstance);
    if (moduleInstance.onMount && this.scene) {
      moduleInstance.onMount(this.scene, this.camera, this.renderer);
    }
  }

  unregisterModule(name) {
    const mod = this.activeModules.get(name);
    if (mod) {
      if (mod.onDestroy && this.scene) {
        mod.onDestroy(this.scene);
      }
      this.activeModules.delete(name);
    }
  }

  getModule(name) {
    return this.activeModules.get(name);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    if (this.camera && this.renderer) {
      this.camera.aspect = this.width / this.height;
      this.camera.fov = this.getResponsiveFOV();
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.width, this.height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Notify all active modules of resize
      for (const mod of this.activeModules.values()) {
        if (mod.onResize) mod.onResize(this.width, this.height);
      }
    }
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.rafId = requestAnimationFrame(this.animate);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.clock.stop();
  }

  animate() {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Update active modules
    for (const mod of this.activeModules.values()) {
      if (mod.onUpdate && mod.enabled !== false) {
        mod.onUpdate(delta, elapsed);
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    for (const name of Array.from(this.activeModules.keys())) {
      this.unregisterModule(name);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

export const scene3D = new Scene3DManager();

