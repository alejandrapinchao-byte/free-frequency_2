/* Simulador de SMS del cuadro del teléfono (tutorial paso a paso). Todo es ilustrativo: no se envía nada y el número es ficticio.
   Estado en live.sms = { text, sent, num, screen: "home"|"compose", field: "num"|"msg" }; el teléfono 3D lee text y sent. */
window.FFSms = (function () {
  "use strict";
  var EXAMPLE_NUM = "0000000000", MAXMSG = 100,
      EXAMPLE_MSG = window.FFi18n ? window.FFi18n.t("Estoy bien. Estoy en un lugar seguro. Te escribiré cuando pueda") : "Estoy bien. Estoy en un lugar seguro. Te escribiré cuando pueda";
  var ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"], ACC = "áéíóúñ", DIGITS = "1234567890";
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 3.5h16a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z"/><circle cx="7.5" cy="10.3" r="1.35"/><circle cx="12" cy="10.3" r="1.35"/><circle cx="16.5" cy="10.3" r="1.35"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fresh() { return { text: "", sent: false, num: "", screen: "home", field: "num" }; }
  function fmt(d) { return (d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6)).trim(); }
  function ready(s) { return s.num.length === 10 && s.text.trim().length > 0; }
  function cap(s) { return !s.text || /[.!?]\s$/.test(s.text); }

  function keyboard(s) {
    var h = '<div class="ss-kb" role="group" aria-label="' + (s.field === "num" ? "Teclado numérico" : "Teclado virtual") + '">';
    function k(ch, label, cls, aria) { return '<button type="button" class="ss-k ' + (cls || "") + '" data-ss="k" data-v="' + esc(ch) + '"' + (aria ? ' aria-label="' + aria + '"' : "") + ">" + esc(label || ch) + "</button>"; }
    if (s.field === "num") {
      h += '<div class="ss-row ss-num">' + DIGITS.split("").map(function (d) { return k(d); }).join("") + "</div>";
      h += '<div class="ss-row"><button type="button" class="ss-k ss-wide ss-ex" data-ss="exnum">Usar número de ejemplo</button>' + k("del", "⌫", "ss-del", "Borrar") + "</div>";
    } else {
      var up = cap(s);
      ROWS.forEach(function (r) { h += '<div class="ss-row">' + r.split("").map(function (c) { return k(c, up ? c.toUpperCase() : c); }).join("") + "</div>"; });
      h += '<div class="ss-row">' + ACC.split("").map(function (c) { return k(c, up ? c.toUpperCase() : c); }).join("") + k(".", ".") + k(",", ",") + "</div>";
      h += '<div class="ss-row">' + k(" ", "espacio", "ss-space", "Espacio") + k("del", "⌫", "ss-del", "Borrar") + "</div>";
      h += '<div class="ss-row"><button type="button" class="ss-k ss-wide ss-ex" data-ss="exmsg">Usar el mensaje de ejemplo</button></div>';
    }
    return h + "</div>";
  }

  function inner(s) {
    if (s.screen === "home") {
      return '<div class="ss-home"><p class="ss-time" aria-hidden="true">9:41</p><div class="ss-apps">' +
        '<button type="button" class="ss-app ss-open" data-ss="open"><span class="ss-ico">' + ICON + '</span><span>Mensajes</span></button>' +
        '<span class="ss-app ss-dead" aria-hidden="true"><span class="ss-ico"></span><span>Llamadas</span></span><span class="ss-app ss-dead" aria-hidden="true"><span class="ss-ico"></span><span>Ajustes</span></span></div>' +
        '<p class="ss-help" role="status">Toca el icono «Mensajes» para empezar.</p></div>';
    }
    var top = '<div class="ss-bar"><button type="button" class="ss-back" data-ss="back" aria-label="Atrás: volver a la parte anterior"><span aria-hidden="true">‹</span> Atrás</button><b>Mensaje nuevo</b></div>';
    if (s.sent) {
      return top + '<div class="ss-body"><div class="ss-bubble">' + esc(s.text) + '</div><p class="ss-state" role="status"><b>Envío simulado</b></p>' +
        '<p class="ss-note">No se asegura que haya sido recibido: en esta simulación no existe una conexión real. Con red celular disponible, un SMS real podría salir; con la red caída o saturada, podría quedar pendiente o no enviarse.</p>' +
        '<div class="ss-acts"><button type="button" class="seq-again" data-ss="edit">Editar el mensaje</button><button type="button" class="seq-finish" data-ss="again">Repetir el ejercicio</button></div></div>';
    }
    var st = ready(s) ? "Mensaje preparado: pulsa el botón ➤ para el envío simulado." : !s.num.length ? "Paso siguiente: escribe el número ficticio." : s.num.length < 10 ? "Faltan " + (10 - s.num.length) + " cifras del número." : "Ahora escribe tu mensaje.";
    return top + '<div class="ss-body"><button type="button" class="ss-field' + (s.field === "num" ? " on" : "") + '" data-ss="field" data-v="num" aria-pressed="' + (s.field === "num") + '"><span>Para:</span> ' + (s.num ? "<b>" + fmt(s.num) + "</b>" : "<i>número ficticio</i>") + "</button>" +
      '<div class="ss-msgrow"><button type="button" class="ss-field ss-msg' + (s.field === "msg" ? " on" : "") + '" data-ss="field" data-v="msg" aria-pressed="' + (s.field === "msg") + '">' + (s.text ? esc(s.text) : "<i>escribe tu mensaje</i>") + (s.field === "msg" ? '<u class="ss-caret"></u>' : "") + "</button>" +
      '<button type="button" class="ss-send" data-ss="send" aria-label="Enviar (simulado)"' + (ready(s) ? "" : ' aria-disabled="true"') + ">➤</button></div>" +
      '<p class="ss-status" role="status">' + st + "</p></div>" + keyboard(s);
  }

  function html(s) {
    return '<div class="sms-sim" data-sim><div class="ss-phone" tabindex="-1" role="group" aria-label="Teléfono de práctica">' + inner(s) + '</div>' +
      '<p class="ss-kbhint">También puedes escribir con el teclado de tu dispositivo: Enter envía y Esc vuelve a la parte anterior.</p></div>';
  }

  /* un solo oyente en el cuadro; hooks.changed(info) avisa a la secuencia (pasos del tutorial, teléfono 3D, sonidos) */
  function attach(card, live, hooks) {
    var CH = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9.,:;!?¿¡'"()\-]$/;
    /* ejecuta una acción del simulador; devuelve false si no hizo nada. by: "pointer" | "key" */
    function run(a, v, ch, by) {
      var s = live.sms, sound = null, focus = null;
      if (a === "open") { s.screen = "compose"; s.field = "num"; sound = "click"; focus = '[data-ss="field"][data-v="num"]'; }
      else if (a === "back") {
        if (s.screen === "home") return false;
        if (s.sent) { s.sent = false; s.field = "msg"; focus = '[data-ss="field"][data-v="msg"]'; }
        else if (s.field === "msg") { s.field = "num"; focus = '[data-ss="field"][data-v="num"]'; }
        else { s.screen = "home"; focus = '[data-ss="open"]'; }
        sound = "click";
      }
      else if (a === "field") { s.field = v; sound = "click"; focus = '[data-ss="field"][data-v="' + v + '"]'; }
      else if (a === "exnum") { s.num = EXAMPLE_NUM; s.field = "msg"; sound = "click"; focus = '[data-ss="field"][data-v="msg"]'; }
      else if (a === "exmsg") { s.text = EXAMPLE_MSG; sound = "click"; focus = '[data-ss="send"]'; }
      else if (a === "k") {
        if (s.screen !== "compose" || s.sent) return false;
        if (v === "del") { if (s.field === "num") s.num = s.num.slice(0, -1); else s.text = s.text.slice(0, -1); sound = "del"; }
        else if (s.field === "num") { if (!/^[0-9]$/.test(v) || s.num.length >= 10) return false; s.num += v; sound = v; if (s.num.length === 10) s.field = "msg"; }
        else { if (s.text.length >= MAXMSG) return false; var c = ch || v; s.text += c; sound = c; }
        s.sent = false; focus = by === "pointer" ? ":phone" : (s.field === "num" || v === "del" ? '[data-ss="k"][data-v="' + v + '"]' : null);
        if (by !== "pointer" && s.field === "msg" && v !== "del" && live.sms.num.length === 10 && !s.text) focus = '[data-ss="field"][data-v="msg"]';
      }
      else if (a === "send") {
        if (!ready(s)) { hooks.say && hooks.say(s.num.length < 10 ? "Escribe primero el número ficticio completo" : "Escribe primero un mensaje"); return false; }
        s.sent = true; sound = "send"; focus = '[data-ss="again"]';
      }
      else if (a === "edit") { s.sent = false; s.field = "msg"; focus = '[data-ss="field"][data-v="msg"]'; }
      else if (a === "again") { var f = fresh(); Object.keys(f).forEach(function (k) { s[k] = f[k]; }); focus = '[data-ss="open"]'; }
      else return false;
      render(card, live, focus);
      if (hooks.changed) hooks.changed(sound);
      return true;
    }

    card.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ss]"); if (!b || !card.contains(b)) return;
      var ch = b.textContent.length === 1 ? b.textContent : null;
      run(b.getAttribute("data-ss"), b.getAttribute("data-v"), ch, e.detail ? "pointer" : "key");
    });

    /* teclado del dispositivo: solo cuando el foco está dentro del teléfono de práctica */
    card.addEventListener("keydown", function (e) {
      var ph = e.target.closest && e.target.closest(".ss-phone"); if (!ph || e.ctrlKey || e.metaKey || e.altKey) return;
      var s = live.sms, k = e.key, onBtn = e.target.tagName === "BUTTON";
      if (s.screen === "home") { if (k === "Escape") return; return; }
      if (k === "Escape") { if (run("back", null, null, "key")) e.preventDefault(); return; }
      if (s.sent) return;
      if (k === "Backspace") { if (run("k", "del", null, "key")) e.preventDefault(); return; }
      if (k === "Enter") {
        if (onBtn && e.target.getAttribute("data-ss") !== "field") return;   // en cualquier otro botón, Enter lo activa como siempre
        e.preventDefault();
        if (s.field === "num") { if (s.num.length) run("field", "msg", null, "key"); } else run("send", null, null, "key");
        return;
      }
      if (k === " ") { if (s.field === "msg") { e.preventDefault(); run("k", " ", " ", "key"); } return; }
      if (k.length === 1 && CH.test(k)) {
        e.preventDefault();
        if (s.field === "num") { if (/[0-9]/.test(k)) run("k", k, null, "key"); }
        else run("k", k, k, "key");
      }
    });
  }

  function render(card, live, focus) {
    var ph = card.querySelector(".sms-sim .ss-phone"); if (!ph) return;
    ph.innerHTML = inner(live.sms);
    if (focus === ":phone") ph.focus({ preventScroll: true });
    else if (focus) { var f = ph.querySelector(focus); if (f) f.focus({ preventScroll: true }); else ph.focus({ preventScroll: true }); }
    else ph.focus({ preventScroll: true });
  }

  return { fresh: fresh, html: html, attach: attach, render: render, ready: ready, EXAMPLE_MSG: EXAMPLE_MSG };
})();
