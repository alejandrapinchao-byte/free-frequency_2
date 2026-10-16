# Free Frequency

Experiencia web educativa sobre alternativas de comunicación cuando la conectividad falla. HTML + CSS + JS; los objetos y los escenarios usan Three.js (copia local, ver abajo).
Fuentes: Fraunces y DM Sans (Google Fonts, con alternativa del sistema).

## Cómo probarla
```bash
npm run dev
```
Abre la dirección que muestre la terminal (por defecto http://localhost:5190; si está ocupado usa el siguiente puerto libre).
Se recomienda usar el servidor: abrir `index.html` con doble clic puede funcionar, pero no está verificado.

## Estructura
**Portada** → **Elegir zona** → **Menú de la zona** (los tres objetos 3D) → **Recorrido de cada objeto** → **Preparación** (con **Fuentes y créditos**).

- **Dos zonas**: *Ruralidad — Cauca* (con Mateo; cobertura débil o inexistente) y *Urbanidad — Cali* (con Valeria; situación posterior a un sismo). Cada zona tiene su escenario 3D (`js/scenery.js`) y su propia explicación de cada objeto (`FF.zones[zona].items` en `js/data.js`): los textos no se repiten entre zonas.
- **Tres objetos** (y solo tres): teléfono celular, radio portátil AM/FM y linterna, con modelo 3D (`js/hub.js`, `js/seq-modules.js`).
  - Teléfono rural: SMS, buscar mejor señal y reconexión. Teléfono urbano: SMS breves, llamadas breves, modo avión y probar otra red (solo si el teléfono y el operador lo permiten).
  - Radio: una explicación por zona.
  - **Linterna: recorrido guiado de código Morse** (`FF.zones[zona].items.linterna.guide` en `js/data.js`; lógica en `js/sequence.js`, bloque «recorrido guiado»). Avanza por pasos que esperan al usuario: 1) la linterna 3D sola, que se enciende poco a poco, con el título «Una luz también puede comunicar»; 2) acercamiento a las manos y al pulgar, con el destello corto (punto, ≈0,2 s) y el largo (raya, ≈0,6 s) y sus indicadores; 3) la señal SOS (`... --- ...`) reproducida con la linterna y con cada punto o raya iluminándose a la vez (0,2 s entre símbolos, 0,6 s entre letras), más el texto de cada zona; 4) práctica: «Destello corto», «Destello largo», «Reproducir SOS», «Repetir», «Borrar» y «Continuar», o mantener presionado el interruptor de la linterna (clic, toque o Espacio/Enter) —se enciende al presionar y se apaga al soltar—, con un registro de lo que escribes que avisa si coincide con SOS (sin medir tiempos); 5) cuadro «¿Cómo ayuda?» y «Condiciones y límites». Durante los pasos 3 y 4 el deslizamiento y la rueda no cambian de escena. Con «reducir movimiento» la linterna no parpadea: solo se iluminan los indicadores.
- **Secuencia visual** (`js/sequence.js` + `js/seq-modules.js`), igual para todos los objetos: 1) objeto protagonista → 2) primer plano de las manos usándolo → 3) personaje completo usándolo (mismo objeto, sin cortes) → 4) cuadro con *Cómo ayuda*, *Condiciones y límites*, el territorio y una indicación breve de interacción. El cuadro queda fijo hasta que el usuario decide continuar y no tapa el objeto (a un lado en computador, abajo en móvil).
- **Simulación del sismo** (solo al entrar a la zona urbana): ~5 s con cámara y suelo moviéndose de forma suave (±3 cm), edificios y postes que oscilan ~1°, luces que parpadean, objetos de la calle que vibran y el personaje encogido con una señal «!». Termina con un aviso «El movimiento terminó» y un botón para continuar con las explicaciones; se puede saltar. Con «reducir movimiento» no se mueve nada: se muestra la escena en reposo con los dos textos. No hay derrumbes ni daños en los edificios.
- **Interacciones** (ratón, teclado y táctil; nada real): simulador de SMS con campo de texto («Enviar (simulado)»), modo avión con reconexión ilustrativa, búsqueda de señal, cambio de red ilustrativo, radio con perillas que se arrastran, perilla de encendido, selector AM/FM (lámparas) y dial, y linterna que enciende y apaga iluminando el entorno. No se envían mensajes ni llamadas, ni se tocan ajustes del dispositivo.
- **Navegación**: barra inferior con Menú, anterior, progreso de la zona (3 alternativas) y siguiente; pestañas superiores; teclas ←/→; deslizamiento horizontal largo y rueda del ratón sobre el escenario. Cada gesto avanza **un solo paso** y hay una pausa de ~0,9 s entre pasos; tocar objetos 3D o el cuadro nunca cambia de escena. «Repetir el acercamiento», «Repetir secuencia» y los pasos de la barra de progreso permiten revisar cada etapa; la primera vez se ve la secuencia completa y al volver se muestra directo el plano completo.
- **Movimiento reducido**: sin transiciones; los cuatro pasos son planos fijos que se eligen con la barra de progreso. **Sin WebGL**: versión plana con el mismo cuadro y controles (sin acercamiento ni sismo).
- Archivos: `js/data.js` (contenido y fuentes), `js/app.js` (rutas, navegación), `js/components.js` (selector de zona y sección final), `js/hub.js` (menú 3D y modelos), `js/scenery.js` (escenarios), `js/sequence.js` (motor), `js/seq-modules.js` (objetos), `js/tuner.js` (sintonizador), `css/styles.css`.

