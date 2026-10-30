/**
 * Genera el contenido autonomico: src/datos/autonomico.json.
 *
 *   pnpm datos:autonomicas              -> tabla de revision
 *   pnpm datos:autonomicas --escribir   -> escribe autonomico.json
 *
 * Lee el consolidado del BOE que descarga `pnpm datos:extraer`.
 *
 * POR QUE ESTA CURADO A MANO
 *
 * Se probaron dos heuristicas para localizar automaticamente el precepto que
 * crea cada obligacion, y las dos fallaban entre el 20% y el 30% de las veces:
 * escogian articulos de infracciones (que describen el incumplimiento, no
 * crean el deber), deberes del veterinario o del vendedor en lugar del titular,
 * o clausulas de excepcion en vez del precepto general. Para un producto cuya
 * premisa es no afirmar nada sin respaldo, ese margen no vale.
 *
 * Asi que la eleccion de norma, articulo y estado es humana y esta abajo, en
 * SELECCION y REFERENCIAS. Lo que NO es humano es la cita: el script la extrae
 * del XML consolidado del BOE usando un localizador, de modo que el texto es
 * literal por construccion y no depende de que nadie lo transcriba bien.
 *
 * Si un localizador deja de encontrar su frase, el script falla en vez de
 * escribir una cita vacia.
 *
 * REGLA DE ESTADO (aprobada el 07/09/2026)
 *   - obligacion directa                       -> obligatorio
 *   - obligacion que remite a reglamento        -> obligatorio_pendiente_reglamento
 *   - tema no regulado                          -> no se crea regla (sin_datos)
 *
 * Matiz aplicado (D36): una remision que solo alcanza a "otras especies", a
 * "las condiciones" o al procedimiento no convierte en pendiente el deber
 * principal.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ordenarArticulos,
  ordenarFuentes,
  ordenarNormas,
  ordenarReglas,
  ordenarRequisitos,
} from '../../src/lib/datos/orden.ts';
import { CACHE as CACHE_COMUN, escribirDatos } from './comun.mjs';

const CACHE = join(CACHE_COMUN, 'autonomicas');

/** Fecha de la ultima revision completa de la seleccion contra el BOE. */
const VERIFICADA_EN = '2026-09-29';

/** Requisitos que solo existen por las leyes autonomicas. */
const REQUISITOS = [
  {
    clave: 'identificacion_animales',
    tema: 'identificacion',
    titulo: 'Identificar a tu animal',
    descripcionCorta:
      'Hay que identificar al animal, en perros, gatos y hurones con microchip.',
    explicacion:
      'La Ley 7/2023 obliga en toda España a identificar con microchip a perros, gatos y hurones, y con anilla a las aves. Muchas comunidades lo exigían ya en su propia ley, con plazos y especies propios: la cita de tu comunidad, cuando la hay, es la que manda en el plazo.',
    tipo: 'obligacion',
    periodicidad: 'unica',
    plazo: 'Varía según la comunidad',
    quienLoExige: 'Estado y comunidad autónoma',
    exigeNormaTerritorial: false,
    orden: 5,
  },
  {
    clave: 'censo_municipal',
    tema: 'identificacion',
    titulo: 'Inscribir a tu animal en el censo municipal',
    descripcionCorta:
      'Tu comunidad obliga a inscribirlo en el censo de tu ayuntamiento.',
    explicacion:
      'El censo lo lleva tu ayuntamiento, pero quien obliga a inscribirse es la ley de tu comunidad. El plazo concreto figura en la cita.',
    tipo: 'tramite',
    periodicidad: 'unica',
    plazo: 'Varía según la comunidad',
    quienLoExige: 'Ayuntamiento',
    // Sin norma territorial no se puede afirmar nada, ni siquiera no_aplica.
    exigeNormaTerritorial: true,
    orden: 6,
  },
];

/**
 * Id estable de una regla: el mismo en cada ejecucion, para que el diff de
 * autonomico.json solo muestre cambios reales. Formato UUID sobre md5.
 */
