/**
 * Genera la geografia a partir de fuentes oficiales del INE.
 *
 * Fuentes:
 *   1. Comunidades y provincias, con su correspondencia:
 *      https://www.ine.es/daco/daco42/codmun/cod_ccaa_provincia.htm
 *   2. Municipios y sus codigos, por provincia:
 *      https://www.ine.es/daco/daco42/codmun/26codmun.xlsx
 *
 * Contraste: los recuentos se comparan con el dataset comunitario
 * codeforspain/ds-organizacion-administrativa. Ese dataset NO se usa como
 * origen de nombres porque su fichero de comunidades esta doblemente
 * codificado en UTF-8.
 *
 *   pnpm datos:geografia
 *
 * Escribe src/datos/geografia.json y src/datos/municipios.json.
 */
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { CACHE, escribirDatos } from './comun.mjs';

const URL_CCAA_PROVINCIAS =
  'https://www.ine.es/daco/daco42/codmun/cod_ccaa_provincia.htm';
const URL_MUNICIPIOS = 'https://www.ine.es/daco/daco42/codmun/26codmun.xlsx';
const URL_CONTRASTE =
  'https://raw.githubusercontent.com/codeforspain/ds-organizacion-administrativa/master/data/municipios.csv';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

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
  Uuml: 'Ü',
  ccedil: 'ç',
  Ccedil: 'Ç',
  agrave: 'à',
  egrave: 'è',
  igrave: 'ì',
  ograve: 'ò',
  ugrave: 'ù',
  Agrave: 'À',
  Egrave: 'È',
  Ograve: 'Ò',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  lt: '<',
  gt: '>',
};

function decodificarEntidades(texto) {
  return texto
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&([a-z]+);/gi, (coincidencia, nombre) =>
      nombre in ENTIDADES ? ENTIDADES[nombre] : coincidencia,
    );
}

/**
 * El INE escribe los articulos pospuestos: "Mata de los Olmos, La".
 * Para el slug se restituye el orden natural, que es como la gente escribe y
 * busca. El nombre oficial se conserva intacto en la columna nombre.
 */
