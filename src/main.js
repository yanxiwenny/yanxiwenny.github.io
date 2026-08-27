import "./styles.css";

const $ = (id) => document.getElementById(id);
const canvas = $("effects");
const ctx = canvas.getContext("2d", { alpha: true });
const petalSprite = $("petal-sprite");
const audio = $("bgm");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = window.matchMedia("(max-width: 720px)").matches;

let scene = "welcome";
let wished = false;
let width = window.innerWidth;
let height = window.innerHeight;
let dpr = 1;
let pointerX = width * 0.5;
let pointerY = height * 0.5;
let parallaxX = 0;
let parallaxY = 0;
let targetParallaxX = 0;
let targetParallaxY = 0;
let lastTime = performance.now();
let musicWanted = true;

const stars = [];
const petals = [];
const embers = [];
const bursts = [];

function random(min, max) {
  return min + Math.random() * (max - min);
}

function setPanel(id, active) {
  const panel = $(id);
  panel.classList.toggle("is-active", active);
  panel.setAttribute("aria-hidden", String(!active));
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createStars();
  createPetals();
  createEmbers();
}

function createStars() {
  stars.length = 0;
  const count = reducedMotion ? 34 : mobile ? 72 : 130;
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: random(.55, 2.2),
      alpha: random(.12, .58),
      twinkle: random(.6, 1.8),
      phase: random(0, Math.PI * 2),
      drift: random(1.5, 5.5)
    });
  }
}

function freshPetal(fromTop = true) {
  return {
    x: random(width * .36, width * 1.04),
    y: fromTop ? random(-height * .45, -20) : random(0, height),
    size: random(mobile ? 25 : 34, mobile ? 54 : 76),
    speed: random(12, 31),
    sway: random(16, 45),
    phase: random(0, Math.PI * 2),
    rotation: random(-Math.PI, Math.PI),
    spin: random(-.3, .3),
    alpha: random(.38, .82)
  };
}

function createPetals() {
  petals.length = 0;
  const count = reducedMotion ? 5 : mobile ? 9 : 16;
  for (let i = 0; i < count; i += 1) petals.push(freshPetal(false));
}

function createEmbers() {
  embers.length = 0;
  const count = reducedMotion ? 9 : mobile ? 18 : 34;
  for (let i = 0; i < count; i += 1) {
    embers.push({
      phase: random(0, Math.PI * 2),
      radius: random(14, 82),
      speed: random(.24, .72),
      size: random(.6, 2.2),
      alpha: random(.18, .64)
    });
  }
}

function scenePoint() {
  return {
    x: width * (mobile ? .67 : .744),
    y: height * (mobile ? .2 : .19)
  };
}

function burst(x, y, count = 48, palette = "pearl") {
  for (let i = 0; i < count; i += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(24, 150);
    bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: random(.45, 1.05),
      size: random(1, 3.4),
      color: palette === "gold"
        ? (Math.random() > .36 ? "255,225,159" : "255,248,226")
        : (Math.random() > .45 ? "229,220,255" : "255,252,240")
    });
  }
}

function updateParallax() {
  if (reducedMotion) return;
  parallaxX += (targetParallaxX - parallaxX) * .045;
  parallaxY += (targetParallaxY - parallaxY) * .045;
  document.documentElement.style.setProperty("--parallax-x", parallaxX.toFixed(2) + "px");
  document.documentElement.style.setProperty("--parallax-y", parallaxY.toFixed(2) + "px");
}

