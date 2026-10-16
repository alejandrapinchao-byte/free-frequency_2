/* Escenarios 3D de las dos zonas (geometría sencilla de Three.js, material "toon" del proyecto; sin archivos externos):
   · rural — Cauca: cielo, montañas en capas, lomas con cultivos, camino de tierra, casas de paredes claras y techo de teja, árboles y cercas.
   · urbano — Cali: cielo de atardecer, edificios de colores con ventanas, una torre con tejado en punta, calle con andén y líneas, postes de luz, palmas y objetos de calle.
   Pensado para móviles de gama media: ~60–80 mallas, geometrías y materiales compartidos, sin sombras proyectadas.
   `build()` devuelve { sky, update(t, amp) }: `amp` (0–1) es la intensidad de la simulación del sismo; en reposo es 0. */
window.FFScenery = (function () {
  "use strict";

  function skyTexture(THREE, stops) {
    var c = document.createElement("canvas"); c.width = 8; c.height = 256; var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    return new THREE.CanvasTexture(c);
  }

  function build(X, kind) {
    var THREE = X.THREE, M = X.M, env = X.env, V = X.V;
    var mats = {};
    function mat(color) { if (!mats[color]) mats[color] = X.envMat(M.toon(color)); return mats[color]; }
    function add(parent, geo, color, x, y, z, sx, sy, sz, ry) {
      var m = new THREE.Mesh(geo, typeof color === "number" ? mat(color) : color); m.position.set(x, y, z); if (sx !== undefined) m.scale.set(sx, sy, sz); if (ry) m.rotation.y = ry; parent.add(m); return m;
    }
    var box = new THREE.BoxGeometry(1, 1, 1), cone = new THREE.ConeGeometry(1, 1, 7), cone4 = new THREE.ConeGeometry(1, 1, 4), cyl = new THREE.CylinderGeometry(1, 1, 1, 9), sph = new THREE.SphereGeometry(1, 12, 8), hill = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
    var swayers = [], jitter = [], lamps = [], clouds = [];
    var group = new THREE.Group(); env.add(group);

    if (kind === "rural") {
      var skyT = skyTexture(THREE, [[0, "#8fc1d8"], [0.55, "#d8e9e2"], [1, "#f1efd8"]]);
      /* montañas: tres capas de profundidad */
      [[-16, 7.5, -26, 0x7b9db0], [-3, 9.5, -27, 0x6f93a8], [10, 8, -26, 0x7b9db0], [21, 9, -27, 0x6f93a8]].forEach(function (m) { add(group, cone, m[3], m[0], m[1] / 2, m[2], 10, m[1], 9); });
      [[-12, 5.5, -19, 0x5f8a6a], [1, 7, -20, 0x57806a], [14, 6, -19, 0x5f8a6a]].forEach(function (m) { add(group, cone, m[3], m[0], m[1] / 2, m[2], 8, m[1], 7); });
      add(group, hill, 0x7fa56a, -9, 0, -11, 9, 2.8, 6); add(group, hill, 0x8fb06f, 8, 0, -12, 10, 3.2, 6); add(group, hill, 0x6e9a5e, 0, 0, -17, 14, 3.6, 6);
      /* cultivos en la loma de la izquierda */
      var shrubs = new THREE.InstancedMesh(sph, mat(0x4f8a4a), 36), dm = new THREE.Object3D(), n = 0;
      for (var r = 0; r < 4; r++) for (var i = 0; i < 9; i++) { dm.position.set(-13 + i * 0.9 + r * 0.25, 0.85 + (3 - r) * 0.22 - Math.abs(i - 4) * 0.08, -9.3 - r * 0.6); dm.scale.set(0.24, 0.17, 0.24); dm.updateMatrix(); shrubs.setMatrixAt(n++, dm.matrix); }
      group.add(shrubs);
      /* camino de tierra que se aleja entre las lomas */
      [[1.6, 1.0, 0.0, 6], [0.9, 0.9, -5.5, 6], [-0.3, 0.8, -11, 7]].forEach(function (p) { var m = add(group, box, 0xc9ad7c, p[0], 0.01, p[2], p[1] * 1.5, 0.02, p[3]); m.rotation.y = -p[0] * 0.12; });
      /* casas: paredes claras y techo de teja */
      [[-6.6, -6.5, 1], [7.4, -8.5, 1.15]].forEach(function (h) {
        var g = new THREE.Group(); g.position.set(h[0], 0, h[1]); group.add(g);
        add(g, box, 0xf3ead6, 0, 0.62 * h[2], 0, 2.1 * h[2], 1.24 * h[2], 1.7 * h[2]);
        add(g, cone4, 0xb5543a, 0, 1.55 * h[2], 0, 1.75 * h[2], 0.95 * h[2], 1.5 * h[2], Math.PI / 4);
        add(g, box, 0x7a4a2c, 0.5 * h[2], 0.4 * h[2], 0.86 * h[2], 0.34 * h[2], 0.8 * h[2], 0.04); add(g, box, 0x3d4a5a, -0.5 * h[2], 0.75 * h[2], 0.86 * h[2], 0.34 * h[2], 0.3 * h[2], 0.04);
      });
      var fence = new THREE.InstancedMesh(box, mat(0x8a6a44), 10);
      for (var f = 0; f < 10; f++) { dm.position.set(-9.6 + f * 0.55, 0.28, -4.6); dm.scale.set(0.07, 0.56, 0.07); dm.updateMatrix(); fence.setMatrixAt(f, dm.matrix); }
      group.add(fence); add(group, box, 0x8a6a44, -7.15, 0.38, -4.6, 5, 0.06, 0.05);
      /* árboles */
      [[-4.6, -4, 1], [4.8, -3.2, 1.15], [8.8, -5.5, 1.3], [-10.5, -5, 1.2], [3.2, -9.5, 1], [-2.6, -8.5, 0.9]].forEach(function (t) {
        add(group, cyl, 0x6b4a2e, t[0], 0.45 * t[2], t[1], 0.12 * t[2], 0.9 * t[2], 0.12 * t[2]);
        add(group, cone, 0x3f7a4a, t[0], 1.35 * t[2], t[1], 0.7 * t[2], 1.2 * t[2], 0.7 * t[2]); add(group, cone, 0x4a8a50, t[0], 1.95 * t[2], t[1], 0.5 * t[2], 0.9 * t[2], 0.5 * t[2]);
      });
      /* nubes */
      [[-12, 11, -23], [6, 13, -24], [18, 10, -23]].forEach(function (c) { var g = new THREE.Group(); g.position.set(c[0], c[1], c[2]); group.add(g); var cm = X.envMat(new THREE.MeshBasicMaterial({ color: 0xffffff })); [[0, 0, 2.2], [1.8, -0.2, 1.7], [-1.8, -0.3, 1.6]].forEach(function (p) { add(g, sph, cm, p[0], p[1], 0, p[2], p[2] * 0.55, p[2] * 0.6); }); clouds.push(g); });
      return {
        sky: skyT,
        update: function (t) { clouds.forEach(function (c, i) { c.position.x += 0.0025 * (1 + i * 0.3); if (c.position.x > 28) c.position.x = -28; }); }
      };
    }

    /* ---------------- urbano: Cali ---------------- */
    var skyU = skyTexture(THREE, [[0, "#6a5d8c"], [0.45, "#d98b8f"], [0.8, "#f6c28b"], [1, "#fbe1b0"]]);
    function winTex(w, h, lit) {
      var c = document.createElement("canvas"); c.width = 64; c.height = 128; var g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 64, 128);
      for (var y = 0; y < 8; y++) for (var x = 0; x < 4; x++) { g.fillStyle = (x * 3 + y * 5 + lit) % 7 === 0 ? "#f6d98a" : "#4b5670"; g.fillRect(6 + x * 15, 8 + y * 15, 9, 9); }
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w, h); return t;
    }
    function building(x, z, w, h, d, color, lit) {
      var g = new THREE.Group(); g.position.set(x, 0, z); group.add(g);
      var m = X.envMat(M.toon(color, { map: winTex(Math.max(1, Math.round(w / 1.1)), Math.max(1, Math.round(h / 1.6)), lit) }));
      var b = new THREE.Mesh(box, m); b.position.y = h / 2; b.scale.set(w, h, d); g.add(b);
      add(g, box, 0x7a7378, 0, h + 0.08, 0, w * 1.04, 0.16, d * 1.04);
      swayers.push({ g: g, h: h, ph: x * 0.7 }); return g;
    }
    var cols = [0xd9b99b, 0xb8c5d6, 0xe3c9c0, 0xc9b6d9, 0x9fb7a4, 0xe6d2a0];
    [[-17, -12, 3, 8, 3], [-13.2, -10, 2.6, 5.5, 2.6], [-7.6, -12, 3.2, 9.5, 3], [-3.4, -14, 2.8, 7, 3], [2.6, -13, 3, 10.5, 3], [7.6, -11, 2.6, 6, 2.6], [11.6, -13, 3.2, 8.5, 3], [16.6, -12, 3, 6.5, 3]].forEach(function (b, i) { building(b[0], b[1], b[2], b[3], b[4], cols[i % cols.length], i); });
    building(-6.6, -4.2, 2.6, 3.2, 2.2, 0xe3c9c0, 3); building(6.8, -4.6, 2.8, 4.2, 2.4, 0xc9d3b9, 5);
    /* torre con tejado en punta y balcón */
    var tower = new THREE.Group(); tower.position.set(-10.2, 0, -8); group.add(tower);
    add(tower, box, 0xf1e6d2, 0, 3, 0, 1.7, 6, 1.7); add(tower, cone4, 0xa84a3a, 0, 6.9, 0, 1.4, 1.8, 1.4, Math.PI / 4); add(tower, box, 0x7a4a2c, 0, 0.8, 0.86, 0.7, 1.4, 0.05); add(tower, box, 0x3d4a5a, 0, 4.2, 0.86, 0.5, 0.9, 0.05); add(tower, box, 0x7a7378, 0, 3.2, 1.0, 1.6, 0.08, 0.5);
    swayers.push({ g: tower, h: 6, ph: 2 });
    /* calle: andén, líneas y objetos */
    add(group, box, 0xb9b3a8, 0, 0.06, -3.1, 36, 0.12, 1.7);
    var dash = new THREE.InstancedMesh(box, mat(0xf3eadb), 11), dm = new THREE.Object3D();
    for (var q = 0; q < 11; q++) { dm.position.set(-15 + q * 3, 0.015, 3.4); dm.scale.set(1.3, 0.02, 0.14); dm.updateMatrix(); dash.setMatrixAt(q, dm.matrix); }
    group.add(dash);
    var bulb = X.envMat(new THREE.MeshBasicMaterial({ color: 0xfff2b8 }));
    [-3.4, 3.8].forEach(function (x, i) {
      var g = new THREE.Group(); g.position.set(x, 0, -2.6); group.add(g);
      add(g, cyl, 0x4a4650, 0, 1.6, 0, 0.06, 3.2, 0.06); add(g, box, 0x4a4650, 0.3, 3.2, 0, 0.7, 0.07, 0.07); var l = add(g, sph, bulb, 0.6, 3.12, 0, 0.14, 0.1, 0.14); lamps.push(l); swayers.push({ g: g, h: 3, ph: i });
    });
    [[5.6, -2.4], [-6.0, -1.8]].forEach(function (p, i) {   // palmas
      var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); group.add(g);
      var tr = add(g, cyl, 0x8a6a4a, 0, 1.4, 0, 0.12, 2.8, 0.12); tr.rotation.z = i ? 0.1 : -0.08;
      for (var k = 0; k < 6; k++) { var lf = add(g, cone4, 0x3f8a4a, Math.cos(k * 1.05) * 0.5 + (i ? 0.28 : -0.22), 2.85, Math.sin(k * 1.05) * 0.5, 0.18, 1.2, 0.5); lf.rotation.set(Math.sin(k * 1.05) * 1.1, 0, -Math.cos(k * 1.05) * 1.1); }
      swayers.push({ g: g, h: 2.8, ph: 1 + i });
    });
    var cone1 = add(group, cone, 0xe0662b, 2.2, 0.28, -1.8, 0.2, 0.56, 0.2); add(group, box, 0xf3eadb, 2.2, 0.03, -1.8, 0.4, 0.06, 0.4); jitter.push(cone1);
    var bin = add(group, box, 0x4f7a5a, -1.8, 0.35, -2.2, 0.5, 0.7, 0.45); jitter.push(bin); var crate = add(group, box, 0xc8a46a, -4.4, 0.25, -1.6, 0.5, 0.5, 0.5); jitter.push(crate);
    return {
      sky: skyU,
      update: function (t, amp) {
        var a = amp || 0;
        swayers.forEach(function (s) { s.g.rotation.z = a * Math.sin(t * 5.2 + s.ph) * 0.012 * (1 + s.h * 0.06); s.g.rotation.x = a * Math.sin(t * 4.1 + s.ph * 1.7) * 0.006; });
        jitter.forEach(function (m, i) { m.position.x += (a * Math.sin(t * 31 + i * 2.1) * 0.012 - (m.userData.dx || 0)); m.userData.dx = a * Math.sin(t * 31 + i * 2.1) * 0.012; });
        lamps.forEach(function (l, i) { l.material.color.setHex(a > 0.05 && Math.sin(t * 24 + i) > 0.2 ? 0xc8b680 : 0xfff2b8); });
      }
    };
  }

  return { build: build };
})();
