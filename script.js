const SYMBOLS = [
  {id:"chaya1", file:"assets/chaya1.png", payout:20, baseWeight:15},
  {id:"kondom", file:"assets/kondom1.png", payout:"lose_all", baseWeight:3}, // selten
  {id:"nello_horny", file:"assets/nello_horny.png", payout:"bonus", baseWeight:5} // mäßig selten
];

const NELLO_STEP       = 1;     // vorher 3 → zu stark
const KONDOM_STEP      = 1;     // vorher 3 → zu stark
const NELLO_MAX_BONUS  = 15;    // vorher 40 → zu hoch
const KONDOM_MAX_BONUS = 20;    // vorher 30 → zu hoch


// Phase: "nello" oder "kondom"
let phase = "nello";
let nello_bonus = 0;   // erhöht nello_horny Gewicht in Phase "nello"
let kondom_bonus = 0;  // erhöht kondom Gewicht in Phase "kondom"

// Hilfsfunktion: erzeuge effektive Gewichte (base + bonus, mit Caps)
function getEffectiveWeights() {
  // Kopiere Basen
  const eff = SYMBOLS.map(s => ({
    ...s,
    weight: s.baseWeight
  }));

  if (phase === "nello") {
    // nello_bonus erhöht nur nello_horny
    for (let e of eff) {
      if (e.id === "nello_horny") {
        e.weight = e.baseWeight + Math.min(nello_bonus, NELLO_MAX_BONUS);
      }
      // kondom bleibt normal
    }
  } else if (phase === "kondom") {
    for (let e of eff) {
      if (e.id === "kondom") {
        e.weight = e.baseWeight + Math.min(kondom_bonus, KONDOM_MAX_BONUS);
      }
      // nello_horny bleibt normal
    }
  }
  return eff;
}



let credit = 100;      // Startbetrag
let pullsLeft = Math.floor(credit/10);  // Anzahl Züge = 100€ / 10€ pro Zug

// gewichtete Zufallsauswahl
function weightedRandom(symbolsWithWeight) {
  const total = symbolsWithWeight.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let s of symbolsWithWeight) {
    if (r < s.weight) return s;
    r -= s.weight;
  }
  // Fallback (sollte nie erreicht werden)
  return symbolsWithWeight[symbolsWithWeight.length - 1];
}



function pickThreeSymbols() {
  const eff = getEffectiveWeights();
  // wähle 3 Symbole (unabhängig, mit Replacement)
  const a = weightedRandom(eff);
  const b = weightedRandom(eff);
  const c = weightedRandom(eff);
  return [a, b, c];
}

// --------- Nach jedem Spin: Update der Bonussysteme ---------
// Diese Funktion rufst du nach der Auswertung des Spins auf.
// Parameter: ids = ['nello_horny','geld','chaya1'] etc. ; 
// triggerEvent = 'nello' oder 'kondom' wenn 3x des Typs auftraten, sonst null
function updateAdaptiveState(ids, triggerEvent) {
  if (phase === "nello") {
    if (triggerEvent === "nello") {
      // nello erreicht -> reset nello_bonus und wechsle zu kondom
      nello_bonus = 0;
      kondom_bonus = 0;    // frisch starten
      phase = "kondom";
    } else {
      // kein nello ausgelöst -> incremento nello_bonus leicht erhöhen
      nello_bonus += NELLO_STEP;
      // (optional) begrenze nello_bonus bereits in getEffectiveWeights
    }
  } else if (phase === "kondom") {
    if (triggerEvent === "kondom") {
      // kondom erreicht -> reset und zurück zu nello
      kondom_bonus = 0;
      nello_bonus = 0;
      phase = "nello";
    } else {
      kondom_bonus += KONDOM_STEP;
    }
  }
}

const slotEls = [
  document.getElementById("slot1"),
  document.getElementById("slot2"),
  document.getElementById("slot3")
];
const creditEl = document.getElementById("credit");
const pullsEl = document.getElementById("pullsLeft");
const messageEl = document.getElementById("message");

function updateStatus() {
  creditEl.textContent = credit;
  pullsEl.textContent = pullsLeft;
}

