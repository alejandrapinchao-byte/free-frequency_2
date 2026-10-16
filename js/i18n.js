/* Idioma (ES/EN). El español es el original; en inglés, un traductor de DOM reemplaza cada texto con su equivalente de js/lang-en.js.
   Si una frase no está en el diccionario se deja en español (nunca queda vacía). El idioma se guarda en localStorage ("ff-lang") y al cambiarlo se recarga la página. */
window.FFi18n = (function () {
  "use strict";
  var KEY = "ff-lang", lang = "es";
  try { var s = localStorage.getItem(KEY); if (s === "en" || s === "es") lang = s; else if (/^en/i.test(navigator.language || "")) lang = "en"; } catch (e) {}
  var D = window.FF_EN || {}, map = {};
  Object.keys(D).forEach(function (k) { map[norm(k)] = D[k]; });

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }

  var rules = [
    [/^Con (.+?) · (\d+) de (\d+) objetos explorados$/, function (m) { return "With " + m[1] + " · " + m[2] + " of " + m[3] + " objects explored"; }],
    [/^(\d+) de (\d+) objetos explorados$/, function (m) { return m[1] + " of " + m[2] + " objects explored"; }],
    [/^(\d+) de (\d+) explorados$/, function (m) { return m[1] + " of " + m[2] + " explored"; }],
    [/^Con (.+)$/, function (m) { return "With " + t(m[1]); }],
    [/^Comenzar el recorrido educativo: (.+)$/, function (m) { return "Start the educational tour: " + t(m[1]); }],
    [/^Volver a: (.+)$/, function (m) { return "Back to: " + t(m[1]); }],
    [/^Faltan (\d+) cifras del número\.$/, function (m) { return m[1] + " digits of the number are missing."; }],
    [/^Recorrido de (.+)$/, function (m) { return "Tour of " + t(m[1]); }],
    [/^Guía del código Morse, paso (\d+)$/, function (m) { return "Morse code guide, step " + m[1]; }],
    [/^Dial en (\d+) de 100, banda (.+)$/, function (m) { return "Dial at " + m[1] + " of 100, band " + m[2]; }],
    [/^En llamada · (.+)$/, function (m) { return "In a call · " + m[1]; }],
    [/^Paso (\d+) de (\d+)$/, function (m) { return "Step " + m[1] + " of " + m[2]; }],
    [/^Paso (\d+) de (\d+): (.+)$/, function (m) { return "Step " + m[1] + " of " + m[2] + ": " + t(m[3]); }]
  ];

  /* Traduce una cadena: exacta → reglas → partes separadas por « · » → original */
  function t(s) {
    if (lang !== "en" || s == null) return s;
    var raw = String(s), n = norm(raw);
    if (!n) return raw;
    var r = map[n];
    if (r == null) {
      for (var i = 0; i < rules.length; i++) { var m = n.match(rules[i][0]); if (m) { r = rules[i][1](m); break; } }
    }
    if (r == null && n.indexOf(" · ") > 0) {
      var parts = n.split(" · "), hit = false;
      var out = parts.map(function (p) { var q = map[p]; if (q != null) { hit = true; return q; } return p; });
      if (hit) r = out.join(" · ");
    }
    if (r == null) {
      var ci = n.indexOf(": ");
      if (ci > 0 && ci < 60) {
        var a = t(n.slice(0, ci)), b = t(n.slice(ci + 2));
        if (a !== n.slice(0, ci) || b !== n.slice(ci + 2)) r = a + ": " + b;
      }
    }
    if (r == null) return raw;
    var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    return lead + r + trail;
  }

  var ATTRS = ["aria-label", "alt", "title", "placeholder", "aria-valuetext"];
  function doNode(node) {
    if (node.nodeType === 3) {
      var p = node.parentNode;
      if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE")) return;
      var v = node.nodeValue, r = t(v);
      if (r !== v) node.nodeValue = r;
    } else if (node.nodeType === 1) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") return;
      ATTRS.forEach(function (a) { if (node.hasAttribute(a)) { var v = node.getAttribute(a), r = t(v); if (r !== v) node.setAttribute(a, r); } });
      for (var c = node.firstChild; c; c = c.nextSibling) doNode(c);
    }
  }

  var busy = false, obs = null;
  function start() {
    if (lang !== "en") return;
    document.documentElement.lang = "en";
    document.title = "Free Frequency";
    var md = document.querySelector('meta[name="description"]'); if (md) md.content = "Communication alternatives when connectivity fails: rural Cauca and urban Cali.";
    var og = document.querySelector('meta[property="og:description"]'); if (og) og.content = "When the signal goes out, communication doesn’t. Explore communication alternatives in rural Cauca and in Cali after an earthquake.";
    doNode(document.body);
    obs = new MutationObserver(function (list) {
      if (busy) return; busy = true;
      list.forEach(function (m) {
        if (m.type === "characterData") doNode(m.target);
        else if (m.type === "attributes") { var a = m.attributeName, v = m.target.getAttribute(a), r = v == null ? v : t(v); if (r !== v) m.target.setAttribute(a, r); }
        else m.addedNodes.forEach(doNode);
      });
      busy = false;
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function paintToggle() {
    var b = document.getElementById("lang-toggle");
    if (!b) return;
    b.textContent = lang === "en" ? "ES" : "EN";
    b.setAttribute("aria-label", lang === "en" ? "Cambiar el idioma a español" : "Change the language to English");
    b.setAttribute("title", lang === "en" ? "Español" : "English");
    b.setAttribute("lang", lang === "en" ? "es" : "en");
    b.addEventListener("click", function () { set(lang === "en" ? "es" : "en"); });
  }

  function set(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    location.reload();
  }

  function init() { paintToggle(); start(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  return { t: t, lang: function () { return lang; }, set: set };
})();
