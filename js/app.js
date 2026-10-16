/* Free Frequency — estado, rutas y comportamiento. Contenido en data.js, componentes en components.js,
   secuencia visual de cada alternativa en sequence.js + seq-modules.js, menú 3D en hub.js.
   Rutas: #inicio · #zonas (elegir zona) · #rural / #urbano (menú de los tres objetos de la zona) · #rural/telefono (recorrido) · #preparacion · #fuentes */
(function () {
  "use strict";
  var D = window.FF, C = window.FFC, Z = D.zones, J = D.journeys, ORDER = D.order;
  var $ = function (s) { return document.querySelector(s); };
  var views = { home: $("#view-home"), zones: $("#view-zones"), select: $("#view-select"), seq: $("#view-seq"), final: $("#view-final") };
  var tabs = $("#tabs"), sweep = $("#sweep"), topLink = $("#top-select");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Sonido (js/audio.js): botón para silenciar o activar; la preferencia se recuerda en el navegador */
  var snd = $("#sound-toggle");
  function paintSound() { if (!window.FFAudio) { snd.hidden = true; return; } var on = window.FFAudio.enabled(); snd.setAttribute("aria-pressed", on ? "true" : "false"); snd.setAttribute("aria-label", on ? "Sonido activado. Pulsa para silenciar" : "Sonido silenciado. Pulsa para activar"); snd.classList.toggle("off", !on); }
  snd.addEventListener("click", function () { window.FFAudio.setEnabled(!window.FFAudio.enabled()); paintSound(); });
  paintSound();
  $("#btn-start").addEventListener("click", function () { if (window.FFAudio) window.FFAudio.unlock(); });
  document.addEventListener("click", function (e) {   // botones que bajan a una sección de la misma página (sin cambiar la ruta)
    var b = e.target.closest("[data-scroll]"); if (!b) return; var t = document.getElementById(b.getAttribute("data-scroll"));
    if (t) t.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  /* Progreso guardado: temas vistos ("rural:telefono:sms") y recorridos cuya presentación ya se vio ("intro:rural:telefono") */
  var visited = {};
  try { visited = JSON.parse(localStorage.getItem("ff-visited2") || "{}"); } catch (e) {}
  function saveVisited() { try { localStorage.setItem("ff-visited2", JSON.stringify(visited)); } catch (e) {} }
  var choice = {};         // último tema abierto por recorrido (mientras dura la visita)
  var quakePlayed = false; // la simulación del sismo se ve al entrar a la zona urbana, no en cada alternativa

  var colors = { rural: "#2f5d3a", urbano: "#3a3260", home: "#14303a", zones: "#14303a", select: "#14303a", final: "#f6ecd6" };

  function zoneItems(zid) { var n = 0; ORDER.forEach(function (j) { n += Z[zid].items[j].objects.length; }); return n; }
  function zoneCount(zid) { var n = 0; ORDER.forEach(function (j) { Z[zid].items[j].objects.forEach(function (o) { if (visited[zid + ":" + j + ":" + o.id]) n++; }); }); return n; }
  function altCount(zid, jid) { return Z[zid].items[jid].objects.filter(function (o) { return visited[zid + ":" + jid + ":" + o.id]; }).length; }

  /* ---------- Menú de objetos de la zona (js/hub.js): se crea al entrar y se libera al salir ---------- */
  var hub = null;
  function startHub(zid) {
    stopHub();
    var z = Z[zid];
    $("#select-kicker").textContent = z.name;
    $("#select-title").textContent = "Elige un objeto para empezar";
    $("#select-over").textContent = D.info.overview;
    hub = window.FFHub.start($("#hub"), D.menu, function (id) { var n = altCount(zid, id), t = Z[zid].items[id].objects.length; return n + " de " + t + " temas explorados"; },
      function (id) { location.hash = "#" + zid + "/" + id; }, reduce);
  }
  function stopHub() { if (hub) { hub.stop(); hub = null; } }

  /* ---------- Secuencia de la alternativa (js/sequence.js) ---------- */
  var seqRun = null, seqKey = null;
  function navFor(zid, jid) {
    var i = ORDER.indexOf(jid), last = i === ORDER.length - 1;
    return {
      index: i, total: ORDER.length, zoneName: Z[zid].name, menuHref: "#" + zid,
      items: ORDER.map(function (j) { return { id: j, label: J[j].short, href: "#" + zid + "/" + j, on: j === jid, done: altCount(zid, j) > 0 }; }),
      prev: i > 0 ? { href: "#" + zid + "/" + ORDER[i - 1], label: J[ORDER[i - 1]].short } : { href: "#" + zid, label: "Menú" },
      next: !last ? { href: "#" + zid + "/" + ORDER[i + 1], label: J[ORDER[i + 1]].short } : { href: "#preparacion", label: "Preparación" },
      other: { href: "#" + (zid === "rural" ? "urbano" : "rural") + "/" + jid, label: Z[zid === "rural" ? "urbano" : "rural"].name }
    };
  }
  function startSeq(zid, jid) {
    stopSeq();
    var item = Z[zid].items[jid], key = zid + ":" + jid;
    var journey = Object.assign({ zone: zid }, J[jid], item);
    var playQuake = !!Z[zid].quake && !quakePlayed;
    seqKey = key;
    seqRun = window.FFSeq.start($("#seq"), {
      journey: journey, zone: Z[zid], seq: D.seq, quakeText: D.quake, reduce: reduce, topic: choice[key], introSeen: !!visited["intro:" + key], quake: playQuake, nav: navFor(zid, jid),
      onQuakeDone: function () { quakePlayed = true; },
      onTopic: function (tid) { choice[key] = tid; visited[key + ":" + tid] = true; saveVisited(); renderTabs(); },
      onIntro: function () { if (!visited["intro:" + key]) { visited["intro:" + key] = true; saveVisited(); } }
    });
    $("#seq-h1").textContent = J[jid].name + ": " + item.kicker;
  }
  function stopSeq() { if (seqRun) { seqRun.stop(); seqRun = null; } }

  /* Navegación controlada dentro del recorrido: un solo paso por gesto (botones, teclas, deslizamiento o rueda), con una pausa entre pasos */
  var navLock = 0;
  function go(href) { var now = Date.now(); if (now < navLock || !href) return; navLock = now + 900; location.hash = href; }
  function seqNav(dir) { if (!seqRun || !seqRun.nav) return; go((dir > 0 ? seqRun.nav.next : seqRun.nav.prev).href); }
  var sv = $("#view-seq"), drag = null, wheelAcc = 0, wheelAt = 0;
  function onStage(t) { return !t.closest || !t.closest(".seq-card, .seq-bye, .seq-nav, .seq-hud, .seq-hot, .seq-quake, button, a, input"); }
  sv.addEventListener("pointerdown", function (e) { if (!onStage(e.target) || (seqRun && seqRun.interacting && seqRun.interacting())) { drag = null; return; } drag = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
  sv.addEventListener("pointerup", function (e) {
    var d = drag; drag = null; if (!d || (seqRun && seqRun.interacting && seqRun.interacting())) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 110 && Math.abs(dx) > Math.abs(dy) * 2 && e.timeStamp - d.t < 900) seqNav(dx < 0 ? 1 : -1);   // deslizar a la izquierda = siguiente
  });
  sv.addEventListener("pointercancel", function () { drag = null; });
  sv.addEventListener("click", function (e) {   // los enlaces de navegación avanzan un solo paso a la vez
    var a = e.target.closest && e.target.closest("a[data-nav]"); if (!a) return; e.preventDefault(); go(a.getAttribute("href"));
  });
  sv.addEventListener("wheel", function (e) {
    if (!onStage(e.target) || e.ctrlKey || (seqRun && seqRun.interacting && seqRun.interacting())) return;
    var now = Date.now(); if (now - wheelAt > 400) wheelAcc = 0; wheelAt = now; wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 220) { var d = wheelAcc > 0 ? 1 : -1; wheelAcc = 0; seqNav(d); }
  }, { passive: true });
  document.addEventListener("keydown", function (e) {
    if (cur && cur.view === "seq" && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) {
      if (e.key === "ArrowRight" && !e.target.closest(".seq-ctx, .seq-topics")) seqNav(1);
      else if (e.key === "ArrowLeft" && !e.target.closest(".seq-ctx, .seq-topics")) seqNav(-1);
    }
  });

  /* ---------- Rutas con transición de "barrido de señal" ---------- */
  function parse() {
    var r = (location.hash || "#inicio").slice(1), p = r.split("/");
    if (Z[p[0]]) {
      if (p[1] && J[p[1]]) return { view: "seq", zone: p[0], alt: p[1], key: p[0] + "/" + p[1] };
      return { view: "select", zone: p[0], key: p[0] };
    }
    if (r === "zonas") return { view: "zones", key: "zonas" };
    if (r === "preparacion" || r === "fuentes") return { view: "final", key: r, scrollTo: r === "fuentes" ? "fuentes" : null };
    return { view: "home", key: "inicio" };
  }

  /* Navegación direccional: la vista que sale se aleja o se acerca según el sentido y un barrido de color nace en el punto donde el usuario hizo clic.
     Dura ~0,65 s y nunca bloquea: si el usuario navega de nuevo, la animación se salta y se aplica el destino al instante. */
  var order = { home: 0, zones: 1, select: 2, seq: 3, final: 4 };
  var click = { x: 50, y: 55 };
  document.addEventListener("pointerdown", function (e) { click.x = e.clientX / innerWidth * 100; click.y = e.clientY / innerHeight * 100; }, true);
  var cur = null, tr = null;

  function pos(x) { return (x.zone === "urbano" ? 10 : 0) + (x.alt ? ORDER.indexOf(x.alt) : 0); }
  function dirOf(from, to) {
    if (from.view === "seq" && to.view === "seq") return pos(to) > pos(from) ? "side-r" : "side-l";
    var d = order[to.view] - order[from.view];
    return d > 0 ? "fwd" : d < 0 ? "back" : "none";
  }
  function clearTransitionClasses() {
    Object.keys(views).forEach(function (k) {
      var c = views[k].classList;
      ["leave-fwd", "leave-back", "leave-side-r", "leave-side-l"].forEach(function (n) { c.remove(n); });
    });
  }

  function onRoute(first) {
    var dest = parse(), interrupted = !!tr;
    if (tr) tr.cancel();
    if (cur && dest.key === cur.key) return;
    var dir = (first || reduce || interrupted || !cur) ? "none" : dirOf(cur, dest);
    if (dir === "none") { apply(dest, "none"); return; }

    var out = views[cur.view], side = dir.indexOf("side") === 0;
    var at = click.x.toFixed(1) + "% " + click.y.toFixed(1) + "%";
    out.classList.add("leave-" + dir);
    sweep.style.background = colors[dest.zone || dest.view] || colors.home;
    sweep.style.display = "block";
    var a2 = null, dead = false;
    var a1 = sweep.animate([{ clipPath: "circle(0% at " + at + ")" }, { clipPath: "circle(150% at " + at + ")" }],
      { duration: side ? 280 : 340, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" });
    var cleanup = function () {
      sweep.getAnimations().forEach(function (a) { a.cancel(); });
      sweep.style.display = "none"; clearTransitionClasses(); tr = null;
    };
    tr = { cancel: function () { dead = true; a1.cancel(); if (a2) a2.cancel(); cleanup(); } };
    a1.onfinish = function () {
      if (dead) return;
      apply(dest, dir);
      a2 = sweep.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-out", fill: "forwards" });
      a2.onfinish = function () { if (!dead) cleanup(); };
    };
  }
  window.addEventListener("hashchange", function () { onRoute(false); });

  function apply(dest, dir) {
    cur = { view: dest.view, zone: dest.zone || null, alt: dest.alt || null, key: dest.key };
    clearTransitionClasses();
    if (dest.view !== "select") stopHub();
    if (dest.view !== "seq") stopSeq();
    if (dest.view === "home" || dest.view === "zones") quakePlayed = false;   // al volver a elegir zona, el sismo urbano se vuelve a simular
    document.body.setAttribute("data-view", dest.view);
    document.body.setAttribute("data-zone", dest.zone || "");
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== dest.view; });
    if (dest.view === "zones") { views.zones.innerHTML = C.ZoneSelect(Z, function (id) { return zoneCount(id) + " de " + zoneItems(id) + " temas explorados"; }, D.info); }
    else if (dest.view === "select") startHub(dest.zone);
    else if (dest.view === "seq") startSeq(dest.zone, dest.alt);
    else if (dest.view === "final") { views.final.innerHTML = C.Final(D.final, Z, J, ORDER, visited); setupReveal(); }
    renderTabs();
    window.scrollTo(0, 0);
    if (dest.scrollTo) { var el = document.getElementById(dest.scrollTo); if (el) setTimeout(function () { el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); }, 60); }
    if (dir && dir !== "none") {
      var v = views[dest.view]; v.classList.add("enter-" + dir);
      setTimeout(function () { v.classList.remove("enter-" + dir); }, 850);
    }
  }

  /* Pestañas: dentro de una zona, sus tres alternativas con su avance; fuera, las dos zonas */
  function renderTabs() {
    if (!cur) return;
    var html;
    if (cur.zone) {
      var zid = cur.zone;
      html = '<a href="#' + zid + '" class="zone-chip' + (cur.view === "select" ? " on" : "") + '"' + (cur.view === "select" ? ' aria-current="page"' : "") + ' title="Menú de la zona">' + Z[zid].short + "</a>" +
        ORDER.map(function (j) {
          var on = cur.alt === j, n = altCount(zid, j), t = Z[zid].items[j].objects.length;
          return '<a href="#' + zid + "/" + j + '"' + (on ? ' class="on" aria-current="page"' : "") + '><span class="full">' + J[j].name + '</span><span class="short">' + J[j].short + "</span>" +
            '<small aria-label="' + n + " de " + t + ' explorados">' + n + "/" + t + "</small></a>";
        }).join("");
    } else {
      html = Object.keys(Z).map(function (id) { return '<a href="#' + id + '"><span class="full">' + Z[id].name + '</span><span class="short">' + Z[id].short + "</span></a>"; }).join("");
    }
    tabs.innerHTML = html + '<a href="#preparacion"' + (cur.view === "final" ? ' class="on" aria-current="page"' : "") + ">Preparación</a>";
    topLink.setAttribute("href", cur.zone ? "#" + cur.zone : "#zonas"); topLink.textContent = cur.zone ? "Menú de la zona" : "Menú principal";
  }

  /* Sección final: los bloques aparecen al llegar a ellos con el scroll del usuario (sin forzar desplazamiento) */
  var io = null;
  function setupReveal() {
    if (io) io.disconnect();
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = views.final.querySelectorAll(".final-in > p, .final-in > h1, .cols section, .learned, .final-links");
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    Array.prototype.forEach.call(els, function (el, i) { el.classList.add("rv"); el.style.setProperty("--rd", (i % 3) * 90 + "ms"); io.observe(el); });
  }

  /* Portada: parallax de los personajes */
  views.home.addEventListener("pointermove", function (e) {
    if (reduce) return;
    views.home.style.setProperty("--hx", ((e.clientX / innerWidth) - 0.5).toFixed(3));
  });

  onRoute(true);
})();
