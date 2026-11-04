import * as THREE from 'three';
import { webglAvailable } from './webgl';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** The Kobra mark as a solid object, built from the logo's own 256-unit SVG geometry. */
const tileShape = () => {
  const shape = new THREE.Shape(), s = 120, r = 62;
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s); shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r); shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s); shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r); shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return shape;
};
// SVG coordinates (y down, 0–256) to centered model coordinates (y up).
const polygon = (points: [number, number][]) => new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x - 128, 128 - y)));
const letter = () => polygon([[76, 61], [105, 61], [105, 117], [155, 61], [192, 61], [132, 126], [195, 195], [156, 195], [105, 137], [105, 195], [76, 195]]);
const notch = () => polygon([[121, 120], [149, 128], [121, 137]]);

export async function createEmblem(host: HTMLElement) {
  if (!webglAvailable()) throw new Error('WebGL is unavailable');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const environment = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = environment.fromScene(room, .04).texture;
  room.dispose(); environment.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, 0, 9.4);

  const tileMaterial = new THREE.MeshPhysicalMaterial({ roughness: .24, metalness: .05, clearcoat: 1, clearcoatRoughness: .12 });
  const letterMaterial = new THREE.MeshPhysicalMaterial({ roughness: .3, metalness: .85, clearcoat: .6, clearcoatRoughness: .2 });
  const notchMaterial = new THREE.MeshPhysicalMaterial({ roughness: .2, metalness: .1, clearcoat: 1 });
  const extrude = (shape: THREE.Shape, depth: number, bevel: number) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 28 });
  const model = new THREE.Group();
  const tile = new THREE.Mesh(extrude(tileShape(), 26, 10), tileMaterial);
  const mark = new THREE.Group();
  const k = new THREE.Mesh(extrude(letter(), 12, 2.5), letterMaterial);
  const play = new THREE.Mesh(extrude(notch(), 14, 1.2), notchMaterial);
  mark.add(k, play);
  model.add(tile, mark);
  model.scale.setScalar(.01);
  model.position.z = -.18;
  scene.add(model);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // Pearl: white tile and graphite K. Midnight: graphite tile and silver K, like the app icons.
  const applyTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    tileMaterial.color.set(dark ? 0x2a2a2e : 0xf3f3f5);
    letterMaterial.color.set(dark ? 0xd9d9de : 0x1c1c1f);
    notchMaterial.color.set(dark ? 0x2a2a2e : 0xfafafa);
    renderer.toneMappingExposure = dark ? 1.05 : .95;
    requestDraw();
  };

  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  let visible = true, frame = 0, disposed = false, contextLost = false;
  let pointerX = 0, pointerY = 0, rotationX = .3, rotationY = -.9, lift = 0;
  function size() {
    if (disposed) return;
    const width = renderer.domElement.clientWidth, height = renderer.domElement.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function draw() {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden || reducedMotion.matches) return;
    const rect = host.getBoundingClientRect();
    // Scroll position alone drives the turn: the K rises out of the tile, then faces you.
    const progress = THREE.MathUtils.clamp((innerHeight - rect.top) / (innerHeight * .8), 0, 1);
    const targetY = -1 + progress * .74 + pointerX * .35;
    const targetX = .44 - progress * .3 - pointerY * .25;
    const targetLift = THREE.MathUtils.smoothstep(progress, .15, .75);
    rotationX += (targetX - rotationX) * .1;
    rotationY += (targetY - rotationY) * .1;
    lift += (targetLift - lift) * .1;
    model.rotation.set(rotationX, rotationY, -.06 + progress * .06);
    mark.position.z = 36 - 26 * (1 - lift);
    play.position.z = 2;
    renderer.render(scene, camera);
    if (!host.classList.contains('is-ready')) { host.classList.add('is-ready'); host.dataset.renderer = 'webgl'; }
    if (Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) + Math.abs(targetLift - lift) > .0003) requestDraw();
  }
  function requestDraw() { if (!frame && !disposed && !contextLost && visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw); }
  applyTheme();
  const resize = new ResizeObserver(size);
  resize.observe(renderer.domElement);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) requestDraw(); });
  visibility.observe(host);
  const section = host.closest('section') || host;
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    pointerX = THREE.MathUtils.clamp((event.clientX - rect.left - rect.width / 2) / innerWidth, -.5, .5);
    pointerY = THREE.MathUtils.clamp((event.clientY - rect.top - rect.height / 2) / innerHeight, -.5, .5);
    requestDraw();
  };
  const resetPointer = () => { pointerX = pointerY = 0; requestDraw(); };
  section.addEventListener('pointermove', pointer as EventListener);
  section.addEventListener('pointerleave', resetPointer);
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('kobra-site-theme', applyTheme);
  document.addEventListener('visibilitychange', requestDraw);
  reducedMotion.addEventListener('change', requestDraw);
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; host.classList.remove('is-ready'); host.dataset.renderer = 'fallback'; };
  const restored = () => { contextLost = false; requestDraw(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect(); visibility.disconnect();
    section.removeEventListener('pointermove', pointer as EventListener); section.removeEventListener('pointerleave', resetPointer);
    window.removeEventListener('scroll', requestDraw); window.removeEventListener('kobra-site-theme', applyTheme);
    document.removeEventListener('visibilitychange', requestDraw); reducedMotion.removeEventListener('change', requestDraw);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    renderer.domElement.removeEventListener('webglcontextrestored', restored);
    model.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    [tileMaterial, letterMaterial, notchMaterial].forEach(material => material.dispose());
    scene.environment?.dispose(); renderer.dispose(); renderer.domElement.remove(); host.classList.remove('is-ready');
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  size();
}
