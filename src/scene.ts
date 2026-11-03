import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Procedural 3D product display. No external models, tracking, or remote texture dependencies. */
export async function createProductScene(host: HTMLElement, imageUrl: string) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 50);
  camera.position.set(0, .08, 11.5);
  const model = new THREE.Group();
  scene.add(model);
  const texture = await new THREE.TextureLoader().loadAsync(imageUrl).catch(error => { renderer.dispose(); throw error; });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const casing = new THREE.Mesh(new RoundedBoxGeometry(7.64, 4.81, .19, 5, .11), new THREE.MeshStandardMaterial({ color: 0x77777b, metalness: .85, roughness: .27 }));
  model.add(casing);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(7.56, 4.73, .06, 4, .08), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: .25, metalness: .35 }));
  bezel.position.z = .106;
  model.add(bezel);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(7.43, 4.644), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  display.position.z = .14;
  model.add(display);
  const power = new THREE.Mesh(new THREE.BoxGeometry(.28, .025, .05), new THREE.MeshStandardMaterial({ color: 0xaaaab0, metalness: .9, roughness: .2 }));
  power.position.set(2.6, 2.409, 0);
  model.add(power);
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const key = new THREE.DirectionalLight(0xffffff, 4);
  key.position.set(-4, 6, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 3);
  rim.position.set(5, -2, -2);
  scene.add(rim);

  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  let visible = true, frame = 0, disposed = false, contextLost = false;
  let pointerX = 0, pointerY = 0, rotationX = .07, rotationY = -.2;
  function size() {
    if (disposed) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the screen on both narrow phones and wide desktops with perspective breathing room.
    camera.position.z = Math.max(10.5, 4.5 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function draw() {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden || reducedMotion.matches) return;
    const rect = host.getBoundingClientRect();
    const progress = THREE.MathUtils.clamp((innerHeight * .7 - rect.top) / (innerHeight + rect.height), 0, 1);
    const targetX = .12 - progress * .18 + pointerY * .025;
    const targetY = -.25 + progress * .43 + pointerX * .045;
    rotationX += (targetX - rotationX) * .12;
    rotationY += (targetY - rotationY) * .12;
    model.rotation.set(rotationX, rotationY, -.025 + progress * .045);
    model.position.y = Math.sin(progress * Math.PI) * .07;
    renderer.render(scene, camera);
    if (!host.classList.contains('is-ready')) { host.classList.add('is-ready'); host.dataset.renderer = 'webgl'; }
    // Render only while settling or in response to input, never an endless idle loop.
    if (Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) > .0002) requestDraw();
  }
  function requestDraw() { if (!frame && !disposed && !contextLost && visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(size);
  resize.observe(host);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) requestDraw(); });
  visibility.observe(host);
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
    requestDraw();
  };
  const resetPointer = () => { pointerX = pointerY = 0; requestDraw(); };
  host.addEventListener('pointermove', pointer);
  host.addEventListener('pointerleave', resetPointer);
  window.addEventListener('scroll', requestDraw, { passive: true });
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
    host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', resetPointer);
    window.removeEventListener('scroll', requestDraw); document.removeEventListener('visibilitychange', requestDraw);
    reducedMotion.removeEventListener('change', requestDraw);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    renderer.domElement.removeEventListener('webglcontextrestored', restored);
    model.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
    texture.dispose(); renderer.dispose(); renderer.domElement.remove(); host.classList.remove('is-ready');
  };
  // Keep a BFCache-restored page usable; dispose on actual navigation or Vite replacement.
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  size();
}
