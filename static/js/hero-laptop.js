/*
 * Hero scene: a ThinkPad rendered with three.js, with the author's real
 * hyprlock desktop shown on its display. Drag to rotate, scroll to zoom,
 * right-drag (or two fingers) to pan.
 *
 * Loaded on demand and only when there is a canvas, WebGL, a roomy viewport
 * and no save-data request; otherwise the bordered panel is left as-is. When
 * the visitor prefers reduced motion the idle spin is disabled and frames are
 * only drawn in response to interaction.
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
  let OrbitControls;
  let RoomEnvironment;
  try {
    THREE = await import('three');
    ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
    ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
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

  // A neutral studio environment gives the body and display real reflections
  // instead of reading as flat colour.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = pmrem.fromScene(new RoomEnvironment(renderer), 0.04);
  scene.environment = room.texture;
  pmrem.dispose();

  // The glTF body is pure black, which would read as a silhouette, so it is
  // lifted to a warm charcoal. Lights are tuned to the site's paper/ink palette.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc9ba, 1.05);
  const key = new THREE.DirectionalLight(0xfff6e9, 2.0);
  key.position.set(4, 7, 6);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-6, 2, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 0.75);
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
    hemi.intensity = dark ? 0.85 : 1.05;
    key.color.setHex(dark ? 0xf2ead9 : 0xfff6e9);
    key.intensity = dark ? 1.9 : 2.0;
    fill.color.setHex(dark ? 0x9fb0e6 : 0xdfe6ff);
    fill.intensity = dark ? 0.5 : 0.5;
    rim.color.setHex(dark ? 0xcfd6ff : 0xffffff);
    rim.intensity = dark ? 1.4 : 0.75;
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
      if (mat.envMapIntensity !== undefined) mat.envMapIntensity = 0.45;
    }
  });
  applyTheme();

  if (screen) {
    const texture = new THREE.TextureLoader().load('/images/hyprlock-shot.png', (tex) => {
      fitScreenTexture(tex, screen);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // An LCD is mostly self-lit; the emissive map carries the image while the
    // low roughness lets the studio environment glint across the glass.
    screen.material = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: 0.95,
      roughness: 0.16,
      metalness: 0.0,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide
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

  // Light spilling off the display makes the keyboard read as part of one
  // scene rather than an image sitting on top of it.
  if (screen) {
    scene.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(screen).getCenter(new THREE.Vector3());
    const na = screen.geometry.attributes.normal;
    const normal = new THREE.Vector3(na.getX(0), na.getY(0), na.getZ(0))
      .applyMatrix3(new THREE.Matrix3().getNormalMatrix(screen.matrixWorld))
      .normalize();
    const spill = new THREE.PointLight(0xc2d0f0, 0.6, 4, 2);
    spill.position.copy(center).addScaledVector(normal, 0.35);
    scene.add(spill);
  }

  // ---- interaction ---------------------------------------------------------
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.7;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.45;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });
  controls.addEventListener('change', () => renderer.render(scene, camera));

  const viewDir = new THREE.Vector3(0, 0.34, 1).normalize();

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function fit() {
    resize();
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const halfH = halfV * camera.aspect;
    const dist = Math.max(size.y / 2 / halfV, size.x / 2 / halfH) * 1.08 + size.z / 2;
    camera.position.copy(center).addScaledVector(viewDir, dist);
    controls.target.copy(center);
    controls.minDistance = dist * 0.45;
    controls.maxDistance = dist * 2.4;
    controls.update();
  }
  fit();
  window.addEventListener('resize', resize, { passive: true });

  let visible = true;
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

  if (!reduce) {
    (function step() {
      requestAnimationFrame(step);
      if (visible) controls.update(); // damping + idle spin, renders via 'change'
    })();
  }

  canvas.classList.add('is-ready');
  renderer.render(scene, camera);
}

initHeroLaptop().catch(() => {});
