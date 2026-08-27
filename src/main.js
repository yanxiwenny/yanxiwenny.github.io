import "./styles.css";

const $ = (id) => document.getElementById(id);
const backCanvas = $("effects-back");
const frontCanvas = $("effects-front");
const backCtx = backCanvas.getContext("2d", { alpha: true });
const frontCtx = frontCanvas.getContext("2d", { alpha: true });
const petalSprite = $("petal-sprite");
const audio = $("bgm");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let scene = "welcome";
let wished = false;
let width = window.innerWidth;
let height = window.innerHeight;
let dpr = 1;
let mobile = window.matchMedia("(max-width: 720px)").matches;
let parallaxX = 0;
let parallaxY = 0;
let targetParallaxX = 0;
let targetParallaxY = 0;
let lastTime = performance.now();
let musicWanted = true;

const stars = [];
const heroMotes = [];
const petals = [];
const embers = [];
const bursts = [];

const heroStates = {};

for (const name of ["bouquet", "cake"]) {
  const stage = $(`${name}-stage`);
  const rotor = stage.querySelector(".hero-rotor");
  heroStates[name] = {
    name,
    stage,
    rotor,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startUserX: 0,
    startUserY: 0,
    userX: 0,
    userY: 0,
    rx: 0,
    ry: 0,
    phase: name === "bouquet" ? .2 : 1.4
  };
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPanel(id, active) {
  const panel = $(id);
  panel.classList.toggle("is-active", active);
  panel.setAttribute("aria-hidden", String(!active));
}

function resizeCanvases() {
  width = window.innerWidth;
  height = window.innerHeight;
  mobile = window.matchMedia("(max-width: 720px)").matches;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  for (const [canvas, ctx] of [[backCanvas, backCtx], [frontCanvas, frontCtx]]) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  createStars();
  createHeroMotes();
  createPetals();
  createEmbers();
}

function createStars() {
  stars.length = 0;
  const count = reducedMotion ? 42 : mobile ? 92 : 170;
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: random(.45, 2.15),
      alpha: random(.12, .68),
      twinkle: random(.7, 2.1),
      phase: random(0, Math.PI * 2),
      drift: random(1.2, 5.2),
      hue: Math.random() > .75 ? "153,190,255" : "255,232,171"
    });
  }
}

function createHeroMotes() {
  heroMotes.length = 0;
  const count = reducedMotion ? 96 : mobile ? 210 : 360;

  for (let i = 0; i < count; i += 1) {
    const core = Math.random() < .4;
    heroMotes.push({
      angle: random(0, Math.PI * 2),
      radius: core ? random(.08, .58) : random(.5, 1.08),
      vertical: random(.56, 1.02),
      phase: random(0, Math.PI * 2),
      drift: random(.035, .16) * (Math.random() > .5 ? 1 : -1),
      wanderX: random(4, 24),
      wanderY: random(4, 20),
      size: Math.random() < .07 ? random(1.35, 2.05) : random(.3, 1.18),
      alpha: random(.34, .94),
      twinkle: random(1.15, 4.8),
      front: Math.random() > .52,
      glint: Math.random() < .075,
      tone: Math.random()
    });
  }
}

function freshPetal(fromTop = true) {
  return {
    x: random(width * (mobile ? .06 : .42), width * .98),
    y: fromTop ? random(-height * .4, -20) : random(0, height),
    size: random(mobile ? 24 : 31, mobile ? 52 : 70),
    speed: random(12, 30),
    sway: random(16, 48),
    phase: random(0, Math.PI * 2),
    rotation: random(-Math.PI, Math.PI),
    spin: random(-.34, .34),
    alpha: random(.36, .78)
  };
}

function createPetals() {
  petals.length = 0;
  const count = reducedMotion ? 5 : mobile ? 9 : 16;
  for (let i = 0; i < count; i += 1) petals.push(freshPetal(false));
}

function createEmbers() {
  embers.length = 0;
  const count = reducedMotion ? 10 : mobile ? 22 : 38;
  for (let i = 0; i < count; i += 1) {
    embers.push({
      phase: random(0, Math.PI * 2),
      radius: random(18, 92),
      speed: random(.24, .72),
      size: random(.7, 2.35),
      alpha: random(.2, .72)
    });
  }
}

