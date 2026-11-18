const root = document.documentElement;
const switcher = document.querySelector(".language-switch");
const languageButtons = [...switcher.querySelectorAll("button")];
const navigation = document.querySelector(".navigation");
const navigationLinks = [...navigation.querySelectorAll("a")];
const navigationTargets = navigationLinks.map(link => document.querySelector(link.hash));

function updateCurrentSection() {
  const headerBottom = document.querySelector(".topbar").getBoundingClientRect().bottom;
  const anchorLine = headerBottom + 36;
  const requestedIndex = navigationLinks.findIndex(link => link.hash === window.location.hash);
  let currentIndex = 0;

  navigationTargets.forEach((section, index) => {
    const threshold = index === requestedIndex ? headerBottom + 110 : anchorLine;
    if (section.getBoundingClientRect().top <= threshold) currentIndex = index;
  });

  if (window.scrollY < 8 && (!window.location.hash || window.location.hash === "#about")) {
    currentIndex = 0;
  }

  const pageHeight = root.scrollHeight;
  if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= pageHeight - 1) {
    const requestedSection = navigationTargets[requestedIndex];
    const requestedNearEnd = requestedSection
      && requestedSection.getBoundingClientRect().top > anchorLine
      && requestedSection.getBoundingClientRect().top < window.innerHeight;
    currentIndex = requestedNearEnd ? requestedIndex : navigationLinks.length - 1;
  }

  navigationLinks.forEach((link, index) => {
    if (index === currentIndex) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function setLanguage(language) {
  const english = language === "en";
  root.lang = language;
  document.title = english ? "Irving He · Curriculum Vitae" : "Irving He · 个人简历";
  document.querySelector('meta[name="description"]').content = english
    ? "Irving He's CV, covering autonomous driving foundation models and mobile robotics research."
    : "何子辰（Irving He）的个人简历，涵盖自动驾驶基础模型研发和移动机器人研究。";
  navigation.setAttribute("aria-label", english ? "Résumé navigation" : "简历导航");
  switcher.setAttribute("aria-label", english ? "Choose language" : "选择语言");
  const themes = document.querySelector(".theme-switch");
  themes.setAttribute("aria-label", english ? "Website theme" : "网站主题");
  const lightLabel = english ? "Light theme" : "白色主题";
  const darkLabel = english ? "Dark theme" : "黑色主题";
  for (const [mode, label] of [["light", lightLabel], ["dark", darkLabel]]) {
    const button = themes.querySelector(`[data-theme="${mode}"]`);
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  languageButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  });

  const url = new URL(window.location.href);
  if (english) url.searchParams.set("lang", "en");
  else url.searchParams.delete("lang");

  if (url.href !== window.location.href) history.replaceState(history.state, "", url);
  updateCurrentSection();
}

languageButtons.forEach(button => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});
switcher.hidden = false;
setLanguage(new URL(location.href).searchParams.get("lang") === "en" ? "en" : "zh-CN");

let scheduled = false;
function scheduleSectionUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    updateCurrentSection();
  });
}

window.addEventListener("scroll", scheduleSectionUpdate, { passive: true });
window.addEventListener("resize", scheduleSectionUpdate);
window.addEventListener("hashchange", scheduleSectionUpdate);
window.addEventListener("popstate", () => {
  setLanguage(new URL(location.href).searchParams.get("lang") === "en" ? "en" : "zh-CN");
});

const themeSwitcher = document.querySelector(".theme-switch");
const themeButtons = [...themeSwitcher.querySelectorAll("button")];
const themeColor = document.querySelector('meta[name="theme-color"]');

function setTheme(theme, persist = false) {
  root.dataset.theme = theme;
  themeColor.content = theme === "dark" ? "#101416" : "#f7f8fa";
  themeButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  });
  if (persist) {
    try {
      localStorage.setItem("resume-theme", theme);
    } catch {
      // The current theme remains active if storage is unavailable.
    }
  }
}

themeSwitcher.hidden = false;
setTheme(root.dataset.theme === "dark" ? "dark" : "light");
themeButtons.forEach(button => button.addEventListener("click", () => setTheme(button.dataset.theme, true)));

const canvas = document.querySelector(".pointer-effects");
const context = canvas.getContext("2d");
const pointerPreference = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const particles = [];
let particleFrame = 0;
let pixelRatio = 1;
let lastTrailTime = 0;

function sizeCanvas() {
  if (canvas.hidden) return;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawParticles(now) {
  context.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  for (let index = particles.length - 1; index >= 0; index--) {
    const spark = particles[index];
    const elapsed = now - spark.start;
    if (elapsed >= spark.life) {
      particles.splice(index, 1);
      continue;
    }
    const remaining = 1 - elapsed / spark.life;
    const x = spark.x + spark.vx * elapsed;
    const y = spark.y + spark.vy * elapsed + 0.00013 * elapsed ** 2;
    context.fillStyle = spark.color;
    context.globalAlpha = remaining * spark.opacity;
    context.beginPath();
    context.arc(x, y, spark.radius * (0.55 + 0.45 * remaining), 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  particleFrame = particles.length ? requestAnimationFrame(drawParticles) : 0;
}

function spawnParticles(event, burst) {
  if (canvas.hidden || event.pointerType !== "mouse") return;
  const now = performance.now();
  if (!burst && now - lastTrailTime < 34) return;
  lastTrailTime = now;

  const palette = root.dataset.theme === "dark" ? ["#f3a984", "#9abed0"] : ["#a95031", "#58849b"];
  const count = burst ? 13 : 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (burst ? 0.11 : 0.035) * (0.4 + Math.random() * 0.6);
    particles.push({
      x: event.clientX,
      y: event.clientY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      start: now,
      life: burst ? 420 + Math.random() * 190 : 240 + Math.random() * 120,
      radius: (burst ? 2.5 : 1.7) + Math.random(),
      opacity: burst ? 0.9 : 0.55,
      color: palette[i % palette.length],
    });
  }
  if (particles.length > 90) particles.splice(0, particles.length - 90);
  if (!particleFrame) particleFrame = requestAnimationFrame(drawParticles);
}

function setParticleAvailability() {
  canvas.hidden = !context || !pointerPreference.matches;
  if (canvas.hidden) {
    cancelAnimationFrame(particleFrame);
    particleFrame = 0;
    particles.length = 0;
  } else {
    sizeCanvas();
  }
}

pointerPreference.addEventListener("change", setParticleAvailability);
window.addEventListener("resize", sizeCanvas);
window.addEventListener("pointermove", event => spawnParticles(event, false), { passive: true });
window.addEventListener("pointerdown", event => {
  if (event.button === 0) spawnParticles(event, true);
}, { passive: true });
setParticleAvailability();
