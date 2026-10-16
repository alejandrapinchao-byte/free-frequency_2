/* Sonido de Free Frequency: un solo módulo central, con Web Audio API y sonidos sintetizados al momento (sin archivos, sin descargas, sin dependencias).
   · El audio se habilita tras una acción explícita del usuario (primer clic, toque o tecla, o «Comenzar»), como exigen los navegadores.
   · Un único interruptor de silencio (botón del encabezado) apaga todo: efectos y radio. La preferencia se guarda solo como «ff-sound» = on/off en el navegador.
   · Volumen general moderado (0,5) y efectos suaves. Si Web Audio no existe o falla, todas las funciones no hacen nada y la experiencia sigue igual.
   · Los sonidos los dispara solo quien llama (acciones del usuario y sus demostraciones en pantalla); no hay sonido de fondo continuo. Los avisos diferidos
     de reconexión y el retumbo del sismo se cancelan al salir de la escena (`sceneStop`).
   · No se reproduce música, emisoras ni transmisiones reales: la radio usa ruido y tonos originales generados en el momento. */
window.FFAudio = (function () {
  "use strict";
  var ctx = null, master = null, sfxBus = null, radBus = null, noiseBuf = null, on = true, VOL = 0.9, unlocked = false;
  try { on = localStorage.getItem("ff-sound") !== "off"; } catch (e) {}
  var later = [], rPos = 0, rn = null, rIdle = 0, lastTickAt = 0, lastTickPos = -99, qk = null, listeners = [];

  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? VOL : 0;
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;   // limitador: sube la claridad sin saturar
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master); radBus = ctx.createGain(); radBus.gain.value = 0.9; radBus.connect(master);
      var n = Math.floor(ctx.sampleRate * 1.6), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = b;
    } catch (e) { ctx = null; }
    return ctx;
  }
  function running() { return !!ctx && on && ctx.state === "running"; }
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === "suspended" && on) { try { ctx.resume(); } catch (e) {} }
    unlocked = true;
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { window.addEventListener(ev, unlock, { capture: true, passive: true }); });
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); } catch (e) {}
  });

  /* ---------- primitivas ---------- */
  function osc(type, f0, f1, t0, dur, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxBus); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function burst(t0, dur, type, f, q, vol, dest) {
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(fl); fl.connect(g); g.connect(dest || sfxBus); s.start(t0, Math.random() * 0.8, dur + 0.03);
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function sfx(fn) { return safe(fn); }
  function safe(fn) { return function () { try { if (!running()) return; return fn.apply(null, arguments); } catch (e) {} }; }

  /* ---------- efectos del teléfono ---------- */
  var key = sfx(function (ch) {
    var t = ctx.currentTime, code = ch ? String(ch).toLowerCase().charCodeAt(0) || 97 : 97, f = 1050 + (code % 13) * 38;   // cada tecla suena un poco distinta
    burst(t, 0.03, "highpass", 2200, 0.7, 0.5); osc("sine", f, f * 0.8, t, 0.07, 0.22); osc("triangle", f * 0.5, f * 0.4, t, 0.05, 0.12);
  });
  var del = sfx(function () { var t = ctx.currentTime; burst(t, 0.045, "lowpass", 1800, 0.7, 0.4); osc("triangle", 460, 280, t, 0.1, 0.24); });
  var send = sfx(function () { var t = ctx.currentTime; osc("sine", 620, 0, t, 0.1, 0.24); osc("sine", 930, 0, t + 0.09, 0.16, 0.26); burst(t + 0.02, 0.16, "bandpass", 1800, 0.8, 0.1); });
  var airplane = sfx(function (isOn) { var t = ctx.currentTime; if (isOn) { osc("sine", 520, 0, t, 0.1, 0.22); osc("sine", 390, 0, t + 0.11, 0.16, 0.22); } else { osc("sine", 390, 0, t, 0.1, 0.22); osc("sine", 520, 0, t + 0.11, 0.16, 0.22); } });
  var blip = sfx(function () { var t = ctx.currentTime; osc("sine", 700, 0, t, 0.09, 0.2); osc("sine", 700, 0, t + 0.15, 0.12, 0.17); });   // aviso breve de «reconexión ilustrativa»: dos pulsos iguales, sin tono de éxito

  /* ---------- interruptores y radio ---------- */
  var click = sfx(function (isOn) {
    var t = ctx.currentTime;
    if (isOn) { burst(t, 0.022, "bandpass", 2800, 1.2, 0.9); osc("square", 200, 90, t, 0.07, 0.3); osc("sine", 120, 60, t, 0.09, 0.45); burst(t + 0.04, 0.016, "bandpass", 2000, 1.5, 0.35); }   // el botón se hunde
    else { burst(t, 0.016, "bandpass", 3800, 1.4, 0.7); osc("square", 300, 180, t, 0.035, 0.2); burst(t + 0.03, 0.012, "bandpass", 2600, 1.5, 0.25); }   // el botón sube
  });
  var dial = sfx(function (pos) {
    var now = performance.now(); if (now - lastTickAt < 55 || Math.abs(pos - lastTickPos) < 2) return; lastTickAt = now; lastTickPos = pos;
    var t = ctx.currentTime; burst(t, 0.02, "bandpass", 700 + (pos % 7) * 40, 2, 0.4); osc("sine", 160, 110, t, 0.05, 0.22);
  });
  var band = sfx(function () { var t = ctx.currentTime; burst(t, 0.04, "bandpass", 900, 1.4, 0.65); osc("square", 140, 90, t + 0.01, 0.07, 0.2); burst(t + 0.07, 0.22, "bandpass", 2400, 0.5, 0.22); });
  var lock = sfx(function () { var t = ctx.currentTime; osc("sine", 392, 0, t, 0.12, 0.2); osc("sine", 523, 0, t + 0.13, 0.22, 0.2); });
  function radioEnsure() {
    if (rn) return rn;
    var src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain(), o = ctx.createOscillator(), tg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true; bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.6; ng.gain.value = 0; src.connect(bp); bp.connect(ng); ng.connect(radBus);
    o.type = "sine"; o.frequency.value = 440; tg.gain.value = 0; lfo.frequency.value = 5; lg.gain.value = 0; lfo.connect(lg); lg.connect(tg.gain); o.connect(tg); tg.connect(radBus);
    var sw = ctx.createOscillator(), sg = ctx.createGain(); sw.type = "sine"; sw.frequency.value = 600; sg.gain.value = 0; sw.connect(sg); sg.connect(radBus); sw.start();
    src.start(); o.start(); lfo.start(); rn = { src: src, bp: bp, ng: ng, o: o, tg: tg, lfo: lfo, lg: lg, sw: sw, sg: sg }; return rn;
  }
  function radioFade() { if (!rn || !ctx) return; var t = ctx.currentTime; rn.ng.gain.setTargetAtTime(0, t, 0.45); rn.tg.gain.setTargetAtTime(0, t, 0.45); rn.lg.gain.setTargetAtTime(0, t, 0.45); rn.sg.gain.setTargetAtTime(0, t, 0.1); }
  /* estado de sintonía: más estática cuanto menos clara es la señal, tono limpio cuando se encuentra una emisora de ejemplo; se apaga solo si no hay interacción */
  var radio = safe(function (s) {
    var n = radioEnsure(), t = ctx.currentTime, c = s.clarity || 0;
    if (!s.on) { radioFade(); return; }
    var dp = Math.abs((s.pos || 0) - rPos); rPos = s.pos || 0;   // cuanto más rápido se mueve el dial, más se oye el barrido
    n.sw.frequency.setTargetAtTime(380 + rPos * 17, t, 0.04); n.sg.gain.cancelScheduledValues(t); n.sg.gain.setTargetAtTime(Math.min(0.2, dp * 0.035) * (1 - c), t, 0.02); n.sg.gain.setTargetAtTime(0, t + 0.18, 0.09);
    n.ng.gain.setTargetAtTime(0.05 + 0.4 * (1 - c), t, 0.12); n.tg.gain.setTargetAtTime(0.22 * smooth((c - 0.3) / 0.7), t, 0.2); n.lg.gain.setTargetAtTime(0.22 * smooth((c - 0.3) / 0.7) * 0.2, t, 0.2);
    n.bp.frequency.setTargetAtTime(s.band === "AM" ? 1400 + s.pos * 9 : 2600 + s.pos * 14, t, 0.05); n.bp.Q.setTargetAtTime(s.band === "AM" ? 0.5 : 0.9, t, 0.1);
    n.o.frequency.setTargetAtTime(s.kind === "music" ? 330 : 440, t, 0.05);
    clearTimeout(rIdle); rIdle = setTimeout(radioFade, 3800);
  });
  function radioStop() { clearTimeout(rIdle); radioFade(); }

  /* ---------- ruido de apoyo (retumbo del sismo) ---------- */
  function loopNoise(dest, type, f, vol, nodes) {
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(dest); s.start(); nodes.push(s, fl, g); return fl;
  }
  function lfoTo(param, rate, depth, nodes, type) { var l = ctx.createOscillator(), g = ctx.createGain(); l.type = type || "sine"; l.frequency.value = rate; g.gain.value = depth; l.connect(g); g.connect(param); l.start(); nodes.push(l, g); }
  /* sismo: un retumbo grave y breve, controlado (se desvanece solo) */
  function quake(isOn) { if (!ctx) return; try { if (isOn && !running()) return; quakeImpl(isOn); } catch (e) {} }   // apagar siempre limpia, aunque el sonido esté silenciado
  function quakeImpl(isOn) {
    var t = ctx.currentTime;
    if (isOn) {
      if (qk) return; var nodes = [], g = ctx.createGain(); g.gain.value = 0; g.connect(sfxBus); var fl = loopNoise(g, "lowpass", 110, 1, nodes); lfoTo(fl.frequency, 6, 30, nodes);
      g.gain.setTargetAtTime(0.55, t, 0.5); qk = { g: g, nodes: nodes };
    } else if (qk) {
      var q = qk; qk = null; q.g.gain.setTargetAtTime(0, t, 0.7); setTimeout(function () { q.nodes.forEach(function (n) { try { if (n.stop) n.stop(); n.disconnect(); } catch (e) {} }); try { q.g.disconnect(); } catch (e) {} }, 3500);
    }
  }

  /* avisos diferidos (reconexión ilustrativa): cancelables */
  function after(ms, fn) { var id = setTimeout(function () { later = later.filter(function (x) { return x !== id; }); fn(); }, ms); later.push(id); return id; }
  function cancelLater() { later.forEach(clearTimeout); later = []; }
  function sceneStop() { cancelLater(); radioStop(); quake(false); }

  function setEnabled(v) {
    on = !!v; try { localStorage.setItem("ff-sound", on ? "on" : "off"); } catch (e) {}
    if (ctx) { try { master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, 0.04); if (on) { ctx.resume(); } else { cancelLater(); radioStop(); setTimeout(function () { if (!on && ctx) try { ctx.suspend(); } catch (e) {} }, 400); } } catch (e) {} }
    else if (on) ensure();
    listeners.forEach(function (f) { f(on); });
  }
  function onChange(f) { listeners.push(f); }

  return { unlock: unlock, enabled: function () { return on; }, setEnabled: setEnabled, onChange: onChange, key: key, del: del, send: send, airplane: airplane, blip: blip, click: click, dial: dial, band: band, lock: lock,
    radio: radio, radioStop: radioStop, quake: quake, after: after, cancelLater: cancelLater, sceneStop: sceneStop,
    state: function () { return ctx ? ctx.state : "none"; } };
})();
