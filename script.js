/* Kleines, leichtes Mini-Game – keine Abhängigkeiten */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const cookieBtn = $("#cookieBtn");
  const scoreEl = $("#score");
  const todayEl = $("#today");
  const msgEl = $("#message");
  const confetti = $("#confetti");
  const spinBtn = $("#spinBtn");
  const revealBtn = $("#revealBtn");
  const resetBtn = $("#resetBtn");

  // Personalisierbare Botschaften – füge Insider hinzu 🥰
  const MESSAGES = [
    "Du schaffst das! ✨",
    "Fast daheim! 🏡",
    "Ich bin stolz auf dich. 💛",
    "Dein Lächeln ist mein Lieblingsplatz. 😊",
    "Heute schon genug gegrinst? Jetzt schon! 😁",
    "Kleiner Keks, große Liebe. 🍪❤️",
    "Pause? Du verdienst sie! ☕",
    "Ich drück dich später ganz fest. 🤗",
    "Du bist meine Lieblingsnachricht. 💌",
    "Noch ein Klick, noch ein Lächeln. ✨",
    "Ich hol die Kuscheldecke. 🧸",
    "Du + ich = 💖",
    "Wolkenfrei im Herzen. ☀️",
    "Sicher ankommen & lächeln. 🚗💤",
    "Heute bin ich dein Chauffeur der Komplimente. 🚌✨"
  ];

  // Farben für Konfetti-Herzen
  const HEART_COLORS = ["#ff7aa2","#ffb703","#ffd166","#06d6a0","#90caf9","#f48fb1"];

  // State & Persistenz
  const STORAGE_KEY = "cookie-game-v1";
  const state = loadState();

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return {score:0, today:0, last:todayStr(), seen:[]};
      const s = JSON.parse(raw);
      // Tageszähler zurücksetzen, wenn neuer Tag
      if(s.last !== todayStr()){ s.today = 0; s.last = todayStr(); }
      return s;
    }catch(e){
      return {score:0, today:0, last:todayStr(), seen:[]};
    }
  }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function todayStr(){ return new Date().toISOString().slice(0,10); }

  // UI initial
  scoreEl.textContent = state.score;
  todayEl.textContent = state.today;

  // Hilfen
  const rand = (min, max) => Math.random()*(max-min)+min;
  function pickMessage(){
    // ohne Wiederholung, bis alle durch sind
    const remaining = MESSAGES.filter(m => !state.seen.includes(m));
    const pool = remaining.length ? remaining : MESSAGES;
    if(!remaining.length) state.seen = [];
    const msg = pool[Math.floor(Math.random()*pool.length)];
    if(!state.seen.includes(msg)) state.seen.push(msg);
    return msg;
  }

  function showMessage(text){
    msgEl.innerHTML = `<span class="pill">${escapeHTML(text)}</span>`;
  }

  function escapeHTML(str){
    return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  }

  function bumpStats(){
    state.score += 1;
    state.today += 1;
    scoreEl.textContent = state.score;
    todayEl.textContent = state.today;
    saveState();
  }

  function popConfetti(x, y){
    // 12–18 Herzen erzeugen
    const count = Math.floor(rand(12,18));
    const rect = document.body.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const h = document.createElement("div");
      h.className = "heart";
      const hue = HEART_COLORS[Math.floor(Math.random()*HEART_COLORS.length)];
      const startX = x ?? rect.width/2;
      const startY = y ?? rect.height/2;

      const xEnd = startX + rand(-120, 120);
      const yEnd = rect.height + rand(40, 140);

      h.style.left = `${startX}px`;
      h.style.top  = `${startY}px`;
      h.style.setProperty("--color", hue);
      h.style.setProperty("--xEnd", `${xEnd - startX}px`);
      h.style.setProperty("--yEnd", `${yEnd - startY}px`);
      h.style.setProperty("--dur", `${rand(1400, 2400)}ms`);
      h.style.setProperty("--rotDur", `${rand(800, 1600)}ms`);
      confetti.appendChild(h);

      // Aufräumen
      setTimeout(()=> h.remove(), 2500);
    }
  }

  function cookieBounce(){
    cookieBtn.animate(
      [{transform:"scale(1)"},{transform:"scale(1.06)"},{transform:"scale(1)"}],
      {duration:180, easing:"ease-out"}
    );
  }

  function clickSfx(){
    // Sanfter „Plopp“ über WebAudio (ohne Datei)
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type="sine";
      o.frequency.setValueAtTime(520, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.16);
      // Kontext kurz danach schließen
      setTimeout(()=>ctx.close(), 300);
    }catch(e){}
  }

  // Interaktionen
  cookieBtn.addEventListener("click", (ev) => {
    bumpStats();
    showMessage(pickMessage());
    cookieBounce();
    popConfetti(ev.clientX || window.innerWidth/2, ev.clientY || window.innerHeight/2);
    clickSfx();
  });

  spinBtn.addEventListener("click", ()=>{
    const msg = pickMessage();
    showMessage("🎡 " + msg);
    popConfetti(window.innerWidth/2, window.innerHeight*0.25);
  });

  revealBtn.addEventListener("click", ()=>{
    // Kleine „Überraschung“ – ändere den Text ruhig auf etwas Persönliches
    const surprises = [
      "Belohnung: 1 Gratis-Umarmung heute Abend! 🤗",
      "Gutschein: Ein Abendessen nach Wahl. 🍝",
      "Zusage: Fußmassage inkl. Serienmarathon. 🦶📺",
      "Überraschung: Ich hab Dessert geplant. 🍰",
      "Deal: Du bestimmst den Film. 🎬"
    ];
    const msg = surprises[Math.floor(Math.random()*surprises.length)];
    showMessage("💌 " + msg);
    popConfetti(window.innerWidth*0.8, window.innerHeight*0.2);
  });

  resetBtn.addEventListener("click", ()=>{
    if(confirm("Fortschritt wirklich zurücksetzen?")){
      state.score = 0;
      state.today = 0;
      state.seen = [];
      state.last = todayStr();
      saveState();
      scoreEl.textContent = "0";
      todayEl.textContent = "0";
      showMessage("Zurückgesetzt. Frisch verliebt klicken! 💖");
    }
  });

  // Erste freundliche Nachricht
  if(state.score === 0){
    showMessage("Tippe auf den Keks & hol dir ein Lächeln! 🍪");
  } else {
    showMessage("Weiter so! Noch ein Klick? ✨");
  }
})();
