// ===== Segmente definieren =====
// 1) 📷 Picture Time -> zufälliges Bild aus img/1.jpeg ... img/8.jpeg
// 2) ❤️ Liebesnachricht + Herzfunken + Overlay
// 3) 🚕 Fast daheim – bleib sicher <3
// 4) 🎬 Video: img/video.mp4
// 5) 🧸 Bild: img/lego.png (achte auf die Endung in deinem Ordner!)
// 6) 😘 Kusspause
// 7) 🛏️ Gute Nacht
// 8) 💃 Herzfunken-Party
const segments = [
  {
    text: "",
    emoji: "📷",
    type: "randomImageOverlay",
    pattern: "img/{n}.jpeg",
    count: 8,
    overlay: { title: "Picture Time 📷" }
  },
  {
    text: "",
    emoji: "❤️",
    type: "overlayHearts",
    overlay: { emoji: "❤️", title: "I lieb di 🥰❤️" }
  },
  {
    text: "",
    emoji: "🚕",
    type: "overlay",
    overlay: { emoji: "🚕", title: "Fast daheim – bleib sicher <3" } // 'bleib' statt 'blib'
  },
  {
    text: "",
    emoji: "🎬",
    type: "overlay",
    overlay: { title: "Filmzeit 🎬", videoSrc: "img/video.mp4" }
  },
  {
    text: "",
    emoji: "🧸",
    type: "overlay",
    overlay: { title: "LEGO!", imageSrc: "img/lego.png" }
  },
  {
    text: "",
    emoji: "😘",
    type: "overlay",
    overlay: { emoji: "😘", title: "Kusspause! 😘" }
  },
  {
    text: "",
    emoji: "🛏️",
    type: "overlay", // <- hier fehlte das Komma!
    overlay: { emoji: "🛏️", title: "Schlaf wundervoll und träum süß 🥰" }
  },
  {
    text: "",
    emoji: "💃",
    type: "hearts"
  },
];

// Pastellige Segmentfarben
const colors = [
  "#ffd6e7", "#d4f1ff", "#e9ffd6", "#fff3c9",
  "#e5d6ff", "#d6fff7", "#ffd6f1", "#d6f9ff"
];

// ===== Canvas & DOM =====
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const wheelWrap = document.querySelector(".wheel-wrap");
const spinBtn = document.getElementById("spinBtn");
const againBtn = document.getElementById("againBtn");
const resultText = document.getElementById("resultText");

const overlay = document.getElementById("overlay");
const overlayEmoji = document.getElementById("overlayEmoji");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMedia = document.getElementById("overlayMedia");

const burst = document.getElementById("burst");
const bgHearts = document.getElementById("bgHearts");

let rotation = 0;        // absolute Rotation in Grad (CSS transform)
let spinning = false;    // Sperre während Animation
let lastChosen = null;   // zuletzt gewählter Segmentindex

// ===== Utilities =====
function secureRandInt(min, max){
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const x = buf[0] / 0xFFFFFFFF;
  return Math.floor(x * (max - min + 1)) + min;
}
function secureRandFloat(min, max){
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const x = buf[0] / 0xFFFFFFFF;
  return min + x * (max - min);
}
function mod(a, n){ return ((a % n) + n) % n; }

// Transition-Fallback für iOS (falls 'transitionend' nicht feuert)
function waitTransition(el, ms){
  return new Promise(resolve => {
    let done = false;
    const clean = () => {
      if(done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd, true);
      el.removeEventListener("webkitTransitionEnd", onEnd, true);
      resolve();
    };
    const onEnd = () => clean();
    el.addEventListener("transitionend", onEnd, true);
    el.addEventListener("webkitTransitionEnd", onEnd, true);
    setTimeout(clean, ms + 80);
  });
}

// ===== Wheel drawing (responsive, crisp on HiDPI) =====
function setupCanvasSize(){
  const size = parseFloat(getComputedStyle(wheelWrap).width);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawWheel();
}

