/*
 * LC-3 schematic: a real, legible line drawing of the machine the site's
 * author actually built (register file, memory, ALU). Loaded on demand,
 * never blocking, and skipped when motion is reduced or the viewport is small.
 */
async function initHeroField() {
  const canvas = document.getElementById('hero-field');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  if (window.innerWidth < 1000) return;
  if (navigator.connection && navigator.connection.saveData) return;

  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return;
  } catch (e) {
    return;
  }

  let THREE;
  try {
    THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  } catch (e) {
    return; // keep the plain bordered panel as fallback
  }

  const wrap = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const group = new THREE.Group();
  scene.add(group);

  const isDark = () => {
    const sheet = document.getElementById('dark-theme');
    return sheet ? !sheet.disabled : false;
  };
  const INK = { light: 0x1b1a17, dark: 0xe8e5db };
  const ACCENT = 0x4b61d1;

  const matInk = new THREE.LineBasicMaterial({
    color: isDark() ? INK.dark : INK.light,
    transparent: true,
    opacity: 0.55
  });
  const matAccent = new THREE.LineBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.9
  });

  function box(w, h, d, x, y, z, mat) {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    const line = new THREE.LineSegments(geo, mat || matInk);
    line.position.set(x, y, z);
    group.add(line);
    return line;
  }

  // Die outline.
  box(6.2, 3.6, 0.02, 0, 0, 0, matInk);

  // Register file: eight small cells across the top.
  for (let i = 0; i < 8; i++) {
    box(0.5, 0.5, 0.02, -2.95 + i * 0.62, 1.15, 0.02, matAccent);
  }

  // Memory: an 8 x 3 grid.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      box(0.52, 0.42, 0.01, -2.95 + c * 0.62, -0.15 - r * 0.6, 0.02, matInk);
    }
  }

  // ALU block.
  box(1.2, 1.0, 0.02, 2.3, -1.35, 0.02, matAccent);

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let visible = true;
  let t = 0;

  function step() {
    requestAnimationFrame(step);
    if (!visible) return;
    t += 0.004;
    group.rotation.y = Math.sin(t) * 0.32;
    group.rotation.x = -0.12 + Math.sin(t * 0.6) * 0.05;
    renderer.render(scene, camera);
  }
  step();

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && !document.hidden;
  }, { threshold: 0.05 });
  observer.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  document.querySelectorAll('.dark-theme-toggle').forEach((el) => {
    el.addEventListener('click', () => {
      matInk.color.setHex(isDark() ? INK.dark : INK.light);
    });
  });
}

initHeroField();