function ordenNatural(nombre) {
  const m = nombre.match(/^(.*),\s*(El|La|Los|Las|L'|Es|Sa|A|O|As|Os)$/i);
  return m ? `${m[2]} ${m[1]}` : nombre;
}

/**
 * Los nombres oficiales de comunidad y provincia posponen tambien el tipo de entidad:
 * "Madrid, Comunidad de". Para el slug se usa el orden en que se escribe.
 */
function ordenNaturalEntidad(nombre) {
  const m = nombre.match(/^(.+?),\s*(.+)$/);
  return m ? `${m[2]} ${m[1]}` : nombre;
}

function generarSlug(nombre) {
  return ordenNatural(nombre)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[·']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Nombre para mostrar: "Mata de los Olmos, La" -> "La Mata de los Olmos",
 * "Madrid, Comunidad de" -> "Comunidad de Madrid". El oficial se guarda aparte.
 */
function nombreVisible(nombre) {
  const m = /^(.+?),\s*(.+)$/.exec(nombre);
  if (!m) return nombre;
  const [, cuerpo, pospuesto] = m;
  // "L'" se une sin espacio: "Hospitalet de Llobregat, L'" -> "L'Hospitalet..."
  return pospuesto.endsWith("'")
    ? `${pospuesto}${cuerpo}`
    : `${pospuesto} ${cuerpo}`;
}

async function descargar(url, destino, binario = false) {
  const ruta = join(CACHE, destino);
  if (existsSync(ruta)) return ruta;
  await mkdir(CACHE, { recursive: true });
  execFileSync('curl', ['-sSL', '-o', ruta, url], { stdio: 'inherit' });
  if (!binario) return ruta;
  return ruta;
}

// ---------------------------------------------------------------------------
// 1. Comunidades y provincias
// ---------------------------------------------------------------------------

async function leerComunidadesYProvincias() {
  const ruta = await descargar(URL_CCAA_PROVINCIAS, 'cod_ccaa_provincia.htm');
  // La pagina se sirve en ISO-8859-15.
  const html = await readFile(ruta, 'latin1');

  const filas = [...html.matchAll(/<tr>?[\s\S]*?<\/tr>/gi)];
  const comunidades = new Map();
  const provincias = [];

  for (const [fila] of filas) {
    const celdas = [...fila.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      decodificarEntidades(m[1].replace(/<[^>]*>/g, '')).trim(),
    );
    if (celdas.length !== 4) continue;
    const [codAuto, nombreCcaa, cpro, nombreProvincia] = celdas;
    if (!/^\d{2}$/.test(codAuto) || !/^\d{2}$/.test(cpro)) continue;

    if (!comunidades.has(codAuto)) {
      comunidades.set(codAuto, { codigo: codAuto, nombre: nombreCcaa });
    }
    provincias.push({
      codigo: cpro,
      nombre: nombreProvincia,
      comunidad: codAuto,
    });
  }

  return { comunidades: [...comunidades.values()], provincias };
}

// ---------------------------------------------------------------------------
// 2. Municipios, desde el xlsx del INE
// ---------------------------------------------------------------------------

async function leerMunicipios() {
  const ruta = await descargar(URL_MUNICIPIOS, '26codmun.xlsx', true);
  const destino = join(CACHE, 'xlsx');
  execFileSync('unzip', ['-o', '-q', ruta, '-d', destino]);

  const sst = await readFile(join(destino, 'xl', 'sharedStrings.xml'), 'utf8');
  const cadenas = [...sst.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, bloque]) =>
    decodificarEntidades(
      [...bloque.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((m) => m[1])
        .join(''),
    ),
  );

  const libro = await readFile(join(destino, 'xl', 'workbook.xml'), 'utf8');
  const numeroDeHojas = [...libro.matchAll(/<sheet[^>]*name="([^"]+)"/g)]
    .length;

  const municipios = [];
  for (let i = 1; i <= numeroDeHojas; i += 1) {
    const hoja = await readFile(
      join(destino, 'xl', 'worksheets', `sheet${i}.xml`),
      'utf8',
    );

    for (const [, contenidoFila] of hoja.matchAll(
      /<row[^>]*>([\s\S]*?)<\/row>/g,
    )) {
      const celdas = {};
      // Los atributos de <c> vienen en orden variable (r, s, t), asi que se
      // captura el tag entero y se leen por separado.
      for (const [, atributos, cuerpo] of contenidoFila.matchAll(
        /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
      )) {
        const ref = /\br="([A-Z]+)\d+"/.exec(atributos)?.[1];
        if (!ref) continue;
        const tipo = /\bt="([^"]+)"/.exec(atributos)?.[1];
        const valor = cuerpo
          ? /<v>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1]
          : undefined;
        if (valor === undefined) continue;
        celdas[ref] = tipo === 's' ? cadenas[Number(valor)] : valor;
      }

      const cpro = celdas.A;
      const cmun = celdas.B;
      const nombre = celdas.D;
      // Las filas de cabecera no cumplen el formato de codigo.
      if (!/^\d{2}$/.test(cpro ?? '') || !/^\d{3}$/.test(cmun ?? '')) continue;
      if (!nombre) continue;

      municipios.push({ codigo: `${cpro}${cmun}`, nombre, provincia: cpro });
    }
  }

  return municipios;
}

// ---------------------------------------------------------------------------
// 3. Slugs unicos
// ---------------------------------------------------------------------------

/**
 * Los nombres de municipio se repiten entre provincias. El slug es unico en
 * todo el sitio, asi que las colisiones se desambiguan con la provincia, de
 * forma determinista: gana el codigo INE mas bajo.
 */
function asignarSlugs(municipios, provinciaPorCodigo) {
  const porSlug = new Map();
  for (const m of [...municipios].sort((a, b) =>
    a.codigo.localeCompare(b.codigo),
  )) {
    const base = generarSlug(m.nombre);
    const lista = porSlug.get(base) ?? [];
    lista.push(m);
    porSlug.set(base, lista);
  }

  const colisiones = [];
  for (const [base, lista] of porSlug) {
    if (lista.length === 1) {
      lista[0].slug = base;
      continue;
    }
    colisiones.push({ base, cuantos: lista.length });
    for (const m of lista) {
      const provincia = provinciaPorCodigo.get(m.provincia);
      m.slug = `${base}-${generarSlug(ordenNaturalEntidad(provincia.nombre))}`;
    }
  }

  // Segunda pasada: mismo nombre dos veces dentro de la misma provincia.
  const vistos = new Set();
  for (const m of municipios) {
    let candidato = m.slug;
    let n = 2;
    while (vistos.has(candidato)) {
      candidato = `${m.slug}-${n}`;
      n += 1;
    }
    m.slug = candidato;
    vistos.add(candidato);
  }

  return colisiones;
}

// ---------------------------------------------------------------------------

