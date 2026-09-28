/**
 * Extrae el articulado de las leyes autonomicas de proteccion animal desde el
 * texto consolidado del BOE (que incluye normativa autonomica: ambito 2).
 *
 *   pnpm datos:extraer
 *
 * Escribe docs/VERIFICACION-02-autonomico.md, la ficha para revisar ANTES de
 * que nada entre en la web. No genera datos: eso lo hace
 * generar-autonomicas.mjs solo con lo aprobado.
 *
 * El texto de los articulos se copia literal, sin reescribir.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE as CACHE_COMUN } from './comun.mjs';

const RAIZ = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
);
const CACHE = join(CACHE_COMUN, 'autonomicas');
const SALIDA = join(RAIZ, 'docs', 'VERIFICACION-02-autonomico.md');

const API = 'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id';

/**
 * Ley vigente de proteccion animal de cada comunidad, localizada recorriendo
 * el indice completo de legislacion consolidada del BOE y filtrando por
 * ambito autonomico.
 *
 * Ceuta y Melilla no aparecen: son ciudades autonomas sin potestad
 * legislativa, regulan por ordenanza municipal.
 */
const LEYES = [
  ['Andalucía', 'BOE-A-2003-23292'],
  ['Aragón', 'BOE-A-2003-8225'],
  ['Principado de Asturias', 'BOE-A-2003-2102'],
  ['Illes Balears', 'BOE-A-1992-14038'],
  ['Canarias', 'BOE-A-1991-16425'],
  ['Cantabria', 'BOE-A-1992-11685'],
  ['Castilla-La Mancha', 'BOE-A-2020-13916'],
  ['Castilla y León', 'BOE-A-1997-14412'],
  ['Cataluña', 'DOGC-f-2008-90016'],
  ['Comunitat Valenciana', 'BOE-A-2023-7421'],
  ['Extremadura', 'BOE-A-2002-16784'],
  ['Galicia', 'BOE-A-2017-12357'],
  ['Comunidad de Madrid', 'BOE-A-2016-11097'],
  ['Región de Murcia', 'BOE-A-2017-15288'],
  ['Comunidad Foral de Navarra', 'BOE-A-2019-6779'],
  ['País Vasco', 'BOE-A-2022-14086'],
];

/**
 * Temas que se buscan en el articulado. Se ha elegido cubrir todo lo que
 * regulan estas leyes, no solo lo que ya teniamos cargado.
 */