function idRegla(identificador, requisito, clave = '') {
  const h = createHash('md5')
    .update(identificador + requisito + clave, 'utf8')
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Leyes de las que se extrae. La primera de cada comunidad es su ley general
 * de proteccion animal; Cataluña tiene ademas una ley propia de perros
 * potencialmente peligrosos. La Rioja solo tiene una ley derogada (D32);
 * Ceuta y Melilla no tienen ley (D34). Estado y fechas salen de /metadatos del
 * BOE, no de aqui.
 */
const LEYES = [
  ['01', 'Andalucía', 'BOE-A-2003-23292', 'de Andalucía'],
  ['02', 'Aragón', 'BOE-A-2003-8225', 'de Aragón'],
  [
    '03',
    'Principado de Asturias',
    'BOE-A-2003-2102',
    'del Principado de Asturias',
  ],
  ['04', 'Illes Balears', 'BOE-A-1992-14038', 'de las Illes Balears'],
  ['05', 'Canarias', 'BOE-A-1991-16425', 'de Canarias'],
  // El propio titulo ya lleva el territorio: "Ley de Cantabria 3/1992".
  ['06', 'Cantabria', 'BOE-A-1992-11685', ''],
  ['07', 'Castilla y León', 'BOE-A-1997-14412', 'de Castilla y León'],
  ['08', 'Castilla-La Mancha', 'BOE-A-2020-13916', 'de Castilla-La Mancha'],
  ['09', 'Cataluña', 'DOGC-f-2008-90016', 'de Cataluña'],
  [
    '09',
    'Cataluña',
    'BOE-A-1999-18004',
    'de Cataluña',
    'ley-perros-peligrosos-cataluna',
  ],
  [
    '10',
    'Comunitat Valenciana',
    'BOE-A-2023-7421',
    'de la Comunitat Valenciana',
  ],
  ['11', 'Extremadura', 'BOE-A-2002-16784', 'de Extremadura'],
  ['12', 'Galicia', 'BOE-A-2017-12357', 'de Galicia'],
  [
    '13',
    'Comunidad de Madrid',
    'BOE-A-2016-11097',
    'de la Comunidad de Madrid',
  ],
  ['14', 'Región de Murcia', 'BOE-A-2017-15288', 'de la Región de Murcia'],
  ['15', 'Comunidad Foral de Navarra', 'BOE-A-2019-6779', 'de Navarra'],
  ['16', 'País Vasco', 'BOE-A-2022-14086', 'del País Vasco'],
  ['17', 'La Rioja', 'BOE-A-2018-17064', 'de La Rioja'],
].map(([ine, comunidad, identificador, de, slug]) => ({
  ine,
  comunidad,
  identificador,
  de,
  slug: slug ?? `ley-animales-${slugDe(comunidad)}`,
}));

/**
 * Ley de perros de asistencia de cada comunidad. El RD 409/2025 deja a cada
 * una el procedimiento de reconocimiento (art. 6.1), asi que la guia «Mi
 * perro es de asistencia» enlaza la de la tuya. Solo se cargan sus metadatos:
 * no fundamentan reglas. Extremadura no tiene ley propia: el acceso con
 * perro de asistencia lo reconoce su ley de accesibilidad universal.
 */
const ASISTENCIA = [
  ['01', 'Andalucía', 'BOE-A-2022-759', 'de Andalucía'],
  ['02', 'Aragón', 'BOE-A-2023-10879', 'de Aragón'],
  [
    '03',
    'Principado de Asturias',
    'BOE-A-2021-430',
    'del Principado de Asturias',
  ],
  ['04', 'Illes Balears', 'BOE-A-2014-3754', 'de las Illes Balears'],
  ['05', 'Canarias', 'BOE-A-2017-7821', 'de Canarias'],
  ['06', 'Cantabria', 'BOE-A-2017-9487', 'de Cantabria'],
  ['07', 'Castilla y León', 'BOE-A-2019-6613', 'de Castilla y León'],
  ['08', 'Castilla-La Mancha', 'BOE-A-2019-1695', 'de Castilla-La Mancha'],
  ['09', 'Cataluña', 'BOE-A-2009-20771', 'de Cataluña'],
  [
    '10',
    'Comunitat Valenciana',
    'BOE-A-2026-992',
    'de la Comunitat Valenciana',
  ],
  ['11', 'Extremadura', 'BOE-A-2014-13629', 'de Extremadura'],
  ['12', 'Galicia', 'BOE-A-2004-1675', 'de Galicia'],
  ['13', 'Comunidad de Madrid', 'BOE-A-2015-6129', 'de la Comunidad de Madrid'],
  ['14', 'Región de Murcia', 'BOE-A-2015-3276', 'de la Región de Murcia'],
  ['15', 'Comunidad Foral de Navarra', 'BOE-A-2015-2339', 'de Navarra'],
  ['16', 'País Vasco', 'BOE-A-2011-16753', 'del País Vasco'],
  ['17', 'La Rioja', 'BOE-A-2017-11508', 'de La Rioja'],
].map(([ine, comunidad, identificador, de]) => ({
  ine,
  comunidad,
  identificador,
  de,
  slug: `ley-perros-asistencia-${slugDe(comunidad)}`,
}));

/** Lo que no dice el BOE de una norma y hay que decir en su ficha. */
const RESUMENES = {
  // /analisis del BOE: "SE DEROGA, por Ley 10/2023, de 7 de agosto" (BOE-A-2023-18413).
  'BOE-A-2018-17064':
    'Derogada por la Ley 10/2023, de 7 de agosto, cuyo artículo único la deroga sin sustituirla. La Rioja no tiene hoy ley autonómica de protección animal: rige el marco estatal.',
  'BOE-A-2014-13629':
    'Extremadura no tiene ley propia de perros de asistencia. Esta ley de accesibilidad reconoce, en su disposición adicional tercera, el derecho de acceso de las personas acompañadas de apoyo animal, que según su anexo incluye a los perros de asistencia.',
};

/**
 * Seleccion humana de reglas. `localizador` marca la frase exacta que se
 * cita; el script la extrae del texto oficial, no se transcribe aqui.
 *
 * `ley` elige otra ley de la comunidad que no sea la general.
 *
 * `nota` explica por que se ha elegido ese estado cuando no es evidente, o da
 * el plazo cuando la cita lo dice de forma dificil de leer.
 *
 * `especies` limita la regla a las que el articulo nombra. Sin ella la regla
 * se aplicaria a cualquier animal, y a un pez le saldria obligatorio un
 * microchip que la ley solo exige a perros, gatos y hurones.
 *
 * `siguientes` anade a la cita las frases posteriores a la del localizador
 * dentro del mismo parrafo; `parrafos`, los parrafos siguientes enteros.
 * Hacen falta cuando la obligacion no se entiende sin ellos.
 *
 * `tambien` cita otro articulo de la misma ley que completa la obligacion.
 *
 * Madrid no tiene reglas propias: la Ley 7/2024 suprimio el seguro y remitio
 * la identificacion a la Ley 7/2023 (D54). La Comunitat Valenciana, Galicia,
 * Madrid, Murcia, Navarra y el Pais Vasco no imponen un censo municipal
 * aparte del registro autonomico de identificacion.
 */
const SELECCION = [
  {
    ine: '01',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato'],
    articulo: 'Artículo 17',
    localizador: /Los perros y gatos, así como otros animales/,
    estado: 'obligatorio',
    nota: 'La remisión reglamentaria solo alcanza a «otros animales»: para perros y gatos el deber es directo, con plazo de tres meses desde el nacimiento.',
  },
  {
    ine: '01',
    requisito: 'censo_municipal',
    especies: ['perro', 'gato'],
    articulo: 'Artículo 18',
    localizador:
      /Los propietarios de perros y gatos, así como otros animales que se determinen reglamentariamente, deberán inscribirlos/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o un mes desde la adquisición o el cambio de residencia. La remisión reglamentaria solo alcanza a «otros animales».',
  },
  {
    ine: '02',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 16',
    localizador:
      /Los poseedores y, en su caso, los propietarios de perros deberán distinguirlos e identificarlos/,
    estado: 'obligatorio',
    nota: 'El reglamento fija el procedimiento de identificación, no si hay que identificar al perro, que es un deber directo.',
  },
  {
    ine: '02',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 15',
    localizador: /Los poseedores de perros que lo sean por cualquier título/,
    estado: 'obligatorio',
    nota: 'Deber directo de censar en el ayuntamiento, con plazo de tres meses. Las remisiones del artículo afectan al contenido del censo, no al deber.',
  },
  {
    ine: '03',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato'],
    articulo: 'Artículo 12',
    localizador: /Los perros y gatos deberán ser identificados individualmente/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'La remisión regula las condiciones del microchip, no la existencia del deber, que además se refuerza con «en todo caso».',
  },
  {
    ine: '03',
    requisito: 'censo_municipal',
    especies: ['perro', 'gato'],
    articulo: 'Artículo 12',
    localizador: /Los perros y gatos deberán ser censados en el Concejo/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o quince días desde la adquisición.',
  },
  {
    ine: '04',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 14',
    // La frase de la identificacion no dice de que animal habla: lo dice la
    // del censo, que es el parrafo anterior.
    localizador:
      /Los poseedores de perros, que lo sean por cualquier título, deberán censarlos/,
    parrafos: 1,
    estado: 'obligatorio',
    nota: 'La ley balear exige que el perro lleve de forma permanente su identificación censal; el microchip lo exige además la Ley 7/2023.',
  },
  {
    ine: '04',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 14',
    localizador:
      /Los poseedores de perros, que lo sean por cualquier título, deberán censarlos/,
    estado: 'obligatorio',
    nota: 'Plazo: seis meses desde el nacimiento.',
  },
  {
    ine: '05',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 11',
    localizador:
      /Los propietarios de perros deberán identificarlos como reglamentariamente se establezca/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'El reglamento fija cómo se identifica, no si hay que hacerlo. Plazo: tres meses desde el nacimiento o un mes desde la adquisición.',
  },
  {
    ine: '05',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 11',
    localizador:
      /Los propietarios de perros deberán identificarlos como reglamentariamente se establezca/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o un mes desde la adquisición.',
  },
  {
    ine: '06',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 10',
    localizador:
      /Los poseedores de perros, que lo sean por cualquier título, deberán censarlos/,
    estado: 'obligatorio',
    nota: 'La ley cántabra exige que el perro lleve de forma permanente su identificación censal; el microchip lo exige además la Ley 7/2023.',
  },
  {
    ine: '06',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 10',
    localizador:
      /Los poseedores de perros, que lo sean por cualquier título, deberán censarlos/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o un mes desde la adquisición.',
  },
  {
    ine: '07',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 9',
    localizador:
      /Los propietarios o poseedores de perros deberán censarlos en el Ayuntamiento/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'La identificación censal puede hacerse con tatuaje o con microchip (artículo 9.2); el microchip lo exige además la Ley 7/2023.',
  },
  {
    ine: '07',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 9',
    localizador:
      /Los propietarios o poseedores de perros deberán censarlos en el Ayuntamiento/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o la adquisición.',
  },
  {
    ine: '08',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 14',
    localizador:
      /Los perros, gatos y hurones deberán ser identificados individualmente/,
    estado: 'obligatorio',
    tambien: [
      {
        articulo: 'Artículo 15',
        localizador:
          /La identificación de los perros, gatos y hurones se realizará antes de los tres meses de edad/,
      },
    ],
  },
  {
    ine: '08',
    requisito: 'censo_municipal',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 4',
    localizador:
      /Identificar al animal e inscribirle en los registros y censos/,
    estado: 'obligatorio',
    nota: 'El deber alcanza a los censos «que en cada caso correspondan». Se aplica a las especies de identificación obligatoria en la misma ley (artículo 14): perros, gatos y hurones.',
  },
  {
    ine: '09',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 15',
    localizador: /Los perros, los gatos y los hurones deben ser identificados/,
    estado: 'obligatorio',
  },
  {
    ine: '09',
    requisito: 'censo_municipal',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 14',
    // El apartado 3 es el deber del poseedor; el 2 es el del ayuntamiento.
    localizador:
      /La persona propietaria o poseedora de un perro, un gato o un hurón tiene un plazo de tres meses/,
    estado: 'obligatorio',
  },
  {
    ine: '10',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron', 'ave'],
    articulo: 'Artículo 10',
    localizador: /Están obligatoriamente sujetos a identificación/,
    estado: 'obligatorio',
    nota: 'Perros, gatos, hurones y aves quedan sujetos directamente (el apartado se reformó en 2024 para incluir las aves); la remisión solo alcanza a especies adicionales.',
  },
  {
    ine: '10',
    requisito: 'censo_municipal',
    especies: ['perro', 'gato', 'huron', 'ave'],
    articulo: 'Artículo 14',
    localizador:
      /tendrá carácter censal a los efectos de establecer los censos municipales/,
    estado: 'obligatorio',
    nota: 'No es un trámite aparte: el animal queda en el censo al identificarlo, porque el registro autonómico en el que se inscribe tiene carácter censal.',
  },
  {
    ine: '11',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 17',
    localizador:
      /Los poseedores de perros que lo sean por cualquier título, deberán identificarlos electrónicamente/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'La remisión reglamentaria fija la modalidad de la identificación electrónica, no el deber. Plazo: tres meses desde el nacimiento o un mes desde la adquisición.',
  },
  {
    ine: '11',
    requisito: 'censo_municipal',
    especies: ['perro'],
    articulo: 'Artículo 17',
    localizador:
      /Los poseedores de perros que lo sean por cualquier título, deberán identificarlos electrónicamente/,
    estado: 'obligatorio',
    nota: 'Plazo: tres meses desde el nacimiento o un mes desde la adquisición.',
  },
  {
    ine: '12',
    requisito: 'identificacion_animales',
    especies: ['perro'],
    articulo: 'Artículo 12',
    // La frase del plazo no dice a que animales se refiere: lo dice la
    // anterior. Se citan las dos para no sacar el deber de contexto.
    localizador:
      /la identificación de los animales de la especie canina es obligatoria sin excepción/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'La ley gallega la exige sin excepción a los perros y declara voluntaria la del resto de especies, salvo las potencialmente peligrosas. A gatos, hurones y aves los obliga en todo caso la Ley 7/2023.',
  },
  {
    ine: '14',
    requisito: 'seguro_rc_perros',
    especies: ['perro'],
    articulo: 'Artículo 4',
    localizador:
      /Contratar un seguro de responsabilidad civil en aquellos casos/,
    estado: 'obligatorio_pendiente_reglamento',
    nota: 'Remite a reglamento para determinar los casos, y ese reglamento no se ha publicado.',
  },
  {
    ine: '14',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 14',
    localizador:
      /En el caso de perros, gatos y hurones la identificación se llevará a cabo/,
    estado: 'obligatorio',
    nota: 'El artículo 14.2 fija el microchip para perros, gatos y hurones, y el 4.2.b obliga al propietario a tener identificado a su animal.',
    tambien: [
      {
        articulo: 'Artículo 4',
        localizador: /Tener debidamente identificado su animal/,
      },
    ],
  },
  {
    ine: '15',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 8',
    localizador: /Es obligatoria la identificación de perros, gatos y hurones/,
    estado: 'obligatorio',
    nota: 'Plazo: antes de los tres meses de edad; en gatos y hurones puede esperar a la primera vacuna antirrábica (Decreto Foral 94/2022, artículo 6.1.a).',
  },
  {
    ine: '16',
    requisito: 'seguro_rc_perros',
    especies: ['perro'],
    articulo: 'Artículo 4',
    localizador:
      /Contratar un seguro de responsabilidad civil para la tenencia de perros/,
    estado: 'obligatorio',
    nota: 'Para perros el deber es directo; la remisión solo alcanza a «aquellas especies que se determine reglamentariamente».',
  },
  {
    ine: '16',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 9',
    localizador:
      /Serán objeto de identificación individual obligatoria los perros, hurones, gatos/,
    siguientes: 1,
    estado: 'obligatorio',
    nota: 'Plazo: dos meses desde el nacimiento y siempre antes de cualquier transmisión. Para los gatos y hurones nacidos antes de la ley se prevé un periodo de carencia; la Ley 7/2023 los obliga en todo caso.',
  },
];

/**
 * Articulos que no fundamentan una regla del motor pero que la web cita: el
 * cuadro de multas de cada ley, las razas de perro potencialmente peligroso
 * que añade y otras obligaciones propias que conviene conocer.
 *
 * `grupo`: 'sanciones', 'ppp' o 'obligacion'. `clave` agrupa las del mismo
 * tipo entre comunidades y es la que se traduce en la web.
 */
const REFERENCIAS = [
  // --- Cuadro de multas -------------------------------------------------------
  {
    ine: '01',
    grupo: 'sanciones',
    articulo: 'Artículo 41',
    localizador:
      /Las infracciones indicadas en el artículo anterior serán sancionadas con multas de/,
    parrafos: 3,
  },
  {
    ine: '02',
    grupo: 'sanciones',
    articulo: 'Artículo 71',
    localizador:
      /Las infracciones administrativas tipificadas en la presente Ley se sancionarán con la siguiente escala/,
    parrafos: 3,
  },
  {
    ine: '03',
    grupo: 'sanciones',
    articulo: 'Artículo 44',
    localizador:
      /Las infracciones tipificadas en la sección anterior serán sancionadas con multas de/,
    parrafos: 3,
  },
  {
    ine: '04',
    grupo: 'sanciones',
    articulo: 'Artículo 48',
    localizador:
      /Las infracciones leves serán sancionadas con multa de 10\.000/,
  },
  {
    ine: '05',
    grupo: 'sanciones',
    articulo: 'Artículo 26',
    localizador:
      /Las infracciones leves serán sancionadas con multas de 5\.000/,
  },
  {
    ine: '06',
    grupo: 'sanciones',
    articulo: 'Artículo 39',
    localizador:
      /Las referidas infracciones serán sancionadas con las siguientes multas/,
    parrafos: 3,
  },
  {
    ine: '07',
    grupo: 'sanciones',
    articulo: 'Artículo 29',
    localizador:
      /Las infracciones tipificadas en el artículo anterior serán sancionadas con multas de/,
    parrafos: 3,
  },
  {
    ine: '08',
    grupo: 'sanciones',
    articulo: 'Artículo 44',
    localizador:
      /Las infracciones serán sancionadas con multas de 300 a 60\.000/,
    parrafos: 3,
  },
  // Cataluña: la Ley 11/2026 reescribio el articulo 46 y el consolidado del
  // BOE todavia no lo recoge. La cuantia vigente se cita de la propia Ley
  // 11/2026, en src/datos/externas.json (SIN_CONSOLIDAR, mas abajo).
  {
    ine: '10',
    grupo: 'sanciones',
    articulo: 'Artículo 43',
    localizador: /podrán imponerse las sanciones pecuniarias siguientes/,
    parrafos: 3,
  },
  {
    ine: '11',
    grupo: 'sanciones',
    articulo: 'Artículo 33',
    localizador:
      /A las infracciones a que se refiere la presente Ley, le serán de aplicación las siguientes sanciones/,
    parrafos: 3,
  },
  {
    ine: '12',
    grupo: 'sanciones',
    articulo: 'Artículo 41',
    localizador:
      /Las infracciones administrativas tipificadas en el capítulo anterior serán objeto de las sanciones siguientes/,
    parrafos: 3,
  },
  {
    ine: '13',
    grupo: 'sanciones',
    articulo: 'Artículo 21',
    localizador:
      /Las sanciones, así como las medidas accesorias aplicables por las infracciones previstas en esta ley/,
  },
  {
    ine: '14',
    grupo: 'sanciones',
    articulo: 'Artículo 40',
    localizador:
      /Las infracciones tipificadas en esta ley serán sancionadas con multas de/,
    parrafos: 3,
  },
  {
    ine: '15',
    grupo: 'sanciones',
    articulo: 'Artículo 27',
    localizador:
      /Las sanciones que se aplicarán por las infracciones previstas en esta ley foral serán/,
    parrafos: 3,
  },
  {
    ine: '16',
    grupo: 'sanciones',
    articulo: 'Artículo 40',
    localizador:
      /Las infracciones de la presente ley serán sancionadas con multas de 100 a 100\.000 euros/,
    parrafos: 3,
  },

  // --- Razas de perro potencialmente peligroso añadidas por ley --------------
  {
    ine: '09',
    ley: 'BOE-A-1999-18004',
    grupo: 'ppp',
    clave: 'razas',
    articulo: 'Artículo 1',
    localizador: /Perros que pertenecen a una de las siguientes razas/,
  },
  {
    ine: '09',
    ley: 'BOE-A-1999-18004',
    grupo: 'ppp',
    clave: 'seguro',
    articulo: 'Artículo 3',
    localizador:
      /los propietarios de perros potencialmente peligrosos han de contratar una póliza/,
  },
  {
    ine: '11',
    grupo: 'ppp',
    clave: 'razas',
    articulo: 'Disposición adicional quinta',
    localizador:
      /Perros que pertenecen a una de las siguientes razas o a sus cruces/,
  },
  {
    ine: '12',
    grupo: 'ppp',
    clave: 'razas',
    articulo: 'Artículo 16',
    localizador:
      /Perros que por sus características raciales pudiesen ser aptos para el adiestramiento/,
    parrafos: 1,
  },

  // --- Otras obligaciones propias ---------------------------------------------
  {
    ine: '01',
    grupo: 'obligacion',
    clave: 'vacunacion',
    articulo: 'Artículo 8',
    localizador:
      /La vacunación antirrábica será obligatoria para todos los perros y gatos/,
  },
  {
    ine: '05',
    grupo: 'obligacion',
    clave: 'vacunacion',
    articulo: 'Artículo 11',
    localizador: /Los perros deberán ser vacunados con carácter obligatorio/,
  },
  {
    ine: '15',
    grupo: 'obligacion',
    clave: 'vacunacion',
    articulo: 'Artículo 10',
    localizador:
      /En el caso de perros y gatos, cuya vacunación antirrábica es obligatoria/,
  },
  {
    ine: '15',
    grupo: 'obligacion',
    clave: 'esterilizacion',
    articulo: 'Artículo 6',
    localizador:
      /Los perros y los gatos que puedan tener contacto no controlado con otros perros o gatos deberán estar esterilizados/,
  },
  {
    ine: '10',
    grupo: 'obligacion',
    clave: 'esterilizacion',
    articulo: 'Artículo 6',
    localizador:
      /Obligación de esterilizar a los animales de las especies canina y felina/,
  },
  {
    ine: '16',
    grupo: 'obligacion',
    clave: 'esterilizacion',
    articulo: 'Artículo 4',
    localizador: /la esterilización será obligatoria en la transmisión/,
    siguientes: 1,
  },
  {
    ine: '09',
    grupo: 'obligacion',
    clave: 'esterilizacion',
    articulo: 'Artículo 11',
    localizador:
      /Los animales de compañía que son objeto de comercialización o transacción deben ser esterilizados/,
  },
  {
    ine: '13',
    grupo: 'obligacion',
    clave: 'formacion',
    articulo: 'Artículo 6',
    localizador: /Superar la formación en tenencia responsable reglamentada/,
  },
  {
    ine: '13',
    grupo: 'obligacion',
    clave: 'maximoAnimales',
    articulo: 'Artículo 7',
    localizador:
      /Mantener en el mismo domicilio un total superior a 5 animales/,
  },
  {
    ine: '13',
    grupo: 'obligacion',
    clave: 'tiempoSolo',
    articulo: 'Artículo 7',
    localizador:
      /Dejar sin supervisión a cualquier animal de compañía durante más de tres días consecutivos/,
  },
  {
    ine: '16',
    grupo: 'obligacion',
    clave: 'tiempoSolo',
    articulo: 'Artículo 4',
    localizador:
      /Queda prohibido dejar solo a cualquier animal durante 24 horas consecutivas/,
  },
  {
    ine: '10',
    grupo: 'obligacion',
    clave: 'correa',
    articulo: 'Artículo 6',
    localizador:
      /La persona responsable legal o temporal de los animales de la especie canina debe realizar un acompañamiento adecuado/,
  },
  {
    ine: '16',
    grupo: 'obligacion',
    clave: 'correa',
    articulo: 'Artículo 4',
    localizador:
      /En el caso de los animales de la especie canina, en las vías y espacios públicos urbanos/,
  },
  {
    ine: '12',
    grupo: 'obligacion',
    clave: 'correa',
    articulo: 'Artículo 7',
    localizador:
      /En el caso de los perros, a estos deberán llevarlos provistos de correa/,
  },
];

const ENTIDADES = {
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  ntilde: 'ñ',
  Ntilde: 'Ñ',
  uuml: 'ü',
  ccedil: 'ç',
  Ccedil: 'Ç',
  agrave: 'à',
  egrave: 'è',
  ograve: 'ò',
  iexcl: '¡',
  iquest: '¿',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  deg: '°',
  ordm: 'º',
  ordf: 'ª',
  euro: '€',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lt: '<',
  gt: '>',
};

const decodificar = (t) =>
  t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTIDADES[n] ?? m)
    // El BOE separa "Articulo" del numero con un espacio duro (U+00A0).
    // Sin normalizarlo, comparar titulos falla de una forma dificil de ver:
    // las dos cadenas se imprimen igual y miden lo mismo.
    .replace(/\u00a0/g, ' ');

