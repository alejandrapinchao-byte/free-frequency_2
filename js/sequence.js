/* Secuencia visual obligatoria de cada alternativa (Three.js, sin archivos de modelo externos). Sistema reutilizable:
     1) objeto protagonista (sin personaje)  →  2) primer plano de las manos usándolo  →  3) personaje completo usándolo  →  4) cuadro educativo.
   Este archivo es el motor común: cámara, línea de tiempo, entorno (suelo, fondo, personaje), luces, cuadro, controles y progreso.
   Cada alternativa es un "módulo" (js/seq-modules.js: teléfono, radio, linterna) que aporta su modelo 3D, sus manos, su demostración y sus poses.

   Reglas que implementa el motor:
   · el mismo modelo 3D se usa en las tres etapas; las poses se mezclan sin cortes (el objeto nunca desaparece);
   · la secuencia completa se ve la primera vez; si el usuario vuelve a la alternativa se muestra directamente el plano completo con el cuadro,
     y puede repetir el acercamiento (botón del cuadro) o la secuencia entera (botón «Repetir secuencia» o los pasos de la barra de progreso);
   · nunca cambia de pantalla por sí sola: solo el botón «Finalizar recorrido» muestra la despedida;
   · con «reducir movimiento» no hay transiciones: los pasos son planos fijos que el usuario elige.

   Alcance real: el personaje completo es la ilustración de referencia (imagen plana en un plano 3D, con un ligero movimiento del cuerpo entero), no un modelo
   articulado. Las manos y los antebrazos del primer plano son piezas 3D estilizadas hechas con geometría simple; en el plano completo se ve la mano que sostiene
   el objeto a la altura de la muñeca de la ilustración. La luz de la linterna es un foco sencillo sin sombras. */