function drawStars(time) {
  for (const star of stars) {
    const pulse = .52 + Math.sin(time * star.twinkle + star.phase) * .48;
    const alpha = star.alpha * (.42 + pulse * .58);
    star.y -= star.drift * .004;
    if (star.y < -4) star.y = height + 4;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,250,229,${alpha})`;
    ctx.shadowColor = "rgba(255,242,198,.75)";
    ctx.shadowBlur = star.size * 5;
    ctx.arc(star.x, star.y, star.size * (.74 + pulse * .26), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawPetals(delta, time) {
  if (scene !== "bouquet" || !petalSprite.complete) return;

  for (const petal of petals) {
    petal.y += petal.speed * delta;
    petal.rotation += petal.spin * delta;
    const x = petal.x + Math.sin(time * .72 + petal.phase) * petal.sway;

    if (petal.y > height + petal.size * 1.6) {
      Object.assign(petal, freshPetal(true));
    }

    ctx.save();
    ctx.translate(x, petal.y);
    ctx.rotate(petal.rotation + Math.sin(time + petal.phase) * .12);
    ctx.globalAlpha = petal.alpha;
    ctx.drawImage(petalSprite, -petal.size * .49, -petal.size * .5, petal.size * .98, petal.size);
    ctx.restore();
  }
}

function drawCandle(time) {
  if (scene !== "cake" && scene !== "wished") return;
  const anchor = scenePoint();
  const breath = .86 + Math.sin(time * 5.2) * .08 + Math.sin(time * 2.3) * .06;
  const strength = wished ? 0 : 1;

  if (strength > 0) {
    const glow = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, 72 * breath);
    glow.addColorStop(0, "rgba(255,250,220,.54)");
    glow.addColorStop(.22, "rgba(255,213,125,.24)");
    glow.addColorStop(1, "rgba(255,199,100,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(anchor.x - 85, anchor.y - 85, 170, 170);

    for (const ember of embers) {
      const progress = (time * ember.speed + ember.phase) % 1;
      const x = anchor.x + Math.sin(progress * 7 + ember.phase) * ember.radius * .22;
      const y = anchor.y - 4 - progress * ember.radius;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,226,155,${ember.alpha * (1 - progress)})`;
      ctx.shadowColor = "rgba(255,214,126,.8)";
      ctx.shadowBlur = 8;
      ctx.arc(x, y, ember.size * (1 - progress * .4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
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

    ctx.beginPath();
    ctx.fillStyle = `rgba(${particle.color},${Math.max(0, particle.life)})`;
    ctx.shadowColor = `rgba(${particle.color},.8)`;
    ctx.shadowBlur = 10;
    ctx.arc(particle.x, particle.y, particle.size * Math.max(.2, particle.life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function animate(now) {
  const delta = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
  const time = now / 1000;
  lastTime = now;

  ctx.clearRect(0, 0, width, height);
  updateParallax();
  drawStars(time);
  drawPetals(delta, time);
  drawCandle(time);
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
  burst(width * .66, height * .52, mobile ? 36 : 72, "pearl");
  startMusic();
}

function acceptBouquet() {
  if (scene !== "bouquet") return;
  updateScene("cake");
  setPanel("bouquet-copy", false);
  setPanel("birthday", true);
  const anchor = scenePoint();
  burst(anchor.x, anchor.y + 80, mobile ? 42 : 84, "gold");
}

function makeWish() {
  if (scene !== "cake") return;
  wished = true;
  updateScene("wished");
  $("birthday").classList.add("is-wished");
  const anchor = scenePoint();
  burst(anchor.x, anchor.y, mobile ? 72 : 130, "gold");
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
}

window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  targetParallaxX = ((pointerX / width) - .5) * -14;
  targetParallaxY = ((pointerY / height) - .5) * -9;
});

window.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  if (scene === "bouquet") {
    burst(event.clientX, event.clientY, mobile ? 16 : 28, "pearl");
    for (let i = 0; i < 3; i += 1) {
      const petal = freshPetal(false);
      petal.x = event.clientX + random(-44, 44);
      petal.y = event.clientY + random(-22, 18);
      petals.push(petal);
    }
  } else if (scene === "cake") {
    burst(event.clientX, event.clientY, mobile ? 14 : 24, "gold");
  }
});

$("start").addEventListener("click", startExperience);
$("accept").addEventListener("click", acceptBouquet);
$("wish").addEventListener("click", makeWish);
$("music").addEventListener("click", toggleMusic);
$("replay").addEventListener("click", replayExperience);
window.addEventListener("resize", resizeCanvas);

document.body.dataset.scene = "welcome";
resizeCanvas();
requestAnimationFrame(animate);
document.documentElement.dataset.birthdayReady = "true";
