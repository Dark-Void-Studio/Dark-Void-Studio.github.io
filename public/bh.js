/* Darkvoid black hole — canvas 2D renderer (v1/v2/v3 historial).
   Sin dependencias. Se auto-inicia en #blackhole (hero, v1 interactivo)
   y expone window.BlackHole.mount(canvas, variante) para la comparativa. */
(function () {
  'use strict';

  var S = 720, CX = S / 2, CY = S / 2, R = S * 0.21;

  var VARIANTS = {
    v1: { label: 'v1 — original interactivo', squash: 0.24, tilt: -14, dopF: 0.40, dopA: 0.60,
      layers: 16, segs: 56, bandIn: 1.15, bandSpan: 0.95, bandAlpha: 0.55, profPow: 1.6,
      lineW: 0.075, rim: false, halo: 'none', ambient: [0.10, 0.07],
      ring: { w: 0.006, blur: 22, a: 0.95 }, streakA: 0.5 },
    v2: { label: 'v2 — Gargantua', squash: 0.30, tilt: -14, dopF: 0.55, dopA: 0.45,
      layers: 20, segs: 64, bandIn: 1.12, bandSpan: 1.30, bandAlpha: 0.85, profPow: 1.25,
      lineW: 0.095, rim: true, halo: 'flat', ambient: [0.10, 0.07],
      ring: { w: 0.0045, blur: 14, a: 0.85 }, streakA: 0.65 },
    v3: { label: 'v3 — EHT oscuro', squash: 0.30, tilt: -14, dopF: 0.55, dopA: 0.45,
      layers: 20, segs: 64, bandIn: 1.10, bandSpan: 1.00, bandAlpha: 0.70, profPow: 1.25,
      lineW: 0.095, rim: true, halo: 'round', ambient: [0.08, 0.05],
      ring: { w: 0.004, blur: 12, a: 0.90 }, streakA: 0.65 }
  };

  var STOPS = [
    [0.00, 234, 254, 255], [0.22, 0, 240, 255], [0.50, 122, 28, 255],
    [0.78, 255, 0, 255], [1.00, 255, 0, 255]
  ];
  function ramp(f) {
    for (var i = 1; i < STOPS.length; i++) {
      if (f <= STOPS[i][0]) {
        var t = (f - STOPS[i - 1][0]) / (STOPS[i][0] - STOPS[i - 1][0]);
        return [
          Math.round(STOPS[i - 1][1] + t * (STOPS[i][1] - STOPS[i - 1][1])),
          Math.round(STOPS[i - 1][2] + t * (STOPS[i][2] - STOPS[i - 1][2])),
          Math.round(STOPS[i - 1][3] + t * (STOPS[i][3] - STOPS[i - 1][3]))
        ];
      }
    }
    return [255, 0, 255];
  }

  function mount(canvas, name, opts) {
    opts = opts || {};
    var v = VARIANTS[name] || VARIANTS.v1;
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    var TILT = v.tilt * Math.PI / 180;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var host = opts.interactive ? (canvas.closest('.hero') || null) : null;

    function doppler(a) { return v.dopF + v.dopA * (0.5 + 0.5 * Math.cos(a - Math.PI)); }

    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var streaks = [];
    for (var i = 0; i < 44; i++) {
      streaks.push({ a: rnd() * Math.PI * 2, r: 1.18 + rnd() * 0.9, w: 0.04 + rnd() * 0.14, sp: 0.35 + rnd() * 0.75 });
    }
    var clumps = [
      { p: 0.4, r: 1.5, s: 26 }, { p: 2.7, r: 1.75, s: 20 }, { p: 4.5, r: 1.32, s: 30 }
    ];

    var baked = document.createElement('canvas');
    baked.width = S; baked.height = S;
    (function bake() {
      var b = baked.getContext('2d');
      b.translate(CX, CY); b.scale(1, v.squash);
      for (var li = 0; li < v.layers; li++) {
        var f = li / (v.layers - 1);
        var rr = R * (v.bandIn + f * v.bandSpan);
        var c = ramp(f);
        var baseA = Math.pow(1 - f, v.profPow);
        b.lineWidth = R * v.lineW;
        for (var si = 0; si < v.segs; si++) {
          var a0 = (si / v.segs) * Math.PI * 2;
          var al = baseA * doppler(a0 + Math.PI / v.segs) * v.bandAlpha;
          b.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al.toFixed(3) + ')';
          b.beginPath(); b.arc(0, 0, rr, a0, a0 + (Math.PI * 2 / v.segs) * 1.15); b.stroke();
        }
      }
      if (v.rim) {
        var rimCols = [[0.9, 6], [0.55, 10], [0.3, 16]];
        for (var ri = 0; ri < rimCols.length; ri++) {
          b.strokeStyle = 'rgba(240,254,255,' + rimCols[ri][0] + ')';
          b.lineWidth = rimCols[ri][1];
          b.beginPath(); b.arc(0, 0, R * 1.12, 0, Math.PI * 2); b.stroke();
        }
      }
    })();

    function clippedHalf(top, tilt, draw) {
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(TILT + tilt);
      ctx.beginPath();
      if (top) ctx.rect(-R * 3.0, -R * 3.0, R * 6.0, R * 3.0);
      else ctx.rect(-R * 3.0, 0, R * 6.0, R * 3.0);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      draw();
      ctx.restore();
    }
    function band(top, tilt) {
      clippedHalf(top, tilt, function () { ctx.drawImage(baked, 0, 0); });
    }
    function streakPass(top, tilt, t, energy) {
      clippedHalf(top, tilt, function () {
        ctx.save();
        ctx.translate(CX, CY); ctx.rotate(TILT + tilt); ctx.scale(1, v.squash);
        ctx.lineCap = 'round';
        for (var i = 0; i < streaks.length; i++) {
          var st = streaks[i];
          var a = st.a + t * st.sp * energy / Math.pow(st.r, 1.5);
          ctx.strokeStyle = 'rgba(225,252,255,' + (v.streakA * doppler(a)).toFixed(3) + ')';
          ctx.lineWidth = R * 0.03;
          ctx.beginPath(); ctx.arc(0, 0, st.r * R, a, a + st.w); ctx.stroke();
        }
        ctx.restore();
      });
    }
    function clumpPass(top, tilt, t, energy) {
      clippedHalf(top, tilt, function () {
        ctx.save();
        ctx.translate(CX, CY); ctx.rotate(TILT + tilt); ctx.scale(1, v.squash);
        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < clumps.length; i++) {
          var c = clumps[i];
          var a = c.p + t * 0.55 * energy / Math.pow(c.r, 1.5);
          var x = Math.cos(a) * c.r * R, y = Math.sin(a) * c.r * R;
          var br = 0.35 + 0.65 * doppler(a);
          var g = ctx.createRadialGradient(x, y, 0, x, y, c.s);
          g.addColorStop(0, 'rgba(255,255,255,' + (0.85 * br).toFixed(3) + ')');
          g.addColorStop(0.35, 'rgba(0,240,255,' + (0.5 * br).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255,0,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x, y, c.s, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });
    }
    function lensArcs(tilt, shimmer) {
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(TILT + tilt);
      ctx.strokeStyle = 'rgba(150,248,255,' + (0.5 * shimmer).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1.5, S * 0.004);
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.5, R * 1.5 * v.squash, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,120,255,' + (0.35 * shimmer).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.5, R * 1.5 * v.squash, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.restore();
    }
    function haloFlat(tilt, energy, shimmer) {
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(TILT + tilt); ctx.scale(1, v.squash);
      ctx.lineCap = 'round';
      var radii = [1.55, 1.85, 2.15];
      for (var i = 0; i < radii.length; i++) {
        var rr = radii[i] * R;
        var g = ctx.createLinearGradient(-rr, 0, rr, 0);
        var aL = (0.5 - i * 0.1) * energy * shimmer;
        var aR = (0.18 - i * 0.04) * energy * shimmer;
        g.addColorStop(0, 'rgba(234,254,255,' + Math.max(0, aL).toFixed(3) + ')');
        g.addColorStop(0.45, 'rgba(0,240,255,' + Math.max(0, aL * 0.6).toFixed(3) + ')');
        g.addColorStop(0.75, 'rgba(255,0,255,' + Math.max(0, aR).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,0,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = R * 0.14;
        ctx.beginPath(); ctx.arc(0, 0, rr, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      }
      ctx.restore();
    }
    function haloRound(tilt, energy, shimmer) {
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(TILT * 0.3 + tilt);
      ctx.lineCap = 'round';
      var radii = [1.45, 1.7, 1.95];
      for (var i = 0; i < radii.length; i++) {
        var rr = radii[i] * R;
        var g = ctx.createLinearGradient(-rr, 0, rr, 0);
        var aL = (0.4 - i * 0.08) * energy * shimmer;
        var aR = (0.15 - i * 0.03) * energy * shimmer;
        g.addColorStop(0, 'rgba(234,254,255,' + Math.max(0, aL).toFixed(3) + ')');
        g.addColorStop(0.45, 'rgba(0,240,255,' + Math.max(0, aL * 0.6).toFixed(3) + ')');
        g.addColorStop(0.75, 'rgba(255,0,255,' + Math.max(0, aR).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,0,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = R * 0.12;
        ctx.beginPath(); ctx.arc(0, 0, rr, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      }
      ctx.restore();
    }

    var tx = 0, ty = 0, px = 0, py = 0;
    if (host && fine && !reduce) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      host.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    }

    function draw(t, energy, tilt) {
      ctx.clearRect(0, 0, S, S);
      var shimmer = 0.9 + 0.1 * Math.sin(t * 2.3);
      var g0 = ctx.createRadialGradient(CX, CY, R * 0.5, CX, CY, R * 2.6);
      g0.addColorStop(0, 'rgba(0,240,255,' + (v.ambient[0] * energy).toFixed(3) + ')');
      g0.addColorStop(0.5, 'rgba(255,0,255,' + (v.ambient[1] * energy).toFixed(3) + ')');
      g0.addColorStop(1, 'rgba(255,0,255,0)');
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, S, S);
      band(false, tilt);
      streakPass(false, tilt, t, energy);
      clumpPass(false, tilt, t, energy);
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(0,240,255,0.9)'; ctx.shadowBlur = v.ring.blur * shimmer;
      ctx.strokeStyle = 'rgba(234,254,255,' + (v.ring.a * shimmer).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1.5, S * v.ring.w);
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.045, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      lensArcs(tilt, shimmer);
      if (v.halo === 'flat') haloFlat(tilt, energy, shimmer);
      if (v.halo === 'round') haloRound(tilt, energy, shimmer);
      band(true, tilt);
      streakPass(true, tilt, t, energy);
      clumpPass(true, tilt, t, energy);
    }

    if (reduce) { draw(2.0, 1, 0); return { variant: name }; }
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      var rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var t = now / 1000;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      var energy = 1 + 0.3 * Math.min(1, (Math.abs(px) + Math.abs(py)) / 2);
      draw(t, energy, py * 0.05);
    }
    requestAnimationFrame(frame);
    return { variant: name };
  }

  window.BlackHole = { mount: mount, VARIANTS: VARIANTS, logoBase: logoBase };

  // Logo eclipse en degradado. p = { spread, glow, cyan, violet, magenta }.
  // spread: alcance de la aureola (fracción de S). glow: intensidad global.
  // cyan/violet/magenta: posición (0..1) de cada parada.
  function logoBase(canvas, p) {
    if (!canvas || !canvas.getContext) return null;
    p = p || {};
    var spread = p.spread != null ? p.spread : 0.3;
    var glow = p.glow != null ? p.glow : 0.3;
    var posC = p.cyan != null ? p.cyan : 0.07;
    var posV = p.violet != null ? p.violet : 0.2;
    var posM = p.magenta != null ? p.magenta : 0.51;
    var ctx = canvas.getContext('2d');
    var S = canvas.width, C = S / 2;
    var rDisk = S * 0.28, rRing = S * 0.295;
    ctx.clearRect(0, 0, S, canvas.height);
    // Resplandor amplio del sol que está detrás
    var halo = ctx.createRadialGradient(C, C, rDisk * 0.9, C, C, S * 0.48);
    halo.addColorStop(0.00, 'rgba(0,240,255,0)');
    halo.addColorStop(0.18, 'rgba(234,254,255,' + (0.28 * glow).toFixed(3) + ')');
    halo.addColorStop(0.45, 'rgba(0,240,255,' + (0.12 * glow).toFixed(3) + ')');
    halo.addColorStop(0.70, 'rgba(122,28,255,' + (0.10 * glow).toFixed(3) + ')');
    halo.addColorStop(0.88, 'rgba(255,0,255,' + (0.08 * glow).toFixed(3) + ')');
    halo.addColorStop(1.00, 'rgba(255,0,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, S, canvas.height);
    // Disco negro que tapa el sol
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(C, C, rDisk, 0, Math.PI * 2); ctx.fill();
    // Aureola en degradado corrido: brillante al borde, difusa al final
    var cg = ctx.createRadialGradient(C, C, rRing, C, C, rRing + spread * S);
    cg.addColorStop(0.00, 'rgba(234,254,255,' + Math.min(1, 0.90 * glow).toFixed(3) + ')');
    cg.addColorStop(posC, 'rgba(0,240,255,' + Math.min(1, 0.55 * glow).toFixed(3) + ')');
    cg.addColorStop(posV, 'rgba(122,28,255,' + Math.min(1, 0.30 * glow).toFixed(3) + ')');
    cg.addColorStop(posM, 'rgba(255,0,255,' + Math.min(1, 0.12 * glow).toFixed(3) + ')');
    cg.addColorStop(1.00, 'rgba(255,0,255,0)');
    ctx.save();
    ctx.shadowColor = 'rgba(0,240,255,0.6)'; ctx.shadowBlur = S * 0.02;
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(C, C, rRing + spread * S, 0, Math.PI * 2);
    ctx.arc(C, C, rRing, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
    // Delineado fino al borde del disco
    ctx.save();
    ctx.shadowColor = 'rgba(0,240,255,0.9)'; ctx.shadowBlur = S * 0.015;
    ctx.strokeStyle = '#eafeff';
    ctx.lineWidth = Math.max(2, S * 0.006);
    ctx.beginPath(); ctx.arc(C, C, rRing, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // Anillo tipo Saturno, de luz: elipse inclinada con Doppler (izquierda brillante)
    ctx.save();
    ctx.translate(C, C); ctx.rotate(-14 * Math.PI / 180); ctx.scale(1, 0.32);
    function saturnRing(rr, lw, stops) {
      var g = ctx.createLinearGradient(-rr, 0, rr, 0);
      for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      ctx.strokeStyle = g; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
    }
    saturnRing(S * 0.41, S * 0.055, [[0, 'rgba(234,254,255,0)'], [0.18, 'rgba(0,240,255,0.55)'], [0.32, 'rgba(234,254,255,0.9)'], [0.5, 'rgba(0,240,255,0.35)'], [0.68, 'rgba(255,0,255,0.30)'], [0.85, 'rgba(255,0,255,0.08)'], [1, 'rgba(255,0,255,0)']]);
    saturnRing(S * 0.41, S * 0.014, [[0, 'rgba(234,254,255,0)'], [0.25, 'rgba(234,254,255,0.95)'], [0.5, 'rgba(0,240,255,0.5)'], [0.75, 'rgba(255,0,255,0.35)'], [1, 'rgba(255,0,255,0)']]);
    ctx.restore();
    return { step: 'v5' };
  }

  function auto() {
    var heroCanvas = document.getElementById('blackhole');
    if (heroCanvas) mount(heroCanvas, 'v1', { interactive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
