// js/dxf-export.js
console.log("DXF module loaded");

function lineToDXF(line){
  // simple 2D LINE entity in paper units (pixels)
  return [
    "0","LINE",
    "8","0",
    "10", String(line.x1),
    "20", String(line.y1),
    "11", String(line.x2),
    "21", String(line.y2)
  ].join("\n") + "\n";
}

window.exportDXF = function(shapes){
  let header = "0\nSECTION\n2\nENTITIES\n";
  let body = "";
  shapes.forEach(s=>{
    if(s.type==='line'){
      body += lineToDXF(s);
    } else if(s.type==='rect'){
      // convert rect to 4 lines
      const x = s.x, y = s.y, w = s.w, h = s.h;
      const l1 = {x1:x, y1:y, x2:x+w, y2:y};
      const l2 = {x1:x+w, y1:y, x2:x+w, y2:y+h};
      const l3 = {x1:x+w, y1:y+h, x2:x, y2:y+h};
      const l4 = {x1:x, y1:y+h, x2:x, y2:y};
      [l1,l2,l3,l4].forEach(L => body += lineToDXF(L));
    } else if(s.type==='circle'){
      // approximate circle as many short lines (or skip)
      const steps = 64;
      let prev = null;
      for(let i=0;i<=steps;i++){
        const a1 = (i/steps)*Math.PI*2;
        const px = s.cx + Math.cos(a1)*s.r;
        const py = s.cy + Math.sin(a1)*s.r;
        if(prev){
          body += lineToDXF({x1:prev.x,y1:prev.y,x2:px,y2:py});
        }
        prev = {x:px,y:py};
      }
    }
  });
  const footer = "0\nENDSEC\n0\nEOF\n";
  const dxf = header + body + footer;
  const blob = new Blob([dxf], {type:'application/dxf'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'webcad_export.dxf'; a.click();
};