function slugDe(t) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function leerCampo(xml, nombre) {
  const m = new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`).exec(xml);
  return m ? decodificar(m[1].trim()) : null;
}

/**
 * Devuelve los parrafos de la version vigente de un articulo y el id de su
 * bloque, que es tambien el ancla del articulo en la pagina del BOE
 * (act.php?id=...#a2-8).
 *
 * Solo la ultima version: el bloque guarda tambien el texto anterior a cada
 * reforma, y buscar en todo el bloque encontraba frases ya suprimidas (el
 * seguro de Madrid siguio "citandose" despues de que la Ley 7/2024 lo quitara).
 */
function parrafosDe(xml, numeroArticulo) {
  const buscado = numeroArticulo.replace(/\.$/, '');
  for (const [, atributos, cuerpo] of xml.matchAll(
    /<bloque([^>]*)>([\s\S]*?)<\/bloque>/g,
  )) {
    if (!/tipo="precepto"/.test(atributos)) continue;
    const titulo = decodificar(/titulo="([^"]*)"/.exec(atributos)?.[1] ?? '');
    if (titulo.replace(/\.$/, '') !== buscado) continue;
    const versiones = [
      ...cuerpo.matchAll(/<version([^>]*)>([\s\S]*?)<\/version>/g),
    ];
    const vigente = versiones.at(-1)?.[2] ?? '';
    return {
      ancla: /\bid="([^"]+)"/.exec(atributos)?.[1] ?? null,
      // Normas que han dado redaccion a este articulo, segun el consolidado.
      normas: new Set(
        versiones
          .map(([, v]) => /id_norma="([^"]+)"/.exec(v)?.[1])
          .filter(Boolean),
      ),
      parrafos: [...vigente.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
        .map(([, p]) => decodificar(p.replace(/<[^>]+>/g, '')).trim())
        .filter(Boolean),
    };
  }
  return null;
}

/**
 * Reformas que el /analisis del BOE anuncia para un articulo y que no
 * aparecen entre sus versiones: el consolidado aun no las ha incorporado y el
 * texto que citariamos ya no es el vigente. Paso con Cataluña: la Ley 11/2026
 * cambio las multas del articulo 46 y el consolidado seguia con las de 2020.
 *
 * Solo se reconocen las reformas que dicen que articulos tocan ("los arts. 46
 * y 48", "los arts. 4 a 7"); las de "determinados preceptos" no se pueden
 * atribuir a un articulo.
 */
function reformasSinConsolidar(analisis, numeroArticulo, normasDelArticulo) {
  const numero = /^Artículo (\d+)/.exec(numeroArticulo)?.[1];
  if (!numero) return [];
  const posteriores =
    analisis.split('<posteriores>')[1]?.split('</posteriores>')[0] ?? '';
  const pendientes = [];
  for (const [, p] of posteriores.matchAll(
    /<posterior>([\s\S]*?)<\/posterior>/g,
  )) {
    const id = /<id_norma>([^<]+)<\/id_norma>/.exec(p)?.[1];
    const relacion = /<relacion[^>]*>([^<]+)<\/relacion>/.exec(p)?.[1] ?? '';
    const texto = decodificar(/<texto>([\s\S]*?)<\/texto>/.exec(p)?.[1] ?? '');
    if (!id || normasDelArticulo.has(id)) continue;
    if (!/MODIFICA|SUPRIME|DEROGA/.test(relacion)) continue;
    // Solo la parte de articulos: antes de "por Ley..." y de disposiciones.
    const tramo = texto.split(/,? por /)[0].split(/disposici|anexo/i)[0];
    if (!/\barts?\./.test(tramo)) continue;
    const numeros = new Set();
    // "4.16" es el apartado 16 del articulo 4: el apartado no es un articulo.
    for (const [, desde, hasta] of tramo.matchAll(
      /(\d+)(?:\.\d+|\.?[a-z]\))*(?:\s+a\s+(\d+))?/g,
    )) {
      for (let n = Number(desde); n <= Number(hasta ?? desde); n++)
        numeros.add(String(n));
    }
    if (numeros.has(numero)) pendientes.push(`${relacion} ${texto} (${id})`);
  }
  return pendientes;
}

/** "20031219" -> "2003-12-19" */
const fechaIso = (f) =>
  f ? `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}` : null;

/** Condicion del motor que limita la regla a las especies del articulo. */
function condicionEspecies(especies) {
  if (!especies?.length)
    throw new Error('Cada regla tiene que decir a que especies se aplica.');
  return especies.length === 1
    ? { campo: 'especie', op: 'eq', valor: especies[0] }
    : { campo: 'especie', op: 'in', valor: especies };
}

/**
 * Frase completa que contiene el localizador, extraida del texto oficial,
 * con su posicion en el articulo para poder ordenar varias citas del mismo.
 */
function citaLiteral(parrafos, { localizador, siguientes = 0, parrafos: mas }) {
  for (const [i, p] of parrafos.entries()) {
    const m = localizador.exec(p);
    if (!m) continue;

    // Fin de frase: un punto seguido de espacio o del final del parrafo. El
    // punto de los miles ("10.000", "1.905") no corta.
    const esFin = (j) =>
      p[j] === '.' && (j + 1 >= p.length || /\s/.test(p[j + 1]));
    let inicio = m.index;
    while (inicio > 0 && !/[.;]\s/.test(p.slice(inicio - 2, inicio))) inicio--;
    let fin = m.index;
    while (fin < p.length && !esFin(fin)) fin++;
    for (let n = 0; n < siguientes; n++) {
      fin++;
      while (fin < p.length && !esFin(fin)) fin++;
    }

    const limpio = (t) => t.trim().replace(/\s+/g, ' ');
    let cita = limpio(p.slice(inicio, fin + 1));

    // En texto legal es corriente que el precepto termine en dos puntos y la
    // enumeracion venga en parrafos aparte. Citar solo hasta los dos puntos
    // deja la obligacion a medias, asi que se anaden los parrafos pedidos o,
    // si no se pide ninguno, la primera letra de la lista, que es la que
    // concreta el deber.
    const extra = mas ?? (cita.endsWith(':') ? 1 : 0);
    for (let n = 1; n <= extra; n++) {
      if (!parrafos[i + n]) throw new Error('Faltan parrafos tras la cita.');
      cita = `${cita} ${limpio(parrafos[i + n])}`;
    }

    return { cita, posicion: [i, inicio] };
  }
  return null;
}

/** Une varias citas del mismo articulo en su orden de texto, sin repetirlas. */
function unirCitas(citas) {
  const ordenadas = [...citas].sort(
    (a, b) => a.posicion[0] - b.posicion[0] || a.posicion[1] - b.posicion[1],
  );
  const unicas = ordenadas.filter(
    (c, i) =>
      !ordenadas.some(
        (otra, j) =>
          j !== i &&
          otra.cita.includes(c.cita) &&
          (otra.cita !== c.cita || j < i),
      ),
  );
  return unicas.map((c) => c.cita).join(' […] ');
}

const leyPorIdentificador = new Map(LEYES.map((l) => [l.identificador, l]));
const leyGeneral = (ine) => LEYES.find((l) => l.ine === ine);

async function main() {
  const escribir = process.argv.includes('--escribir');
  const cache = new Map();
  const leer = async (identificador) => {
    if (!cache.has(identificador)) {
      cache.set(identificador, {
        texto: await readFile(join(CACHE, `${identificador}.xml`), 'utf8'),
        meta: await readFile(join(CACHE, `${identificador}-meta.xml`), 'utf8'),
        analisis: await readFile(
          join(CACHE, `${identificador}-analisis.xml`),
          'utf8',
        ).catch(() => {
          throw new Error(
            `Falta el analisis de ${identificador}: ejecuta pnpm datos:extraer.`,
          );
        }),
      });
    }
    return cache.get(identificador);
  };

  /** Resuelve articulo y cita de una entrada de SELECCION o REFERENCIAS. */
  const citas = new Map();
  async function citar(entrada) {
    const ley = entrada.ley
      ? leyPorIdentificador.get(entrada.ley)
      : leyGeneral(entrada.ine);
    if (!ley || ley.ine !== entrada.ine)
      throw new Error(`${entrada.ine}: ley desconocida ${entrada.ley ?? ''}`);
    const { texto, meta, analisis } = await leer(ley.identificador);
    if (leerCampo(meta, 'estatus_derogacion') === 'S')
      throw new Error(`${ley.comunidad}: no se cita una ley derogada.`);
    const articulo = parrafosDe(texto, entrada.articulo);
    if (!articulo) {
      throw new Error(
        `${ley.comunidad}: no existe ${entrada.articulo} en ${ley.identificador}`,
      );
    }
    const pendientes = reformasSinConsolidar(
      analisis,
      entrada.articulo,
      articulo.normas,
    );
    if (pendientes.length > 0) {
      throw new Error(
        `${ley.comunidad} ${entrada.articulo}: el BOE anuncia una reforma que su consolidado aun no incorpora: ${pendientes.join('; ')}. ` +
          'Cita la nueva redaccion desde la norma que reforma (src/datos/externas.json).',
      );
    }
    const encontrada = citaLiteral(articulo.parrafos, entrada);
    if (!encontrada) {
      throw new Error(
        `${ley.comunidad} ${entrada.articulo}: el localizador ${entrada.localizador} ya no encuentra su frase. ` +
          'La norma puede haber cambiado: revisa antes de seguir.',
      );
    }
    const url = `https://www.boe.es/buscar/act.php?id=${ley.identificador}`;
    const id = `${ley.slug}#${entrada.articulo}`;
    if (!citas.has(id)) {
      citas.set(id, {
        id,
        norma: ley.slug,
        referencia: entrada.articulo,
        urlAncla: articulo.ancla ? `${url}#${articulo.ancla}` : url,
        epigrafes: [],
        citas: [],
      });
    }
    citas.get(id).citas.push(encontrada);
    return { ley, articulo: id, cita: encontrada.cita };
  }

  const reglas = [];
  for (const s of SELECCION) {
    const principal = await citar(s);
    const extra = [];
    for (const t of s.tambien ?? []) {
      extra.push(await citar({ ...t, ine: s.ine, ley: s.ley }));
    }
    reglas.push({ ...s, ...principal, extra });
  }

  const referencias = [];
  for (const r of REFERENCIAS) {
    const resuelta = await citar(r);
    referencias.push({ ...r, ...resuelta });
  }

  if (!escribir) {
    console.log(
      `${reglas.length} reglas y ${referencias.length} referencias curadas\n`,
    );
    for (const r of reglas) {
      console.log(
        `[${r.estado === 'obligatorio' ? 'OBL ' : 'PEND'}] ${r.ley.comunidad} · ${r.requisito} · ${r.articulo}`,
      );
      console.log(`         "${r.cita}"`);
      for (const e of r.extra) console.log(`         + "${e.cita}"`);
      if (r.nota) console.log(`         nota: ${r.nota}`);
    }
    console.log('');
    for (const r of referencias) {
      console.log(
        `[${r.grupo.toUpperCase()}] ${r.ley.comunidad} · ${r.clave ?? ''} · ${r.articulo}`,
      );
      console.log(`         "${r.cita}"`);
    }
    console.log('\nTodas las citas se han extraido del texto oficial.');
    return;
  }

  const normas = [];
  for (const ley of [...LEYES, ...ASISTENCIA]) {
    const { meta } = await leer(ley.identificador).catch(async () => ({
      meta: await readFile(
        join(CACHE, `${ley.identificador}-meta.xml`),
        'utf8',
      ),
    }));
    const tituloNorma = leerCampo(meta, 'titulo');
    const base = tituloNorma.split(',')[0];
    normas.push({
      slug: ley.slug,
      ambito: 'autonomico',
      comunidad: ley.ine,
      // El Decreto Legislativo 2/2008 de Cataluña es un texto refundido: rango
      // de ley.
      tipo: 'ley',
      numero: leerCampo(meta, 'numero_oficial'),
      anio: Number(leerCampo(meta, 'fecha_disposicion')?.slice(0, 4)) || null,
      titulo: tituloNorma,
      // "Ley 11/2003, de 24 de noviembre, ..." -> "Ley 11/2003 de Andalucia".
      // Hace falta el territorio: Andalucia y Aragon tienen las dos una 11/2003.
      tituloCorto: ley.de ? `${base} ${ley.de}` : base,
      urlOficial: `https://www.boe.es/buscar/act.php?id=${ley.identificador}`,
      identificadorBoletin: ley.identificador,
      fechaPublicacion: fechaIso(leerCampo(meta, 'fecha_publicacion')),
      fechaEntradaVigor: fechaIso(leerCampo(meta, 'fecha_vigencia')),
      estado:
        leerCampo(meta, 'estatus_derogacion') === 'S' ? 'derogada' : 'vigente',
      resumen: RESUMENES[ley.identificador] ?? null,
      verificadaEn: VERIFICADA_EN,
    });
  }
  const vigenciaDe = new Map(normas.map((n) => [n.slug, n.fechaEntradaVigor]));

  for (const r of referencias) {
    if (r.epigrafe) citas.get(r.articulo).epigrafes.push(r.epigrafe);
  }

  const ruta = await escribirDatos('autonomico.json', {
    requisitos: ordenarRequisitos(REQUISITOS),
    normas: ordenarNormas(normas),
    // El articulo guarda las frases citadas: es lo que se ha verificado.
    articulos: ordenarArticulos(
      [...citas.values()].map((a) => ({
        id: a.id,
        norma: a.norma,
        referencia: a.referencia,
        epigrafe: a.epigrafes.length ? a.epigrafes.join(' · ') : null,
        textoLiteral: unirCitas(a.citas),
        urlAncla: a.urlAncla,
      })),
    ),
    reglas: ordenarReglas(
      reglas.map((r) => ({
        id: idRegla(r.ley.identificador, r.requisito, r.clave),
        requisito: r.requisito,
        ambito: 'autonomico',
        comunidad: r.ine,
        provincia: null,
        municipio: null,
        condiciones: condicionEspecies(r.especies),
        estado: r.estado,
        parametros: {},
        vigenteDesde: vigenciaDe.get(r.ley.slug),
        vigenteHasta: null,
        prioridad: 0,
        nota: r.nota ?? null,
        verificadaEn: VERIFICADA_EN,
      })),
    ),
    fuentes: ordenarFuentes(
      reglas.flatMap((r) =>
        [r, ...r.extra].map((f) => ({
          regla: idRegla(r.ley.identificador, r.requisito, r.clave),
          articulo: f.articulo,
          cita: f.cita,
        })),
      ),
    ),
    referencias: referencias.map((r) => ({
      comunidad: r.ine,
      grupo: r.grupo,
      clave: r.clave ?? null,
      articulo: r.articulo,
      cita: r.cita,
    })),
  });
  console.log(
    `Escrito ${ruta}: ${reglas.length} reglas, ${referencias.length} referencias, ${normas.length} normas, ${citas.size} articulos.`,
  );
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