## Sonido (`js/audio.js`)
Un módulo central con Web Audio API; todos los sonidos se sintetizan al momento (sin archivos, descargas ni dependencias). Se habilita con el primer clic, toque o tecla (o «Comenzar»). El botón del encabezado silencia o activa todo (efectos, radio y ambientes) y la preferencia se guarda como `ff-sound` = on/off en el navegador. Mezcla en tres buses (efectos, radio y ambiente) con un compresor/limitador antes del volumen general (0,9): los efectos van al frente, y el ambiente baja un instante cada vez que suena un efecto para que se oiga con claridad. Si Web Audio falla, todo sigue funcionando sin sonido.
- **Teléfono**: cada tecla suena al escribirla —y en la demostración, cada vez que el pulgar pulsa— (tono distinto por letra), borrar tiene otro sonido, enviar (simulado), modo avión (confirmación) y un aviso breve y neutro cuando aparece la «reconexión ilustrativa», sincronizado con el cambio de pantalla.
- **Radio**: clic de perilla y de las lámparas de banda, tic mecánico del dial, silbido de barrido de frecuencia que sigue al dial (también en la demostración), estática que sube o baja con la claridad de la señal simulada, tono limpio al encontrar una emisora de ejemplo y estática que vuelve al perderla; se calla sola a los ~4 s sin interacción y al apagar la radio. Suena al manipularla y durante su demostración en pantalla.
- **Linterna**: al hundir el botón de encendido suena un golpe mecánico grave, y al soltarlo un clic más agudo, sincronizados con la luz y con el pulgar (también cuando la linterna se enciende al empezar); en la demostración, el SOS y la práctica suena un clic por cada encendido y apagado (el SOS son 18 clics: 9 destellos). Volver a entrar a una escena es silencioso.
- **Sin sonido de fondo**: no hay música ni ambientes. Solo el retumbo breve del sismo (se desvanece solo; con «reducir movimiento» no suena).
- No hay audio en el menú, en la portada ni al cambiar de ruta, y `sceneStop()` detiene ambiente, radio y avisos pendientes al salir de una escena. La versión plana (sin WebGL) no tiene sonido en sus controles.

## Rutas
`#inicio`, `#zonas`, `#rural` y `#urbano` (menú de la zona), `#rural/telefono`, `#urbano/radio`, etc. (recorrido), `#preparacion`, `#fuentes`.

## Dependencia
`assets/vendor/three.min.js`: Three.js r149 (MIT, ver `assets/vendor/three.LICENSE.txt`), script clásico sin build.

## Interacción del menú de la zona
Un único cuadro informativo (texto HTML real, accesible) muestra el nombre y la explicación del objeto. Seleccionar nunca navega: el recorrido empieza solo con **«Comenzar recorrido»**.
- **Ratón:** el cursor muestra una vista previa; un clic selecciona. **Táctil:** un toque selecciona; el botón del cuadro abre el recorrido. **Teclado:** Tab, Enter y Escape.
- Textos del menú: `FF.menu` en `js/data.js`.

## Límites reales (qué es 3D y qué no)
- Son 3D reales y construidos en código: los tres objetos, los escenarios de ambas zonas, las manos y los antebrazos del primer plano (geometría sencilla y estilizada con pulgar articulado) y la luz de la linterna (un foco sin sombras).
- **Los personajes completos siguen siendo ilustraciones planas** (Mateo y Valeria) sobre un plano 3D: no hay modelos 3D articulados disponibles en el proyecto. Se mueve el cuerpo entero (respirar, balanceo al explicar, encogerse y ladearse en el sismo); **no** hay parpadeo, mirada, expresión de sorpresa ni brazos que se muevan. En el plano completo se ve la mano 3D que sostiene el objeto a la altura de la muñeca de la ilustración. No caminan.
- El sintonizador es ilustrativo: no hay audio ni frecuencias ni emisoras reales.

## Recursos provisionales (reemplazables con el mismo nombre)
- Ilustraciones de zona: `assets/scenes/{cauca,cali}-back.svg` (miniaturas del selector y versión plana). Iconos: `assets/objects/*.svg`.
- Personajes: `assets/characters/cauca.png` (Mateo) y `cali.png` (Valeria); originales en `*-original.png`.

## Contenido y fuentes
Los textos son educativos y no reemplazan las indicaciones de las autoridades. La sección «Fuentes y créditos» (`#fuentes`) cita a UNGRD, SGC, MinTIC, CRC y Cruz Roja Colombiana; se consultaron resúmenes que las citan (detalle en la cabecera de `js/data.js`), así que conviene confirmar en sus sitios oficiales antes de publicar. No se citan frecuencias, alcances de radios ni garantías de conectividad.

## Revisión académica (octubre de 2026)

- **Idiomas (ES/EN):** botón `EN`/`ES` en la barra superior. El español es el original; `js/lang-en.js` trae el diccionario y `js/i18n.js` traduce la interfaz y los textos de los canvas. El idioma se guarda en `localStorage` (`ff-lang`) y la página se recarga al cambiarlo. Una frase sin traducción se muestra en español.
- **SMS:** icono propio, explicación inicial, por qué sirve con problemas de conectividad y tutorial paso a paso con simulador (nada real se envía).
- **Teléfono, modo avión y alternativas:** introducción en cada tema y resumen en el menú de la zona.
- **Morse:** explicación en el primer paso de la guía de la linterna.
- **Cali y Cauca:** sección «¿Por qué el Cauca y Cali?» en el selector de zonas, con fuentes en `#fuentes`.
- **Logo:** blanco en todas las vistas y dentro de la pantalla del teléfono.
- **Personajes:** halo blanco de los bordes eliminado en `assets/characters/cauca.png` y `cali.png` (siguen siendo ilustraciones planas).
- **Menú y radio:** barra superior sin solapes; en la tarjeta de la radio el sintonizador va arriba y la radio es más grande en el plano general.