async function main() {
  console.log('Descargando fuentes del INE...\n');

  const { comunidades, provincias } = await leerComunidadesYProvincias();
  const municipios = await leerMunicipios();

  const provinciaPorCodigo = new Map(provincias.map((p) => [p.codigo, p]));
  const colisiones = asignarSlugs(municipios, provinciaPorCodigo);

  // --- Comprobaciones de integridad ---------------------------------------
  const problemas = [];

  if (comunidades.length !== 19) {
    problemas.push(
      `Se esperaban 19 comunidades y ciudades autonomas, hay ${comunidades.length}`,
    );
  }
  if (provincias.length !== 52) {
    problemas.push(`Se esperaban 52 provincias, hay ${provincias.length}`);
  }

  const huerfanos = municipios.filter(
    (m) => !provinciaPorCodigo.has(m.provincia),
  );
  if (huerfanos.length > 0) {
    problemas.push(
      `${huerfanos.length} municipios con provincia desconocida: ${huerfanos
        .slice(0, 5)
        .map((m) => m.codigo)
        .join(', ')}`,
    );
  }

  const codigosDuplicados =
    municipios.length - new Set(municipios.map((m) => m.codigo)).size;
  if (codigosDuplicados > 0) {
    problemas.push(`${codigosDuplicados} codigos INE de municipio duplicados`);
  }

  const provinciasSinMunicipios = provincias.filter(
    (p) => !municipios.some((m) => m.provincia === p.codigo),
  );
  if (provinciasSinMunicipios.length > 0) {
    problemas.push(
      `Provincias sin municipios: ${provinciasSinMunicipios
        .map((p) => `${p.codigo} ${p.nombre}`)
        .join(', ')}`,
    );
  }

  // --- Contraste con la fuente independiente ------------------------------
  let contraste;
  try {
    const ruta = await descargar(URL_CONTRASTE, 'contraste_municipios.csv');
    const csv = await readFile(ruta, 'utf8');
    const codigosContraste = new Set(
      csv
        .split('\n')
        .slice(1)
        .map((l) => l.split(',')[0]?.trim())
        .filter((c) => /^\d{5}$/.test(c ?? '')),
    );
    const nuestros = new Set(municipios.map((m) => m.codigo));
    const soloEnIne = [...nuestros].filter((c) => !codigosContraste.has(c));
    const soloEnContraste = [...codigosContraste].filter(
      (c) => !nuestros.has(c),
    );
    contraste =
      `${codigosContraste.size} municipios en la fuente de contraste; ` +
      `${soloEnIne.length} solo en el INE, ${soloEnContraste.length} solo en el contraste`;
    if (soloEnIne.length > 0 || soloEnContraste.length > 0) {
      contraste += `\n  solo en INE: ${soloEnIne.slice(0, 10).join(', ')}`;
      contraste += `\n  solo en contraste: ${soloEnContraste.slice(0, 10).join(', ')}`;
    }
  } catch (error) {
    contraste = `fallo al contrastar: ${error.message}`;
  }

  // --- Informe ------------------------------------------------------------
  console.log('Recuentos');
  console.log(`  comunidades y ciudades autonomas: ${comunidades.length}`);
  console.log(`  provincias:                       ${provincias.length}`);
  console.log(`  municipios:                       ${municipios.length}`);
  console.log(
    `\nSlugs en colision desambiguados por provincia: ${colisiones.length}`,
  );
  for (const c of colisiones.slice(0, 8)) {
    console.log(`  ${c.base} (${c.cuantos})`);
  }
  if (colisiones.length > 8)
    console.log(`  ... y ${colisiones.length - 8} mas`);

  console.log(`\nContraste independiente\n  ${contraste}`);

  if (problemas.length > 0) {
    console.error('\nPROBLEMAS:');
    for (const p of problemas) console.error(`  - ${p}`);
    process.exit(1);
  }

  // --- Datos -------------------------------------------------------------
  const porCodigo = (a, b) =>
    a.codigo < b.codigo ? -1 : a.codigo > b.codigo ? 1 : 0;
  const entidad = (e) => ({
    codigoIne: e.codigo,
    nombre: nombreVisible(e.nombre),
    nombreOficial: e.nombre,
    slug: generarSlug(ordenNaturalEntidad(e.nombre)),
  });

  const geografia = await escribirDatos('geografia.json', {
    comunidades: [...comunidades].sort(porCodigo).map(entidad),
    provincias: [...provincias]
      .sort(porCodigo)
      .map((p) => ({ ...entidad(p), comunidad: p.comunidad })),
  });

  // Tuplas a proposito: son 8132 filas y con objetos el fichero triplica su
  // peso solo en nombres de clave. Forma: [codigoIne, nombre, slug] y un
  // cuarto elemento con el nombre oficial SOLO si difiere del visible. La
  // provincia sale de los dos primeros digitos del codigo INE.
  const listado = await escribirDatos(
    'municipios.json',
    [...municipios].sort(porCodigo).map((m) => {
      const visible = nombreVisible(m.nombre);
      return visible === m.nombre
        ? [m.codigo, visible, m.slug]
        : [m.codigo, visible, m.slug, m.nombre];
    }),
  );
  console.log(`
Escrito ${geografia}
Escrito ${listado}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
