const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let startX, startY;
let mode = "line";

function setMode(m) {
  mode = m;
}

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
});

canvas.addEventListener("mouseup", (e) => {
  if (!drawing) return;
  drawing = false;

  let endX = e.offsetX;
  let endY = e.offsetY;

  if (mode === "line") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  if (mode === "circle") {
    let radius = Math.hypot(endX - startX, endY - startY);
    ctx.beginPath();
    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (mode === "rect") {
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
  }
});

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
