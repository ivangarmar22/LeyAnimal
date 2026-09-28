/**
 * Genera el contenido autonomico: src/datos/autonomico.json.
 *
 *   pnpm datos:autonomicas              -> tabla de revision
 *   pnpm datos:autonomicas --escribir   -> escribe autonomico.json
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
 * SELECCION. Lo que NO es humano es la cita: el script la extrae del XML
 * consolidado del BOE usando un localizador, de modo que el texto es literal
 * por construccion y no depende de que nadie lo transcriba bien.
 *
 * Si un localizador deja de encontrar su frase, el script falla en vez de
 * escribir una cita vacia.
 *
 * REGLA DE ESTADO (aprobada el 07/09/2026)
 *   - obligacion directa                       -> obligatorio
 *   - obligacion que remite a reglamento        -> obligatorio_pendiente_reglamento
 *   - tema no regulado                          -> no se crea regla (sin_datos)
 *
 * Matiz aplicado: una remision que solo alcanza a "otras especies" o a "las
 * condiciones" no convierte en pendiente el deber principal.
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

/** Requisitos que solo existen por las leyes autonomicas. */
const REQUISITOS = [
  {
    clave: 'identificacion_animales',
    tema: 'identificacion',
    titulo: 'Identificar a tu animal',
    descripcionCorta:
      'Tu comunidad exige identificar al animal, normalmente mediante microchip.',
    explicacion:
      'La identificación es competencia autonómica, así que el plazo y las especies afectadas cambian según dónde vivas. Consulta la cita de tu comunidad más abajo.',
    tipo: 'obligacion',
    periodicidad: 'unica',
    plazo: 'Varía según la comunidad',
    quienLoExige: 'Comunidad autónoma',
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
function idRegla(identificador, requisito) {
  const h = createHash('md5')
    .update(identificador + requisito, 'utf8')
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Leyes de las que se extrae. La Rioja, Ceuta y Melilla: ver D32 y D34. */
const NORMAS = {
  '01': ['Andalucía', 'BOE-A-2003-23292', 'de Andalucía'],
  '02': ['Aragón', 'BOE-A-2003-8225', 'de Aragón'],
  '03': [
    'Principado de Asturias',
    'BOE-A-2003-2102',
    'del Principado de Asturias',
  ],
  '08': ['Castilla-La Mancha', 'BOE-A-2020-13916', 'de Castilla-La Mancha'],
  '09': ['Cataluña', 'DOGC-f-2008-90016', 'de Cataluña'],
  10: ['Comunitat Valenciana', 'BOE-A-2023-7421', 'de la Comunitat Valenciana'],
  12: ['Galicia', 'BOE-A-2017-12357', 'de Galicia'],
  13: ['Comunidad de Madrid', 'BOE-A-2016-11097', 'de la Comunidad de Madrid'],
  14: ['Región de Murcia', 'BOE-A-2017-15288', 'de la Región de Murcia'],
  15: ['Comunidad Foral de Navarra', 'BOE-A-2019-6779', 'de Navarra'],
  16: ['País Vasco', 'BOE-A-2022-14086', 'del País Vasco'],
};

/**
 * Normas que se cargan sin reglas: las cinco leyes vigentes cuyo articulado
 * aun no se ha curado (D38) y la ley derogada de La Rioja (D32). Sirven para
 * que la ficha de cada comunidad diga que ley tiene, o que no tiene ninguna.
 * Estado y fechas salen de /metadatos del BOE, no de aqui.
 */
const SIN_REGLAS = [
  {
    ine: '04',
    comunidad: 'Illes Balears',
    identificador: 'BOE-A-1992-14038',
    de: 'de las Illes Balears',
  },
  {
    ine: '05',
    comunidad: 'Canarias',
    identificador: 'BOE-A-1991-16425',
    de: 'de Canarias',
  },
  // El propio titulo ya lleva el territorio: "Ley de Cantabria 3/1992".
  {
    ine: '06',
    comunidad: 'Cantabria',
    identificador: 'BOE-A-1992-11685',
    de: '',
  },
  {
    ine: '07',
    comunidad: 'Castilla y León',
    identificador: 'BOE-A-1997-14412',
    de: 'de Castilla y León',
  },
  {
    ine: '11',
    comunidad: 'Extremadura',
    identificador: 'BOE-A-2002-16784',
    de: 'de Extremadura',
  },
  {
    ine: '17',
    comunidad: 'La Rioja',
    identificador: 'BOE-A-2018-17064',
    de: 'de La Rioja',
    // /analisis del BOE: "SE DEROGA, por Ley 10/2023, de 7 de agosto" (BOE-A-2023-18413).
    resumen:
      'Derogada por la Ley 10/2023, de 7 de agosto, cuyo artículo único la deroga sin sustituirla. La Rioja no tiene hoy ley autonómica de protección animal: rige el marco estatal.',
  },
];

/**
 * Seleccion humana. `localizador` marca la frase exacta que se cita; el script
 * la extrae del texto oficial, no se transcribe aqui.
 *
 * `nota` explica por que se ha elegido ese estado cuando no es evidente.
 *
 * `especies` limita la regla a las que el articulo nombra. Sin ella la regla
 * se aplicaria a cualquier animal, y a un pez le saldria obligatorio un
 * microchip que la ley solo exige a perros, gatos y hurones.
 *
 * `siguientes` anade a la cita esas frases posteriores a la del localizador,
 * cuando la obligacion no se entiende sin ellas.
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
    estado: 'obligatorio',
    nota: 'La remisión regula las condiciones del microchip, no la existencia del deber, que además se refuerza con «en todo caso».',
  },
  {
    ine: '08',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 14',
    localizador:
      /Los perros, gatos y hurones deberán ser identificados individualmente/,
    estado: 'obligatorio',
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
    localizador: /Los ayuntamientos deben llevar un censo municipal/,
    estado: 'obligatorio',
  },
  {
    ine: '10',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 10',
    localizador: /Están obligatoriamente sujetos a identificación/,
    estado: 'obligatorio',
    nota: 'La remisión alcanza a especies adicionales; canina, felina y mustélidos quedan sujetos directamente.',
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
    nota: 'Obligatoria para perros. Para el resto de especies la ley la declara voluntaria, salvo los animales catalogados como potencialmente peligrosos.',
  },
  {
    ine: '13',
    requisito: 'seguro_rc_perros',
    especies: ['perro'],
    articulo: 'Artículo 6',
    localizador:
      /Contratar un seguro de responsabilidad civil en aquellos casos/,
    estado: 'obligatorio_pendiente_reglamento',
    nota: 'Remite a reglamento para determinar los casos. El artículo se reformó en diciembre de 2024 y la remisión se mantuvo.',
  },
  {
    ine: '13',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 11',
    localizador: /Serán obligatoriamente objeto de identificación/,
    estado: 'obligatorio',
  },
  {
    ine: '14',
    requisito: 'seguro_rc_perros',
    especies: ['perro'],
    articulo: 'Artículo 4',
    localizador:
      /Contratar un seguro de responsabilidad civil en aquellos casos/,
    estado: 'obligatorio_pendiente_reglamento',
  },
  {
    ine: '15',
    requisito: 'identificacion_animales',
    especies: ['perro', 'gato', 'huron'],
    articulo: 'Artículo 8',
    localizador: /Es obligatoria la identificación de perros, gatos y hurones/,
    estado: 'obligatorio',
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

const slugDe = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function leerCampo(xml, nombre) {
  const m = new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`).exec(xml);
  return m ? decodificar(m[1].trim()) : null;
}

/**
 * Devuelve los parrafos de un articulo concreto y el id de su bloque, que es
 * tambien el ancla del articulo en la pagina del BOE (act.php?id=...#a2-8).
 */
function parrafosDe(xml, numeroArticulo) {
  for (const [, atributos, cuerpo] of xml.matchAll(
    /<bloque([^>]*)>([\s\S]*?)<\/bloque>/g,
  )) {
    if (!/tipo="precepto"/.test(atributos)) continue;
    if (
      decodificar(/titulo="([^"]*)"/.exec(atributos)?.[1] ?? '') !==
      numeroArticulo
    ) {
      continue;
    }
    return {
      ancla: /\bid="([^"]+)"/.exec(atributos)?.[1] ?? null,
      parrafos: [...cuerpo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
        .map(([, p]) => decodificar(p.replace(/<[^>]+>/g, '')).trim())
        .filter(Boolean),
    };
  }
  return null;
}

/** "20031219" -> "2003-12-19" */
const fechaIso = (f) =>
  f ? `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}` : null;

/** Frase completa que contiene el localizador, extraida del texto oficial. */
/** Condicion del motor que limita la regla a las especies del articulo. */
function condicionEspecies(especies) {
  if (!especies?.length)
    throw new Error('Cada regla tiene que decir a que especies se aplica.');
  return especies.length === 1
    ? { campo: 'especie', op: 'eq', valor: especies[0] }
    : { campo: 'especie', op: 'in', valor: especies };
}

function citaLiteral(parrafos, localizador, siguientes = 0) {
  for (const [i, p] of parrafos.entries()) {
    const m = localizador.exec(p);
    if (!m) continue;

    let inicio = m.index;
    while (inicio > 0 && !/[.;]\s/.test(p.slice(inicio - 2, inicio))) inicio--;
    let fin = m.index;
    while (fin < p.length && p[fin] !== '.') fin++;
    for (let n = 0; n < siguientes; n++) {
      fin++;
      while (fin < p.length && p[fin] !== '.') fin++;
    }

    let cita = p
      .slice(inicio, fin + 1)
      .trim()
      .replace(/\s+/g, ' ');

    // En texto legal es corriente que el precepto termine en dos puntos y la
    // enumeracion venga en parrafos aparte. Citar solo hasta los dos puntos
    // deja la obligacion a medias, asi que se anade la primera letra de la
    // lista, que es la que concreta el deber.
    if (cita.endsWith(':') && parrafos[i + 1]) {
      cita = `${cita} ${parrafos[i + 1].trim().replace(/\s+/g, ' ')}`;
    }

    return cita;
  }
  return null;
}

async function main() {
  const escribir = process.argv.includes('--escribir');
  const reglas = [];
  const cache = new Map();

  for (const s of SELECCION) {
    const [comunidad, identificador, deComunidad] = NORMAS[s.ine];
    if (!cache.has(identificador)) {
      cache.set(identificador, {
        texto: await readFile(join(CACHE, `${identificador}.xml`), 'utf8'),
        meta: await readFile(join(CACHE, `${identificador}-meta.xml`), 'utf8'),
      });
    }
    const { texto, meta } = cache.get(identificador);

    const articulo = parrafosDe(texto, s.articulo);
    if (!articulo) {
      throw new Error(
        `${comunidad}: no existe ${s.articulo} en ${identificador}`,
      );
    }
    const cita = citaLiteral(articulo.parrafos, s.localizador, s.siguientes);
    if (!cita) {
      throw new Error(
        `${comunidad} ${s.articulo}: el localizador ${s.localizador} ya no encuentra su frase. ` +
          'La norma puede haber cambiado: revisa antes de seguir.',
      );
    }

    const tituloNorma = leerCampo(meta, 'titulo');
    const url = `https://www.boe.es/buscar/act.php?id=${identificador}`;
    reglas.push({
      ...s,
      comunidad,
      identificador,
      tituloNorma,
      // "Ley 11/2003, de 24 de noviembre, ..." -> "Ley 11/2003 de Andalucia".
      // Hace falta el territorio: Andalucia y Aragon tienen las dos una 11/2003.
      tituloCorto: `${tituloNorma.split(',')[0]} ${deComunidad}`,
      numero: leerCampo(meta, 'numero_oficial'),
      anio: Number(leerCampo(meta, 'fecha_disposicion')?.slice(0, 4)) || null,
      publicadaEn: fechaIso(leerCampo(meta, 'fecha_publicacion')),
      vigenteDesde: fechaIso(leerCampo(meta, 'fecha_vigencia')),
      urlAncla: articulo.ancla ? `${url}#${articulo.ancla}` : url,
      cita,
    });
  }

  if (!escribir) {
    console.log(`${reglas.length} reglas curadas\n`);
    for (const r of reglas) {
      console.log(
        `[${r.estado === 'obligatorio' ? 'OBL ' : 'PEND'}] ${r.comunidad} · ${r.requisito} · ${r.articulo}`,
      );
      console.log(`         "${r.cita}"`);
      if (r.nota) console.log(`         nota: ${r.nota}`);
    }
    console.log('\nTodas las citas se han extraido del texto oficial.');
    return;
  }

  const normas = [
    ...new Map(
      reglas.map((r) => [
        r.identificador,
        { ...r, estado: 'vigente', resumen: null, verificadaEn: '2026-09-07' },
      ]),
    ).values(),
  ];
  for (const s of SIN_REGLAS) {
    const meta = await readFile(
      join(CACHE, `${s.identificador}-meta.xml`),
      'utf8',
    );
    const tituloNorma = leerCampo(meta, 'titulo');
    const base = tituloNorma.split(',')[0];
    normas.push({
      ...s,
      tituloNorma,
      tituloCorto: s.de ? `${base} ${s.de}` : base,
      numero: leerCampo(meta, 'numero_oficial'),
      anio: Number(leerCampo(meta, 'fecha_disposicion')?.slice(0, 4)) || null,
      publicadaEn: fechaIso(leerCampo(meta, 'fecha_publicacion')),
      vigenteDesde: fechaIso(leerCampo(meta, 'fecha_vigencia')),
      estado:
        leerCampo(meta, 'estatus_derogacion') === 'S' ? 'derogada' : 'vigente',
      resumen: s.resumen ?? null,
      verificadaEn: '2026-09-27',
    });
  }
  const slugDeNorma = (n) => `ley-animales-${slugDe(n.comunidad)}`;
  const slugPorIdentificador = new Map(
    normas.map((n) => [n.identificador, slugDeNorma(n)]),
  );
  const articulos = [
    ...new Map(
      reglas.map((r) => [`${r.identificador}|${r.articulo}`, r]),
    ).values(),
  ];

  const ruta = await escribirDatos('autonomico.json', {
    requisitos: ordenarRequisitos(REQUISITOS),
    normas: ordenarNormas(
      normas.map((n) => ({
        slug: slugDeNorma(n),
        ambito: 'autonomico',
        comunidad: n.ine,
        tipo: 'ley',
        numero: n.numero,
        anio: n.anio,
        titulo: n.tituloNorma,
        tituloCorto: n.tituloCorto,
        urlOficial: `https://www.boe.es/buscar/act.php?id=${n.identificador}`,
        identificadorBoletin: n.identificador,
        fechaPublicacion: n.publicadaEn,
        fechaEntradaVigor: n.vigenteDesde,
        estado: n.estado,
        resumen: n.resumen,
        verificadaEn: n.verificadaEn,
      })),
    ),
    // El articulo guarda la frase citada: es lo que se ha verificado.
    articulos: ordenarArticulos(
      articulos.map((a) => {
        const norma = slugPorIdentificador.get(a.identificador);
        return {
          id: `${norma}#${a.articulo}`,
          norma,
          referencia: a.articulo,
          epigrafe: null,
          textoLiteral: a.cita,
          urlAncla: a.urlAncla,
        };
      }),
    ),
    reglas: ordenarReglas(
      reglas.map((r) => ({
        id: idRegla(r.identificador, r.requisito),
        requisito: r.requisito,
        ambito: 'autonomico',
        comunidad: r.ine,
        provincia: null,
        municipio: null,
        condiciones: condicionEspecies(r.especies),
        estado: r.estado,
        parametros: {},
        vigenteDesde: r.vigenteDesde,
        vigenteHasta: null,
        prioridad: 0,
        nota: r.nota ?? null,
        verificadaEn: '2026-09-07',
      })),
    ),
    fuentes: ordenarFuentes(
      reglas.map((r) => ({
        regla: idRegla(r.identificador, r.requisito),
        articulo: `${slugPorIdentificador.get(r.identificador)}#${r.articulo}`,
        cita: r.cita,
      })),
    ),
  });
  console.log(
    `Escrito ${ruta}: ${reglas.length} reglas, ${normas.length} normas, ${articulos.length} articulos.`,
  );
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
