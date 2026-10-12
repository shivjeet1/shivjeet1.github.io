/*
 * Hero scene: a ThinkPad rendered with three.js, with the author's real
 * hyprlock desktop shown on the display.
 *
 * Loaded on demand and only when there is a canvas, WebGL, a roomy viewport
 * and no save-data request; otherwise the bordered panel is left as-is. When
 * the visitor prefers reduced motion a single static frame is drawn instead
 * of the idle animation.
 */
async function initHeroLaptop() {
  const canvas = document.getElementById('hero-scene');
  if (!canvas) return;

  if (window.innerWidth <= 900) return;
  if (navigator.connection && navigator.connection.saveData) return;

  try {
    const probe = document.createElement('canvas');
    const gl =
      probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl');
    if (!gl) return;
  } catch (e) {
    return;
  }

  let THREE;
  let GLTFLoader;
  try {
    THREE = await import('three');
    ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  } catch (e) {
    return; // leave the empty panel in place
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const group = new THREE.Group();
  scene.add(group);

  // Neutral, paper-friendly lighting. The glTF body is pure black, which would
  // read as a flat silhouette, so it is lifted to a warm charcoal below.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc9ba, 1.15);
  const key = new THREE.DirectionalLight(0xfff6e9, 2.1);
  key.position.set(4, 7, 6);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.55);
  fill.position.set(-6, 2, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-1, 3, -8);
  scene.add(hemi, key, fill, rim);

  const isDark = () => {
    const sheet = document.getElementById('dark-theme');
    return sheet ? !sheet.disabled : false;
  };

  let bodyMat = null;

  function applyTheme() {
    const dark = isDark();
    hemi.color.setHex(dark ? 0x8b93a8 : 0xffffff);
    hemi.groundColor.setHex(dark ? 0x161511 : 0xcfc9ba);
    hemi.intensity = dark ? 0.8 : 1.15;
    key.color.setHex(dark ? 0xf2ead9 : 0xfff6e9);
    key.intensity = dark ? 1.9 : 2.1;
    fill.color.setHex(dark ? 0x9fb0e6 : 0xdfe6ff);
    fill.intensity = dark ? 0.5 : 0.55;
    rim.color.setHex(dark ? 0xcfd6ff : 0xffffff);
    rim.intensity = dark ? 1.4 : 0.7;
    if (bodyMat) bodyMat.color.setHex(dark ? 0x3a372f : 0x2c2a25);
  }
  applyTheme();

  // ---- model ---------------------------------------------------------------
  const root = await new Promise((resolve) => {
    new GLTFLoader().load('/models/leptop.glb', resolve, undefined, () => resolve(null));
  });
  if (!root) return;

  const model = root.scene;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  group.add(model);

  const baseYaw = -0.22;
  const baseTilt = 0.02;
  group.rotation.set(baseTilt, baseYaw, 0);

  let screen = null;
  model.traverse((node) => {
    if (!node.isMesh) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      if (!mat) continue;
      if (mat.roughness !== undefined && mat.roughness < 0.05) {
        screen = node; // the display is the only glossy (roughness 0) surface
      } else if (mat.color && mat.color.getHex() === 0x000000) {
        bodyMat = mat;
        mat.roughness = 0.5;
        mat.metalness = 0.16;
      }
    }
  });
  applyTheme();

  if (screen) {
    const texture = new THREE.TextureLoader().load('/images/hyprlock-shot.png', (tex) => {
      fitScreenTexture(tex, screen);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screen.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false
    });
  }

  // Map the screenshot across the panel without distortion. The glTF UVs sit
  // slightly inside 0..1, so both the crop and the centring account for them.
  function fitScreenTexture(texture, mesh) {
    const image = texture.image;
    const uv = mesh.geometry && mesh.geometry.attributes.uv;
    if (!image || !uv || !uv.count) return;

    let umin = Infinity;
    let umax = -Infinity;
    let vmin = Infinity;
    let vmax = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (u < umin) umin = u;
      if (u > umax) umax = u;
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
    const du = umax - umin;
    const dv = vmax - vmin;
    if (du <= 0 || dv <= 0) return;

    scene.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
    const dims = [size.x, size.y, size.z].sort((a, b) => b - a);
    const panelAspect = dims[1] > 0 ? dims[0] / dims[1] : 1;
    const imageAspect = image.width / image.height;

    let rx;
    let ry;
    if (imageAspect > panelAspect) {
      ry = 1 / dv;
      rx = panelAspect / (imageAspect * du);
    } else {
      rx = 1 / du;
      ry = imageAspect / (panelAspect * dv);
    }
    texture.repeat.set(rx, ry);
    texture.offset.set(0.5 - (rx * (umin + umax)) / 2, 0.5 - (ry * (vmin + vmax)) / 2);
  }

  // ---- camera framing ------------------------------------------------------
  const viewDir = new THREE.Vector3(0, 0.34, 1).normalize();

  function fit() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const halfH = halfV * camera.aspect;
    const dist = Math.max(size.y / 2 / halfV, size.x / 2 / halfH) * 1.08 + size.z / 2;
    camera.position.copy(center).addScaledVector(viewDir, dist);
    camera.lookAt(center);
  }
  fit();
  window.addEventListener('resize', fit, { passive: true });

  // ---- motion --------------------------------------------------------------
  let pointerX = 0;
  let pointerY = 0;
  let visible = true;
  let t = 0;

  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  function step() {
    requestAnimationFrame(step);
    if (!visible) return;
    t += 0.01;
    const yaw = baseYaw + Math.sin(t) * 0.05 + pointerX * 0.12;
    const tilt = baseTilt + Math.sin(t * 0.62) * 0.02 - pointerY * 0.05;
    group.rotation.y += (yaw - group.rotation.y) * 0.06;
    group.rotation.x += (tilt - group.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && !document.hidden;
  }, { threshold: 0.05 });
  observer.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  document.querySelectorAll('.dark-theme-toggle').forEach((el) => {
    el.addEventListener('click', applyTheme);
  });

  canvas.classList.add('is-ready');
  renderer.render(scene, camera);

  if (!reduce) step();
}

initHeroLaptop().catch(() => {});