const TEMAS = [
  [
    'Seguro de responsabilidad civil',
    /seguro|responsabilidad civil|p[oó]liza/i,
  ],
  [
    'Identificación y microchip',
    /microchip|identificaci[oó]n electr[oó]nica|transpondedor|identificar/i,
  ],
  [
    'Censo y registro municipal',
    /censo|registro municipal|inscribir|inscripci[oó]n/i,
  ],
  ['Esterilización', /esteriliza|castraci[oó]n/i],
  ['Perros potencialmente peligrosos', /potencialmente peligros|licencia/i],
  ['Curso o formación', /curso|formaci[oó]n del|acreditar.*conocimient/i],
  ['Núcleo zoológico', /n[uú]cleo zool[oó]gico/i],
  ['Colonias felinas y CES', /colonia|felin|captura.*esteriliza|CES\b/i],
  [
    'Vía pública y excrementos',
    /v[ií]a p[uú]blica|excrement|deyeccion|correa|bozal/i,
  ],
  ['Transporte', /transporte|transportar|veh[ií]culo/i],
  ['Cría y venta', /cr[ií]a|criador|venta|comercializaci[oó]n|tienda/i],
  ['Abandono y sacrificio', /abandon|sacrific|eutanasia/i],
  ['Infracciones y sanciones', /infracci|sanci[oó]n|multa/i],
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
    .replace(/ /g, ' ');

async function descargarTexto(identificador) {
  const ruta = join(CACHE, `${identificador}.xml`);
  if (!existsSync(ruta)) {
    await mkdir(CACHE, { recursive: true });
    execFileSync('curl', [
      '-sSL',
      '-H',
      'Accept: application/xml',
      '-o',
      ruta,
      `${API}/${identificador}/texto`,
    ]);
  }
  return readFile(ruta, 'utf8');
}

async function descargarMetadatos(identificador) {
  const ruta = join(CACHE, `${identificador}-meta.xml`);
  if (!existsSync(ruta)) {
    await mkdir(CACHE, { recursive: true });
    execFileSync('curl', [
      '-sSL',
      '-H',
      'Accept: application/xml',
      '-o',
      ruta,
      `${API}/${identificador}/metadatos`,
    ]);
  }
  const xml = await readFile(ruta, 'utf8');
  const campo = (n) => {
    const m = new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`).exec(xml);
    return m ? decodificar(m[1].trim()) : null;
  };
  return {
    titulo: campo('titulo'),
    fechaPublicacion: campo('fecha_publicacion'),
    fechaVigencia: campo('fecha_vigencia'),
    estatusDerogacion: campo('estatus_derogacion'),
    fechaActualizacion: campo('fecha_actualizacion'),
  };
}

/** Extrae los articulos con su texto literal. */
function extraerArticulos(xml) {
  const articulos = [];
  for (const [, atributos, cuerpo] of xml.matchAll(
    /<bloque([^>]*)>([\s\S]*?)<\/bloque>/g,
  )) {
    if (!/tipo="precepto"/.test(atributos)) continue;
    const titulo = decodificar(/titulo="([^"]*)"/.exec(atributos)?.[1] ?? '');
    const id = /id="([^"]*)"/.exec(atributos)?.[1] ?? '';

    const parrafos = [...cuerpo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map(([, p]) => decodificar(p.replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);

    if (parrafos.length === 0) continue;
    articulos.push({ id, titulo, texto: parrafos.join('\n') });
  }
  return articulos;
}

/**
 * Devuelve el fragmento del articulo donde esta la coincidencia, con contexto
 * alrededor.
 *
 * Mostrar los primeros N caracteres no sirve: en un articulo largo la parte
 * relevante suele estar en mitad del texto, y la ficha se vuelve irrevisable
 * porque no se ve por que se ha incluido ese articulo.
 */
function fragmentoRelevante(texto, patron, contexto = 320) {
  const encaje = patron.exec(texto);
  patron.lastIndex = 0;
  if (!encaje) return texto.slice(0, contexto * 2);

  const posicion = encaje.index;
  let desde = Math.max(0, posicion - contexto);
  let hasta = Math.min(texto.length, posicion + encaje[0].length + contexto);

  // Cuadra el recorte a limites de palabra para no cortar a mitad.
  if (desde > 0) {
    const espacio = texto.indexOf(' ', desde);
    if (espacio > 0 && espacio < posicion) desde = espacio + 1;
  }
  if (hasta < texto.length) {
    const espacio = texto.lastIndexOf(' ', hasta);
    if (espacio > posicion) hasta = espacio;
  }

  return (
    (desde > 0 ? '[…] ' : '') +
    texto.slice(desde, hasta).trim() +
    (hasta < texto.length ? ' […]' : '')
  );
}

async function main() {
  const secciones = [];
  const resumen = [];

  for (const [comunidad, identificador] of LEYES) {
    process.stdout.write(`  ${comunidad}... `);
    let meta, articulos;
    try {
      [meta, articulos] = await Promise.all([
        descargarMetadatos(identificador),
        descargarTexto(identificador).then(extraerArticulos),
      ]);
    } catch (error) {
      console.log('FALLO');
      secciones.push(
        `## ${comunidad}\n\n**No se ha podido verificar.** ${error.message}\n\n` +
          `Estado propuesto: \`sin_datos\` para toda la comunidad.\n`,
      );
      resumen.push([comunidad, identificador, 'NO VERIFICADA', 0, 0]);
      continue;
    }

    const url = `https://www.boe.es/buscar/act.php?id=${identificador}`;
    const porTema = new Map();
    for (const [tema, patron] of TEMAS) {
      const encontrados = articulos.filter(
        (a) => patron.test(a.texto) || patron.test(a.titulo),
      );
      // Se guarda tambien el patron: hace falta para enseñar el fragmento
      // exacto que motivo la inclusion del articulo.
      if (encontrados.length > 0) porTema.set(tema, { patron, encontrados });
    }

    console.log(`${articulos.length} artículos, ${porTema.size} temas`);
    resumen.push([
      comunidad,
      identificador,
      meta.estatusDerogacion && meta.estatusDerogacion !== 'N'
        ? 'DEROGADA'
        : 'vigente',
      articulos.length,
      porTema.size,
    ]);

    const bloques = [
      `## ${comunidad}`,
      '',
      `- **Norma**: ${meta.titulo}`,
      `- **Identificador**: \`${identificador}\``,
      `- **Fuente oficial**: ${url}`,
      `- **Publicación**: ${meta.fechaPublicacion ?? 'no consta'} · **Vigencia**: ${meta.fechaVigencia ?? 'no consta'}`,
      `- **Última actualización del consolidado**: ${meta.fechaActualizacion ?? 'no consta'}`,
      `- **Artículos**: ${articulos.length}`,
      '',
    ];

    for (const [tema, { patron, encontrados }] of porTema) {
      bloques.push(`### ${tema}`, '');
      for (const a of encontrados.slice(0, 6)) {
        bloques.push(
          `**${a.titulo}**`,
          '',
          '> ' + fragmentoRelevante(a.texto, patron).replace(/\n/g, '\n> '),
          '',
        );
      }
      if (encontrados.length > 6) {
        bloques.push(
          `_(y ${encontrados.length - 6} artículos más en este tema)_`,
          '',
        );
      }
    }

    secciones.push(bloques.join('\n'));
  }

  const cabecera = [
    '# Ficha de verificación 02 — normativa autonómica',
    '',
    '> **Pendiente de tu aprobación.** Nada de esto entra en la web',
    '> hasta que lo revises. Todas las citas son literales del texto',
    '> consolidado del BOE, obtenidas por su API de datos abiertos.',
    '',
    `Generada el ${new Date().toISOString().slice(0, 10)} por`,
    '`apps/web/scripts/contenido/extraer-autonomicas.mjs`.',
    '',
    '## Cómo se han localizado estas leyes',
    '',
    'Se descargó el índice completo de legislación consolidada del BOE',
    '(12.387 normas, de las cuales 3.618 son autonómicas) y se filtró por',
    'ámbito autonómico y por título. No es una lista escrita de memoria.',
    '',
    '**Ceuta y Melilla no aparecen** (0 normas suyas en todo el consolidado), y',
    'no es un fallo de búsqueda: son ciudades autónomas **sin potestad',
    'legislativa**, así que no dictan leyes. Regulan por reglamento y ordenanza',
    'de la propia ciudad.',
    '',
    '**Decisión tomada:** no se crean reglas de ámbito autonómico para ellas.',
    'Lo que regulen entra como **ámbito municipal**, que es el que corresponde a',
    'una ordenanza. En la geografía del INE ambas existen a la vez como',
    'comunidad, provincia y municipio (51001 y 52001), así que el motor las',
    'resuelve sin cambios. Entran con la carga de ordenanzas.',
    '',
    '## Atención: La Rioja no tiene ley autonómica',
    '',
    'El brief (§1) daba por vigente la **Ley 6/2018 de La Rioja**. No lo está.',
    '',
    '- La Ley 6/2018 derogó la anterior Ley 5/1995 el 30/11/2018.',
    '- La **Ley 10/2023, de 7 de agosto** derogó a su vez la Ley 6/2018 con',
    '  efectos del 08/08/2023. Es una ley de artículo único: «Queda derogada la',
    '  Ley 6/2018, de 26 de noviembre, de protección de los animales en la',
    '  Comunidad Autónoma de La Rioja». **No la sustituye por otra.**',
    '- Derogar la norma derogatoria no resucita la de 1995.',
    '',
    '**Decisión tomada:** no se carga ninguna regla autonómica para La Rioja, y',
    '*no* se marca la comunidad como `sin_datos` en bloque. `sin_datos`',
    'significa «no lo hemos verificado», y aquí sí lo hemos verificado: no hay',
    'ley. Al no existir regla autonómica ganan las estatales, que es justo lo',
    'que le pasa hoy a alguien de Logroño. En la página de La Rioja se dirá',
    'expresamente que la comunidad derogó su ley.',
    '',
    'Fuente: https://www.boe.es/buscar/act.php?id=BOE-A-2018-17064 y',
    'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18413',
    '',
    '## Atención: el seguro en Madrid no es incondicional',
    '',
    'El brief (§1) afirma que «la Comunidad de Madrid ya exigía seguro de RC',
    'antes de la ley estatal». El texto de la Ley 4/2016 dice, literalmente:',
    '',
    '> a) Contratar un seguro de responsabilidad civil **en aquellos casos que',
    '> se determine reglamentariamente**.',
    '',
    'Es decir, la ley madrileña **remite a un reglamento**, igual que hace la',
    'estatal. Comprobado además:',
    '',
    '- El consolidado del BOE está actualizado a 19/12/2025.',
    '- El artículo 6 fue reformado por la Ley 7/2024, de 26 de diciembre',
    '  (`BOE-A-2025-5522`), en vigor desde el 28/12/2024, y **la remisión al',
    '  reglamento se mantuvo**.',
    '- No consta reglamento publicado que determine esos casos. Lo último',
    '  localizado es una nota de la propia Comunidad de octubre de 2018 diciendo',
    '  que estaba «en fase final de tramitación».',
    '',
    '**Decisión tomada:** `obligatorio_pendiente_reglamento`, el mismo estado',
    'que el estatal. No `obligatorio`, porque diríamos a un madrileño que debe',
    'contratar un seguro que hoy no se le puede exigir; y no `sin_datos`, porque',
    'sí sabemos lo que dice la ley.',
    '',
    'Esto **no afecta a los perros potencialmente peligrosos**: su seguro de',
    '120.000 € sí es exigible hoy por el RD 287/2002, que es norma estatal.',
    '',
    '## Qué necesito de ti',
    '',
    'Por cada comunidad, dime qué obligaciones apruebo cargar y con qué estado.',
    'Mi propuesta por defecto, salvo que me digas otra cosa:',
    '',
    '- Obligación redactada de forma directa y sin remisión → `obligatorio`.',
    '- Obligación que remite a desarrollo reglamentario → ',
    '  `obligatorio_pendiente_reglamento`.',
    '- Tema que la ley no regula → `sin_datos` (nunca `no_aplica`).',
    '',
    '## Resumen',
    '',
    '| Comunidad | Identificador | Estado | Artículos | Temas |',
    '| --- | --- | --- | ---: | ---: |',
    ...resumen.map(
      ([c, i, e, a, t]) => `| ${c} | \`${i}\` | ${e} | ${a} | ${t} |`,
    ),
    '',
    '---',
    '',
  ];

  await writeFile(SALIDA, cabecera.concat(secciones).join('\n'), 'utf8');
  console.log(`\nEscrita ${SALIDA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
