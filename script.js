const SYMBOLS = [
  {id:"chaya1", file:"assets/chaya1.png", payout:20, weight:15},
  {id:"kondom", file:"assets/kondom1.png", payout:"lose_all", weight:3}, // selten
  {id:"nello_horny", file:"assets/nello_horny.png", payout:"bonus", weight:5} // mäßig selten
];


let credit = 100;      // Startbetrag
let pullsLeft = Math.floor(credit/10);  // Anzahl Züge = 100€ / 10€ pro Zug

function weightedRandom(symbols){
  let total = symbols.reduce((sum,s) => sum + s.weight, 0);
  let r = Math.random() * total;
  for(let s of symbols){
    if(r < s.weight) return s;
    r -= s.weight;
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

  // Slots zufällig wählen
  let picked = [];
  for(let i=0;i<3;i++){
    let sym = weightedRandom(SYMBOLS);
    picked.push(sym);
    slotEls[i].src = sym.file;
  }


  // Prüfen auf Gewinn
  const ids = picked.map(s => s.id);
  if(ids[0]===ids[1] && ids[1]===ids[2]){
    const sym = picked[0];
    if(sym.payout === "lose_all"){
      credit = 0;
      pullsLeft = 0;
      messageEl.textContent = "Alles verloren! 💥 (3× Kondom)";
    } else if(sym.payout === "bonus"){
      messageEl.textContent = "Rawlette! Drehe für Jackpot.";
      showBonusWheel();
    } else {
      credit += sym.payout;
      messageEl.textContent = `Drei ${sym.id}! +${sym.payout}€ gut!`;
    }
  } else {
    messageEl.textContent = "Kein Gewinn. Looser!";
  }

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


