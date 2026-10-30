/**
 * Extrae el articulado de las leyes autonomicas de proteccion animal desde el
 * texto consolidado del BOE (que incluye normativa autonomica: ambito 2).
 *
 *   pnpm datos:extraer
 *
 *   pnpm datos:extraer                 -> usa lo descargado
 *   pnpm datos:extraer --actualizar    -> vuelve a descargar del BOE
 *
 * Escribe docs/VERIFICACION-02-autonomico.md, la ficha de trabajo con los
 * articulos de cada ley agrupados por tema. No genera datos: eso lo hace
 * generar-autonomicas.mjs con la seleccion revisada.
 *
 * El texto de los articulos se copia literal, sin reescribir, y siempre de la
 * version vigente de cada articulo.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE as CACHE_COMUN } from './comun.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
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
  // Ley propia de perros potencialmente peligrosos, con su lista de razas.
  ['Cataluña (perros potencialmente peligrosos)', 'BOE-A-1999-18004'],
];

/**
 * Solo metadatos: la ley derogada de La Rioja (D32) y las leyes de perros de
 * asistencia de cada comunidad, que la web enlaza pero no cita.
 */
const SOLO_METADATOS = [
  'BOE-A-2018-17064',
  'BOE-A-2022-759',
  'BOE-A-2023-10879',
  'BOE-A-2021-430',
  'BOE-A-2014-3754',
  'BOE-A-2017-7821',
  'BOE-A-2017-9487',
  'BOE-A-2019-6613',
  'BOE-A-2019-1695',
  'BOE-A-2009-20771',
  'BOE-A-2026-992',
  'BOE-A-2014-13629',
  'BOE-A-2004-1675',
  'BOE-A-2015-6129',
  'BOE-A-2015-3276',
  'BOE-A-2015-2339',
  'BOE-A-2011-16753',
  'BOE-A-2017-11508',
];

const ACTUALIZAR = process.argv.includes('--actualizar');

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
  if (ACTUALIZAR || !existsSync(ruta)) {
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

/**
 * Relaciones de la norma con las posteriores: que reformas se le han hecho.
 * El generador lo usa para detectar reformas que el consolidado aun no
 * incorpora.
 */
async function descargarAnalisis(identificador) {
  const ruta = join(CACHE, `${identificador}-analisis.xml`);
  if (ACTUALIZAR || !existsSync(ruta)) {
    await mkdir(CACHE, { recursive: true });
    execFileSync('curl', [
      '-sSL',
      '-H',
      'Accept: application/xml',
      '-o',
      ruta,
      `${API}/${identificador}/analisis`,
    ]);
  }
}

async function descargarMetadatos(identificador) {
  const ruta = join(CACHE, `${identificador}-meta.xml`);
  if (ACTUALIZAR || !existsSync(ruta)) {
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

/**
 * Extrae los articulos con su texto literal. Cada bloque del consolidado
 * guarda tambien el texto anterior a cada reforma: solo cuenta la ultima
 * version.
 */
function extraerArticulos(xml) {
  const articulos = [];
  for (const [, atributos, cuerpo] of xml.matchAll(
    /<bloque([^>]*)>([\s\S]*?)<\/bloque>/g,
  )) {
    if (!/tipo="precepto"/.test(atributos)) continue;
    const titulo = decodificar(/titulo="([^"]*)"/.exec(atributos)?.[1] ?? '');
    const id = /id="([^"]*)"/.exec(atributos)?.[1] ?? '';

    const vigente =
      [...cuerpo.matchAll(/<version[^>]*>([\s\S]*?)<\/version>/g)].at(
        -1,
      )?.[1] ?? '';
    const parrafos = [...vigente.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
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

  for (const identificador of SOLO_METADATOS) {
    await descargarMetadatos(identificador);
  }

  for (const [comunidad, identificador] of LEYES) {
    process.stdout.write(`  ${comunidad}... `);
    let meta, articulos;
    try {
      [meta, articulos] = await Promise.all([
        descargarMetadatos(identificador),
        descargarTexto(identificador).then(extraerArticulos),
        descargarAnalisis(identificador),
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
    '> Ficha de trabajo. Lo que entra en la web lo decide la selección de',
    '> `scripts/contenido/generar-autonomicas.mjs` (DECISIONES.md, D35). Todas',
    '> las citas son literales de la versión vigente del texto consolidado del',
    '> BOE, obtenidas por su API de datos abiertos.',
    '',
    `Generada el ${new Date().toISOString().slice(0, 10)} por`,
    '`scripts/contenido/extraer-autonomicas.mjs`.',
    '',
    '## Cómo se han localizado estas leyes',
    '',
    'Se recorrió la legislación consolidada del BOE filtrando por ámbito',
    'autonómico y por título. No es una lista escrita de memoria.',
    '',
    '**Ceuta y Melilla no aparecen**: son ciudades autónomas sin potestad',
    'legislativa y regulan por reglamento y ordenanza de la propia ciudad',
    '(DECISIONES.md, D34).',
    '',
    '**La Rioja no tiene ley autonómica**: la Ley 10/2023, de 7 de agosto,',
    'derogó la Ley 6/2018 sin sustituirla (DECISIONES.md, D32).',
    '',
    '**Madrid ya no exige seguro**: la Ley 7/2024, de 26 de diciembre',
    '(`BOE-A-2025-5522`), reescribió el artículo 6 de la Ley 4/2016 y suprimió',
    'la obligación de contratarlo; la identificación y las sanciones remiten',
    'ahora a la Ley 7/2023 (DECISIONES.md, D54).',
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
