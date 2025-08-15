// ===== Segmente definieren =====
// Jede Aktion kann 'emoji' anzeigen, optional 'overlay' mit { emoji, title, imageSrc, videoSrc, poster }
// 'type' steuert, was passiert: 'overlay', 'hearts', 'message'
const segments = [
  { text: "Ich hab dich lieb ❤️", emoji: "❤️", type: "hearts" },
  { text: "Kusspause! 😘", emoji: "😘", type: "overlay", overlay: { emoji: "😘", title: "Kusspause! 😘" } },
  { text: "Fast daheim 🚋", emoji: "🚋", type: "overlay", overlay: { emoji: "🚋", title: "Fast daheim 🚋", imageSrc: "assets/hearts.svg" } },
  { text: "Zeit für einen Keks 🍪", emoji: "🍪", type: "overlay", overlay: { emoji: "🍪", title: "Zeit für einen Keks 🍪", imageSrc: "assets/cookie.svg" } },
  { text: "Kuschelalarm 🐻", emoji: "🐻", type: "overlay", overlay: { emoji: "🐻", title: "Kuschelalarm 🐻" } },
  { text: "Freudentanz! 💃", emoji: "💃", type: "hearts" },
  { text: "Selfie‑Time 🤳", emoji: "🤳", type: "message" },
  { text: "Wasser trinken! 💧", emoji: "💧", type: "message" },
];

// Pastellige Segmentfarben
const colors = [
  "#ffd6e7", "#d4f1ff", "#e9ffd6", "#fff3c9", "#e5d6ff", "#d6fff7", "#ffd6f1", "#d6f9ff"
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
let lastChosen = null;   // gemerkter Index des gewählten Segments (für eindeutige Anzeige)

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

    // Label (Emoji + kurzer Text)
    ctx.save();
    const mid = start + segAngle/2;
    const labelR = r*0.62;
    ctx.translate(Math.cos(mid)*labelR, Math.sin(mid)*labelR);
    ctx.rotate(mid + Math.PI/2);

    ctx.font = `bold ${Math.max(20, r*0.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji", system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333";
    ctx.fillText(segments[i].emoji, 0, -2);

    ctx.font = `500 ${Math.max(10, r*0.045)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const short = segments[i].text.replace(/(.{24}).*/, "$1…");
    ctx.fillStyle = "#4b4b4b";
    ctx.fillText(short, 0, Math.max(12, r*0.09));
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

// ===== Spin logic with exact landing mapping =====
function spin(){
  if(spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  againBtn.style.display = "none";

  const N = segments.length;
  const seg = 360 / N;

  // 1) Zufälliges Zielsegment
  const chosenIndex = secureRandInt(0, N-1);
  lastChosen = chosenIndex;

  // 2) Wir wollen NICHT immer exakt die Mitte treffen -> kleiner Zufall innen im Segment
  const margin = Math.min(6, seg/5); // Sicherheitsabstand zu den Rändern
  const randOffset = secureRandFloat(-(seg/2 - margin), (seg/2 - margin));

  // 3) Winkel der Segmentmitte (bei Rotation 0) im Uhrzeigersinn von 12 Uhr aus
  const mid = chosenIndex * seg + seg/2; // 0..360

  // 4) Zielwinkel so, dass mid + offset bei 12 Uhr (Zeiger) landet:
  //    Wir lösen (rotation_new) ≡ -(mid + randOffset)  (mod 360)
  const targetResidue = -(mid + randOffset);
  const baseResidue = mod(rotation, 360);
  let delta0 = mod(targetResidue - baseResidue, 360);

  // 5) schöne Anzahl Umdrehungen hinzufügen
  const spins = secureRandInt(4, 6);
  const delta = spins*360 + delta0;
  const total = rotation + delta;

  // 6) Animation
  canvas.style.transition = "transform 4.2s cubic-bezier(.12,.65,.07,1)";
  canvas.style.transform = `rotate(${total}deg)`;

  const onEnd = () => {
    canvas.removeEventListener("transitionend", onEnd);
    rotation = total;

    // Ergebnis per chosenIndex (robust, exakt das anvisierte Segment)
    showResult(lastChosen);

    spinning = false;
    spinBtn.disabled = false;
    againBtn.style.display = "inline-block";

    // Transition zurücksetzen
    requestAnimationFrame(() => { canvas.style.transition = "transform .0s linear"; });
  };
  canvas.addEventListener("transitionend", onEnd);
}

// ===== Ergebnis & Aktionen =====
function showResult(idx){
  const item = segments[idx];
  resultText.textContent = item.text;

  if(item.type === "overlay"){
    const o = item.overlay || {};
    openOverlay(o);
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

  // Media Bereich zurücksetzen
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

// ===== Hinweise =====
// • Für ein eigenes Video/Bild: beim gewünschten Segment in 'overlay' die Felder 'imageSrc' oder 'videoSrc' setzen.
//   Beispiel: overlay: { videoSrc: "assets/cute.mp4", poster: "assets/smile.jpg", title: "Lustiges Video!" }
// • Dateien lokal in den Ordner /assets legen. Funktioniert komplett offline.
