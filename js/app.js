// js/app.js
console.log("App engine loaded");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let DPR = window.devicePixelRatio || 1;

function fitCanvas(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * DPR);
  canvas.height = Math.floor(rect.height * DPR);
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// State
let shapes = []; // finalized shapes {type:'line'|'rect'|'circle', data:...}
let preview = null; // {type, start, current}
let mode = 'line';
let isDrawing = false;
let pan = {x:0,y:0,active:false,lastX:0,lastY:0};
let ortho = false;

// UI elements
const modeLabel = document.getElementById('modeLabel');
const hudInfo = document.getElementById('hudInfo');
const statusBar = document.getElementById('statusBar');
const coords = document.getElementById('coords');

// Utils
function toWorld(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - pan.x) ;
  const y = (clientY - rect.top - pan.y) ;
  return {x, y};
}
function dist(a,b){ return Math.hypot(b.x-a.x, b.y-a.y); }
function angleDeg(a,b){ return Math.atan2(b.y-a.y, b.x-a.x) * 180/Math.PI; }
function snapAngle(angle, step=15){
  return Math.round(angle/step)*step;
}
function round2(n){ return Math.round(n*100)/100; }

// Render
function render(){
  // clear
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(pan.x, pan.y);

  // draw existing shapes
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#0b3b6f";
  shapes.forEach(s=>{
    ctx.beginPath();
    if(s.type==='line'){
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    } else if(s.type==='rect'){
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    } else if(s.type==='circle'){
      ctx.beginPath();
      ctx.arc(s.cx, s.cy, s.r, 0, Math.PI*2);
      ctx.stroke();
    }
  });

  // draw preview
  if(preview){
    ctx.strokeStyle = "#ff6b00";
    ctx.setLineDash([6,6]);
    ctx.beginPath();
    if(preview.type==='line'){
      ctx.moveTo(preview.start.x, preview.start.y);
      ctx.lineTo(preview.current.x, preview.current.y);
      ctx.stroke();
    } else if(preview.type==='rect'){
      const x = Math.min(preview.start.x, preview.current.x);
      const y = Math.min(preview.start.y, preview.current.y);
      const w = Math.abs(preview.current.x - preview.start.x);
      const h = Math.abs(preview.current.y - preview.start.y);
      ctx.strokeRect(x,y,w,h);
    } else if(preview.type==='circle'){
      const r = dist(preview.start, preview.current);
      ctx.arc(preview.start.x, preview.start.y, r, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  ctx.restore();
  requestAnimationFrame(()=>{}); // keep smooth
}
render();

// Mouse handlers
canvas.addEventListener('pointerdown', (ev)=>{
  canvas.setPointerCapture(ev.pointerId);
  const pt = toWorld(ev.clientX, ev.clientY);
  if(ev.button === 2){ // right click => start pan
    pan.active = true; pan.lastX = ev.clientX; pan.lastY = ev.clientY; canvas.style.cursor='grabbing'; return;
  }
  // start drawing
  isDrawing = true;
  preview = { type: mode, start: pt, current: pt };
  updateHUD(preview.start, preview.current);
});

canvas.addEventListener('pointermove', (ev)=>{
  const pt = toWorld(ev.clientX, ev.clientY);
  // update coords bar (screen coords without pan compens)
  const screenX = Math.round(pt.x), screenY = Math.round(pt.y);
  coords.textContent = `X:${screenX} Y:${screenY}`;

  if(pan.active){
    const dx = ev.clientX - pan.lastX;
    const dy = ev.clientY - pan.lastY;
    pan.x += dx; pan.y += dy;
    pan.lastX = ev.clientX; pan.lastY = ev.clientY;
    render();
    return;
  }

  if(!isDrawing || !preview) return;
  // apply ortho or shift-angle snap
  let cur = pt;
  const s = preview.start;
  let ang = angleDeg(s, cur);
  let len = dist(s, cur);
  const isShift = ev.shiftKey;
  if(ortho){
    // snap to 0/90 multiples
    const a = Math.round(ang/90)*90;
    const rad = a * Math.PI/180;
    cur = { x: s.x + Math.cos(rad)*len, y: s.y + Math.sin(rad)*len };
  } else if(isShift){
    const snapped = snapAngle(ang, 15);
    const rad = snapped * Math.PI/180;
    cur = { x: s.x + Math.cos(rad)*len, y: s.y + Math.sin(rad)*len };
  }
  preview.current = cur;
  updateHUD(s, cur);
  render();
});

canvas.addEventListener('pointerup', (ev)=>{
  canvas.releasePointerCapture(ev.pointerId);
  if(pan.active){ pan.active=false; canvas.style.cursor='crosshair'; return; }
  if(!isDrawing || !preview) return;
  const s = preview.start;
  const c = preview.current;
  if(preview.type==='line'){
    shapes.push({ type:'line', x1:s.x, y1:s.y, x2:c.x, y2:c.y });
  } else if(preview.type==='rect'){
    const x = Math.min(s.x,c.x), y = Math.min(s.y,c.y);
    shapes.push({ type:'rect', x, y, w:Math.abs(c.x-s.x), h:Math.abs(c.y-s.y) });
  } else if(preview.type==='circle'){
    shapes.push({ type:'circle', cx:s.x, cy:s.y, r:dist(s,c) });
  }
  // finalize
  preview = null; isDrawing = false;
  updateHUD(); render();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase()==='l'){ setMode('line'); }
  if(e.key.toLowerCase()==='r'){ setMode('rect'); }
  if(e.key.toLowerCase()==='c'){ setMode('circle'); }
  if(e.key.toLowerCase()==='o'){ ortho = !ortho; document.getElementById('orthoToggle').checked = ortho; statusBar.textContent = `Ortho: ${ortho ? 'ON' : 'OFF'}`; }
});

// API for UI
function setMode(m){
  mode = m;
  modeLabel.textContent = m.charAt(0).toUpperCase()+m.slice(1);
  document.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('tool_'+m);
  if(btn) btn.classList.add('active');
  statusBar.textContent = `Modo ${m}`;
}
window.setMode = setMode;

// HUD update: length & angle
function updateHUD(a,b){
  if(!a || !b){ hudInfo.textContent = 'Long: 0 — Ang: 0°'; return; }
  const L = dist(a,b);
  let A = angleDeg(a,b);
  // normalize angle 0..360
  if(A < 0) A += 360;
  hudInfo.textContent = `Long: ${round2(L)} px — Ang: ${round2(A)}°`;
}

// Toolbar buttons
document.getElementById('tool_line').addEventListener('click', ()=>setMode('line'));
document.getElementById('tool_rect').addEventListener('click', ()=>setMode('rect'));
document.getElementById('tool_circle').addEventListener('click', ()=>setMode('circle'));
document.getElementById('tool_pan').addEventListener('click', ()=>{ /* toggle pan mode visually */ statusBar.textContent='Use botón derecho para pan'; });
document.getElementById('btn_clear').addEventListener('click', ()=>{ shapes = []; preview = null; render(); statusBar.textContent='Canvas limpio'; });
document.getElementById('btn_export').addEventListener('click', ()=>{ window.exportDXF && window.exportDXF(shapes); });

// Ortho checkbox
document.getElementById('orthoToggle').addEventListener('change', function(){ ortho = this.checked; statusBar.textContent = `Ortho: ${ortho ? 'ON' : 'OFF'}`; });

// Initial mode
setMode('line');
render();
