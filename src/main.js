import * as THREE from "three";
import "./styles.css";
import {
  createAmbientDust,
  createBouquet,
  createCake,
  createFallingPetals,
  createFormationParticles,
  updateAmbientDust,
  updateBouquet,
  updateCake,
  updateFallingPetals
} from "./models.js";

const $ = (id) => document.getElementById(id);
const canvas = $("scene");
const mobile = window.matchMedia("(max-width: 720px)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowPower = mobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    alpha: true,
    powerPreference: lowPower ? "default" : "high-performance"
  });
} catch (error) {
  document.body.classList.add("no-webgl");
  console.warn("WebGL unavailable", error);
}

if (renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd9ddea, mobile ? 0.025 : 0.018);

  const camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.1, mobile ? 12.8 : 10.8);

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemisphere = new THREE.HemisphereLight(0xf7f0ed, 0x586a92, 1.65);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffecd2, 2.25);
  keyLight.position.set(-4.5, 6.8, 5.8);
  keyLight.castShadow = !lowPower;
  keyLight.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9fb7e5, 1.35);
  fillLight.position.set(5, 2.2, 3.5);
  scene.add(fillLight);

  const pearlLight = new THREE.PointLight(0xe8d9ff, 1.3, 11, 1.7);
  pearlLight.position.set(1.5, 1.8, 3.2);
  scene.add(pearlLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.ShadowMaterial({ color: 0x5f6685, transparent: true, opacity: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.62, -0.2);
  floor.receiveShadow = true;
  scene.add(floor);

  const ambientDust = createAmbientDust(lowPower ? 360 : 720);
  scene.add(ambientDust);

  const fallingPetals = createFallingPetals(lowPower ? 10 : 18);
  fallingPetals.visible = false;
  scene.add(fallingPetals);

  const bouquetStage = new THREE.Group();
  const bouquet = createBouquet();
  const formation = createFormationParticles(lowPower ? 720 : 1500);
  bouquetStage.add(bouquet, formation);
  bouquetStage.visible = false;
  scene.add(bouquetStage);

  const cakeStage = new THREE.Group();
  const cake = createCake();
  cakeStage.add(cake);
  cakeStage.visible = false;
  scene.add(cakeStage);

  const audio = $("bgm");
  audio.volume = 0;
  let volumeTimer;
  let phase = "welcome";
  let phaseStartedAt = performance.now();
  let wishedAt = Number.POSITIVE_INFINITY;
  let userRotation = 0;
  let pointerDown = false;
  let pointerMoved = false;
  let pointerStartX = 0;
  let lastPointerX = 0;
  let lastFrame = performance.now();
  let musicWanted = true;
  let audioWarned = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const desktopBouquetScale = 0.98;
  const desktopCakeScale = 0.96;

  function setPanel(id, active) {
    const element = $(id);
    element.classList.toggle("is-active", active);
    element.setAttribute("aria-hidden", String(!active));
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeInOutCubic(value) {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function applyResponsiveLayout() {
    const aspect = window.innerWidth / window.innerHeight;
    const narrow = aspect < 0.82;
    camera.aspect = aspect;
    camera.position.z = narrow ? 12.8 : aspect > 1.85 ? 10.2 : 10.8;
    camera.position.y = narrow ? 0.12 : 0.05;
    camera.updateProjectionMatrix();

    const bouquetScale = narrow ? 0.7 : desktopBouquetScale;
    const cakeScale = narrow ? 0.72 : desktopCakeScale;
    bouquetStage.userData.baseScale = bouquetScale;
    cakeStage.userData.baseScale = cakeScale;
    bouquetStage.scale.setScalar(bouquetScale);
    cakeStage.scale.setScalar(cakeScale);
    bouquetStage.position.x = narrow ? 0 : 1.55;
    bouquetStage.position.y = narrow ? -0.8 : -0.08;
    bouquetStage.position.z = narrow ? 0 : 0;
    cakeStage.position.x = narrow ? 0 : 1.62;
    if (phase !== "cake" && phase !== "wished") cakeStage.position.y = -5;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.35 : 1.85));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  async function startMusic() {
    if (!musicWanted) return;
    try {
      await audio.play();
      $("music").textContent = "音乐：开";
      $("music").setAttribute("aria-pressed", "true");
      window.clearInterval(volumeTimer);
      volumeTimer = window.setInterval(() => {
        audio.volume = Math.min(0.42, audio.volume + 0.025);
        if (audio.volume >= 0.42) window.clearInterval(volumeTimer);
      }, 90);
    } catch (error) {
      if (!audioWarned) {
        console.warn("音乐未能自动播放，动画会继续。", error);
        audioWarned = true;
      }
      $("music").textContent = "音乐：轻触开启";
      $("music").setAttribute("aria-pressed", "false");
    }
  }

  function startExperience() {
    if (phase !== "welcome") return;
    phase = "forming";
    phaseStartedAt = performance.now();
    bouquetStage.visible = true;
    cakeStage.visible = false;
    formation.visible = true;
    formation.material.opacity = 0.9;
    setPanel("welcome", false);
    $("controls").classList.add("is-visible");
    startMusic();
  }

  function beginBouquetTransition() {
    if (phase !== "bouquet") return;
    phase = "transition";
    phaseStartedAt = performance.now();
    setPanel("bouquet-copy", false);
  }

  function revealCake() {
    phase = "cake";
    phaseStartedAt = performance.now();
    bouquetStage.visible = false;
    cakeStage.visible = true;
    cakeStage.position.y = -5;
    cakeStage.rotation.y = userRotation;
    setPanel("birthday", true);
  }

  function makeWish() {
    if (phase !== "cake") return;
    phase = "wished";
    phaseStartedAt = performance.now();
    wishedAt = performance.now() / 1000;
    cake.userData.extinguished = true;
    $("birthday").classList.add("is-wished");
  }

  function resetFormation() {
    const positions = formation.geometry.attributes.position;
    positions.array.set(formation.userData.starts);
    positions.needsUpdate = true;
    formation.material.opacity = 0.9;
  }

  function replayExperience() {
    phase = "welcome";
    phaseStartedAt = performance.now();
    wishedAt = Number.POSITIVE_INFINITY;
    userRotation = 0;
    cake.userData.extinguished = false;
    cake.userData.flame.visible = true;
    cake.userData.flame.scale.setScalar(1);
    cake.userData.flameLight.intensity = 4.8;
    cake.userData.smoke.material.opacity = 0;
    cakeStage.visible = false;
    bouquetStage.visible = false;
    resetFormation();
    $("birthday").classList.remove("is-wished");
    setPanel("birthday", false);
    setPanel("bouquet-copy", false);
    setPanel("welcome", true);
  }

  function toggleMusic() {
    musicWanted = audio.paused;
    if (audio.paused) {
      startMusic();
    } else {
      audio.pause();
      $("music").textContent = "音乐：关";
      $("music").setAttribute("aria-pressed", "false");
    }
  }

  function raycastCandle(event) {
    if (phase !== "cake" || pointerMoved) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(cake.userData.hitTarget, false);
    if (hit.length) makeWish();
  }

  $("start").addEventListener("click", startExperience);
  $("accept").addEventListener("click", beginBouquetTransition);
  $("wish").addEventListener("click", makeWish);
  $("replay").addEventListener("click", replayExperience);
  $("music").addEventListener("click", toggleMusic);

  canvas.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    pointerMoved = false;
    pointerStartX = event.clientX;
    lastPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    const dx = event.clientX - lastPointerX;
    if (Math.abs(event.clientX - pointerStartX) > 4) pointerMoved = true;
    userRotation += dx * 0.008;
    lastPointerX = event.clientX;
  });

  canvas.addEventListener("pointerup", (event) => {
    raycastCandle(event);
    pointerDown = false;
  });

  canvas.addEventListener("pointercancel", () => { pointerDown = false; });
  window.addEventListener("resize", applyResponsiveLayout, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(applyResponsiveLayout, 180), { passive: true });

  function updateFormation(progress) {
    const eased = easeOutCubic(progress);
    const positions = formation.geometry.attributes.position;
    const starts = formation.userData.starts;
    const targets = formation.userData.targets;
    for (let i = 0; i < positions.count; i += 1) {
      const shimmer = Math.sin(progress * Math.PI * 5 + i * 0.17) * (1 - progress) * 0.035;
      positions.array[i * 3] = THREE.MathUtils.lerp(starts[i * 3], targets[i * 3], eased) + shimmer;
      positions.array[i * 3 + 1] = THREE.MathUtils.lerp(starts[i * 3 + 1], targets[i * 3 + 1], eased);
      positions.array[i * 3 + 2] = THREE.MathUtils.lerp(starts[i * 3 + 2], targets[i * 3 + 2], eased) - shimmer;
    }
    positions.needsUpdate = true;
    formation.material.opacity = progress > 0.72 ? (1 - progress) / 0.28 : 0.9;
  }

  function animate(now) {
    const time = now / 1000;
    const elapsed = (now - phaseStartedAt) / 1000;
    const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;

    updateAmbientDust(ambientDust, time);
    updateBouquet(bouquet, time);
    updateCake(cake, time, wishedAt);
    updateFallingPetals(fallingPetals, time, delta, phase !== "welcome" && phase !== "forming");

    const idleSpin = reducedMotion ? 0 : Math.sin(time * 0.18) * 0.045;
    bouquetStage.rotation.y = userRotation + idleSpin;
    cakeStage.rotation.y = userRotation + idleSpin * 0.72;
    bouquetStage.rotation.z = Math.sin(time * 0.34) * 0.006;

    if (phase === "forming") {
      const duration = reducedMotion ? 0.45 : 4.1;
      const progress = clamp01(elapsed / duration);
      updateFormation(progress);
      const baseScale = bouquetStage.userData.baseScale;
      const revealScale = baseScale * (0.62 + easeOutCubic(progress) * 0.38);
      bouquetStage.scale.setScalar(revealScale);
      if (progress >= 1) {
        phase = "bouquet";
        phaseStartedAt = now;
        formation.visible = false;
        bouquetStage.scale.setScalar(baseScale);
        setPanel("bouquet-copy", true);
      }
    }

    if (phase === "bouquet" && elapsed > 10.5) beginBouquetTransition();

    if (phase === "transition") {
      const progress = clamp01(elapsed / (reducedMotion ? 0.3 : 1.85));
      const eased = easeInOutCubic(progress);
      bouquetStage.rotation.y = userRotation + eased * Math.PI * 0.9;
      bouquetStage.scale.setScalar(bouquetStage.userData.baseScale * (1 - eased * 0.56));
      bouquetStage.position.y -= delta * 0.5;
      bouquet.userData.transparentMaterials.forEach((material) => {
        material.opacity = Math.max(0.04, 0.2 * (1 - eased));
      });
      if (progress >= 1) revealCake();
    }

    if (phase === "cake" || phase === "wished") {
      const rise = clamp01(elapsed / (reducedMotion ? 0.35 : 2.1));
      const targetY = mobile ? -0.86 : -0.2;
      cakeStage.position.y = THREE.MathUtils.lerp(-5, targetY, easeOutCubic(rise));
      cakeStage.scale.setScalar(cakeStage.userData.baseScale * (0.84 + easeOutCubic(rise) * 0.16));
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  applyResponsiveLayout();
  requestAnimationFrame(animate);
  document.documentElement.dataset.birthdayReady = "true";
} else {
  const audio = $("bgm");
  audio.volume = 0.38;
  let fallbackPhase = "welcome";

  function fallbackPanel(id, active) {
    const element = $(id);
    element.classList.toggle("is-active", active);
    element.setAttribute("aria-hidden", String(!active));
  }

  async function fallbackMusic() {
    try {
      await audio.play();
      $("music").textContent = "音乐：开";
      $("music").setAttribute("aria-pressed", "true");
    } catch (error) {
      $("music").textContent = "音乐：轻触开启";
      console.warn("音乐未能自动播放。", error);
    }
  }

  $("start").addEventListener("click", () => {
    fallbackPhase = "bouquet";
    document.body.dataset.fallbackState = "bouquet";
    fallbackPanel("welcome", false);
    fallbackPanel("bouquet-copy", true);
    $("controls").classList.add("is-visible");
    fallbackMusic();
  });

  $("accept").addEventListener("click", () => {
    fallbackPhase = "cake";
    document.body.dataset.fallbackState = "cake";
    fallbackPanel("bouquet-copy", false);
    fallbackPanel("birthday", true);
  });

  $("wish").addEventListener("click", () => {
    if (fallbackPhase !== "cake") return;
    fallbackPhase = "wished";
    document.body.dataset.fallbackState = "wished";
    $("birthday").classList.add("is-wished");
  });

  $("music").addEventListener("click", () => {
    if (audio.paused) {
      fallbackMusic();
    } else {
      audio.pause();
      $("music").textContent = "音乐：关";
      $("music").setAttribute("aria-pressed", "false");
    }
  });

  $("replay").addEventListener("click", () => {
    fallbackPhase = "welcome";
    document.body.dataset.fallbackState = "welcome";
    $("birthday").classList.remove("is-wished");
    fallbackPanel("birthday", false);
    fallbackPanel("bouquet-copy", false);
    fallbackPanel("welcome", true);
  });

  document.body.dataset.fallbackState = "welcome";
  document.documentElement.dataset.birthdayReady = "fallback";
}
