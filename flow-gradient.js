/**
 * Flow Gradient Background - Three.js
 * Warm rust/cream animated gradient with mouse interaction
 */

class TouchTexture {
  constructor() {
    this.size = 64;
    this.width = 64;
    this.height = 64;
    this.maxAge = 32;
    this.radius = 0.1;
    this.speed = 1/64;
    this.trail = [];
    this.last = null;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      const f = p.force * this.speed * (1 - p.age / this.maxAge);
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.age++;
      if (p.age > this.maxAge) this.trail.splice(i, 1);
      else this.drawPoint(p);
    }
    this.texture.needsUpdate = true;
  }

  addTouch(point) {
    let force = 0, vx = 0, vy = 0;
    if (this.last) {
      const dx = point.x - this.last.x, dy = point.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const d = Math.sqrt(dx*dx + dy*dy);
      vx = dx/d;
      vy = dy/d;
      force = Math.min((dx*dx + dy*dy) * 8000, 1.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(p) {
    const pos = { x: p.x * this.width, y: (1 - p.y) * this.height };
    let intensity = p.age < this.maxAge * 0.3 
      ? Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2)) 
      : -((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) * ((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) - 2));
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const radius = this.radius * this.width;
    this.ctx.shadowOffsetX = this.size * 5;
    this.ctx.shadowOffsetY = this.size * 5;
    this.ctx.shadowBlur = radius;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

class FlowGradient {
  constructor(container) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    // Warm midnight background (#12110f)
    this.scene.background = new THREE.Color(0x12110f);
    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();
    
    // Warm color palette matching the design
    // rust: #c45c3e → rgb(196, 92, 62) → normalized (0.77, 0.36, 0.24)
    // rust-light: #d4735a → rgb(212, 115, 90) → normalized (0.83, 0.45, 0.35)
    // gold: #c9a55c → rgb(201, 165, 92) → normalized (0.79, 0.65, 0.36)
    // sage: #5a6b5c → rgb(90, 107, 92) → normalized (0.35, 0.42, 0.36)
    // cream-dark: #2d2a26 → rgb(45, 42, 38) → normalized (0.18, 0.16, 0.15)
    // midnight: #12110f → rgb(18, 17, 15) → normalized (0.07, 0.067, 0.059)
    
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uColor1: { value: new THREE.Vector3(0.77, 0.36, 0.24) },    // rust
      uColor2: { value: new THREE.Vector3(0.18, 0.16, 0.15) },    // ink-soft
      uColor3: { value: new THREE.Vector3(0.83, 0.45, 0.35) },    // rust-light
      uColor4: { value: new THREE.Vector3(0.12, 0.11, 0.09) },    // midnight deeper
      uColor5: { value: new THREE.Vector3(0.79, 0.65, 0.36) },    // gold
      uColor6: { value: new THREE.Vector3(0.15, 0.14, 0.12) },    // dark warm
      uSpeed: { value: 0.6 },
      uIntensity: { value: 1.1 },
      uTouchTexture: { value: this.touchTexture.texture },
      uGrainIntensity: { value: 0.04 },
      uDarkBase: { value: new THREE.Vector3(0.07, 0.067, 0.059) }, // midnight
      uGradientSize: { value: 0.5 },
      uColor1Weight: { value: 0.4 },
      uColor2Weight: { value: 1.0 }
    };
    
    this.init();
  }

  getViewSize() {
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2);
    const width = height * this.camera.aspect;
    if (isNaN(width) || isNaN(height) || width === 0 || height === 0) {
      return { width: 100, height: 100 };
    }
    return { width, height };
  }

  init() {
    const viewSize = this.getViewSize();
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `varying vec2 vUv; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vUv = uv; }`,
      fragmentShader: `
        uniform float uTime, uSpeed, uIntensity, uGrainIntensity, uGradientSize, uColor1Weight, uColor2Weight;
        uniform vec2 uResolution;
        uniform vec3 uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uDarkBase;
        uniform sampler2D uTouchTexture;
        varying vec2 vUv;
        
        float grain(vec2 uv, float t) {
          return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
        }
        
        vec3 getGradientColor(vec2 uv, float time) {
          // Slower, more organic movement
          vec2 c1 = vec2(0.5 + sin(time * uSpeed * 0.3) * 0.45, 0.5 + cos(time * uSpeed * 0.4) * 0.45);
          vec2 c2 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.5, 0.5 + sin(time * uSpeed * 0.35) * 0.5);
          vec2 c3 = vec2(0.5 + sin(time * uSpeed * 0.25) * 0.4, 0.5 + cos(time * uSpeed * 0.45) * 0.4);
          vec2 c4 = vec2(0.5 + cos(time * uSpeed * 0.4) * 0.45, 0.5 + sin(time * uSpeed * 0.3) * 0.45);
          vec2 c5 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.35, 0.5 + cos(time * uSpeed * 0.5) * 0.35);
          vec2 c6 = vec2(0.5 + cos(time * uSpeed * 0.35) * 0.5, 0.5 + sin(time * uSpeed * 0.55) * 0.5);
          
          float i1 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c1));
          float i2 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c2));
          float i3 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c3));
          float i4 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c4));
          float i5 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c5));
          float i6 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c6));
          
          vec3 color = vec3(0.0);
          color += uColor1 * i1 * (0.5 + 0.5 * sin(time * uSpeed * 0.8)) * uColor1Weight;
          color += uColor2 * i2 * (0.5 + 0.5 * cos(time * uSpeed * 1.0)) * uColor2Weight;
          color += uColor3 * i3 * (0.5 + 0.5 * sin(time * uSpeed * 0.6)) * uColor1Weight;
          color += uColor4 * i4 * (0.5 + 0.5 * cos(time * uSpeed * 1.1)) * uColor2Weight;
          color += uColor5 * i5 * (0.5 + 0.5 * sin(time * uSpeed * 0.9)) * uColor1Weight * 0.7;
          color += uColor6 * i6 * (0.5 + 0.5 * cos(time * uSpeed * 0.7)) * uColor2Weight;
          
          color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
          
          // Warm tone adjustment
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(lum), color, 1.4);
          color = pow(color, vec3(0.95));
          
          // Blend with warm dark base
          float brightness = length(color);
          color = mix(uDarkBase, color, max(brightness * 1.3, 0.1));
          
          return color;
        }
        
        void main() {
          vec2 uv = vUv;
          vec4 touchTex = texture2D(uTouchTexture, uv);
          uv.x -= (touchTex.r * 2.0 - 1.0) * 0.25 * touchTex.b;
          uv.y -= (touchTex.g * 2.0 - 1.0) * 0.25 * touchTex.b;
          vec2 center = vec2(0.5);
          float dist = length(uv - center);
          float ripple = sin(dist * 15.0 - uTime * 2.5) * 0.012 * touchTex.b;
          uv += vec2(ripple);
          vec3 color = getGradientColor(uv, uTime);
          color += grain(uv, uTime) * uGrainIntensity;
          color = clamp(color, vec3(0.0), vec3(1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    
    // Mouse interaction (throttled)
    const c = this.container;
    let lastMove = 0;
    const onMove = (x, y) => {
      const now = Date.now();
      if (now - lastMove < 32) return; // ~30fps throttle
      lastMove = now;
      this.touchTexture.addTouch({ x: x / c.clientWidth, y: 1 - y / c.clientHeight });
    };
    c.addEventListener("mousemove", (e) => onMove(e.offsetX, e.offsetY), { passive: true });
    c.addEventListener("touchmove", (e) => {
      const rect = c.getBoundingClientRect();
      onMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    }, { passive: true });
    
    window.addEventListener("resize", () => {
      const width = c.clientWidth || window.innerWidth;
      const height = c.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      const viewSize = this.getViewSize();
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
      this.uniforms.uResolution.value.set(width, height);
    });
    
    this.tick();
  }

  tick() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.touchTexture.update();
    this.uniforms.uTime.value += delta;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.tick());
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('heroGradient');
  if (container) {
    new FlowGradient(container);
  }
});