function drawWheel(){
  const sizePx = parseFloat(getComputedStyle(wheelWrap).width);
  const r = sizePx/2;
  const center = { x: r, y: r };
  ctx.clearRect(0,0,sizePx,sizePx);

  const N = segments.length;
  const segAngle = (Math.PI*2)/N;

  ctx.save();
  ctx.translate(center.x, center.y);

  for(let i=0; i<N; i++){
    const start = -Math.PI/2 + i*segAngle; // Start bei 12 Uhr
    const end = start + segAngle;

    // Segment
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r-6,start,end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // Trenner
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label (Emoji + optional kurzer Text)
    ctx.save();
    const mid = start + segAngle/2;
    const labelR = r*0.62;
    ctx.translate(Math.cos(mid)*labelR, Math.sin(mid)*labelR);
    ctx.rotate(mid + Math.PI/2);

    // Emoji
    ctx.font = `bold ${Math.max(20, r*0.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji", system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333";
    ctx.fillText(segments[i].emoji, 0, -2);

    // KEIN Text zeichnen, wenn text leer ist
    const full = (segments[i].text || "").trim();
    if(full){
      ctx.font = `500 ${Math.max(10, r*0.045)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      const short = full.length > 24 ? (full.slice(0,24) + "…") : full;
      ctx.fillStyle = "#4b4b4b";
      ctx.fillText(short, 0, Math.max(12, r*0.09));
    }
    ctx.restore();
  }

  // Außenrand
  ctx.beginPath();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.arc(0,0,r-6,0,Math.PI*2);
  ctx.stroke();

  // Nabe
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(0,0, r*0.08, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function setupCanvasSize(){
  let size = parseFloat(getComputedStyle(wheelWrap).width);
  if(!size || size <= 0){
    console.warn("[Glücksrad] wheel-wrap width war 0 – nutze 300px Fallback. Prüfe, ob styles.css geladen wurde.");
    size = 300; // Fallback, damit das Rad immer sichtbar ist
  }
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawWheel();
}

// ===== Spin logic with exact landing mapping (iOS-safe) =====
async function spin(){
  if(spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  againBtn.style.display = "none";

  const N = segments.length;
  const seg = 360 / N;

  // 1) Zufälliges Zielsegment
  const chosenIndex = secureRandInt(0, N-1);
  lastChosen = chosenIndex;

  // 2) Zufällig leicht neben der Segmentmitte landen
  const margin = Math.min(6, seg/5);
  const randOffset = secureRandFloat(-(seg/2 - margin), (seg/2 - margin));

  // 3) Segmentmitte (bei Rotation 0) im Uhrzeigersinn von 12 Uhr
  const mid = chosenIndex * seg + seg/2;

  // 4) Ziel kongruent zu -(mid + randOffset) mod 360
  const targetResidue = -(mid + randOffset);
  const baseResidue = mod(rotation, 360);
  let delta0 = mod(targetResidue - baseResidue, 360);

  // 5) mehrere Umdrehungen für schöne Animation
  const spins = secureRandInt(4, 6);
  const delta = spins*360 + delta0;
  const total = rotation + delta;

  // 6) iOS-sicher animieren
  canvas.style.willChange = "transform";
  void canvas.getBoundingClientRect();
  await new Promise(r => requestAnimationFrame(() => {
    canvas.style.transition = "transform 4.2s cubic-bezier(.12,.65,.07,1)";
    requestAnimationFrame(() => { canvas.style.transform = `rotate(${total}deg)`; r(); });
  }));
  await waitTransition(canvas, 4200);

  rotation = total; // finaler Winkel
  showResult(lastChosen);

  spinning = false;
  spinBtn.disabled = false;
  againBtn.style.display = "inline-block";
  requestAnimationFrame(() => { canvas.style.transition = "transform 0s linear"; });
}

// ===== Ergebnis & Aktionen =====
function showResult(idx){
  const item = segments[idx];

  // Ergebniszeile unten: wenn text leer -> overlay.title -> emoji
  const display = (item.text && item.text.trim())
                || (item.overlay && item.overlay.title)
                || item.emoji
                || "";
  resultText.textContent = display;

  if(item.type === "randomImageOverlay"){
    const n = secureRandInt(1, item.count || 1);
    const src = (item.pattern || "img/{n}.jpeg").replace("{n}", n);
    openOverlay({ ...(item.overlay||{}), imageSrc: src });
  } else if(item.type === "overlayHearts"){
    openOverlay(item.overlay || {});
    heartBurst(); // zusätzlicher Funkenregen
  } else if(item.type === "overlay"){
    openOverlay(item.overlay || {});
  } else if(item.type === "hearts"){
    heartBurst();
  } else {
    heartBurst(12);
  }
}

// ===== Overlay =====
function openOverlay({emoji, title, imageSrc, videoSrc, poster} = {}){
  overlayEmoji.style.display = emoji ? "block" : "none";
  overlayEmoji.textContent = emoji || "";
  overlayTitle.textContent = title || "";

  overlayMedia.innerHTML = "";
  overlayMedia.setAttribute("aria-hidden", "true");

  if(imageSrc){
    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = title || "Bild";
    overlayMedia.appendChild(img);
    overlayMedia.setAttribute("aria-hidden", "false");
  } else if(videoSrc){
    const vid = document.createElement("video");
    vid.src = videoSrc;
    if(poster) vid.poster = poster;
    vid.controls = true;
    vid.autoplay = true;
    vid.muted = true;         // iOS Autoplay-Sicherheit
    vid.playsInline = true;   // iOS: nicht in Vollbild springen
    overlayMedia.appendChild(vid);
    overlayMedia.setAttribute("aria-hidden", "false");
  }

  overlay.setAttribute("aria-hidden", "false");
}
overlay.addEventListener("click", () => overlay.setAttribute("aria-hidden","true"));

// ===== Hearts burst =====
function heartBurst(count = 22){
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;

  for(let i=0;i<count;i++){
    const span = document.createElement("span");
    span.className = "p";
    span.textContent = ["❤️","💗","💖","💞","💘"][i%5];
    const angle = (i / count) * Math.PI*2 + (Math.random()*0.6 - 0.3);
    const dist = (Math.random()*1 + 0.7) * (rect.width*0.45);
    const dx = Math.cos(angle)*dist;
    const dy = Math.sin(angle)*dist;
    span.style.left = `${cx}px`;
    span.style.top = `${cy}px`;
    span.style.setProperty("--dx", dx + "px");
    span.style.setProperty("--dy", dy + "px");
    span.style.animation = `pop ${800 + Math.random()*400}ms ease-out forwards`;
    burst.appendChild(span);
    setTimeout(() => span.remove(), 1300);
  }
}

// ===== Background hearts =====
function spawnBackgroundHearts(){
  const total = 14;
  for(let i=0;i<total;i++){
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = ["💗","💖","💞","💘","💜"][i%5];
    h.style.left = (Math.random()*100) + "vw";
    const dur = 14 + Math.random()*18;
    const delay = Math.random()*-dur;
    h.style.animationDuration = dur + "s";
    h.style.animationDelay = delay + "s";
    bgHearts.appendChild(h);
  }
}

// ===== Events =====
spinBtn.addEventListener("click", spin);
againBtn.addEventListener("click", spin);
window.addEventListener("resize", setupCanvasSize);

// Keyboard accessibility
document.addEventListener("keydown", (e) => {
  if(e.key === " " || e.key === "Enter"){
    e.preventDefault();
    if(!spinning) spin();
  }
});

// Init
setupCanvasSize();
spawnBackgroundHearts();
