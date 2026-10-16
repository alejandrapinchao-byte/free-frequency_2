/* Free Frequency — contenido. Todo texto se edita aquí.
   Dos zonas (Ruralidad — Cauca, Urbanidad — Cali) y exactamente tres objetos: teléfono celular, radio portátil AM/FM y linterna.
   Cada zona tiene su propia explicación de cada objeto (`zones[zona].items[objeto]`), con uno o varios temas (`objects`): cada tema es una acción
   con su demostración en el primer plano y su cuadro. Tema: what (cómo ayuda), net (qué conexión necesita: [depende?, texto]; se omite si no aplica),
   limit (condiciones y límites), hint (indicación breve de interacción).
   Todos los objetos usan la misma secuencia visual (js/sequence.js): 1) objeto protagonista → 2) primer plano de las manos → 3) personaje completo → 4) cuadro.

   FUENTES (revisadas en octubre de 2026; se consultaron resúmenes de prensa que citan a las entidades, no siempre los documentos originales: conviene
   volver a los sitios oficiales antes de publicar):
   · Línea única de emergencias 123; llamadas gratuitas a líneas de emergencia aun sin saldo; recomendación de usar mensajes de texto o mensajería
     cuando la voz está congestionada: MinTIC (mintic.gov.co) y CRC, Comisión de Regulación de Comunicaciones.
   · Durante un sismo, protegerse (proteger la cabeza, alejarse de vidrios y objetos que puedan caer; en la calle, lejos de postes y cables); kit de emergencia
     con linterna, silbato y pilas; radio a pilas para seguir las actualizaciones: UNGRD, Unidad Nacional para la Gestión del Riesgo de Desastres (gestiondelriesgo.gov.co).
   · Información oficial sobre sismos y reporte «Sismo sentido»: Servicio Geológico Colombiano (sgc.gov.co).
   · Restablecimiento de contacto entre familiares: Cruz Roja Colombiana (cruzrojacolombiana.org).
   NO se citan alcances de radios, frecuencias, tipos de red ni garantías de conectividad. Los textos son generales y prudentes. */
