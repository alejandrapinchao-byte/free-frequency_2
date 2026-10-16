/* Componentes reutilizables: cada función recibe datos y devuelve HTML. Sin estado propio.
   (La secuencia de cada alternativa y su cuadro los genera js/sequence.js.) */
window.FFC = (function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* Selector de zona: dos tarjetas con su escenario y su personaje */
  function ZoneSelect(zones, progress, info) {
    return '<div class="zones-in"><p class="kicker">Dos zonas · tres objetos</p><h1 id="zones-title">Elige una zona</h1>' +
      '<p class="hub-sub">Cada zona cuenta una situación distinta. En las dos encontrarás las mismas tres alternativas —teléfono, radio y linterna—, explicadas según el contexto. <button type="button" class="zw-jump" data-scroll="por-que">¿Por qué estos dos territorios? <span aria-hidden="true">↓</span></button></p>' +
      '<div class="zone-cards">' + Object.keys(zones).map(function (id) {
        var z = zones[id], p = progress(id);
        return '<a class="zone-card" href="#' + id + '" data-zone="' + id + '">' +
          '<img class="zc-scene" src="' + z.img + '" alt="" aria-hidden="true"><img class="zc-char" src="' + z.char + '" alt="" aria-hidden="true">' +
          '<span class="zc-body"><span class="zc-tag">' + esc(z.tag) + "</span><b>" + esc(z.name) + "</b><span class=\"zc-blurb\">" + esc(z.blurb) + "</span>" +
          '<span class="zc-meta">Con ' + esc(z.who) + " · " + esc(p) + '</span><span class="zc-go">Entrar a la zona <span aria-hidden="true">→</span></span></span></a>';
      }).join("") + "</div>" +
      '<section class="zone-why" id="por-que" aria-labelledby="why-title"><h2 id="why-title">' + esc(info.whyTitle) + '</h2><p class="zw-lead">' + esc(info.whyLead) + '</p><div class="zw-grid">' + Object.keys(zones).map(function (id) {
        var z = zones[id];
        return '<article class="zw-card ' + id + '"><p class="zw-tag">' + esc(z.whyTag) + "</p><h3>" + esc(z.name) + '</h3><p class="zw-sum">' + esc(z.whyLead) + "</p><ul>" +
          z.whyPoints.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" + (z.whyFact ? '<p class="zw-fact">' + esc(z.whyFact) + ' <small>' + esc(z.whyRef) + "</small></p>" : "") + "</article>";
      }).join("") + '</div><p class="zw-note">' + esc(info.whyNote) + ' <a href="#fuentes">' + esc(info.whySources) + "</a></p></section></div>";
  }

  /* Sección final y de fuentes */
  function Final(F, zones, journeys, order, visited) {
    var seen = Object.keys(zones).map(function (zid) {
      var z = zones[zid];
      return "<div><h3>" + esc(z.name) + '</h3><ul class="seen">' + order.map(function (jid) {
        return z.items[jid].objects.map(function (o) {
          return '<li class="' + (visited[zid + ":" + jid + ":" + o.id] ? "on" : "") + '"><i></i>' + esc(journeys[jid].short + " · " + o.name) + "</li>";
        }).join("");
      }).join("") + "</ul></div>";
    }).join("");
    return '<div class="final-in"><p class="kicker">Preparación y aprendizajes</p>' +
      '<h1 id="final-title">' + esc(F.title) + "</h1><p class=\"lede big\">" + esc(F.lead) + "</p>" +
      '<div class="cols">' + F.columns.map(function (c, i) {
        return '<section><span class="num">0' + (i + 1) + "</span><h3>" + esc(c.title) + "</h3><ul>" +
          c.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></section>";
      }).join("") + "</div>" +
      '<div class="learned"><h3 class="learned-title">Lo que descubriste</h3><div class="learned-grid">' + seen + "</div></div>" +
      '<section class="sources-box" id="fuentes" aria-labelledby="src-title"><h3 id="src-title">' + esc(F.sourcesTitle) + "</h3><p>" + esc(F.sourcesLead) + "</p><ul>" +
      F.sources.map(function (s) { return "<li><b>" + esc(s.name) + "</b> · " + esc(s.site) + " — " + esc(s.use) + "</li>"; }).join("") + "</ul>" +
      '<p class="credits">' + esc(F.credits) + "</p></section>" +
      '<div class="final-links">' + Object.keys(zones).map(function (id) { return '<a href="#' + id + '">Volver a: ' + esc(zones[id].name) + "</a>"; }).join("") + '<a href="#zonas">Elegir zona</a><a href="#inicio">Ir al inicio</a></div></div>';
  }

  return { ZoneSelect: ZoneSelect, Final: Final };
})();