function heroPoint() {
  return {
    x: width * (mobile ? .5 : .69),
    y: height * (mobile ? .42 : .52)
  };
}

function candlePoint() {
  return {
    x: width * (mobile ? .5 : .69),
    y: height * (mobile ? .145 : .225)
  };
}

function burst(x, y, count = 48, palette = "pearl") {
  for (let i = 0; i < count; i += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(28, 172);
    bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: random(.42, 1.02),
      size: random(1, 3.7),
      color: palette === "gold"
        ? (Math.random() > .34 ? "255,211,119" : "255,250,224")
        : (Math.random() > .44 ? "173,190,255" : "255,244,220")
    });
  }
}

function updateBackgroundParallax() {
  if (reducedMotion) return;
  parallaxX += (targetParallaxX - parallaxX) * .045;
  parallaxY += (targetParallaxY - parallaxY) * .045;
  document.documentElement.style.setProperty("--parallax-x", `${parallaxX.toFixed(2)}px`);
  document.documentElement.style.setProperty("--parallax-y", `${parallaxY.toFixed(2)}px`);
}

function updateHeroDepth(time) {
  for (const state of Object.values(heroStates)) {
    let targetX = state.userX;
    let targetY = state.userY;

    if (!state.dragging && !reducedMotion) {
      targetX += Math.sin(time * .52 + state.phase) * 2.4;
      targetY += Math.sin(time * .39 + state.phase) * 5.4;
      state.userX *= .998;
      state.userY *= .998;
    }

    state.rx += (targetX - state.rx) * (state.dragging ? .22 : .075);
    state.ry += (targetY - state.ry) * (state.dragging ? .22 : .075);

    const midX = state.ry * .62;
    const midY = -state.rx * .52;
    const frontX = state.ry * 1.18;
    const frontY = -state.rx * 1.02;

    state.rotor.style.setProperty("--hero-rx", `${state.rx.toFixed(2)}deg`);
    state.rotor.style.setProperty("--hero-ry", `${state.ry.toFixed(2)}deg`);
    state.rotor.style.setProperty("--layer-x-mid", `${midX.toFixed(2)}px`);
    state.rotor.style.setProperty("--layer-y-mid", `${midY.toFixed(2)}px`);
    state.rotor.style.setProperty("--layer-x-front", `${frontX.toFixed(2)}px`);
    state.rotor.style.setProperty("--layer-y-front", `${frontY.toFixed(2)}px`);
    state.rotor.style.setProperty("--shadow-x", `${(-state.ry * 1.42).toFixed(2)}px`);
    state.rotor.style.setProperty("--shadow-y", `${(12 + state.rx * .55).toFixed(2)}px`);
  }
}

function drawStars(time) {
  for (const star of stars) {
    const pulse = .52 + Math.sin(time * star.twinkle + star.phase) * .48;
    const alpha = star.alpha * (.42 + pulse * .58);
    star.y -= star.drift * .004;
    if (star.y < -4) star.y = height + 4;
    backCtx.beginPath();
    backCtx.fillStyle = `rgba(${star.hue},${alpha})`;
    backCtx.shadowColor = `rgba(${star.hue},.75)`;
    backCtx.shadowBlur = star.size * 6;
    backCtx.arc(star.x, star.y, star.size * (.72 + pulse * .28), 0, Math.PI * 2);
    backCtx.fill();
  }
  backCtx.shadowBlur = 0;
}

function drawHeroHalo(ctx, time) {
  if (scene !== "bouquet" && scene !== "cake" && scene !== "wished") return;
  const point = heroPoint();
  const radius = Math.min(width * (mobile ? .44 : .29), height * .43);
  const pulse = 1 + Math.sin(time * 1.15) * .04;
  const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * pulse);
  glow.addColorStop(0, scene === "bouquet" ? "rgba(176,159,255,.18)" : "rgba(120,151,255,.2)");
  glow.addColorStop(.48, "rgba(104,118,227,.08)");
  glow.addColorStop(1, "rgba(24,30,70,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
}