window.FF = {
  order: ["telefono", "radio", "linterna"],
  seq: { steps: ["Objeto", "Manos", "Personaje", "Información"], skip: "Saltar introducción" },
  info: {
    overview: "Tres alternativas, tres formas de comunicar. El teléfono celular envía SMS y llamadas breves, pero necesita una red celular disponible. La radio AM/FM solo recibe información (no transmite) y funciona sin internet ni red celular: necesita pilas y una emisora. La linterna envía señales visuales, como el SOS en código Morse, a quien pueda verlas. Ninguna garantiza la comunicación: se complementan.",
    whyTitle: "¿Por qué el Cauca y Cali?",
    whyLead: "Free Frequency compara dos contextos distintos para mostrar que no todas las situaciones de comunicación son iguales. Cada uno ayuda a pensar un tipo de problema diferente.",
    whyNote: "Es una comparación entre dos contextos, no una afirmación de que todas las zonas rurales del Cauca carezcan de conectividad ni de que toda Cali tenga buena cobertura. Son ejemplos para aprender, no una predicción: ningún dato de esta experiencia indica que vaya a ocurrir un sismo.",
    whySources: "Ver fuentes y créditos"
  },

  /* Zonas narrativas */
  zones: {
    rural: {
      id: "rural", name: "Ruralidad — Cauca", short: "Cauca", label: "Ruralidad · Cauca", who: "Mateo", role: "Joven caucano", scene: "cauca",
      img: "assets/scenes/cauca-back.svg", char: "assets/characters/cauca.png",
      tag: "Vereda de montaña · Señal débil o inexistente",
      blurb: "Montañas, caminos de tierra y una vereda donde la señal del celular aparece y desaparece. ¿Cómo comunicarse cuando no hay conexión?",
      why: "Se eligió el Cauca como zona rural porque combina montañas y veredas donde la cobertura celular puede ser débil o intermitente y donde llegar a algunos lugares puede ser difícil. Además tiene una historia sísmica conocida: el sismo de Popayán de 1983, de magnitud 5,5, afectó gravemente la región. Sirve para pensar cómo comunicarse cuando la señal falla.",
      whyTag: "Contexto rural",
      whyLead: "Un territorio de montañas y veredas donde, en algunos lugares, la señal puede ser débil o intermitente.",
      whyPoints: ["Importa considerar lugares donde la cobertura celular o el acceso a internet pueden ser limitados.","Hace falta conocer opciones que no dependan solo de aplicaciones digitales.","La radio y las señales visuales pueden ayudar cuando las condiciones lo permiten: que haya emisora, pilas y alguien que vea la luz."],
      items: {
        telefono: {
          kicker: "Teléfono celular · Ruralidad — Cauca",
          bye: "Gracias por recorrer el teléfono en el Cauca. Ninguna de estas opciones garantiza la comunicación: dependen de que haya una red celular disponible.",
          objects: [
            {
              id: "sms", name: "Mensajes SMS", label: "SMS", sms: true,
              icon: "sms", tutorial: {"title":"Tutorial: cómo redactar y enviar un SMS (simulado)","steps":["Toca el icono «Mensajes» en la pantalla de inicio del teléfono de práctica.","Se abre la interfaz de SMS: verás un campo para el número y otro para el mensaje.","Escribe un número de celular ficticio con el teclado numérico (o usa el número de ejemplo). No es un número real.","Toca el campo del mensaje y escríbelo con el teclado virtual. Ejemplo: «Estoy bien. Estoy en un lugar seguro. Te escribiré cuando pueda». Puedes borrar con ⌫, corregir el texto y volver a escribir.","Pulsa el botón de enviar (➤).","La pantalla muestra «Envío simulado». No se asegura que el mensaje haya sido recibido, porque no existe una conexión real. Puedes repetir el ejercicio."]},
              intro: "Los SMS son mensajes de texto enviados mediante la red celular. A diferencia de muchas aplicaciones de mensajería, no necesitan una conexión a internet, pero sí requieren que el servicio de mensajes y la red celular estén disponibles.",
              why: "Cuando muchas personas intentan llamar al mismo tiempo después de una emergencia, puede ser difícil comunicarse. Un mensaje breve puede ser una alternativa, aunque su entrega no está garantizada si la red está caída o saturada.",
              what: "En el Cauca rural, un SMS puede ser útil cuando no hay internet, pero necesita cobertura de la red celular. Si no existe señal, el mensaje podría quedar pendiente o no enviarse. Si la señal aparece y desaparece, puede salir en el momento en que el teléfono logre conectarse.",
              net: { internet: [0, "No la necesita para SMS"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Sin cobertura el mensaje no sale, y que salga no garantiza que llegue ni que lo lean. Envíalo una sola vez.",
              hint: "Sigue los pasos en el teléfono de práctica: no se envía nada real y el número es ficticio."
            },
            {
              id: "cobertura", name: "Buscar mejor señal", label: "Señal", search: true,
              intro: "La cobertura es la señal de la red celular que recibe el teléfono. Depende de la distancia a las antenas, del terreno y de los obstáculos; cuando es débil, las llamadas y los SMS fallan o se demoran.",
              what: "Con cobertura débil o inexistente, buscar un lugar cercano, abierto y seguro puede mejorar la recepción, aunque sea por momentos. Muévete solo si es seguro hacerlo.",
              net: { internet: [0, "No la necesita"], cellular: [1, "Sí: depende de que haya red disponible"] },
              limit: "Si no hay red en la zona, ningún punto la tendrá. No tomes caminos inestables ni te alejes por buscar señal.",
              hint: "Observa cómo la señal sube y baja en la pantalla: es una ilustración, no una medición."
            },
            {
              id: "reconexion", name: "Reconectarse", label: "Reconexión", airplane: true,
              intro: "El modo avión desactiva las conexiones inalámbricas celulares del teléfono. Para enviar un SMS, normalmente debes desactivarlo y contar con cobertura celular. Activarlo no mejora por sí solo la señal.",
              what: "Si el modo avión está activado, desactívalo para poder enviar un SMS. Al desactivarlo el teléfono vuelve a buscar una red, pero solo se conectará si hay cobertura celular en el lugar.",
              net: { internet: [0, "Mientras el modo avión está activo, no hay conexión"], cellular: [1, "Sí: depende de que haya red disponible"] },
              limit: "Reconectar no está garantizado: depende de que haya red. Con el modo avión activo no entran ni salen llamadas ni SMS.",
              hint: "Activa y desactiva el modo avión (simulado) y mira la reconexión ilustrativa."
            }
          ]
        },
        radio: {
          kicker: "Radio AM/FM · Ruralidad — Cauca",
          bye: "Gracias por recorrer la radio en el Cauca. Recuerda que solo recibe y que depende de que haya una emisora disponible.",
          objects: [
            {
              id: "radio", name: "Radio AM/FM", label: "Radio", tuner: true,
              intro: "Una radio AM/FM recibe las señales que emiten las emisoras y las convierte en sonido. Solo recibe: no transmite. Con pilas funciona sin internet ni red celular.",
              what: "Si hay una emisora disponible, una radio portátil con pilas permite escuchar información sin internet ni red celular, algo útil cuando la señal del teléfono no llega a la vereda.",
              net: { internet: [0, "No la necesita"], cellular: [0, "No la necesita"] },
              limit: "Necesita pilas y recepción de una emisora; en zonas de montaña la recepción puede variar con el lugar. Solo recibe: no transmite.",
              hint: "Gira las perillas, cambia entre AM y FM y mueve el dial."
            }
          ]
        },
        linterna: {
          kicker: "Linterna · Ruralidad — Cauca",
          bye: "Gracias por recorrer la linterna en el Cauca. Una señal de luz solo sirve si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
          guided: true,
          guide: {
            "s1": {
              "title": "Una luz también puede comunicar",
              "morse": "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              "text": "Cuando no puedes comunicarte por una llamada o un mensaje, los destellos de una linterna pueden ayudarte a transmitir una señal."
            },
            "s2": {
              "title": "Destello corto y destello largo",
              "text": "En el código Morse, las letras se representan combinando señales cortas y largas. Con una linterna, puedes representar estas señales encendiendo y apagando la luz durante diferentes intervalos."
            },
            "s3": {
              "title": "La señal SOS",
              "text": "SOS es una señal internacional de socorro. En código Morse se forma así: S = tres destellos cortos, O = tres destellos largos y S = tres destellos cortos.",
              "msg": "Para pedir ayuda, puedes repetir la señal SOS con una linterna e intentar que sea visible para otras personas.",
              "note": "La señal solo será útil si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
              "zone": "Si estás en una zona rural y no tienes señal telefónica, los destellos pueden servir como una señal visual para alguien que esté cerca. Busca un lugar seguro y visible, sin exponerte a terrenos peligrosos."
            },
            "p": {
              "title": "Practica la señal",
              "text": "Pulsa «Destello corto» o «Destello largo», reproduce el SOS, o mantén presionado el interruptor de la linterna: se enciende mientras lo sostienes y se apaga al soltarlo. Es solo una práctica: no se envía nada."
            }
          },
          objects: [
            {
              id: "escena", name: "Linterna y código Morse", label: "Linterna", toggle: true, whatTitle: "¿Cómo ayuda?",
              intro: "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              what: "Una linterna permite enviar señales visuales sin depender de una conexión a internet o de una red celular. Mediante el código Morse, puedes transmitir señales como SOS a personas que estén dentro del alcance visual.",
              limit: "Necesitas una linterna con batería, un entorno en el que los destellos puedan verse y una persona capaz de reconocer la señal. La luz puede quedar oculta por obstáculos, la distancia o las condiciones ambientales. El código Morse no sustituye los servicios de emergencia ni garantiza una respuesta.",
              hint: "Enciende y apaga la linterna, o mantén presionado el interruptor para formar puntos y rayas."
            }
          ]
        }
      }
    },

    urbano: {
      id: "urbano", name: "Urbanidad — Cali", short: "Cali", label: "Urbanidad · Cali", who: "Valeria", role: "Joven caleña", scene: "cali",
      img: "assets/scenes/cali-back.svg", char: "assets/characters/cali.png",
      tag: "Después de un sismo · Redes congestionadas",
      blurb: "Una calle de Cali después de un sismo: la electricidad, internet o la red celular pueden fallar. ¿Cómo comunicarse con seguridad?",
      why: "Se eligió Cali como zona urbana porque es una de las ciudades más grandes del país y, según la Alcaldía de Cali (dato de 2020), la única de Colombia con más de un millón de habitantes ubicada en una zona de amenaza sísmica alta. Tras un sismo las redes pueden saturarse o fallar: por eso sirve para practicar cómo comunicarse con seguridad después del movimiento.",
      whyTag: "Contexto urbano",
      whyLead: "Una ciudad grande donde, tras un sismo, muchas personas intentan comunicarse al mismo tiempo.",
      whyPoints: ["Conocer alternativas de comunicación antes de una emergencia, como un sismo, ayuda a reaccionar con más calma.","Las redes pueden congestionarse o sufrir interrupciones cuando muchas personas las usan a la vez.","Por eso sirve conocer los SMS, la radio y la linterna: no dependen de lo mismo y se complementan."],
      whyFact: "Según la Alcaldía de Cali (presentación de 2020), es la única ciudad de Colombia con más de un millón de habitantes en zona de amenaza sísmica alta.",
      whyRef: "Fuente: Alcaldía de Santiago de Cali",
      quake: true,
      items: {
        telefono: {
          kicker: "Teléfono celular · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer el teléfono en Cali. Ninguna de estas acciones garantiza una conexión: dependen de la red y del operador.",
          objects: [
            {
              id: "sms", name: "SMS breves", label: "SMS", sms: true,
              icon: "sms", tutorial: {"title":"Tutorial: cómo redactar y enviar un SMS (simulado)","steps":["Toca el icono «Mensajes» en la pantalla de inicio del teléfono de práctica.","Se abre la interfaz de SMS: verás un campo para el número y otro para el mensaje.","Escribe un número de celular ficticio con el teclado numérico (o usa el número de ejemplo). No es un número real.","Toca el campo del mensaje y escríbelo con el teclado virtual. Ejemplo: «Estoy bien. Estoy en un lugar seguro. Te escribiré cuando pueda». Puedes borrar con ⌫, corregir el texto y volver a escribir.","Pulsa el botón de enviar (➤).","La pantalla muestra «Envío simulado». No se asegura que el mensaje haya sido recibido, porque no existe una conexión real. Puedes repetir el ejercicio."]},
              intro: "Los SMS son mensajes de texto enviados mediante la red celular. A diferencia de muchas aplicaciones de mensajería, no necesitan una conexión a internet, pero sí requieren que el servicio de mensajes y la red celular estén disponibles.",
              why: "Cuando muchas personas intentan llamar al mismo tiempo después de una emergencia, puede ser difícil comunicarse. Un mensaje breve puede ser una alternativa, aunque su entrega no está garantizada si la red está caída o saturada.",
              what: "En Cali, después de un sismo las redes pueden congestionarse. Prioriza mensajes breves con lo esencial (cómo estás, dónde estás y qué necesitas) y evita las llamadas innecesarias para no saturar más la línea de voz; MinTIC y la CRC recomiendan los mensajes de texto cuando la voz está congestionada.",
              net: { internet: [0, "No la necesita para SMS"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Que el mensaje salga no garantiza que llegue ni que lo lean. Úsalo solo cuando sea seguro.",
              hint: "Sigue los pasos en el teléfono de práctica: no se envía nada real y el número es ficticio."
            },
            {
              id: "llamadas", name: "Llamadas breves", label: "Llamadas", call: true,
              intro: "Una llamada de voz usa la red celular. Es la forma más directa de hablar con alguien, pero necesita una conexión estable y se satura cuando muchas personas llaman a la vez.",
              what: "Una llamada corta, con lo esencial, deja la línea libre para otras personas. El 123 es la línea única de emergencias y la llamada es gratuita, incluso sin saldo.",
              net: { internet: [0, "No la necesita"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Solo funciona si hay conexión; con la red congestionada puede no completarse, y llamar al 123 no garantiza que entre.",
              hint: "Mira la llamada simulada: no se llama a nadie."
            },
            {
              id: "avion", name: "Modo avión", label: "Modo avión", airplane: true,
              intro: "El modo avión desactiva las conexiones inalámbricas celulares del teléfono. Para enviar un SMS, normalmente debes desactivarlo y contar con cobertura celular. Activarlo no mejora por sí solo la señal.",
              what: "Si el modo avión está activado, desactívalo para poder enviar un SMS. Al desactivarlo el teléfono vuelve a buscar una red, pero solo se conectará si hay cobertura celular; activarlo no mejora por sí solo la señal.",
              net: { internet: [0, "Mientras está activo, no hay conexión"], cellular: [1, "Sí: depende de que haya red disponible"] },
              limit: "No garantiza una conexión. Mientras está activo no entran ni salen llamadas ni SMS.",
              hint: "Activa y desactiva el modo avión (simulado) y mira la reconexión ilustrativa."
            },
            {
              id: "red", name: "Probar otra red", label: "Otra red", network: true,
              intro: "Algunos teléfonos permiten elegir la red móvil manualmente entre las que ofrece el operador. Es un ajuste que depende de cada teléfono y de cada operador; no todos lo permiten.",
              what: "Algunos teléfonos permiten elegir manualmente otra red o tecnología disponible, pero solo si el teléfono y el operador lo permiten.",
              net: { internet: [0, "No la necesita"], cellular: [1, "Sí: depende del teléfono, del operador y de la red"] },
              limit: "No todos los teléfonos u operadores lo permiten, y cambiar de red no garantiza una conexión.",
              hint: "Mira la pantalla: es una ilustración, no cambia ningún ajuste de tu teléfono."
            }
          ]
        },
        radio: {
          kicker: "Radio AM/FM · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer la radio en Cali. Recuerda que solo recibe información: no sirve para enviar mensajes ni pedir ayuda.",
          objects: [
            {
              id: "radio", name: "Radio AM/FM", label: "Radio", tuner: true,
              intro: "Una radio AM/FM recibe las señales que emiten las emisoras y las convierte en sonido. Solo recibe: no transmite. Con pilas funciona sin internet ni red celular.",
              what: "Una radio portátil con pilas sigue funcionando durante un corte eléctrico y permite escuchar noticias e indicaciones difundidas por las emisoras, sin depender de internet ni de la red celular.",
              net: { internet: [0, "No la necesita"], cellular: [0, "No la necesita"] },
              limit: "Sirve para recibir información, no para enviar mensajes ni solicitar ayuda. Necesita pilas y que haya emisoras al aire.",
              hint: "Gira las perillas, cambia entre AM y FM y mueve el dial."
            }
          ]
        },
        linterna: {
          kicker: "Linterna · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer la linterna en Cali. Una señal de luz solo sirve si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
          guided: true,
          guide: {
            "s1": {
              "title": "Una luz también puede comunicar",
              "morse": "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              "text": "Cuando no puedes comunicarte por una llamada o un mensaje, los destellos de una linterna pueden ayudarte a transmitir una señal."
            },
            "s2": {
              "title": "Destello corto y destello largo",
              "text": "En el código Morse, las letras se representan combinando señales cortas y largas. Con una linterna, puedes representar estas señales encendiendo y apagando la luz durante diferentes intervalos."
            },
            "s3": {
              "title": "La señal SOS",
              "text": "SOS es una señal internacional de socorro. En código Morse se forma así: S = tres destellos cortos, O = tres destellos largos y S = tres destellos cortos.",
              "msg": "Para pedir ayuda, puedes repetir la señal SOS con una linterna e intentar que sea visible para otras personas.",
              "note": "La señal solo será útil si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
              "zone": "Después de un sismo, una linterna puede ayudarte a iluminar el entorno y, si necesitas pedir ayuda, transmitir una señal visual. Evita acercarte a estructuras inestables y sigue las indicaciones de las autoridades."
            },
            "p": {
              "title": "Practica la señal",
              "text": "Pulsa «Destello corto» o «Destello largo», reproduce el SOS, o mantén presionado el interruptor de la linterna: se enciende mientras lo sostienes y se apaga al soltarlo. Es solo una práctica: no se envía nada."
            }
          },
          objects: [
            {
              id: "escena", name: "Linterna y código Morse", label: "Linterna", toggle: true, whatTitle: "¿Cómo ayuda?",
              intro: "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              what: "Una linterna permite enviar señales visuales sin depender de una conexión a internet o de una red celular. Mediante el código Morse, puedes transmitir señales como SOS a personas que estén dentro del alcance visual.",
              limit: "Necesitas una linterna con batería, un entorno en el que los destellos puedan verse y una persona capaz de reconocer la señal. La luz puede quedar oculta por obstáculos, la distancia o las condiciones ambientales. El código Morse no sustituye los servicios de emergencia ni garantiza una respuesta.",
              hint: "Enciende y apaga la linterna, o mantén presionado el interruptor para formar puntos y rayas."
            }
          ]
        }
      }
    }
  },

  /* Los tres objetos (el modelo 3D se construye en js/hub.js y js/seq-modules.js) */
  journeys: {
    telefono: { id: "telefono", module: "phone", name: "Teléfono celular", short: "Teléfono", flatImg: "assets/objects/celular.svg" },
    radio: { id: "radio", module: "radio", name: "Radio portátil AM/FM", short: "Radio", flatImg: "assets/objects/radio.svg" },
    linterna: { id: "linterna", module: "torch", name: "Linterna", short: "Linterna", flatImg: "assets/objects/linterna.svg" }
  },

  /* Menú de objetos de cada zona: los tres objetos 3D */
  menu: [
    { id: "telefono", model: "phone", name: "Teléfono celular", img: "assets/objects/celular.svg",
      text: "Permite enviar SMS, realizar llamadas breves e intentar reconectarse a una red disponible. Estas opciones requieren cobertura celular para funcionar y pueden fallar durante una emergencia." },
    { id: "radio", model: "radio", name: "Radio AM/FM", img: "assets/objects/radio.svg",
      text: "Permite escuchar noticias e indicaciones de las autoridades cuando las redes celulares o internet fallan. Una radio portátil con pilas puede funcionar durante un corte de electricidad, siempre que exista una emisora disponible." },
    { id: "linterna", model: "torch", name: "Linterna", img: "assets/objects/linterna.svg",
      text: "Permite iluminar espacios oscuros, facilitar el desplazamiento y hacer más visibles los obstáculos cuando falla la electricidad. Puede ayudar a orientarse sin depender de la señal celular." }
  ],

  /* Simulación del sismo (solo en la zona urbana) */
  quake: {
    during: "Durante el movimiento",
    duringText: "Simulación de un sismo. Lo primero es protegerte: cubre tu cabeza y aléjate de vidrios y objetos que puedan caer. No es momento de usar el teléfono.",
    after: "El movimiento terminó",
    afterText: "Cuando sea seguro, así puedes intentar comunicarte después del sismo. Las redes pueden estar saturadas o caídas y ninguna alternativa garantiza una conexión.",
    cont: "Continuar con las explicaciones",
    skip: "Saltar simulación",
    again: "Ver la simulación del sismo",
    still: "Simulación en reposo (movimiento reducido): la escena no se mueve."
  },

  /* Sintonizador ilustrativo de la radio (no usa frecuencias ni emisoras reales). pos = posición en el dial (0–100). */
  tuner: {
    title: "Sintoniza la radio",
    note: "Simulación ilustrativa: no usa frecuencias ni emisoras reales. En la vida real depende de que haya emisoras al aire en tu zona.",
    off: "La radio está apagada. Enciéndela (necesita pilas) y mueve el dial.",
    noise: "Solo ruido: aquí no hay emisora. Sigue moviendo el dial.",
    near: "Se oye algo entre el ruido… acércate un poco más.",
    start: { on: false, band: "AM", pos: 8 },
    demo: { band: "AM", pos: 24 },   // posición en que termina la demostración del primer plano
    bands: {
      AM: [
        { pos: 24, kind: "info", name: "Emisora de ejemplo", msg: "Boletín de ejemplo: «Mantenga la calma y siga las indicaciones de las autoridades.»" },
        { pos: 71, kind: "music", name: "Otra emisora de ejemplo", msg: "Programa musical de ejemplo: no trae información de la emergencia. Sigue buscando." }
      ],
      FM: [
        { pos: 38, kind: "info", name: "Emisora de ejemplo", msg: "Boletín de ejemplo: «Escuche con calma y espere nuevas indicaciones oficiales.»" },
        { pos: 82, kind: "music", name: "Otra emisora de ejemplo", msg: "Programa musical de ejemplo: no trae información de la emergencia. Sigue buscando." }
      ]
    }
  },

  /* Sección final y de fuentes */
  final: {
    title: "Prepárate antes de que falle la señal",
    lead: "Ninguna de estas tres alternativas lo resuelve todo. Funcionan mejor combinadas y probadas con tiempo.",
    columns: [
      { title: "Antes", items: [
        "Ten a mano una radio portátil y una linterna con pilas.",
        "Averigua en qué puntos de tu zona suele haber señal y qué emisoras se oyen."
      ] },
      { title: "Durante", items: [
        "Primero protégete. Después, si es seguro, prefiere SMS y llamadas breves; el 123 es solo para emergencias reales.",
        "Escucha la radio para recibir información oficial y alumbra el suelo para moverte con cuidado."
      ] },
      { title: "Después", items: [
        "Avisa que estás bien con un mensaje corto.",
        "Para buscar a un familiar, acude a la Cruz Roja Colombiana y su servicio de restablecimiento de contacto."
      ] }
    ],
    sourcesTitle: "Fuentes y créditos",
    sourcesLead: "Contenido revisado en octubre de 2026 con información de estas entidades (se consultaron resúmenes que las citan; consulta siempre sus canales oficiales, porque esta experiencia es educativa y no reemplaza las indicaciones de las autoridades):",
    sources: [
      { name: "UNGRD — Unidad Nacional para la Gestión del Riesgo de Desastres", site: "gestiondelriesgo.gov.co", use: "Qué hacer durante un sismo y kit de emergencia (linterna, pilas, radio a pilas)." },
      { name: "SGC — Servicio Geológico Colombiano", site: "sgc.gov.co", use: "Información oficial sobre sismos y reporte «Sismo sentido»." },
      { name: "MinTIC — Ministerio de Tecnologías de la Información y las Comunicaciones", site: "mintic.gov.co", use: "Línea única de emergencias 123 y uso de mensajes de texto cuando la voz se congestiona." },
      { name: "CRC — Comisión de Regulación de Comunicaciones", site: "crc.gov.co", use: "Recomendaciones sobre comunicaciones durante emergencias." },
      { name: "Cruz Roja Colombiana", site: "cruzrojacolombiana.org", use: "Restablecimiento de contacto entre familiares." },
      { name: "Alcaldía de Santiago de Cali", site: "cali.gov.co", use: "Cali, única ciudad de Colombia con más de un millón de habitantes en zona de amenaza sísmica alta (presentación de 2020)." },
      { name: "Boletín de Geología (Universidad Industrial de Santander)", site: "revistas.uis.edu.co", use: "Sismo de Popayán del 31 de marzo de 1983 (magnitud 5,5)." },
      { name: "Código Morse (fuentes divulgativas: Berlitz, EcuRed)", site: "berlitz.com · ecured.cu", use: "Puntos y rayas; el SOS como tres cortos, tres largos y tres cortos; el destello largo dura unas tres veces el corto." }
    ],
    credits: "Personajes e ilustraciones de Free Frequency (referencias aprobadas). Modelos 3D de los objetos y entornos construidos con Three.js (MIT). Tipografías: Fraunces y DM Sans (Google Fonts)."
  }
};
