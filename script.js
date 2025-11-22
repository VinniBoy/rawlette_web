const SYMBOLS = [
  {id:"chaya1", file:"assets/chaya1.png", payout:5},
  {id:"chaya2", file:"assets/chaya2.png", payout:5},
  {id:"chaya3", file:"assets/chaya3.png", payout:5},
  {id:"geld", file:"assets/geld.png", payout:10},
  {id:"kondom", file:"assets/kondom.png", payout:"lose_all"},
  {id:"nello_horny", file:"assets/nello_horny.png", payout:"bonus"}
];

let credit = 100;
let pullsLeft = 10;

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
  if(pullsLeft <= 0){
    messageEl.textContent = "Keine Züge mehr.";
    return;
  }
  pullsLeft--;
  messageEl.textContent = "Drehen...";
  
  // Slots zufällig wählen
  let picked = [];
  for(let i=0;i<3;i++){
    picked.push(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]);
    slotEls[i].src = picked[i].file;
  }

  // Prüfen auf Gewinn
  const ids = picked.map(s => s.id);
  if(ids[0]===ids[1] && ids[1]===ids[2]){
    const sym = picked[0];
    if(sym.payout === "lose_all"){
      credit = 0;
      messageEl.textContent = "Alles verloren! 💥 (3× Kondom)";
    } else if(sym.payout === "bonus"){
      messageEl.textContent = "Bonus-Rad! Drehe für Jackpot.";
      showBonusWheel();
    } else {
      credit += sym.payout;
      messageEl.textContent = `Drei ${sym.id}! +${sym.payout} gut!`;
    }
  } else {
    messageEl.textContent = "Keine Gewinnkombination.";
  }
  updateStatus();
}

function restart() {
  credit = 100;
  pullsLeft = 10;
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
const segments = [0,50,100,200,1000,0,50,100];

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
    speed *= 0.97; // abbremsen
    angle += speed;
    drawWheel();
    if(speed > 0.002){
      requestAnimationFrame(animate);
    } else {
      // Stoppen → Segment bestimmen
      const pointerAngle = (2*Math.PI - angle) % (2*Math.PI);
      const idx = Math.floor(pointerAngle/(2*Math.PI/segments.length));
      const prize = segments[idx];
      credit += prize;
      messageEl.textContent = `Bonus-Rad: +${prize}!`;
      updateStatus();
      canvas.style.display = "none";
    }
  }
  animate();
}