function drawHeroMotes(ctx, time, front) {
  if (scene !== "bouquet" && scene !== "cake" && scene !== "wished") return;

  const point = heroPoint();
  const state = scene === "bouquet" ? heroStates.bouquet : heroStates.cake;
  const cakeScene = scene !== "bouquet";
  const extentX = Math.min(width * (mobile ? .47 : cakeScene ? .265 : .31), height * (cakeScene ? .43 : .54));
  const extentY = Math.min(height * (mobile ? .31 : cakeScene ? .42 : .4), width * .27);
  const rotationShift = state.ry * (front ? 1.05 : -.55);

  for (const mote of heroMotes) {
    if (mote.front !== front) continue;

    const angle = mote.angle + time * mote.drift;
    const driftX = Math.sin(time * .29 + mote.phase) * mote.wanderX;
    const driftY = Math.cos(time * .23 + mote.phase * 1.17) * mote.wanderY;
    const x = point.x + Math.cos(angle) * extentX * mote.radius + driftX + rotationShift;
    const y = point.y + Math.sin(angle) * extentY * mote.radius * mote.vertical + driftY - state.rx * (front ? .7 : -.3);
    const wave = .5 + Math.sin(time * mote.twinkle + mote.phase) * .5;
    const flash = Math.pow(wave, 2.15);
    const alpha = mote.alpha * (front ? .3 + flash * .7 : .15 + flash * .45);
    const size = mote.size * (.72 + flash * .38);
    const color = cakeScene
      ? (mote.tone < .5 ? "255,226,157" : mote.tone < .76 ? "238,244,255" : mote.tone < .9 ? "183,203,255" : "222,183,255")
      : (mote.tone < .46 ? "255,244,211" : mote.tone < .72 ? "213,226,255" : mote.tone < .9 ? "184,206,255" : "225,188,255");

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${color})`;
    ctx.shadowColor = `rgba(${color},.92)`;
    ctx.shadowBlur = size * (front ? 9 : 6);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (mote.glint && flash > .78) {
      const ray = size * (2.7 + flash * 2.2);
      ctx.globalAlpha = alpha * .58;
      ctx.lineWidth = Math.max(.35, size * .22);
      ctx.beginPath();
      ctx.moveTo(x - ray, y);
      ctx.lineTo(x + ray, y);
      ctx.moveTo(x, y - ray);
      ctx.lineTo(x, y + ray);
      ctx.strokeStyle = `rgba(${color},.9)`;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

function drawPetals(delta, time) {
  if (scene !== "bouquet" || !petalSprite.complete) return;

  for (const petal of petals) {
    petal.y += petal.speed * delta;
    petal.rotation += petal.spin * delta;
    const x = petal.x + Math.sin(time * .72 + petal.phase) * petal.sway;

    if (petal.y > height + petal.size * 1.6) Object.assign(petal, freshPetal(true));

    frontCtx.save();
    frontCtx.translate(x, petal.y);
    frontCtx.rotate(petal.rotation + Math.sin(time + petal.phase) * .12);
    frontCtx.globalAlpha = petal.alpha;
    frontCtx.drawImage(petalSprite, -petal.size * .49, -petal.size * .5, petal.size * .98, petal.size);
    frontCtx.restore();
  }
}

function drawCandle(time) {
  if (scene !== "cake" && scene !== "wished") return;
  const anchor = candlePoint();
  const breath = .86 + Math.sin(time * 5.2) * .08 + Math.sin(time * 2.3) * .06;
  if (wished) return;

  const sway = Math.sin(time * 4.7) * 3.2 + Math.sin(time * 8.1) * 1.15;
  const flameHeight = 31 * breath;
  const flameWidth = 8.4 + Math.sin(time * 6.4) * .8;
  const glowY = anchor.y - flameHeight * .46;

  const glow = backCtx.createRadialGradient(anchor.x + sway * .3, glowY, 0, anchor.x, glowY, 82 * breath);
  glow.addColorStop(0, "rgba(255,250,220,.66)");
  glow.addColorStop(.22, "rgba(255,190,92,.3)");
  glow.addColorStop(1, "rgba(255,164,77,0)");
  backCtx.fillStyle = glow;
  backCtx.fillRect(anchor.x - 96, glowY - 96, 192, 192);

  frontCtx.save();
  frontCtx.translate(anchor.x + sway, anchor.y);
  frontCtx.shadowColor = "rgba(255,177,62,.95)";
  frontCtx.shadowBlur = 16;
  const flameGradient = frontCtx.createLinearGradient(0, 4, 0, -flameHeight);
  flameGradient.addColorStop(0, "rgba(255,119,34,.98)");
  flameGradient.addColorStop(.42, "rgba(255,218,115,1)");
  flameGradient.addColorStop(.78, "rgba(255,250,222,1)");
  flameGradient.addColorStop(1, "rgba(203,225,255,.93)");
  frontCtx.fillStyle = flameGradient;
  frontCtx.beginPath();
  frontCtx.moveTo(0, 4);
  frontCtx.bezierCurveTo(-flameWidth, -4, -flameWidth * .72, -flameHeight * .58, sway * .18, -flameHeight);
  frontCtx.bezierCurveTo(flameWidth * .72, -flameHeight * .56, flameWidth, -3, 0, 4);
  frontCtx.fill();

  frontCtx.shadowBlur = 6;
  frontCtx.fillStyle = "rgba(255,255,244,.88)";
  frontCtx.beginPath();
  frontCtx.moveTo(0, 1);
  frontCtx.bezierCurveTo(-3.2, -4, -2.3, -flameHeight * .38, sway * .1, -flameHeight * .62);
  frontCtx.bezierCurveTo(3, -flameHeight * .34, 3.3, -3, 0, 1);
  frontCtx.fill();
  frontCtx.restore();

  for (const ember of embers) {
    const progress = (time * ember.speed + ember.phase) % 1;
    const x = anchor.x + sway * .35 + Math.sin(progress * 7 + ember.phase) * ember.radius * .22;
    const y = anchor.y - flameHeight * .78 - progress * ember.radius;
    frontCtx.beginPath();
    frontCtx.fillStyle = `rgba(255,220,139,${ember.alpha * (1 - progress)})`;
    frontCtx.shadowColor = "rgba(255,198,93,.9)";
    frontCtx.shadowBlur = 9;
    frontCtx.arc(x, y, ember.size * (1 - progress * .4), 0, Math.PI * 2);
    frontCtx.fill();
  }
  frontCtx.shadowBlur = 0;
}

function drawBursts(delta) {
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const particle = bursts[i];
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vx *= .985;
    particle.vy = particle.vy * .985 + 8 * delta;
    particle.life -= particle.decay * delta;

    if (particle.life <= 0) {
      bursts.splice(i, 1);
      continue;
    }

    frontCtx.beginPath();
    frontCtx.fillStyle = `rgba(${particle.color},${Math.max(0, particle.life)})`;
    frontCtx.shadowColor = `rgba(${particle.color},.9)`;
    frontCtx.shadowBlur = 11;
    frontCtx.arc(particle.x, particle.y, particle.size * Math.max(.2, particle.life), 0, Math.PI * 2);
    frontCtx.fill();
  }
  frontCtx.shadowBlur = 0;
}

function animate(now) {
  const delta = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
  const time = now / 1000;
  lastTime = now;

  backCtx.clearRect(0, 0, width, height);
  frontCtx.clearRect(0, 0, width, height);
  updateBackgroundParallax();
  updateHeroDepth(time);
  drawStars(time);
  drawHeroHalo(backCtx, time);
  drawHeroMotes(backCtx, time, false);
  drawCandle(time);
  drawHeroMotes(frontCtx, time, true);
  drawPetals(delta, time);
  drawBursts(delta);
  requestAnimationFrame(animate);
}

function updateScene(next) {
  scene = next;
  document.body.dataset.scene = scene;
}

async function startMusic() {
  if (!musicWanted) return;
  try {
    audio.volume = .38;
    await audio.play();
    $("music").textContent = "音乐：开";
    $("music").setAttribute("aria-pressed", "true");
  } catch (error) {
    $("music").textContent = "音乐：轻触开启";
    $("music").setAttribute("aria-pressed", "false");
    console.warn("音乐未能自动播放。", error);
  }
}

function startExperience() {
  if (scene !== "welcome") return;
  updateScene("bouquet");
  setPanel("welcome", false);
  setPanel("bouquet-copy", true);
  $("controls").classList.add("is-visible");
  const point = heroPoint();
  burst(point.x, point.y, mobile ? 46 : 92, "pearl");
  startMusic();
}

function acceptBouquet() {
  if (scene !== "bouquet") return;
  updateScene("cake");
  setPanel("bouquet-copy", false);
  setPanel("birthday", true);
  const point = heroPoint();
  burst(point.x, point.y, mobile ? 52 : 110, "gold");
}

function makeWish() {
  if (scene !== "cake") return;
  wished = true;
  updateScene("wished");
  $("birthday").classList.add("is-wished");
  const anchor = candlePoint();
  burst(anchor.x, anchor.y, mobile ? 86 : 160, "gold");
}

function toggleMusic() {
  if (audio.paused) {
    musicWanted = true;
    startMusic();
  } else {
    musicWanted = false;
    audio.pause();
    $("music").textContent = "音乐：关";
    $("music").setAttribute("aria-pressed", "false");
  }
}

function resetHero(state) {
  state.dragging = false;
  state.userX = 0;
  state.userY = 0;
  state.rx = 0;
  state.ry = 0;
  state.stage.classList.remove("is-dragged");
}

function replayExperience() {
  wished = false;
  updateScene("welcome");
  $("birthday").classList.remove("is-wished");
  setPanel("birthday", false);
  setPanel("bouquet-copy", false);
  setPanel("welcome", true);
  bursts.length = 0;
  createPetals();
  targetParallaxX = 0;
  targetParallaxY = 0;
  Object.values(heroStates).forEach(resetHero);
}

function beginDrag(event, state) {
  if (scene !== state.name) return;
  state.dragging = true;
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.startY = event.clientY;
  state.startUserX = state.userX;
  state.startUserY = state.userY;
  state.rotor.setPointerCapture?.(event.pointerId);
  state.stage.classList.add("is-dragged");
}

function moveDrag(event, state) {
  if (!state.dragging || event.pointerId !== state.pointerId) return;
  state.userY = clamp(state.startUserY + (event.clientX - state.startX) * .095, -14, 14);
  state.userX = clamp(state.startUserX - (event.clientY - state.startY) * .065, -7, 7);
}

function endDrag(event, state) {
  if (!state.dragging || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
  state.dragging = false;
  state.pointerId = null;
  const point = heroPoint();
  burst(point.x + state.ry * 5, point.y - state.rx * 6, mobile ? 16 : 28, state.name === "cake" ? "gold" : "pearl");
}

for (const state of Object.values(heroStates)) {
  state.rotor.addEventListener("pointerdown", (event) => beginDrag(event, state));
  state.rotor.addEventListener("pointermove", (event) => moveDrag(event, state));
  state.rotor.addEventListener("pointerup", (event) => endDrag(event, state));
  state.rotor.addEventListener("pointercancel", (event) => endDrag(event, state));
  state.rotor.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      state.userY = clamp(state.userY + (event.key === "ArrowLeft" ? -2 : 2), -14, 14);
      state.stage.classList.add("is-dragged");
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      state.userX = clamp(state.userX + (event.key === "ArrowUp" ? -1.5 : 1.5), -7, 7);
      state.stage.classList.add("is-dragged");
    }
  });
}

window.addEventListener("pointermove", (event) => {
  targetParallaxX = ((event.clientX / width) - .5) * -13;
  targetParallaxY = ((event.clientY / height) - .5) * -8;
});

$("start").addEventListener("click", startExperience);
$("accept").addEventListener("click", acceptBouquet);
$("wish").addEventListener("click", makeWish);
$("music").addEventListener("click", toggleMusic);
$("replay").addEventListener("click", replayExperience);
window.addEventListener("resize", resizeCanvases);

document.body.dataset.scene = "welcome";
resizeCanvases();
requestAnimationFrame(animate);
document.documentElement.dataset.birthdayReady = "true";
