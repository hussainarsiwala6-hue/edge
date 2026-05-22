/* ============================================================
   EDGELOOP — cat-script.js
   Shared JS for category sub-pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── CURSOR ─────────────────────────────────────────────── */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });
  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  /* ── BACKGROUND CANVAS ──────────────────────────────────── */
  (function initBg() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, time = 0;
    let nmx = 0.5, nmy = 0.5;

    const nodes = Array.from({ length: 50 }, () => ({
      x:  Math.random(), y:  Math.random(),
      vx: (Math.random() - 0.5) * 0.00010,
      vy: (Math.random() - 0.5) * 0.00010,
      r:  Math.random() * 1.4 + 0.4,
      a:  Math.random() * 0.35 + 0.08,
    }));

    const COLS = 18, ROWS = 11;
    let gpts = [];

    function buildGrid() {
      gpts = [];
      for (let r = 0; r <= ROWS; r++)
        for (let c = 0; c <= COLS; c++)
          gpts.push({ x: c/COLS*W, y: r/ROWS*H, ox: c/COLS, oy: r/ROWS, ph: Math.random()*Math.PI*2 });
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildGrid();
    }
    window.addEventListener('resize', resize);
    resize();
    document.addEventListener('mousemove', e => { nmx = e.clientX/window.innerWidth; nmy = e.clientY/window.innerHeight; });

    function getPt(r,c) {
      const p = gpts[r*(COLS+1)+c];
      const w = Math.sin(time + p.ph) * 0.011;
      return { x: p.x + (nmx-p.ox)*0.013*W + w*W, y: p.y + (nmy-p.oy)*0.013*H + w*H };
    }

    function draw() {
      ctx.clearRect(0,0,W,H);
      time += 0.007;

      ctx.strokeStyle = 'rgba(255,255,255,0.022)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= ROWS; r+=2) {
        ctx.beginPath();
        for (let c = 0; c <= COLS; c++) { const p=getPt(r,c); c===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y); }
        ctx.stroke();
      }
      for (let c = 0; c <= COLS; c+=2) {
        ctx.beginPath();
        for (let r = 0; r <= ROWS; r++) { const p=getPt(r,c); r===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y); }
        ctx.stroke();
      }

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if(n.x<0||n.x>1) n.vx*=-1;
        if(n.y<0||n.y>1) n.vy*=-1;
      });
      for (let i=0;i<nodes.length;i++) {
        for (let j=i+1;j<nodes.length;j++) {
          const dx=(nodes[i].x-nodes[j].x)*W, dy=(nodes[i].y-nodes[j].y)*H;
          const d=Math.hypot(dx,dy);
          if(d<120) {
            ctx.strokeStyle=`rgba(255,255,255,${(1-d/120)*0.06})`;
            ctx.lineWidth=0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x*W,nodes[i].y*H);
            ctx.lineTo(nodes[j].x*W,nodes[j].y*H);
            ctx.stroke();
          }
        }
        ctx.fillStyle=`rgba(255,255,255,${nodes[i].a*0.45})`;
        ctx.beginPath(); ctx.arc(nodes[i].x*W,nodes[i].y*H,nodes[i].r,0,Math.PI*2); ctx.fill();
      }

      const sw=((time*0.035)%1.4-0.2)*W;
      const sg=ctx.createLinearGradient(sw-70,0,sw+70,0);
      sg.addColorStop(0,'rgba(255,255,255,0)');
      sg.addColorStop(0.5,'rgba(255,255,255,0.015)');
      sg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=sg; ctx.fillRect(sw-70,0,140,H);

      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ── SCROLL REVEAL ──────────────────────────────────────── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* ── VIDEO SLOT CLICK — open file picker or play ─────────── */
  document.querySelectorAll('.vid-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const video = slot.querySelector('video');
      if (video) {
        // slot already has video — toggle play/pause
        video.paused ? video.play() : video.pause();
      } else {
        // empty slot — open a file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*,image/*';
        input.onchange = e => {
          const file = e.target.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          // remove empty state UI
          const empty = slot.querySelector('.vid-slot-empty');
          if (empty) empty.remove();

          if (file.type.startsWith('video/')) {
            const vid = document.createElement('video');
            vid.src = url; vid.autoplay = true; vid.muted = true;
            vid.loop = true; vid.playsInline = true;
            vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:3';
            slot.appendChild(vid);
          } else {
            const img = document.createElement('img');
            img.src = url; img.alt = file.name;
            img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:3';
            slot.appendChild(img);
          }

          // update slot label
          const titleEl = slot.querySelector('.vid-slot-title');
          if (titleEl) titleEl.textContent = file.name.replace(/\.[^.]+$/, '');
        };
        input.click();
      }
    });
  });

});
