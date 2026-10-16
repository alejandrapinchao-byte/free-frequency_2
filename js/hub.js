/* Menú principal 3D: plataforma central con tres objetos (teléfono celular, radio AM/FM y linterna).
   Los modelos son geometría 3D real construida con Three.js (clásico, copia local en assets/vendor) con material "toon" para el estilo cartoon:
   no hay archivos de modelo externos. Si el navegador no tiene WebGL (o Three.js no carga) se muestra una versión plana con los mismos botones, tarjetas y acciones.
   Interacción: el cursor o el teclado muestran una vista previa del cuadro informativo; un clic o toque SELECCIONA el objeto (se ilumina y el cuadro queda visible).
   Seleccionar nunca navega: el recorrido empieza solo con el botón «Comenzar recorrido» del cuadro. */
window.FFHub = (function () {
  "use strict";

  /* ---------- Utilidades de modelado ---------- */
  function roundedRectShape(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  /* caja redondeada y biselada de w × h × d, centrada */
  function rbox(w, h, d, r, b) {
    var g = new THREE.ExtrudeGeometry(roundedRectShape(w - 2 * b, h - 2 * b, Math.max(r - b, 0.02)),
      { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 10 });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  }
  function rr(x, px, py, w, h, r, color) {
    x.fillStyle = color; x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); x.fill();
  }
  function canvasTex(w, h, draw) {
    var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  var gradient = null;
  function toon(color, extra) {
    if (!gradient) {
      gradient = new THREE.DataTexture(new Uint8Array([105, 175, 255]), 3, 1, THREE.RedFormat);
      gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
    }
    var m = new THREE.MeshToonMaterial(Object.assign({ color: color, gradientMap: gradient }, extra || {}));
    m.userData.base = new THREE.Color(color);
    return m;
  }
  function basic(color, extra) {
    var m = new THREE.MeshBasicMaterial(Object.assign({ color: color }, extra || {}));
    m.userData.base = new THREE.Color(color);
    return m;
  }

  /* ---------- Modelos (el origen de cada grupo está en su base) ---------- */
  function buildPhone(glows) {
    var g = new THREE.Group();
    var dock = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.12, 36), toon(0xf1deb6)); dock.position.y = 0.06; g.add(dock);
    var body = new THREE.Mesh(rbox(1.2, 2.4, 0.22, 0.24, 0.06), toon(0x2f3550)); body.position.y = 1.36; body.rotation.x = -0.1; g.add(body);
    var screenTex = canvasTex(256, 548, function (x) {
      var gr = x.createLinearGradient(0, 0, 0, 548); gr.addColorStop(0, "#2f4170"); gr.addColorStop(1, "#121a30"); x.fillStyle = gr; x.fillRect(0, 0, 256, 548);
      for (var i = 0; i < 4; i++) { var bh = i * 6 + 9; x.fillStyle = i === 0 ? "#ffb627" : "rgba(255,255,255,.28)"; x.fillRect(24 + i * 14, 56 - bh, 9, bh); }
      x.strokeStyle = "#ff6a5a"; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(94, 30); x.lineTo(116, 52); x.moveTo(116, 30); x.lineTo(94, 52); x.stroke();
      rr(x, 28, 112, 150, 58, 24, "#cfd8e8"); rr(x, 78, 188, 150, 58, 24, "#f08a4b"); rr(x, 28, 264, 118, 50, 22, "#cfd8e8"); rr(x, 100, 332, 128, 58, 24, "#f08a4b");
      x.fillStyle = "#ffffff"; x.textAlign = "right"; x.font = "italic 19px Georgia, serif"; x.fillText("Free Frequency", 246, 44);   // logo blanco en la pantalla
      x.fillStyle = "#fff4d6"; x.font = "bold 30px Arial"; x.textAlign = "center"; x.fillText("SMS", 128, 452);
      x.fillStyle = "rgba(255,255,255,.75)"; x.font = "17px Arial"; x.fillText(window.FFi18n ? FFi18n.t("sin internet") : "sin internet", 128, 484);
    });
    var screenGeo = new THREE.ShapeGeometry(roundedRectShape(1.04, 2.22, 0.17)), sp = screenGeo.attributes.position, suv = screenGeo.attributes.uv;
    for (var si = 0; si < sp.count; si++) suv.setXY(si, sp.getX(si) / 1.04 + 0.5, sp.getY(si) / 2.22 + 0.5);   // UV normalizadas (0–1) para que el canvas de la pantalla se vea completo
    var screen = new THREE.Mesh(screenGeo, basic(0xffffff, { map: screenTex }));
    screen.position.set(0, 0, 0.118); screen.geometry.translate(0, 0, 0); body.add(screen); glows.push(screen.material);
    var notch = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.2, 4, 8), basic(0x0d0f1c)); notch.rotation.z = Math.PI / 2; notch.position.set(0, 1.03, 0.125); body.add(notch);
    var btn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.1), toon(0x1f2238)); btn.position.set(0.62, 0.3, 0); body.add(btn);
    g.userData = { center: new THREE.Vector3(0, 1.4, 0), radius: 1.45, baseRot: -0.38, glowMeshes: [body], body: body, screen: screen, dock: dock };
    return g;
  }

  function buildRadio(glows) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(rbox(3.0, 1.7, 1.0, 0.32, 0.08), toon(0xe0682d)); body.position.y = 0.98; g.add(body);
    var foot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 14), toon(0x3d2f27)); foot1.position.set(-1.05, 0.06, 0.25); g.add(foot1);
    var foot2 = foot1.clone(); foot2.position.x = 1.05; g.add(foot2);
    var grilleTex = canvasTex(160, 160, function (x, w, h) {
      x.fillStyle = "#f3e2bd"; x.fillRect(0, 0, w, h); x.fillStyle = "#b79a69";
      for (var j = 0; j < 9; j++) for (var i = 0; i < 9; i++) { x.beginPath(); x.arc(14 + i * 16.5 + (j % 2) * 4, 14 + j * 16.5, 4.2, 0, 6.3); x.fill(); }
    });
    var grille = new THREE.Mesh(new THREE.CircleGeometry(0.6, 40), basic(0xffffff, { map: grilleTex })); grille.position.set(-0.8, -0.02, 0.512); body.add(grille);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.045, 10, 40), toon(0x7a3a1a)); ring.position.set(-0.8, -0.02, 0.5); body.add(ring);
    var dialTex = canvasTex(320, 130, function (x, w, h) {
      x.fillStyle = "#fff4d6"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#5d4a30"; x.font = "bold 20px Arial"; x.textAlign = "left"; x.fillText("FM", 12, 30); x.fillText("AM", 12, 100);
      x.strokeStyle = "#b79a69"; x.lineWidth = 3;
      for (var i = 0; i <= 18; i++) { var px = 58 + i * 14; x.beginPath(); x.moveTo(px, 14); x.lineTo(px, i % 3 === 0 ? 40 : 30); x.stroke(); x.beginPath(); x.moveTo(px, 116); x.lineTo(px, i % 3 === 0 ? 90 : 100); x.stroke(); }
      x.fillStyle = "#7a6a50"; x.font = "bold 15px Arial"; x.textAlign = "center"; ["88", "96", "104"].forEach(function (t, k) { x.fillText(t, 58 + k * 84 + 28, 58); });
          });
    var dial = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.53), basic(0xffffff, { map: dialTex })); dial.position.set(0.7, 0.4, 0.512); body.add(dial); glows.push(dial.material);
    var frame = new THREE.Mesh(rbox(1.42, 0.65, 0.06, 0.1, 0.02), toon(0x7a3a1a)); frame.position.set(0.7, 0.4, 0.49); body.add(frame);
    /* aguja del dial (se puede mover: userData.needle) y perillas (grupos que giran sobre su eje: userData.knobs) */
    var needle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.46, 0.02), basic(0xd7342a)); needle.position.set(0.765, 0.4, 0.528); body.add(needle);
    var knobs = [0.42, 1.0].map(function (kx) {
      var kg = new THREE.Group(); kg.position.set(kx, -0.42, 0.56); body.add(kg);
      var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.16, 28), toon(0x3d2f27)); knob.rotation.x = Math.PI / 2; kg.add(knob);
      var mark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), basic(0xffb627)); mark.position.set(0, 0.07, 0.09); kg.add(mark);
      return kg;
    });
    /* selector de banda AM/FM: etiqueta y dos lámparas (la de la banda activa se enciende; userData.bandPlane y userData.bandLamps) */
    var bandTex = canvasTex(256, 64, function (x, w, h) { x.fillStyle = "#fff4d6"; x.fillRect(0, 0, w, h); x.fillStyle = "#5d4a30"; x.font = "bold 30px Arial"; x.textAlign = "center"; x.fillText("AM", 64, 44); x.fillText("FM", 192, 44); });
    var bandPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), basic(0xffffff, { map: bandTex })); bandPlane.position.set(0.7, -0.14, 0.512); body.add(bandPlane);
    var bandLamps = [0, 1].map(function (i) { var lm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), basic(0x6a4a20)); lm.rotation.x = Math.PI / 2; lm.position.set(i ? 0.925 : 0.475, -0.015, 0.52); body.add(lm); return lm; });
    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 12, 36, Math.PI), toon(0x4a3b30)); handle.position.set(0, 1.78, 0); g.add(handle);
    var ant = new THREE.Group(); ant.position.set(1.2, 1.8, -0.15); ant.rotation.z = -0.5; g.add(ant);
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.5, 10), toon(0xd8dde6)); rod.position.y = 0.75; ant.add(rod);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), toon(0xffb627)); tip.position.y = 1.5; ant.add(tip);
    g.userData = { center: new THREE.Vector3(0, 1.1, 0), radius: 1.9, baseRot: -0.18, glowMeshes: [body], body: body, needle: needle, knobs: knobs, dial: dial, bandPlane: bandPlane, bandLamps: bandLamps };
    return g;
  }

  function buildTorch(glows, beamHolder) {
    var g = new THREE.Group();
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.2, 28), toon(0x2a2d38)); cap.position.y = 0.2; g.add(cap);
    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 30), toon(0xffc83d)); handle.position.y = 1.15; g.add(handle);
    [0.7, 0.98, 1.26].forEach(function (y) { var t = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 10, 28), toon(0x8a5410)); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); });
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.18, 28), toon(0x2a2d38)); neck.position.y = 2.09; g.add(neck);
    var head = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.4, 0.8, 36), toon(0x4a4f5e)); head.position.y = 2.58; g.add(head);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.07, 12, 40), toon(0xb8beca)); rim.rotation.x = Math.PI / 2; rim.position.y = 2.98; g.add(rim);
    var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 36), basic(0xfff3c0)); lens.position.y = 2.99; g.add(lens); glows.push(lens.material);
    var housing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.2), toon(0x2a2d38)); housing.position.set(0.3, 1.6, 0); g.add(housing);
    var sw = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 14), toon(0xd7342a)); sw.rotation.z = Math.PI / 2; sw.position.set(0.42, 1.6, 0); g.add(sw);
    var strap = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 20), toon(0xd7342a)); strap.position.set(0, 0.06, 0.28); strap.rotation.y = Math.PI / 2; g.add(strap);
    /* haz de luz: cono translúcido con degradado (alfa por vértice) */
    var bh = 1.6, bg = new THREE.ConeGeometry(0.85, bh, 40, 1, true), pos = bg.attributes.position, col = new Float32Array(pos.count * 4);
    for (var i = 0; i < pos.count; i++) { var t = (pos.getY(i) + bh / 2) / bh; col[i * 4] = 1; col[i * 4 + 1] = 0.93; col[i * 4 + 2] = 0.66; col[i * 4 + 3] = Math.pow(t, 1.6) * 0.5; }
    bg.setAttribute("color", new THREE.BufferAttribute(col, 4));
    var beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.rotation.x = Math.PI; beam.position.y = 3.02 + bh / 2; g.add(beam); beamHolder.beam = beam;
    g.userData = { center: new THREE.Vector3(0, 1.8, 0), radius: 1.6, baseRot: 0.2, tilt: -0.1, glowMeshes: [handle, head], sw: sw, lens: lens, housing: housing };
    return g;
  }

  /* ---------- Escena e interacción ----------
     Estados: preview (cursor o teclado, temporal) y selected (clic o toque, persistente). Un solo cuadro informativo muestra el objeto en preview o, si no hay,
     el seleccionado. Seleccionar NUNCA navega: el recorrido empieza solo con el botón «Comenzar recorrido» del cuadro. */
  function start(root, items, getProgress, onOpen, reduce) {
    var stage = document.createElement("div"); stage.className = "hub-stage";
    var canvas = document.createElement("canvas"); canvas.className = "hub-canvas"; canvas.setAttribute("aria-hidden", "true");
    var overlay = document.createElement("div"); overlay.className = "hub-items";
    stage.appendChild(canvas); stage.appendChild(overlay); root.innerHTML = ""; root.appendChild(stage);

    var renderer = null, flat = false;
    try {
      if (!window.THREE) throw new Error("sin three");
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      if (!renderer.getContext()) throw new Error("sin webgl");
    } catch (e) { flat = true; renderer = null; }
    root.classList.toggle("hub-flat", flat);

    /* Botones de los objetos (HTML accesible, sobre cada modelo 3D) + un único cuadro informativo */
    var byId = {};
    var btns = items.map(function (it) {
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "hub-obj"; btn.setAttribute("data-id", it.id);
      btn.setAttribute("aria-label", it.name); btn.setAttribute("aria-pressed", "false");
      if (flat) { var im = document.createElement("img"); im.src = it.img; im.alt = ""; im.draggable = false; btn.appendChild(im); }
      overlay.appendChild(btn); byId[it.id] = it; return btn;
    });
    var card = document.createElement("div"); card.className = "hub-card"; card.setAttribute("role", "region"); card.setAttribute("aria-live", "polite"); card.setAttribute("aria-label", "Información del objeto");
    card.innerHTML = '<span class="hub-tag"></span><strong class="hub-name"></strong><p class="hub-text"></p><span class="hub-prog"></span>' +
      '<button type="button" class="hub-open">Comenzar recorrido <span aria-hidden="true">→</span></button>';
    overlay.appendChild(card);
    var elName = card.querySelector(".hub-name"), elText = card.querySelector(".hub-text"), elProg = card.querySelector(".hub-prog"), elTag = card.querySelector(".hub-tag"), elOpen = card.querySelector(".hub-open");

    /* copia invisible del cuadro con el texto más largo: sirve para reservar el espacio justo al encuadrar la escena */
    var ghost = card.cloneNode(true); ghost.className = "hub-card hub-ghost"; ghost.removeAttribute("role"); ghost.removeAttribute("aria-live"); ghost.removeAttribute("aria-label");
    ghost.setAttribute("aria-hidden", "true"); ghost.setAttribute("inert", ""); overlay.appendChild(ghost);
    var longest = items.reduce(function (a, b) { return b.text.length > a.text.length ? b : a; });
    ghost.querySelector(".hub-name").textContent = longest.name; ghost.querySelector(".hub-text").textContent = longest.text; ghost.querySelector(".hub-prog").textContent = "0 de 9 objetos explorados"; ghost.querySelector(".hub-tag").textContent = "Seleccionado";
    function cardWidth(w, mobile) { return mobile ? Math.min(w - 20, 380) : Math.min(420, Math.max(320, w * 0.32)); }

    var selectedId = null, previewId = null, shown = null, onObj = null, cardHover = false, cardFocus = false, grace = 0, armUntil = 0, opened = false;
    var model = {};
    function lit(id) { return id === selectedId ? 1 : id === previewId ? 0.7 : 0; }

    function updateCard() {
      var id = shown;
      root.classList.toggle("has-card", !!id);
      card.classList.toggle("is-selected", !!id && id === selectedId);
      btns.forEach(function (b) { var on = b.getAttribute("data-id") === selectedId; b.classList.toggle("is-selected", on); b.classList.toggle("is-preview", b.getAttribute("data-id") === previewId && !on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (!id) return;
      var it = byId[id];
      /* orden de tabulación: el cuadro (y su botón) queda justo después del objeto que muestra */
      var owner = btns.filter(function (b) { return b.getAttribute("data-id") === id; })[0];
      if (owner && owner.nextSibling !== card) overlay.insertBefore(card, owner.nextSibling);
      if (card.getAttribute("data-id") !== id) {
        card.setAttribute("data-id", id); elName.textContent = it.name; elText.textContent = it.text; elProg.textContent = getProgress(id);
        elOpen.setAttribute("aria-label", "Comenzar el recorrido educativo: " + it.name);
        armUntil = performance.now() + 350;       // un segundo toque rápido no puede pulsar el botón por accidente
        card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
      }
      elTag.textContent = id === selectedId ? "Seleccionado" : "Vista previa";
    }
    function setShown() { var id = previewId || selectedId; if (id === shown) { updateCard(); return; } shown = id; updateCard(); if (!flat) layoutHtml(); }
    function stopGrace() { clearTimeout(grace); }
    /* la vista previa se queda un rato tras quitar el cursor, para poder leerla o llevar el cursor al cuadro */
    function startGrace(ms) { stopGrace(); grace = setTimeout(function () { if (!onObj && !cardHover && !cardFocus) { previewId = null; setShown(); } }, ms || 1300); }
    function select(id) { selectedId = id; previewId = null; stopGrace(); if (model[id]) kick(model[id], 1.2); setShown(); }
    function open(id) { if (opened || !id) return; opened = true; if (model[id]) kick(model[id], 1.6); onOpen(id); }

    var down = null;   // posición del puntero al pulsar: un arrastre no cuenta como selección
    btns.forEach(function (b) {
      var id = b.getAttribute("data-id");
      b.addEventListener("pointerdown", function (ev) { down = { x: ev.clientX, y: ev.clientY }; });
      b.addEventListener("pointerenter", function (ev) { if (ev.pointerType === "mouse") { onObj = id; stopGrace(); previewId = id; if (model[id] && lit(id) < 1) kick(model[id], 0.6); setShown(); } });
      b.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse" && onObj === id) { onObj = null; startGrace(); } });
      b.addEventListener("focus", function () { stopGrace(); previewId = id; setShown(); });
      b.addEventListener("blur", function () { startGrace(400); });
      b.addEventListener("click", function (ev) {
        if (down && ev.detail > 0 && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 10) { down = null; return; }   // arrastre: no selecciona
        down = null; select(id);
      });
    });
    card.addEventListener("pointerenter", function (ev) { if (ev.pointerType === "mouse") { cardHover = true; stopGrace(); } });
    card.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") { cardHover = false; startGrace(); } });
    card.addEventListener("focusin", function () { cardFocus = true; stopGrace(); });
    card.addEventListener("focusout", function () { cardFocus = false; startGrace(400); });
    elOpen.addEventListener("click", function () { if (performance.now() < armUntil) return; open(card.getAttribute("data-id")); });
    /* ratón: pulsar en el fondo quita la selección; Escape también (táctil: la selección se mantiene) */
    stage.addEventListener("pointerdown", function (ev) { if (ev.pointerType === "mouse" && !ev.target.closest(".hub-obj, .hub-card")) { selectedId = null; previewId = null; setShown(); } });
    function onKey(ev) { if (ev.key === "Escape" && (selectedId || previewId)) { selectedId = null; previewId = null; setShown(); } }
    document.addEventListener("keydown", onKey);

    if (flat) {
      return { stop: function () { document.removeEventListener("keydown", onKey); stopGrace(); root.innerHTML = ""; root.classList.remove("hub-flat", "has-card"); } };
    }

    /* ----- 3D ----- */
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    var target = new THREE.Vector3(0, 0.7, 0);

    scene.add(new THREE.HemisphereLight(0xfff0d6, 0x6b5a46, 0.8));
    var key = new THREE.DirectionalLight(0xffdba5, 0.95); key.position.set(4, 8, 7); scene.add(key);
    var rimL = new THREE.DirectionalLight(0x9fd0ff, 0.55); rimL.position.set(-6, 4, -6); scene.add(rimL);

    /* plataforma central */
    var plat = new THREE.Group(); scene.add(plat);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.95, 0.7, 80), toon(0xb8693a)); base.position.y = -0.35; plat.add(base);
    var top = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.4, 0.16, 80), toon(0xf1deb6)); top.position.y = 0.08; plat.add(top);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(5.32, 0.075, 10, 100), basic(0xf5b335)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.17; plat.add(rim);
    var sigRings = [0, 1, 2].map(function () {
      var m = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 100), new THREE.MeshBasicMaterial({ color: 0xf5b335, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.19; plat.add(m); return m;
    });

    var layout = { phone: [-3.0, 0.4], radio: [0, -0.9], torch: [3.0, 0.4] };
    var accent = { phone: 0x2f5d3a, radio: 0xa64630, torch: 0x5f5a92 };
    var beamHolder = {}, torchId = null;
    var shadowTex = canvasTex(128, 128, function (x, w, h) { var gr = x.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(30,15,5,.55)"); gr.addColorStop(1, "rgba(30,15,5,0)"); x.fillStyle = gr; x.fillRect(0, 0, w, h); });

    items.forEach(function (it, i) {
      var gl = [];
      var g = it.model === "phone" ? buildPhone(gl) : it.model === "radio" ? buildRadio(gl) : buildTorch(gl, beamHolder);
      if (it.model === "torch") torchId = it.id;
      var p = layout[it.model], grp = new THREE.Group(); grp.position.set(p[0], 0, p[1]); scene.add(grp);
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.24, 48), toon(accent[it.model])); ped.position.y = 0.3; grp.add(ped);
      var pedTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.05, 48), toon(0xf6ecd6)); pedTop.position.y = 0.45; grp.add(pedTop);
      var pring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 8, 60), basic(0xf5b335, { transparent: true, opacity: 0.35 })); pring.rotation.x = Math.PI / 2; pring.position.y = 0.48; grp.add(pring);
      var shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.5; grp.add(shadow);
      var holder = new THREE.Group(); holder.position.y = 0.48; grp.add(holder); holder.add(g);
      var light = new THREE.PointLight(0xffd9a0, 0, 9, 2); light.position.set(0, 2.6, 2.2); grp.add(light);
      model[it.id] = { group: grp, holder: holder, obj: g, light: light, pring: pring, glowBasic: gl, state: { glow: 0, vy: 0, y: 0, rot: 0, vr: 0, sc: 1, vs: 0 }, phase: i * 1.7 };
    });

    function kick(m, k) { if (reduce) return; m.state.vy += 3.4 * k; m.state.vr += (Math.random() < 0.5 ? -1 : 1) * 6.5 * k; }

    var viewW = 1, side = false;   // ancho del lienzo 3D; "side" = pantalla baja y apaisada (escena a la izquierda, cuadro a la derecha)
    function projectPoint(v) { var p = v.clone().project(camera), h = stage.clientHeight; return { x: (p.x + 1) / 2 * viewW, y: (1 - p.y) / 2 * h }; }

    /* Encuadre: la escena se escala y desplaza para ocupar la franja entre el encabezado y el espacio reservado al cuadro */
    var topRef = new THREE.Vector3(0.6, 3.95, -0.9), botRef = new THREE.Vector3(0, 0.2, 2.0);
    function resize() {
      var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
      side = h < 520 && w > h * 1.3; stage.classList.toggle("hub-side", side); root.parentNode.classList.toggle("hub-side", side); viewW = side ? Math.round(w * 0.6) : w; canvas.style.width = viewW + "px"; renderer.setSize(viewW, h, false);
      var asp = viewW / h, portrait = asp < 0.95, mobile = w < 720 || side; camera.aspect = asp; camera.fov = portrait ? 46 : 30; camera.updateProjectionMatrix();
      var head = root.parentNode.querySelector(".hub-head"), headB = head ? head.getBoundingClientRect().bottom - stage.getBoundingClientRect().top : 90;
      ghost.style.width = (side ? Math.min(340, Math.round(w * 0.36)) : cardWidth(w, mobile)) + "px";
      var cardH = ghost.offsetHeight || 230;
      var yTop = headB + 14, yBot = side ? h - 24 : h - Math.min(cardH + 24, h * 0.5);
      var halfW = portrait ? 4.7 : 6.0, tn = Math.tan(camera.fov * Math.PI / 360), Dmin = halfW / (tn * asp), camY = portrait ? 6.4 : 5.2, D = Math.max(Dmin, 11), ty = 1.0;
      for (var k = 0; k < 7; k++) {
        camera.position.set(0, camY, D); target.set(0, ty, 0); camera.lookAt(target); camera.updateMatrixWorld();
        var a = projectPoint(topRef), b = projectPoint(botRef), span = b.y - a.y, want = Math.max(120, yBot - yTop);
        D = Math.max(Dmin, D * Math.pow(span / want, 0.9));
        ty -= (a.y - yTop) / (h / (2 * D * tn));
      }
      camera.position.set(0, camY, D); target.set(0, ty, 0); camera.lookAt(target); camera.updateMatrixWorld();
      layoutHtml();
    }

    function layoutHtml() {
      var w = stage.clientWidth, h = stage.clientHeight, mobile = w < 720 || side;
      root.classList.toggle("hub-mobile", mobile);
      camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
      btns.forEach(function (b) {
        var m = model[b.getAttribute("data-id")], c = m.obj.userData, wc = m.holder.localToWorld(c.center.clone());
        var s = projectPoint(wc), edge = projectPoint(wc.clone().add(new THREE.Vector3(c.radius, 0, 0).applyQuaternion(camera.quaternion))), r = Math.max(34, Math.hypot(edge.x - s.x, edge.y - s.y));
        b.style.left = (s.x - r) + "px"; b.style.top = (s.y - r) + "px"; b.style.width = (2 * r) + "px"; b.style.height = (2 * r) + "px";
      });
      /* cuadro: debajo del soporte del objeto mostrado, centrado y sin salirse de la pantalla; en modo lateral, a la derecha */
      var id = shown || selectedId || btns[1].getAttribute("data-id"), m2 = model[id];
      var front = projectPoint(new THREE.Vector3(m2.group.position.x, 0.3, m2.group.position.z + 1.55));
      var allFronts = btns.map(function (b) { var mm = model[b.getAttribute("data-id")]; return projectPoint(new THREE.Vector3(mm.group.position.x, 0.3, mm.group.position.z + 1.55)).y; });
      var cw = cardWidth(w, mobile);
      card.style.width = cw + "px";
      var ch = card.offsetHeight || 190, left = Math.max(10, Math.min(w - cw - 10, front.x - cw / 2)), topPx = Math.min(Math.max.apply(null, allFronts) + 14, h - ch - 8);
      if (side) { cw = Math.min(340, Math.round(w * 0.36)); card.style.width = cw + "px"; left = w - cw - 14; topPx = Math.max(8, Math.round((h - ch) / 2)); }
      card.style.left = left + "px"; card.style.top = topPx + "px";
      card.style.setProperty("--ax", Math.max(18, Math.min(cw - 18, front.x - left)) + "px");
    }

    var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null; if (ro) ro.observe(stage); else window.addEventListener("resize", resize);
    resize();

    /* ----- bucle de animación ----- */
    var raf = 0, alive = true, last = performance.now(), t0 = last;
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.033); last = now; var t = (now - t0) / 1000;
      btns.forEach(function (b, i) {
        var id = b.getAttribute("data-id"), m = model[id], s = m.state, ud = m.obj.userData, lv = lit(id), on = lv > 0, sel = id === selectedId;
        s.glow += (lv - s.glow) * Math.min(1, dt * 9);
        var idleY = reduce ? 0 : Math.sin(t * 1.5 + m.phase) * 0.05, idleR = reduce ? 0 : Math.sin(t * 0.8 + m.phase) * 0.12;
        /* resortes: altura (salto breve), giro (balanceo) y escala; el objeto seleccionado queda un poco elevado y más grande */
        s.vy += (((sel ? 0.14 : on ? 0.1 : 0)) - s.y) * 90 * dt - s.vy * 9 * dt; s.y += s.vy * dt;
        s.vr += (0 - s.rot) * 70 * dt - s.vr * 7 * dt; s.rot += s.vr * dt;
        s.vs += ((((sel ? 1.1 : on ? 1.06 : 1)) - s.sc) * 120 - s.vs * 12) * dt; s.sc += s.vs * dt;
        m.holder.position.y = 0.48 + s.y + idleY;
        m.obj.rotation.y = ud.baseRot + idleR + s.rot; m.obj.rotation.z = ud.tilt || 0; m.holder.scale.setScalar(s.sc);
        m.light.intensity = s.glow * 0.45;
        m.pring.material.opacity = 0.35 + s.glow * 0.65 + (sel && !reduce ? Math.sin(t * 3) * 0.08 : 0);
        m.glowBasic.forEach(function (mat) { mat.color.copy(mat.userData.base).multiplyScalar(1 + s.glow * 0.45); });
        ud.glowMeshes.forEach(function (mesh) { mesh.material.emissive.copy(mesh.material.userData.base); mesh.material.emissiveIntensity = s.glow * 0.04; });
      });
      if (beamHolder.beam && torchId) beamHolder.beam.material.opacity = 0.5 + 0.45 * model[torchId].state.glow + (reduce ? 0 : Math.sin(t * 2.2) * 0.04);
      sigRings.forEach(function (r, i) { var ph = reduce ? 0.5 : ((t * 0.16 + i / 3) % 1), rad = 1.2 + ph * 4.1; r.scale.setScalar(rad); r.material.opacity = reduce ? 0.08 : (1 - ph) * 0.34; });
      plat.rotation.y = reduce ? 0 : Math.sin(t * 0.15) * 0.04;
      layoutHtml();
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return {
      stop: function () {
        alive = false; cancelAnimationFrame(raf); stopGrace(); document.removeEventListener("keydown", onKey); if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (mt) { if (mt.map) mt.map.dispose(); mt.dispose(); }); } });
        renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
        root.innerHTML = ""; root.classList.remove("hub-flat", "has-card", "hub-mobile"); root.parentNode.classList.remove("hub-side");
      }
    };
  }

  /* modelos y utilidades reutilizables (los usa la secuencia de cada alternativa, js/sequence.js y js/seq-modules.js) */
  return { start: start, models: { buildPhone: buildPhone, buildRadio: buildRadio, buildTorch: buildTorch, toon: toon, basic: basic, rbox: rbox, canvasTex: canvasTex, roundedRectShape: roundedRectShape } };
})();