function spin() {
  if(pullsLeft <= 0 || credit < 10){
    messageEl.textContent = "Keine Züge mehr möglich.";
    return;
  }

  // Jeder Zug kostet 10€
  credit -= 10;
  pullsLeft = Math.floor(credit/10);

  // Slots zufällig wählen aus effektiven Gewichten!
  let picked = pickThreeSymbols(); // WICHTIG: ersetzt bisheriges weightedRandom(SYMBOLS)
  slotEls[0].src = picked[0].file;
  slotEls[1].src = picked[1].file;
  slotEls[2].src = picked[2].file;

  const ids = picked.map(s => s.id);

  // prüfen, ob 3 gleiche
  let trigger = null;
  if(ids[0] === ids[1] && ids[1] === ids[2]){
    const sym = picked[0];
    if(sym.payout === "lose_all"){
      credit = 0;
      pullsLeft = 0;
      messageEl.textContent = "Alles verloren! 💥 (3× Kondom)";
      trigger = "kondom"; // trigger für adaptive Logik
    } else if(sym.payout === "bonus"){
      messageEl.textContent = "Rawlette! Drehe für Jackpot.";
      showBonusWheel();
      trigger = "nello"; // trigger für adaptive Logik
    } else {
      credit += sym.payout;
      messageEl.textContent = `Drei ${sym.id}! +${sym.payout}€ gut!`;
    }
  } else {
    messageEl.textContent = "Kein Gewinn. Looser!";
  }

  // Update adaptive Wahrscheinlichkeit
  updateAdaptiveState(ids, trigger);
  //updateProbabilities(); // neu!

  pullsLeft = Math.floor(credit/10); // aktualisieren nach eventuellen Gewinnen
  updateStatus();
}


function restart() {
  credit = 100;
  pullsLeft = Math.floor(credit/10);
  messageEl.textContent = "Neu gestartet.";
  updateStatus();
  slotEls.forEach((el,i)=> el.src=SYMBOLS[i].file);
}

document.getElementById("spinBtn").onclick = spin;
document.getElementById("restartBtn").onclick = restart;

updateStatus();





// ------------------- Bonus-Rad -------------------
const canvas = document.getElementById("bonusWheel");
const ctx = canvas.getContext("2d");
const segments = [30,50,100,200,1000,300,50,100];



function showBonusWheel(){
  canvas.style.display = "block";
  let angle = 0;
  let speed = 0.3 + Math.random()*0.5;

  function drawWheel(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    const radius = 150;
    const n = segments.length;

    for(let i=0;i<n;i++){
      const start = (i/n)*2*Math.PI + angle;
      const end = ((i+1)/n)*2*Math.PI + angle;
      ctx.fillStyle = i%2===0?"#ffcc00":"#ff9900";
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,radius,start,end);
      ctx.fill();

      // Text
      ctx.save();
      ctx.translate(cx,cy);
      const mid = (start+end)/2;
      ctx.rotate(mid);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(segments[i],radius*0.6,0);
      ctx.restore();
    }

    // Zeiger
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(cx,cy-radius-10);
    ctx.lineTo(cx-10,cy-radius+10);
    ctx.lineTo(cx+10,cy-radius+10);
    ctx.closePath();
    ctx.fill();
  }

  function animate(){
    speed *= 0.98; // abbremsen
    angle += speed;
    drawWheel();
    if(speed > 0.002){
      requestAnimationFrame(animate);
    } else {
      // Stoppen → Segment bestimmen
          // Winkel normalisieren (0 bis 2π)
      const norm = (angle % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);

    // Pointer zeigt nach OBEN (−90°)
      const pointerAngle = ( -Math.PI/2 - norm + 2*Math.PI ) % (2*Math.PI);

    // Größe eines Segments
      const segAngle = 2*Math.PI / segments.length;

    // Index korrekt berechnen
      const idx = Math.floor(pointerAngle / segAngle);

    // Fallback (zur Sicherheit)
      const safeIndex = ((idx % segments.length) + segments.length) % segments.length;
      //const idx = Math.floor(pointerAngle/(2*Math.PI/segments.length));
      const prize = segments[safeIndex];
      const finalPrize = Number(prize) || 0;

      credit += finalPrize;
      messageEl.textContent = `Rawlette - Gewinn: + ${finalPrize}!`;
      updateStatus();
      canvas.style.display = "none";
    }
  }
  animate();
}


function updateProbabilities() {
  const eff = getEffectiveWeights();
  const total = eff.reduce((sum,s) => sum + s.weight, 0);
  
  eff.forEach(s => {
    const percent = Math.round((s.weight / total) * 100);
    if(s.id === "chaya1") document.getElementById("prob-chaya1").textContent = percent;
    if(s.id === "kondom") document.getElementById("prob-kondom").textContent = percent;
    if(s.id === "nello_horny") document.getElementById("prob-nello").textContent = percent;
  });
}