window.FFSeq = (function () {
  "use strict";
  var clamp01 = function (t) { return Math.max(0, Math.min(1, t)); };
  var smooth = function (t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var step = function (t) { return t > 0 ? 1 : 0; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* personajes y fondos de cada contexto. wrist = punto (en el plano del personaje) donde la ilustración tiene la mano. */
  var CTX3D = {
    rural: { img: "assets/characters/cauca.png", bg: "assets/scenes/cauca-back.svg", w: 2.85, wrist: [0.39, 1.48, 0.12], skin: 0xe0a578, sleeve: "plaid", bracelet: false, ground: 0x5d7547 },
    urbano: { img: "assets/characters/cali.png", bg: "assets/scenes/cali-back.svg", w: 2.7, wrist: [0.62, 1.19, 0.12], skin: 0xd9996a, sleeve: "floral", bracelet: true, ground: 0x6c6877 }
  };
  var TIMES = { hero: 2.6, toClose: 1.2, toWide: 2.0, cardAfter: 1.6 };
  var modules = {};

  function markup(J, SQ, nav, QT) {
    var prog = nav.items.map(function (it) { return '<li class="' + (it.on ? "on" : it.done ? "done" : "") + '"' + (it.on ? ' aria-current="step"' : "") + '><a data-nav href="' + it.href + '">' + esc(it.label) + "</a></li>"; }).join("");
    return '<div class="seq-stage"><canvas class="seq-canvas" aria-hidden="true"></canvas></div>' +
      '<p class="sr-only" role="status" aria-live="polite" id="seq-status"></p>' +
      '<div class="seq-hud"><ol class="seq-steps" aria-label="Progreso de la secuencia">' + SQ.steps.map(function (s, i) {
        return '<li data-i="' + (i + 1) + '"><button type="button" class="seq-step" aria-label="Ir al paso ' + (i + 1) + ": " + esc(s) + '"><i></i><span>' + esc(s) + "</span></button></li>";
      }).join("") + '</ol><button type="button" class="seq-skip">' + esc(SQ.skip) + "</button></div>" +
      '<button type="button" class="seq-hot" role="switch" aria-checked="false" hidden><span class="ring"></span><span class="lbl">Interruptor</span></button>' +
      '<section class="seq-card" aria-label="Información de la alternativa" hidden></section>' +
      '<section class="seq-bye" role="dialog" aria-labelledby="seq-bye-title" hidden><h2 id="seq-bye-title">Gracias por recorrer esta escena</h2><p>' + esc(J.bye) + "</p>" +
      '<div class="seq-actions"><a class="seq-next-btn" data-nav href="' + nav.next.href + '">Seguir: ' + esc(nav.next.label) + ' <span aria-hidden="true">→</span></a><a class="seq-menu" data-nav href="' + nav.menuHref + '">Volver al menú de la zona</a><button type="button" class="seq-repeat">Repetir secuencia</button></div></section>' +
      '<nav class="seq-nav" aria-label="Recorrido de ' + esc(nav.zoneName) + '"><a class="seq-home" data-nav href="' + nav.menuHref + '">Menú</a><a class="seq-prev" data-nav href="' + nav.prev.href + '"><span aria-hidden="true">←</span> ' + esc(nav.prev.label) + '</a>' +
      '<div class="seq-progress"><span class="seq-zname">' + esc(nav.zoneName) + '</span><ol>' + prog + '</ol></div>' +
      '<a class="seq-next" data-nav href="' + nav.next.href + '">' + esc(nav.next.label) + ' <span aria-hidden="true">→</span></a></nav>' +
      '<section class="seq-quake" role="status" aria-live="polite" hidden><p class="seq-qk"></p><p class="seq-qt"></p><div class="seq-qbtns"><button type="button" class="seq-qgo" hidden>' + esc(QT.cont) + '</button><button type="button" class="seq-qskip">' + esc(QT.skip) + '</button></div></section>';
  }

  function start(root, cfg) {
    var J = cfg.journey, Zn = cfg.zone, SQ = cfg.seq, QTX = cfg.quakeText, NAV = cfg.nav, reduce = !!cfg.reduce, topics = J.objects;
    var ctxId = Zn.id, topicId = cfg.topic || topics[0].id;
    root.innerHTML = markup(J, SQ, NAV, QTX);
    var $ = function (s) { return root.querySelector(s); };
    var canvas = $(".seq-canvas"), statusEl = $("#seq-status"), skipBtn = $(".seq-skip"), hot = $(".seq-hot"), card = $(".seq-card"), bye = $(".seq-bye");
    var stepLis = [].slice.call(root.querySelectorAll(".seq-steps li"));
    var alive = true, live = { light: false, airplane: false, kick: -1e9, sms: window.FFSms.fresh(), net: 0, netAt: -1e9, searchAt: -1e9, recAt: -1e9 }, shown = { card: false, stage: 0 };
    var unmountTuner = null, miniCtx = null, miniAt = 0;
    var G = J.guide ? { n: 1, gate: 0, user: [], busy: false, autoSos: false, demoDone: false, lit: false, t0: 0, focus: false } : null;   // recorrido guiado (linterna y código Morse)

    function topic() { return topics.filter(function (o) { return o.id === topicId; })[0] || topics[0]; }
    function say(m) { statusEl.textContent = m; }
    function setStep(n) {
      if (n === shown.stage) return; shown.stage = n;
      stepLis.forEach(function (li, i) { li.classList.toggle("done", i + 1 < n); li.classList.toggle("active", i + 1 === n); });
      say("Paso " + n + " de 4: " + SQ.steps[n - 1]);
    }

    /* ---------- cuadro educativo (etapa 4) ---------- */
    function netHTML(o) {
      if (!o.net) return "";
      var row = function (label, v) { return '<div class="' + (v[0] ? "yes" : "no") + '"><dt>' + label + "</dt><dd>" + esc(v[1]) + "</dd></div>"; };
      return '<dl class="seq-net">' + row("Internet", o.net.internet) + row("Red celular", o.net.cellular) + "</dl>";
    }
    var ICON_SMS = '<svg class="ico-sms" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 3.5h16a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z"/><circle cx="7.5" cy="10.3" r="1.35"/><circle cx="12" cy="10.3" r="1.35"/><circle cx="16.5" cy="10.3" r="1.35"/></svg>';
    function tunerHTML() {
      var D = window.FF.tuner;
      return '<section class="seq-tuner tuner" data-tuner><h3>' + esc(D.title) + "</h3>" +
        '<div class="tn-row"><button type="button" class="tn-power" role="switch" aria-checked="false"><span class="knob" aria-hidden="true"></span><span class="lbl">Encender la radio</span></button>' +
        '<div class="tn-bands" role="group" aria-label="Banda"><button type="button" data-band="AM" aria-pressed="true">AM</button><button type="button" data-band="FM" aria-pressed="false">FM</button></div></div>' +
        '<div class="tn-dial" aria-hidden="true"><span class="tn-scale"></span><i class="tn-needle"></i></div>' +
        '<input class="tn-range" type="range" min="0" max="100" step="1" value="8" aria-label="Dial de sintonía" disabled>' +
        '<div class="tn-meter" aria-hidden="true"><i></i></div>' +
        '<p class="tn-out" role="status" aria-live="polite"></p><p class="tn-note">' + esc(D.note) + "</p></section>";
    }
    /* tutorial paso a paso del SMS simulado: la lista marca lo ya hecho y el paso en curso a medida que el usuario escribe y envía */
    function smsHTML(o) {
      return '<section class="seq-tut"><h3>' + esc(o.tutorial.title) + '</h3><ol class="tut-steps">' + o.tutorial.steps.map(function (st, i) { return '<li data-s="' + i + '">' + esc(st) + "</li>"; }).join("") + "</ol></section>" +
        '<div class="seq-sms"><p class="sms-note">Teléfono de práctica: es una simulación, el número es ficticio y no se envía ningún mensaje real.</p>' + window.FFSms.html(live.sms) + "</div>";
    }
    function tutState() {
      var s = live.sms, sent = s.sent, d = [s.screen !== "home" || sent, s.screen !== "home" || sent, s.num.length >= 10 || sent, s.text.length >= 8 || sent, sent, sent], cur = d.indexOf(false);
      [].forEach.call(card.querySelectorAll(".tut-steps li"), function (li, i) { li.classList.toggle("done", d[i]); li.classList.toggle("cur", i === cur); });
    }
    function controlsHTML(o) {
      var h = "";
      if (o.toggle) h += '<button type="button" class="seq-toggle" data-act="light" role="switch" aria-checked="' + live.light + '"><span class="knob" aria-hidden="true"></span><span class="lbl">' + (live.light ? "Apagar la linterna" : "Encender la linterna") + "</span></button>";
      if (o.airplane) h += '<button type="button" class="seq-toggle" data-act="air" role="switch" aria-checked="' + live.airplane + '"><span class="knob" aria-hidden="true"></span><span class="lbl">' + (live.airplane ? "Desactivar el modo avión" : "Activar el modo avión") + "</span></button>";
      if (o.network) h += '<button type="button" class="seq-toggle" data-act="net" role="switch" aria-checked="' + !!live.net + '"><span class="knob" aria-hidden="true"></span><span class="lbl">' + (live.net ? "Volver a la red automática" : "Probar otra red (simulado)") + "</span></button>";
      if (o.search) h += '<button type="button" class="seq-again" data-act="search">Buscar señal (simulado)</button>';
      return h;
    }
    function introTitle(o) { return J.module === "torch" ? "¿Qué es el código Morse?" : o.sms ? "¿Qué es un SMS?" : o.airplane ? "¿Qué es el modo avión?" : o.search ? "¿Qué es la cobertura?" : o.call ? "¿Qué es una llamada breve?" : o.network ? "¿Qué significa probar otra red?" : o.tuner ? "¿Qué es una radio AM/FM?" : "¿Qué es?"; }
    function renderCard(focusAct) {
      var o = topic(), pick = "";
      if (topics.length > 1) pick = '<div class="seq-pick"><div class="seq-topics" role="group" aria-label="Tema">' + topics.map(function (x) {
        return '<button type="button" data-act="topic" data-v="' + x.id + '" aria-pressed="' + (x.id === topicId) + '">' + (x.icon === "sms" ? ICON_SMS : "") + esc(x.label) + "</button>";
      }).join("") + "</div></div>";
      card.innerHTML = pick + '<p class="seq-id">' + esc(J.kicker) + '</p><h2 id="seq-title">' + (o.icon === "sms" ? ICON_SMS : "") + esc(o.name) + "</h2>" +
        (o.tuner ? tunerHTML() : "") +
        (o.intro ? "<h3>" + esc(introTitle(o)) + "</h3><p>" + esc(o.intro) + "</p>" : "") +
        "<h3>" + esc(o.whatTitle || "Cómo ayuda") + "</h3><p>" + esc(o.what) + "</p>" +
        (o.why ? "<h3>¿Por qué es útil cuando hay problemas de conectividad?</h3><p>" + esc(o.why) + "</p>" : "") +
        netHTML(o) + "<h3>Condiciones y límites</h3><p>" + esc(o.limit) + "</p>" +
        (o.hint ? '<p class="seq-hint"><b>Interacción:</b> ' + esc(o.hint) + "</p>" : "") +
        (o.tutorial ? smsHTML(o) : "") +
        (J.module === "phone" ? '<figure class="seq-miniwrap"><canvas class="seq-mini" width="128" height="274" aria-hidden="true"></canvas><figcaption>Pantalla del teléfono (simulación): lo que escribes y pulsas aquí se ve en el teléfono.</figcaption></figure>' : "") +
        '<div class="seq-actions">' + controlsHTML(o) +
        '<button type="button" class="seq-again" data-act="again">' + (G ? "Repetir la práctica" : "Repetir el acercamiento") + "</button>" +
        '<button type="button" class="seq-finish" data-act="finish">Finalizar recorrido <span aria-hidden="true">→</span></button></div>' +
        '<a class="seq-other" data-nav href="' + NAV.other.href + '">Ver esta alternativa en ' + esc(NAV.other.label) + ' <span aria-hidden="true">→</span></a>';
      card.setAttribute("aria-labelledby", "seq-title");
      var mc = card.querySelector(".seq-mini"); miniCtx = mc ? mc.getContext("2d") : null; miniAt = 0;
      if (o.tutorial) tutState();
      if (unmountTuner) { unmountTuner(); unmountTuner = null; }
      if (o.tuner && window.FFTuner) unmountTuner = window.FFTuner.mount(card);
      if (focusAct) { var f = card.querySelector('[data-act="' + focusAct.act + '"]' + (focusAct.v ? '[data-v="' + focusAct.v + '"]' : "")); if (f) f.focus({ preventScroll: true }); }
    }

    /* ---------- sin WebGL: versión plana (mismo cuadro y mismos controles) ---------- */
    var renderer = null;
    try {
      if (!window.THREE || !window.FFHub || !window.FFHub.models || !modules[J.module]) throw new Error("sin three");
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      if (!renderer.getContext()) throw new Error("sin webgl");
    } catch (e) { renderer = null; }

    if (!renderer) return startFlat();

    function startFlat() {
      var flat = document.createElement("div"); flat.className = "seq-flat" + (J.module === "torch" ? " dark" : "");
      flat.innerHTML = '<img class="sf-bg" alt="" src="' + Zn.img + '"><img class="sf-char" alt="' + esc(Zn.who + ", " + Zn.role) + '" src="' + Zn.char + '"><img class="sf-obj" alt="" src="' + J.flatImg + '"><div class="sf-dark"></div>';
      root.querySelector(".seq-stage").appendChild(flat); root.classList.add("seq-flatmode");
      $(".seq-hud").hidden = true;
      card.hidden = false; renderCard(); setStep(4);
      if (cfg.onTopic) cfg.onTopic(topicId);
      card.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return; var a = b.getAttribute("data-act");
        if (a === "topic") { topicId = b.getAttribute("data-v"); renderCard({ act: "topic", v: topicId }); if (cfg.onTopic) cfg.onTopic(topicId); }
        else if (a === "light") { live.light = !live.light; root.classList.toggle("seq-on", live.light); renderCard({ act: "light" }); }
        else if (a === "air") { live.airplane = !live.airplane; renderCard({ act: "air" }); }
        else if (a === "net") { live.net = live.net ? 0 : 1; renderCard({ act: "net" }); }
        else if (a === "finish") { card.hidden = true; bye.hidden = false; var m = bye.querySelector(".seq-menu"); if (m) m.focus(); }
      });
      window.FFSms.attach(card, live, { changed: function () { tutState(); } });
      $(".seq-again").hidden = true;
      bye.querySelector(".seq-repeat").addEventListener("click", function () { bye.hidden = true; card.hidden = false; });
      return { stop: function () { root.innerHTML = ""; root.classList.remove("seq-flatmode", "seq-on"); }, flat: true, nav: NAV, interacting: function () { return false; } };
    }

    /* ---------- 3D: escena común ---------- */
    var M = window.FFHub.models, toon = M.toon, basic = M.basic, rbox = M.rbox, canvasTex = M.canvasTex;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    var ambient = new THREE.AmbientLight(0x8fa0cc, 0.2); scene.add(ambient);
    var heroKey = new THREE.DirectionalLight(0xffe2b0, 1.1); heroKey.position.set(3, 5, 6); scene.add(heroKey);
    var heroFill = new THREE.HemisphereLight(0xcfe0ff, 0x2a2230, 0.75); scene.add(heroFill);
    var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

    /* materiales compartidos de las manos (el color de piel y la manga cambian con el contexto) */
    var skin = toon(0xd9996a), gold = toon(0xd9a441);
    var plaid = canvasTex(256, 256, function (x, w, h) {
      x.fillStyle = "#ece6d8"; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(120,108,100,.5)"; for (var i = 0; i < 4; i++) { x.fillRect(i * 64 + 6, 0, 22, h); x.fillRect(0, i * 64 + 6, w, 22); }
      x.fillStyle = "rgba(70,60,56,.45)"; for (var j = 0; j < 4; j++) { x.fillRect(j * 64 + 14, 0, 6, h); x.fillRect(0, j * 64 + 14, w, 6); }
    });
    plaid.wrapS = plaid.wrapT = THREE.RepeatWrapping; plaid.repeat.set(2, 2);
    var floral = canvasTex(256, 160, function (x, w, h) {
      x.fillStyle = "#2a1f2e"; x.fillRect(0, 0, w, h);
      var cols = ["#e85d8c", "#8a5cc2", "#f08a4b", "#f5b335", "#4b7bd6", "#d7342a", "#3fa76a"];
      for (var i = 0; i < 46; i++) { var cx = (i * 53) % w, cy = (i * 37) % h, r = 7 + (i % 4) * 3, c = cols[i % cols.length];
        for (var k = 0; k < 5; k++) { var a = k * 1.2566; x.fillStyle = c; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, r * 0.62, 0, 6.3); x.fill(); }
        x.fillStyle = "#f6e6a8"; x.beginPath(); x.arc(cx, cy, r * 0.4, 0, 6.3); x.fill(); }
    });
    var sleeveMat = toon(0xffffff, { map: floral });
    var armVariants = { plaid: [], floral: [] }, bracelets = [];
    function limb(a, b, r, mat) {
      var dir = b.clone().sub(a), len = dir.length();
      var m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.01), 6, 12), mat);
      m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return m;
    }
    /* antebrazo desde la muñeca `w` hacia `dir`: manga de cuadros (zona rural) o antebrazo con brazalete y manga floral (zona urbana) */
    function makeArm(w, dir, parent) {
      var d = dir.clone().normalize(), E = w.clone().addScaledVector(d, 1.6), g = new THREE.Group(); parent.add(g);
      var wristSkin = limb(w, w.clone().addScaledVector(d, 0.5), 0.2, skin); g.add(wristSkin);
      var tube = limb(w.clone().addScaledVector(d, 0.38), E, 0.27, sleeveMat); armVariants.plaid.push(tube); g.add(tube);
      var fore = limb(w.clone().addScaledVector(d, 0.45), E, 0.2, skin); armVariants.floral.push(fore); g.add(fore);
      var br = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 24), gold); br.position.copy(w).addScaledVector(d, 0.42); br.quaternion.setFromUnitVectors(V(0, 0, 1), d); bracelets.push(br); g.add(br);
      var puff = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), sleeveMat); puff.scale.set(1, 0.85, 1); puff.position.copy(E).addScaledVector(d, 0.1); armVariants.floral.push(puff); g.add(puff);
      return g;
    }
    /* dedo "elástico": un cilindro entre dos puntos (base y punta) con la punta redondeada; sirve para pulgares que tocan la pantalla o giran una perilla */
    function digit(r) {
      var g = new THREE.Group(), cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, 1, 12), skin), tip = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 14, 12), skin), base = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 12, 10), skin);
      g.add(cyl); g.add(tip); g.add(base); g.userData = { cyl: cyl, tip: tip, base: base, up: V(0, 1, 0), q: new THREE.Quaternion(), d: V(0, 0, 0) };
      return g;
    }
    function aim(g, a, b) {
      var u = g.userData; u.d.copy(b).sub(a); var len = Math.max(u.d.length(), 0.001);
      u.cyl.position.copy(a).addScaledVector(u.d, 0.5); u.cyl.scale.set(1, len, 1); u.cyl.quaternion.setFromUnitVectors(u.up, u.d.clone().normalize());
      u.tip.position.copy(b); u.base.position.copy(a);
    }

    /* entorno: suelo, fondo, personaje (aparece solo en el plano completo) */
    var env = new THREE.Group(); scene.add(env); var envMats = [];
    function envMat(m) { m.transparent = true; m.opacity = 0; envMats.push(m); return m; }
    var groundMat = envMat(new THREE.MeshLambertMaterial({ color: 0x3a3440 }));
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.z = 6; env.add(ground);
    var bgMat = envMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));   // cielo (degradado)
    var bg = new THREE.Mesh(new THREE.PlaneGeometry(110, 60), bgMat); bg.position.set(0, 14, -30); env.add(bg);
    var charGroup = new THREE.Group(); env.add(charGroup);
    var charMat = envMat(new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.05, emissive: new THREE.Color(0xffffff) }));
    var charPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 4.4), charMat); charPlane.position.y = 2.2; charGroup.add(charPlane);
    env.visible = false;
    var scenery = window.FFScenery.build({ THREE: THREE, M: M, env: env, envMat: envMat, V: V }, ctxId);
    bgMat.map = scenery.sky;
    var texCache = {};
    function loadChar(img, done) {
      if (texCache[img]) return done(texCache[img]);
      new THREE.TextureLoader().load(img, function (tx) { texCache[img] = tx; if (alive) done(tx); });
    }

    /* módulo de la alternativa */
    var ctx3d = { THREE: THREE, M: M, scene: scene, env: env, envMat: envMat, skin: skin, gold: gold, sleeveMat: sleeveMat, limb: limb, makeArm: makeArm, digit: digit, aim: aim, V: V, camera: camera,
      toon: toon, basic: basic, rbox: rbox, canvasTex: canvasTex, reduce: reduce, charGroup: charGroup, charMat: charMat, root: root, guided: !!G,
      setLight: function (v) { setLight(v, true); }, setAirplane: function (v) { setAirplane(v); } };
    var mod = modules[J.module](ctx3d);
    var dark = !!mod.dark;
    var rig = new THREE.Group(); rig.add(mod.root); scene.add(rig);
    renderer.setClearColor(dark ? 0x0a0d16 : 0x14303a, 1);
    if (dark) scene.fog = new THREE.Fog(0x0a0d16, 14, 30);
    var LIGHT = dark ? { key: 0.12, fill: 0.22, amb: 0.16, emi: 0.5 } : { key: 0.55, fill: 0.55, amb: 0.5, emi: 0.38 };
    var HEROL = dark ? { key: 1.1, fill: 0.75, amb: 0.2 } : { key: 0.62, fill: 0.42, amb: 0.2 };

    var C3 = CTX3D[ctxId], wristLocal = V(0, 0, 0);
    function applyContext() {
      C3 = CTX3D[ctxId]; wristLocal.set(C3.wrist[0], C3.wrist[1], C3.wrist[2]);
      skin.color.setHex(C3.skin); skin.userData.base.setHex(C3.skin);
      sleeveMat.map = C3.sleeve === "plaid" ? plaid : floral; sleeveMat.needsUpdate = true;
      armVariants.plaid.forEach(function (m) { m.visible = C3.sleeve === "plaid"; }); armVariants.floral.forEach(function (m) { m.visible = C3.sleeve !== "plaid"; });
      bracelets.forEach(function (m) { m.visible = C3.bracelet; });
      charPlane.scale.x = C3.w / 2.7;
      groundMat.color.setHex(dark ? 0x3a3440 : C3.ground);
      bgMat.color.setHex(dark ? 0x2c2c40 : 0xffffff);
      var want = ctxId;
      loadChar(C3.img, function (tx) { if (ctxId !== want) return; charMat.map = tx; charMat.emissiveMap = tx; charMat.needsUpdate = true; });
      frameWide(); if (mod.setContext) mod.setContext(ctxId, C3);
    }

    /* ---------- cámaras ---------- */
    var camWide = { p: V(0, 2.7, 11.4), l: V(0, 2.1, 0) }, aspect = 1, portrait = false, camHero = null, camClose = null;
    function pickCams() { var c = mod.cams(portrait, aspect, Math.tan(camera.fov * Math.PI / 360)); camHero = c.hero; camClose = c.close; }
    function frameWide() {
      portrait = aspect < 0.9; var fov = portrait ? 42 : 30; camera.fov = fov; camera.updateProjectionMatrix();
      var tn = Math.tan(fov * Math.PI / 360);
      if (portrait) { var Hv = 4.4 / 0.34, D = Hv / (2 * tn); camWide.l.set(0.5, 2.2 - (0.5 - 0.31) * Hv, 0); camWide.p.set(0.5, camWide.l.y + 1.8, D); }
      else { var Hv2 = 4.4 / 0.74, D2 = Hv2 / (2 * tn), Wv = Hv2 * aspect, shift = aspect > 1.15 ? (0.5 - 0.33) * Wv : 0; camWide.l.set(0.3 + shift, 2.05, 0); camWide.p.set(0.3 + shift, 2.7, D2); }
      pickCams();
    }
    function resize() {
      var w = root.clientWidth || 1, h = root.clientHeight || 1; renderer.setSize(w, h, false); aspect = w / h;
      frameWide(); camera.aspect = aspect; camera.updateProjectionMatrix();
    }
    var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null; if (ro) ro.observe(root); else window.addEventListener("resize", resize);

    /* ---------- línea de tiempo ---------- */
    var E = reduce ? step : smooth, t = 0, tl = null, holdT = false;
    function plan(skipHero) {
      var H = skipHero ? 0 : TIMES.hero, A = mod.duration(topicId), c0 = H + TIMES.toClose, c1 = c0 + A, w1 = c1 + TIMES.toWide;
      tl = { H: H, c0: c0, c1: c1, w1: w1, card: c1 + TIMES.cardAfter, A: A, fromWide: !!skipHero };
    }
    function resetLive() { live.light = false; live.airplane = false; live.sms = window.FFSms.fresh(); live.net = 0; live.netAt = live.searchAt = live.recAt = -1e9; if (mod.reset) mod.reset(); }
    function hideCard() { card.hidden = true; hot.hidden = true; }
    function restart(skipHero) {
      bye.hidden = true; hideCard(); shown.card = false; plan(skipHero); resetLive(); t = 0; skipBtn.hidden = false; setStep(skipHero ? 2 : 1);
      holdT = false;
      if (reduce) { holdT = true; t = skipHero ? tl.c1 - 0.001 : Math.max(0.05, tl.H * 0.8); setStep(skipHero ? 2 : 1); }
      if (G) guideBegin(skipHero);
    }
    var pendingFocus = null;
    function toEnd() { /* plano completo con el cuadro ya visible (visita repetida o «saltar») */
      plan(true); resetLive(); if (mod.finish) mod.finish(); t = tl.card + 0.01; bye.hidden = true; holdT = reduce; skipBtn.hidden = true;
      if (G) { stopPlay(); G.n = 5; G.gate = Infinity; mod.slow = false; mod.sos = true; setHotMode("toggle"); }
    }
    function goStep(n) {
      if (G) { if (n === 1) restart(false); else if (n === 2 || n === 3) guideJump(n); else toEnd(); return; }
      if (n === 1) restart(false);
      else if (n === 2) restart(true);
      else if (n === 3) { t = tl.c1 + (reduce ? 0.25 : 0.0); bye.hidden = true; hideCard(); shown.card = false; skipBtn.hidden = false; holdT = reduce; if (mod.finish) mod.finish(); setStep(3); }
      else { toEnd(); }
    }
    function showCard() {
      if (shown.card || !bye.hidden) return; shown.card = true;
      card.classList.remove("seq-guided"); setHotMode("toggle"); card.hidden = false; renderCard(pendingFocus); pendingFocus = null; skipBtn.hidden = true; setStep(4);
      hot.hidden = !mod.hotWorld;
      if (cfg.onTopic) cfg.onTopic(topicId);
      if (cfg.onIntro) cfg.onIntro();
    }

    /* ---------- controles ---------- */
    function setLight(v, silent) { var chg = live.light !== !!v; live.light = !!v; live.kick = performance.now(); if (chg && !silent && window.FFAudio) window.FFAudio.click(live.light); root.classList.toggle("seq-on", live.light); syncHot(); if (shown.card) { var b = card.querySelector('[data-act="light"]'); if (b) { b.setAttribute("aria-checked", live.light); b.querySelector(".lbl").textContent = live.light ? "Apagar la linterna" : "Encender la linterna"; } } }
    function setAirplane(v) {
      var was = live.airplane; live.airplane = !!v; live.kick = performance.now(); if (was && !live.airplane) live.recAt = live.kick;
      var b = card.querySelector('[data-act="air"]'); if (b) { b.setAttribute("aria-checked", live.airplane); b.querySelector(".lbl").textContent = live.airplane ? "Desactivar el modo avión" : "Activar el modo avión"; }
      say(live.airplane ? "Modo avión activado (simulado)" : "Modo avión desactivado: reconexión ilustrativa");
      var A = window.FFAudio; if (A) { A.cancelLater(); A.airplane(live.airplane); if (!live.airplane) A.after(2800, function () { A.blip(); }); }   // el aviso coincide con el cambio visual «Reconexión ilustrativa»
    }
    function setNet(v) {
      live.net = v ? 1 : 0; live.kick = live.netAt = performance.now();
      var b = card.querySelector('[data-act="net"]'); if (b) { b.setAttribute("aria-checked", !!live.net); b.querySelector(".lbl").textContent = live.net ? "Volver a la red automática" : "Probar otra red (simulado)"; }
      say(live.net ? "Probando otra red (simulado): no garantiza conexión" : "Red automática (simulado)");
      var A = window.FFAudio; if (A) { A.cancelLater(); A.airplane(!!live.net); if (live.net) A.after(2400, function () { A.blip(); }); }
    }
    function doSearch() { live.searchAt = live.kick = performance.now(); say("Buscando señal (simulado)"); var A = window.FFAudio; if (A) { A.cancelLater(); A.click(true); A.after(3200, function () { A.blip(); }); } }
    function syncHot() { hot.setAttribute("aria-checked", live.light ? "true" : "false"); hot.setAttribute("aria-label", "Interruptor de la linterna: " + (live.light ? "encendida. Púlsalo para apagar" : "apagada. Púlsalo para encender")); }
    skipBtn.addEventListener("click", function () { toEnd(); });
    stepLis.forEach(function (li) { li.querySelector("button").addEventListener("click", function () { goStep(+li.getAttribute("data-i")); }); });
    bye.querySelector(".seq-repeat").addEventListener("click", function () { restart(false); });
    function swapTopic(id) { topicId = id; pendingFocus = { act: "topic", v: id }; if (mod.setTopic) mod.setTopic(id); restart(true); say("Tema: " + topic().name); }
    card.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return; var a = b.getAttribute("data-act"), v = b.getAttribute("data-v");
      if (a === "topic" && v !== topicId) { swapTopic(v); }
      else if (a === "light") setLight(!live.light);
      else if (a === "air") setAirplane(!live.airplane);
      else if (a === "net") setNet(!live.net);
      else if (a === "search") doSearch();
      else if (a === "again") { pendingFocus = { act: "again" }; if (G) guideJump(4); else restart(true); }
      else if (a === "finish") { hideCard(); bye.hidden = false; say("Despedida"); var m = bye.querySelector(".seq-menu"); if (m) m.focus(); }
    });
    window.FFSms.attach(card, live, { say: say, changed: function (snd) {
      live.kick = performance.now(); tutState(); var A = window.FFAudio; if (!A || !snd) return;
      if (snd === "send") { A.send(); say("Envío simulado"); } else if (snd === "del") A.del(); else if (snd === "click") A.click(true); else A.key(snd);
    } });

    /* objetos 3D que el usuario puede tocar (la radio: perillas y selector de banda). Solo en el plano completo y con el cuadro visible. */
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pick = null, hoverAt = 0;
    function toNdc(e) { var r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
    function pickable() { return mod.pickables && shown.card && info.stage === "wide" && bye.hidden; }
    canvas.addEventListener("pointerdown", function (e) {
      if (!pickable()) return; toNdc(e); var hits = ray.intersectObjects(mod.pickables, false); if (!hits.length) return;
      pick = { hit: hits[0], x: e.clientX, y: e.clientY, moved: false }; try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      if (mod.onPick) mod.onPick("down", pick, 0, 0); e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (pick) { var dx = e.clientX - pick.x, dy = e.clientY - pick.y; if (Math.abs(dx) + Math.abs(dy) > 6) pick.moved = true; if (mod.onPick) mod.onPick("move", pick, dx, dy); return; }
      if (e.pointerType === "mouse" && pickable() && performance.now() - hoverAt > 60) { hoverAt = performance.now(); toNdc(e); canvas.style.cursor = ray.intersectObjects(mod.pickables, false).length ? "pointer" : ""; }
    });
    canvas.addEventListener("pointerup", function (e) { if (!pick) return; var p = pick; pick = null; if (mod.onPick) mod.onPick("up", p, e.clientX - p.x, e.clientY - p.y); });
    canvas.addEventListener("pointercancel", function () { pick = null; });

    /* ---------- simulación del sismo (solo zona urbana, al entrar) ----------
       Movimientos suaves y acotados: cámara ±3 cm y 0,3° de giro, edificios y postes oscilan ~1°, luces que parpadean y objetos de la calle que vibran.
       El personaje (una ilustración plana) reacciona con un golpe de signo «!» y una postura encogida y ladeada de todo el cuerpo: no es una animación corporal. */
    var qk = $(".seq-quake"), qState = null, QDUR = 5.0, surprise = null;
    function startQuake() {
      surprise = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, function (x) { x.fillStyle = "#fff4d6"; x.beginPath(); x.arc(64, 64, 56, 0, 6.3); x.fill(); x.strokeStyle = "#d7342a"; x.lineWidth = 8; x.stroke(); x.fillStyle = "#d7342a"; x.font = "bold 84px Arial"; x.textAlign = "center"; x.fillText("!", 64, 92); }), transparent: true, opacity: 0, depthTest: false }));
      surprise.scale.set(0.9, 0.9, 1); surprise.position.set(1.15, 4.05, 0.5); scene.add(surprise);
      qState = { t: 0, phase: "during" }; rig.visible = false; hideCard(); root.classList.add("seq-quaking"); qk.hidden = false; qk.classList.remove("after");
      qk.querySelector(".seq-qk").textContent = QTX.during; qk.querySelector(".seq-qt").textContent = QTX.duringText + (reduce ? " " + QTX.still : "");
      qk.querySelector(".seq-qgo").hidden = true; qk.querySelector(".seq-qskip").hidden = false; say(QTX.during + ": " + QTX.duringText);
      if (!reduce && window.FFAudio) window.FFAudio.quake(true);
      if (reduce) { qState.t = QDUR + 0.7; qState.phase = "after"; quakeAfter(); }
    }
    function quakeAfter() {
      qState.phase = "after"; if (window.FFAudio) window.FFAudio.quake(false); qk.classList.add("after"); qk.querySelector(".seq-qk").textContent = reduce ? QTX.during + " · " + QTX.after : QTX.after; qk.querySelector(".seq-qt").textContent = reduce ? QTX.duringText + " " + QTX.still + " " + QTX.afterText : QTX.afterText;
      var go = qk.querySelector(".seq-qgo"); go.hidden = false; qk.querySelector(".seq-qskip").hidden = true; go.focus({ preventScroll: true }); say(QTX.after + ". " + QTX.afterText);
    }
    function endQuake() {
      if (!qState) return; if (window.FFAudio) window.FFAudio.quake(false); qState = null; qk.hidden = true; rig.visible = true; root.classList.remove("seq-quaking"); if (surprise) surprise.material.opacity = 0;
      if (cfg.onQuakeDone) cfg.onQuakeDone(); heroKey.intensity = LIGHT.key;
      restart(false);
    }
    qk.querySelector(".seq-qgo").addEventListener("click", endQuake);
    qk.querySelector(".seq-qskip").addEventListener("click", function () { if (qState && qState.phase === "during") { qState.t = QDUR + 0.7; quakeAfter(); } });
    function quakeFrame(dt) {
      qState.t += dt; var qt = qState.t;
      var a = reduce ? 0 : smooth(qt / 1.2) * (1 - smooth((qt - 3.6) / 1.4)), pr = reduce ? 1 : smooth(qt / 0.45) * (1 - smooth((qt - 4.6) / 1.0));
      if (qState.phase === "during" && qt >= QDUR + 0.7) quakeAfter();
      env.visible = true; envMats.forEach(function (m) { m.opacity = 1; });
      camera.position.copy(camWide.p); camera.lookAt(camWide.l);
      camera.position.x += (Math.sin(qt * 13.1) * 0.028 + Math.sin(qt * 7.7) * 0.02) * a; camera.position.y += Math.sin(qt * 17.3) * 0.015 * a; camera.rotateZ(Math.sin(qt * 5.3) * 0.005 * a);
      heroKey.intensity = LIGHT.key * (1 - 0.3 * a * Math.abs(Math.sin(qt * 21))); heroFill.intensity = LIGHT.fill; ambient.intensity = LIGHT.amb; charMat.emissiveIntensity = LIGHT.emi;
      scenery.update(qt, a);
      charGroup.scale.set(1 + 0.03 * pr, 1 - 0.1 * pr, 1); charGroup.position.y = 0; charGroup.rotation.set(0.05 * pr, 0, 0.07 * pr + Math.sin(qt * 19) * 0.008 * a);
      surprise.material.opacity = pr > 0.1 && qt < 4.2 ? 1 : 0; surprise.scale.setScalar(0.9 + (reduce ? 0 : 0.12 * Math.sin(qt * 9)) * (qt < 1.5 ? 1 : 0));
      renderer.render(scene, camera);
    }

    /* ---------- recorrido guiado: linterna y código Morse ----------
       Pasos que esperan al usuario (botón «Continuar»): 1 presentación (la luz se enciende poco a poco) → 2 manos y destello corto/largo → 3 señal SOS → 4 práctica → 5 cuadro.
       Los destellos se reproducen con el reloj real (corto 0,2 s, largo 0,6 s, 0,2 s entre símbolos, 0,6 s entre letras) y cada punto o raya se ilumina en pantalla a la vez.
       Con «reducir movimiento» la linterna no parpadea: solo se iluminan los indicadores. */
    var mp = { ev: null, start: 0, idx: -1, total: 0, done: null }, hold = null, hotMode = "toggle", DOT = 200, DASH = 600, GAP = 200, LGAP = 600;
    function sosEvents() {
      var out = [], tt = 0, n = 0;
      ["...", "---", "..."].forEach(function (L, li) { L.split("").forEach(function (ch, k) { var d = ch === "." ? DOT : DASH; out.push({ s: tt, e: tt + d, sym: ch, sel: '[data-mi="' + n + '"]' }); tt += d; n++; if (k < 2) tt += GAP; }); if (li < 2) tt += LGAP; });
      return { ev: out, total: tt + 500 };
    }
    function lamp(on) { if (!reduce && live.light !== on) setLight(on); }   // destellos de la demostración, del SOS y de la práctica: un clic por encendido y por apagado
    function hl(sel, on) { var el = sel && card.querySelector(sel); if (el) el.classList.toggle("on", on); }
    function syncGuideButtons() { [].forEach.call(card.querySelectorAll(".mo-act"), function (b) { b.disabled = !!G.busy; b.setAttribute("aria-busy", G.busy ? "true" : "false"); }); }
    function stopPlay() { if (!mp.ev) return; if (mp.idx >= 0) hl(mp.ev[mp.idx].sel, false); mp.ev = null; mp.idx = -1; G.busy = false; lamp(false); if (card) syncGuideButtons(); }
    function playEvents(p, onDone) { stopPlay(); mp.ev = p.ev; mp.total = p.total; mp.start = performance.now(); mp.idx = -1; mp.done = onDone || null; G.busy = true; syncGuideButtons(); }
    function playerTick(now) {
      if (!mp.ev) return; var el = now - mp.start, act = -1, i;
      for (i = 0; i < mp.ev.length; i++) if (el >= mp.ev[i].s && el < mp.ev[i].e) { act = i; break; }
      if (act !== mp.idx) { if (mp.idx >= 0) hl(mp.ev[mp.idx].sel, false); mp.idx = act; if (act >= 0) hl(mp.ev[act].sel, true); lamp(act >= 0); }
      if (el >= mp.total) { var d = mp.done; mp.ev = null; mp.idx = -1; G.busy = false; syncGuideButtons(); if (d) d(); }
    }
    function playSos() { say("Señal SOS: tres destellos cortos, tres largos y tres cortos"); playEvents(sosEvents()); }
    function playDemo() { playEvents({ ev: [{ s: 300, e: 300 + DOT, sym: ".", sel: ".mo-chip.dot" }, { s: 1400, e: 1400 + DASH, sym: "-", sel: ".mo-chip.dash" }], total: 2700 }); }
    function userFlash(sym) { var d = sym === "dot" ? DOT : DASH; playEvents({ ev: [{ s: 0, e: d, sym: sym === "dot" ? "." : "-", sel: null }], total: d + 150 }, function () { addSym(sym); }); }
    /* práctica: cada destello se compara con SOS (... --- ...). Al desviarse aparece el error, la secuencia se borra al instante y se puede volver a intentar */
    var SOS_STR = "...---...";
    function addSym(sym) {
      if (G.done || G.err) { G.user = []; G.done = false; G.err = false; clearTimeout(G.errT); }
      G.user.push(sym);
      var str = G.user.map(function (x) { return x === "dot" ? "." : "-"; }).join("");
      if (str !== SOS_STR.slice(0, str.length)) {
        G.user = []; G.err = true; renderLog();
        clearTimeout(G.errT); G.errT = setTimeout(function () { if (G && G.err) { G.err = false; if (card) renderLog(); } }, 7000);
        return;
      }
      if (str.length === SOS_STR.length) G.done = true;
      renderLog();
    }
    function renderLog() {
      var el = card.querySelector(".mo-log"); if (!el) return;
      el.innerHTML = G.user.length ? G.user.map(function (x) { return '<i class="mo-sym ' + x + '"></i>'; }).join("") : '<span class="mo-empty">Aún no has enviado destellos.</span>';
      var fb = card.querySelector(".mo-fb");
      fb.classList.toggle("err", !!G.err);
      fb.textContent = G.err ? "Código incorrecto: el SOS son tres destellos cortos, tres largos y tres cortos (... --- ...). Inténtalo de nuevo." : G.done ? "¡Correcto! Tu secuencia coincide con SOS: ... --- ... (esta práctica no mide los tiempos exactos)." : "";
    }
    function seqHTML() {
      var h = '<div class="mo-seq" role="img" aria-label="SOS: tres destellos cortos, tres largos y tres cortos">', n = 0;
      ["S", "O", "S"].forEach(function (L, li) { h += '<span class="mo-letter"><span class="mo-syms">'; for (var k = 0; k < 3; k++) { h += '<i class="mo-sym ' + (li === 1 ? "dash" : "dot") + '" data-mi="' + n + '"></i>'; n++; } h += "</span><b>" + L + "</b></span>"; });
      return h + "</div>";
    }
    function guideHTML() {
      var g = J.guide, h = '<p class="seq-id">' + esc(J.kicker) + "</p>";
      if (G.n === 1) h += "<h2>" + esc(g.s1.title) + "</h2><p>" + esc(g.s1.text) + '</p><p class="seq-hint"><b>¿Qué es el código Morse?</b> ' + esc(g.s1.morse) + '</p><div class="seq-actions"><button type="button" class="seq-finish" data-g="next">Continuar <span aria-hidden="true">→</span></button></div>';
      else if (G.n === 2) h += "<h2>" + esc(g.s2.title) + '</h2><div class="mo-chips"><span class="mo-chip dot"><i class="mo-sym dot"></i> Destello corto = punto (≈ 0,2 s)</span><span class="mo-chip dash"><i class="mo-sym dash"></i> Destello largo = raya (≈ 0,6 s)</span></div><p>' + esc(g.s2.text) + '</p><div class="seq-actions"><button type="button" class="seq-again" data-g="back"><span aria-hidden="true">←</span> Atrás</button><button type="button" class="seq-again mo-act" data-g="demo">Ver de nuevo</button><button type="button" class="seq-finish" data-g="next">Continuar <span aria-hidden="true">→</span></button></div>';
      else if (G.n === 3) h += "<h2>" + esc(g.s3.title) + "</h2><p>" + esc(g.s3.text) + "</p>" + seqHTML() + '<p class="mo-code"><b>Secuencia: <code>... --- ...</code></b></p><p>' + esc(g.s3.msg) + '</p><p class="seq-hint">' + esc(g.s3.note) + "</p><p>" + esc(g.s3.zone) + '</p><div class="seq-actions"><button type="button" class="seq-again" data-g="back"><span aria-hidden="true">←</span> Atrás</button><button type="button" class="seq-again mo-act" data-g="sos">Ver la señal SOS</button><button type="button" class="seq-finish" data-g="practice">Practicar <span aria-hidden="true">→</span></button></div>';
      else h += "<h2>" + esc(g.p.title) + "</h2><p>" + esc(g.p.text) + "</p>" + seqHTML() + '<div class="mo-pad"><button type="button" class="mo-btn mo-act" data-g="dot"><i class="mo-sym dot"></i> Destello corto</button><button type="button" class="mo-btn mo-act" data-g="dash"><i class="mo-sym dash"></i> Destello largo</button><button type="button" class="mo-btn mo-act" data-g="sos">Reproducir SOS</button><button type="button" class="mo-btn mo-act" data-g="repeat">Repetir</button></div><p class="mo-lbl">Tu práctica:</p><div class="mo-log" aria-live="polite"></div><p class="mo-fb" role="status"></p><div class="seq-actions"><button type="button" class="seq-again" data-g="back"><span aria-hidden="true">←</span> Atrás</button><button type="button" class="seq-again" data-g="clear">Borrar práctica</button><button type="button" class="seq-finish" data-g="finish">Continuar <span aria-hidden="true">→</span></button></div>';
      return h;
    }
    function setHotMode(m) {
      hotMode = m; var lbl = hot.querySelector(".lbl");
      if (m === "hold") { hot.setAttribute("role", "button"); hot.removeAttribute("aria-checked"); hot.setAttribute("aria-label", "Interruptor de la linterna: mantén presionado para encender y suelta para apagar"); if (lbl) lbl.textContent = "Mantén presionado"; }
      else { hot.setAttribute("role", "switch"); if (lbl) lbl.textContent = "Interruptor"; syncHot(); }
    }
    function guideShow(n) {
      G.n = n; card.classList.add("seq-guided"); card.hidden = false; card.innerHTML = guideHTML(); card.removeAttribute("aria-labelledby"); card.setAttribute("aria-label", "Guía del código Morse, paso " + n);
      setStep(n === 1 ? 1 : n === 2 ? 2 : 3); skipBtn.hidden = false; setHotMode(n === 4 ? "hold" : "toggle"); hot.hidden = n < 4; if (n === 4) renderLog(); syncGuideButtons();
      if (G.focus) { var f = card.querySelector("[data-g=next],[data-g=dot]"); if (f) f.focus({ preventScroll: true }); } G.focus = false;
    }
    function guideBegin(skipHero) {
      stopPlay(); G.n = 1; G.user = []; G.err = false; G.done = false; clearTimeout(G.errT); G.busy = false; G.autoSos = false; G.demoDone = false; G.lit = false; G.t0 = performance.now(); mod.slow = true; mod.sos = false;
      G.gate = skipHero ? tl.c1 - 0.02 : tl.H - 0.001; setHotMode("toggle"); guideShow(1);
      if (reduce) { G.lit = true; setLight(true, true); }
    }
    function guideJump(n) {
      restart(true); G.focus = false; mod.slow = false; setLight(false, true);
      if (n === 2) { G.gate = tl.c1 - 0.02; if (reduce) t = tl.c1 - 0.001; mod.sos = false; guideShow(2); }
      else { t = tl.c1 + TIMES.toWide + 1.9; G.gate = t; mod.sos = true; G.autoSos = n === 3; guideShow(n); }
    }
    function guideNext() {
      stopPlay(); G.focus = true; mod.slow = false;
      if (G.n === 1) { setLight(false, true); G.gate = tl.c1 - 0.02; if (reduce) t = tl.c1 - 0.001; guideShow(2); }
      else if (G.n === 2) { G.gate = tl.c1 + TIMES.toWide + 1.9; mod.sos = true; if (reduce) t = G.gate; G.autoSos = true; guideShow(3); }
    }
    function guideFinish() {
      stopPlay(); if (hold) hold = null; G.n = 5; G.gate = Infinity; mod.sos = true; card.hidden = true; card.classList.remove("seq-guided"); hot.hidden = true; setHotMode("toggle"); setStep(4); if (reduce) t = tl.card + 0.01;
    }
    function guideFrame(now) {
      if (G.n === 1 && !G.lit && now - G.t0 > 700) { G.lit = true; setLight(true); }   // se hunde el botón y la luz sube poco a poco
      if (G.n === 2 && !G.demoDone && info.stage === "close" && info.ta >= 0.4) { G.demoDone = true; playDemo(); }
      if (G.n === 3 && G.autoSos && t >= tl.c1 + TIMES.toWide - 0.2) { G.autoSos = false; playSos(); }
      playerTick(now);
    }
    card.addEventListener("click", function (e) {
      var b = e.target.closest("[data-g]"); if (!b || !G) return; var a = b.getAttribute("data-g");
      if (a === "next") guideNext();
      else if (a === "back") { stopPlay(); G.focus = false; if (G.n === 2) restart(false); else guideJump(G.n - 1); }
      else if (a === "demo") { if (!G.busy) playDemo(); }
      else if (a === "sos" || a === "repeat") { if (!G.busy && !hold) playSos(); }
      else if (a === "practice") { stopPlay(); G.focus = true; guideShow(4); }
      else if (a === "dot" || a === "dash") { if (!G.busy && !hold) userFlash(a); }
      else if (a === "clear") { G.user = []; G.err = false; G.done = false; clearTimeout(G.errT); renderLog(); }
      else if (a === "finish") guideFinish();
    });
    /* interruptor sobre la linterna: alternar (cuadro final) o mantener presionado para encender y soltar para apagar (práctica) */
    hot.addEventListener("click", function () { if (hotMode === "toggle") setLight(!live.light); });
    function holdStart(e) { if (hotMode !== "hold" || !G || G.busy || hold) return; hold = { at: performance.now() }; hot.classList.add("held"); lamp(true); }
    function holdEnd() { if (!hold) return; var d = performance.now() - hold.at; hold = null; hot.classList.remove("held"); lamp(false); addSym(d < 400 ? "dot" : "dash"); }
    hot.addEventListener("pointerdown", function (e) { if (hotMode !== "hold") return; e.preventDefault(); try { hot.setPointerCapture(e.pointerId); } catch (x) {} holdStart(e); });
    hot.addEventListener("pointerup", holdEnd); hot.addEventListener("pointercancel", holdEnd); hot.addEventListener("blur", holdEnd);
    hot.addEventListener("keydown", function (e) { if (hotMode === "hold" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); if (!e.repeat) holdStart(e); } });
    hot.addEventListener("keyup", function (e) { if (hotMode === "hold" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); holdEnd(); } });

    /* ---------- bucle ---------- */
    var info = { t: 0, tl: null, stage: "hero", kIn: 0, kOut: 0, ta: 0, A: 0, fromWide: false, rise: 0, leftK: 1, armsK: 1, envA: 0, sweep: 0, speakK: 0, wrist: V(0, 0, 0), live: live, aspect: 1, portrait: false, reduce: reduce, dt: 0, ctx: ctxId, topic: topicId, camera: camera };
    var raf = 0, last = performance.now(), api = { hold: false }, pv = V(0, 0, 0), v1 = V(0, 0, 0), u3 = V(0, 0, 0), pw = { p: V(0, 0, 0), q: new THREE.Quaternion(), s: 1 }, ph = { p: V(0, 0, 0), q: new THREE.Quaternion(), s: 1 }, pc = { p: V(0, 0, 0), q: new THREE.Quaternion(), s: 1 };
    function copyPose(d, s) { d.p.copy(s.p); d.q.copy(s.q); d.s = s.s; }
    function place(a, b, k) {
      var q = rig.quaternion.copy(a.q).slerp(b.q, k), s = lerp(a.s, b.s, k); rig.scale.setScalar(s);
      pv.lerpVectors(a.p, b.p, k).sub(u3.copy(mod.pivot).multiplyScalar(s).applyQuaternion(q)); rig.position.copy(pv);
    }
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.033); last = now; if (qState) { quakeFrame(dt); return; } if (!holdT && !api.hold) t += dt;
      if (G) { if (t > G.gate) t = G.gate; guideFrame(now); }
      var H = tl.H, c0 = tl.c0, c1 = tl.c1, w1 = tl.w1;
      var kIn = H >= 0 ? E((t - H) / TIMES.toClose) : 1, kOut = E((t - c1) / TIMES.toWide);
      var stage = t < H ? "hero" : t < c1 ? "close" : "wide";
      if (!G) { if (stage === "hero") setStep(1); else if (stage === "close") setStep(2); else if (t < tl.card) setStep(3); }
      var sweep = t > w1 && !reduce ? (t - w1) * 0.55 : 0;
      var envA = t < c1 ? (tl.fromWide ? 1 - E(kIn * 1.3) : 0) : E((t - (c1 + 0.2)) / 1.6);
      var speakK = t >= tl.card ? 1 : 0;

      charGroup.updateMatrixWorld(true); wristLocal.set(C3.wrist[0], C3.wrist[1], C3.wrist[2]); info.wrist.copy(charGroup.localToWorld(u3.copy(wristLocal)));
      info.t = t; info.tl = tl; info.stage = stage; info.kIn = kIn; info.kOut = kOut; info.ta = clamp01((t - c0) / tl.A) * tl.A; info.A = tl.A; info.fromWide = tl.fromWide;
      info.rise = tl.fromWide ? 1 : E((t - H) / 1.0); info.envA = envA; info.sweep = sweep; info.speakK = speakK; info.aspect = aspect; info.portrait = portrait; info.dt = dt; info.ctx = ctxId; info.topic = topicId;
      info.leftK = t < c1 ? (tl.fromWide ? E(kIn * 1.4) : 1) : 1 - E((t - c1) / 0.9);
      info.armsK = t < c1 + (w1 - c1) * 0.45 ? 1 : 0;

      /* objeto: hero → primer plano → plano completo (siempre el mismo modelo, mezclado sin cortes) */
      copyPose(pw, mod.pose.wide(info));
      if (t < H) { copyPose(ph, mod.pose.hero(t, info)); place(ph, ph, 0); }
      else if (t < c1) { copyPose(pc, mod.pose.close(info)); if (tl.fromWide) place(pw, pc, kIn); else { copyPose(ph, mod.pose.hero(H, info)); place(ph, pc, kIn); } }
      else { copyPose(pc, mod.pose.close(info)); place(pc, pw, kOut); }

      /* cámara */
      if (t < H) { camera.position.copy(camHero.p); v1.copy(camHero.l); }
      else if (t < c1) {
        var cf = tl.fromWide ? camWide : camHero;
        camera.position.lerpVectors(cf.p, camClose.p, kIn); v1.lerpVectors(cf.l, camClose.l, kIn);
        if (!tl.fromWide && !reduce) camera.position.x += Math.sin(t * 0.6) * 0.04 * kIn;
      } else { camera.position.lerpVectors(camClose.p, camWide.p, kOut); v1.lerpVectors(camClose.l, camWide.l, kOut); }
      camera.lookAt(v1);

      /* entorno y luces (la misma luz de la etapa 1 pasa de forma continua al plano completo) */
      env.visible = envA > 0.01; envMats.forEach(function (m) { m.opacity = envA; });
      heroKey.intensity = lerp(HEROL.key, LIGHT.key, envA); heroFill.intensity = lerp(HEROL.fill, LIGHT.fill, envA); ambient.intensity = lerp(HEROL.amb, LIGHT.amb, envA);
      charMat.emissiveIntensity = LIGHT.emi;
      var breathe = reduce ? 0 : Math.sin(t * 1.4) * 0.006;
      charGroup.scale.set(1 - breathe * 0.3, 1 + breathe, 1);
      /* gestos del personaje al explicar: balanceo del cuerpo entero (la ilustración es plana: no hay brazos articulados) */
      charGroup.position.y = reduce ? 0 : Math.abs(Math.sin(t * 2.6)) * 0.03 * speakK;
      charGroup.rotation.set(0, 0, reduce ? 0 : Math.sin(t * 1.3) * 0.022 * speakK);

      scenery.update(t, 0);
      if (mod.frame) mod.frame(info);
      if (miniCtx && mod.screenCanvas && now - miniAt > 110) { miniAt = now; miniCtx.drawImage(mod.screenCanvas, 0, 0, 128, 274); }
      if (mod.charAdjust) mod.charAdjust(charGroup, info);

      if (t >= tl.card && (!G || G.n === 5)) showCard();
      if (!hot.hidden && mod.hotWorld) {
        mod.hotWorld(u3); u3.project(camera); var w = root.clientWidth, h = root.clientHeight, s = 64;
        hot.style.left = ((u3.x + 1) / 2 * w - s / 2) + "px"; hot.style.top = ((1 - u3.y) / 2 * h - s / 2) + "px"; hot.style.width = s + "px"; hot.style.height = s + "px";
      }
      renderer.render(scene, camera);
    }

    /* arranque: primera vez → secuencia completa; visita repetida → plano completo con el cuadro (se puede repetir) */
    applyContext(); resize();
    if (mod.setTopic) mod.setTopic(topicId);
    syncHot();
    if (cfg.quake && Zn.quake) { restart(false); startQuake(); }
    else restart(false);   /* también en visitas repetidas: siempre empieza con el objeto solo → acercamiento con la interacción → personaje (se puede saltar) */
    raf = requestAnimationFrame(frame);

    api.seek = function (s) { t = s; };
    api.tick = function (n) { /* avanza n fotogramas a mano (pruebas con la pestaña en segundo plano) */
      for (var i = 0; i < (n || 1); i++) { cancelAnimationFrame(raf); last = performance.now() - 33; frame(performance.now()); }
    };
    api.step = goStep;
    Object.defineProperties(api, {
      time: { get: function () { return t; } }, plan: { get: function () { return tl; } }, live: { get: function () { return live; } },
      context: { get: function () { return ctxId; } }, topic: { get: function () { return topicId; } }, stage: { get: function () { return info.stage; } },
      info: { get: function () { return info; } }, module: { get: function () { return mod; } }
    });
    api.stop = function () {
      alive = false; if (window.FFAudio) window.FFAudio.sceneStop(); cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      if (unmountTuner) unmountTuner();
      scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (mt) { if (mt.map) mt.map.dispose(); mt.dispose(); }); } });
      Object.keys(texCache).forEach(function (k) { texCache[k].dispose(); });
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      root.innerHTML = ""; root.classList.remove("seq-on", "seq-flatmode");
    };
    api.setTopic = swapTopic; api.setLight = setLight; api.setAirplane = setAirplane; api.nav = NAV; api.interacting = function () { return !!pick || !!(G && (G.n === 3 || G.n === 4)); };
    api.quake = function () { return qState; }; api.endQuake = endQuake;
    start.current = api;
    return api;
  }

  return { start: start, modules: modules, get current() { return start.current; } };
})();
