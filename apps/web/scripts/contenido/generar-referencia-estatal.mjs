/**
 * Genera src/datos/referencia-estatal.json: articulos estatales que no
 * fundamentan ninguna regla del motor pero que las guias citan (sanciones,
 * medidas de seguridad de los PPP, perdida del animal, abandono...).
 *
 *   pnpm datos:referencia
 *
 * Igual que en generar-autonomicas.mjs, la seleccion es humana y el texto no:
 * cada entrada dice que parrafos citar por su comienzo, y el script los copia
 * del texto consolidado del BOE (API de datos abiertos). Si un parrafo ya no
 * se encuentra, la norma ha cambiado y el script falla en vez de seguir.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ordenarArticulos } from '../../src/lib/datos/orden.ts';
import { CACHE as CACHE_COMUN, escribirDatos } from './comun.mjs';

const CACHE = join(CACHE_COMUN, 'estatal');

const NORMAS = {
  'ley-7-2023-bienestar-animal': 'BOE-A-2023-7936',
  'ley-50-1999-animales-potencialmente-peligrosos': 'BOE-A-1999-24419',
  'rd-287-2002-animales-potencialmente-peligrosos': 'BOE-A-2002-6016',
};

/**
 * `bloque`: id del bloque en el XML del BOE, que es tambien el ancla del
 * articulo en su pagina web. `parrafos`: comienzo literal de cada parrafo
 * que se cita, en orden.
 */
const SELECCION = [
  // --- Ley 7/2023: obligaciones que usan las guias -------------------------
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-4',
    referencia: 'art. 22.1',
    epigrafe: 'Recogida de animales extraviados y abandonados',
    parrafos: ['1. Corresponderá a los ayuntamientos'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.2.c',
    epigrafe: 'Obligaciones generales. Vigilancia',
    parrafos: ['c) Ejercer sobre los animales la adecuada vigilancia'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.2.g',
    epigrafe: 'Obligaciones generales. Pérdida o sustracción',
    parrafos: ['g) Comunicar a la autoridad competente la pérdida'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.2.i',
    epigrafe: 'Obligaciones generales. Colaborar con las autoridades',
    parrafos: ['i) Colaborar con las autoridades'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.3',
    epigrafe: 'Responsabilidad por daños',
    parrafos: ['3. La persona responsable de un animal'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-8',
    referencia: 'art. 26.e',
    epigrafe: 'Obligaciones específicas. Excrementos y orines',
    parrafos: ['e) Evitar que los animales depositen'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-8',
    referencia: 'art. 26.j',
    epigrafe: 'Obligaciones específicas. Muerte del animal',
    parrafos: [
      'j) Comunicar a la administración competente y a su titular',
      'La baja de un animal de compañía por muerte',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-9',
    referencia: 'art. 27.d',
    epigrafe: 'Prohibiciones. Espacios públicos sin supervisión',
    parrafos: ['d) Mantenerlos atados o deambulando'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-9',
    referencia: 'art. 27.e',
    epigrafe: 'Prohibiciones. Terrazas, balcones y similares',
    parrafos: ['e) Mantener de forma habitual a perros y gatos'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-9',
    referencia: 'art. 27.i',
    epigrafe: 'Prohibiciones. Dejarlo sin supervisión',
    parrafos: ['i) Dejar sin supervisión'],
  },

  // --- Ley 7/2023: infracciones y sanciones --------------------------------
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-4',
    referencia: 'art. 72.2',
    epigrafe: 'Clasificación de las infracciones',
    parrafos: ['2. Las infracciones se clasifican'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-5',
    referencia: 'art. 73',
    epigrafe: 'Infracciones leves',
    parrafos: ['Se considera infracción leve'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-6',
    referencia: 'art. 74.b',
    epigrafe: 'Infracción grave. Identificación',
    parrafos: ['b) No cumplir las obligaciones de identificación'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-6',
    referencia: 'art. 74.c',
    epigrafe: 'Infracción grave. Métodos agresivos o violentos',
    parrafos: ['c) El uso de métodos agresivos'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-6',
    referencia: 'art. 74.k',
    epigrafe: 'Infracción grave. Abandono',
    parrafos: ['k) El abandono de uno o más animales'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-6',
    referencia: 'art. 74.o',
    epigrafe: 'Infracción grave. Terrazas, balcones y similares',
    parrafos: ['o) Mantener de forma permanente perros o gatos'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-7',
    referencia: 'art. 75.a',
    epigrafe: 'Infracción muy grave. Muerte del animal',
    parrafos: [
      'a) El incumplimiento de las obligaciones y prohibiciones exigidas por esta ley cuando se produzca la muerte',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-7',
    referencia: 'art. 75.c',
    epigrafe: 'Infracción muy grave. Peleas',
    parrafos: ['c) El adiestramiento y uso de animales para peleas'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-8',
    referencia: 'art. 76.1',
    epigrafe: 'Sanciones principales',
    parrafos: [
      '1. Las infracciones previstas en esta ley se sancionarán',
      'a) Las infracciones leves',
      'b) Las infracciones graves',
      'c) Las infracciones muy graves',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-8',
    referencia: 'art. 76.2',
    epigrafe: 'Sanciones. Reincidencia',
    parrafos: ['2. Si concurre la reincidencia'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a7-8',
    referencia: 'art. 76.3',
    epigrafe: 'Sanciones. Especificaciones y graduaciones',
    parrafos: ['3. El Gobierno y las comunidades autónomas'],
  },

  // --- Ley 50/1999: animales potencialmente peligrosos ---------------------
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.1.a',
    epigrafe: 'Infracción muy grave. Abandono',
    parrafos: ['a) Abandonar un animal potencialmente peligroso'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.1.b',
    epigrafe: 'Infracción muy grave. Tenencia sin licencia',
    parrafos: [
      'b) Tener perros o animales potencialmente peligrosos sin licencia',
    ],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.2.a',
    epigrafe: 'Infracción grave. Dejarlo suelto',
    parrafos: ['a) Dejar suelto un animal potencialmente peligroso'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.2.b',
    epigrafe: 'Infracción grave. Identificación',
    parrafos: ['b) Incumplir la obligación de identificar'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.2.c',
    epigrafe: 'Infracción grave. Inscripción en el registro',
    parrafos: ['c) Omitir la inscripción en el Registro'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.2.d',
    epigrafe: 'Infracción grave. Sin bozal o sin sujetar',
    parrafos: ['d) Hallarse el perro potencialmente peligroso'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.4',
    epigrafe: 'Infracciones leves',
    parrafos: [
      '4. Tendrán la consideración de infracciones administrativas leves',
    ],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.5',
    epigrafe: 'Cuantía de las multas',
    parrafos: [
      '5. Las infracciones tipificadas',
      '- Infracciones leves',
      '- Infracciones graves',
      '- Infracciones muy graves',
    ],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a13',
    referencia: 'art. 13.7',
    epigrafe: 'Potestad sancionadora',
    parrafos: ['7. El ejercicio de la potestad sancionadora'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'daprimera',
    referencia: 'disp. adic. 1.ª',
    epigrafe: 'Obligaciones específicas referentes a los perros',
    parrafos: ['Para la presencia y circulación en espacios públicos'],
  },

  // --- RD 287/2002 -----------------------------------------------------------
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a2',
    referencia: 'art. 2.2',
    epigrafe: 'Perros potencialmente peligrosos por su conducta',
    parrafos: ['2. En todo caso, aunque no se encuentren incluidos'],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a3',
    referencia: 'art. 3.1',
    epigrafe: 'Licencia. Requisitos',
    parrafos: [
      '1. La obtención o renovación de la licencia',
      'a) Ser mayor de edad.',
      'b) No haber sido condenado',
      'c) No haber sido sancionado',
      'd) Disponer de capacidad física',
      'e) Acreditación de haber formalizado',
    ],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a8',
    referencia: 'art. 8.1',
    epigrafe: 'Medidas de seguridad. Licencia y registro',
    parrafos: ['1. La presencia de animales potencialmente peligrosos'],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a8',
    referencia: 'art. 8.2',
    epigrafe: 'Medidas de seguridad. Bozal',
    parrafos: [
      '2. Los animales de la especie canina potencialmente peligrosos',
    ],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a8',
    referencia: 'art. 8.3',
    epigrafe: 'Medidas de seguridad. Correa o cadena',
    parrafos: ['3. Igualmente los perros potencialmente peligrosos'],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a8',
    referencia: 'art. 8.6',
    epigrafe: 'Medidas de seguridad. Pérdida o sustracción',
    parrafos: ['6. La sustracción o pérdida del animal'],
  },
  {
    norma: 'rd-287-2002-animales-potencialmente-peligrosos',
    bloque: 'a9',
    referencia: 'art. 9',
    epigrafe: 'Identificación con microchip',
    parrafos: ['Todos los animales potencialmente peligrosos'],
  },
];

const ENTIDADES = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

const decodificar = (t) =>
  t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n] ?? m)
    // El BOE usa espacios duros en algunos epigrafes y listas.
    .replace(/\u00a0/g, ' ');

async function textoDe(identificador) {
  const ruta = join(CACHE, `${identificador}.xml`);
  if (!existsSync(ruta)) {
    await mkdir(CACHE, { recursive: true });
    const r = await fetch(
      `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/${identificador}/texto`,
      { headers: { Accept: 'application/xml' } },
    );
    if (!r.ok) throw new Error(`BOE ${identificador}: HTTP ${r.status}`);
    await writeFile(ruta, await r.text(), 'utf8');
  }
  return readFile(ruta, 'utf8');
}

/** Parrafos de la version vigente (la ultima) de un bloque. */
function parrafosDelBloque(xml, id) {
  const bloque = new RegExp(
    `<bloque id="${id}"[^>]*>([\\s\\S]*?)</bloque>`,
  ).exec(xml);
  if (!bloque) return null;
  const versiones = [
    ...bloque[1].matchAll(/<version[^>]*>([\s\S]*?)<\/version>/g),
  ];
  const vigente = versiones.at(-1)?.[1] ?? '';
  return [...vigente.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(([, p]) =>
      decodificar(p.replace(/<[^>]+>/g, ''))
        .trim()
        .replace(/\s+/g, ' '),
    )
    .filter(Boolean);
}

/**
 * Quita el numero o la letra de apartado del primer parrafo cuando se cita un
 * apartado suelto ("g) Comunicar..." -> "Comunicar..."), como en estatal.json.
 * En citas de varios parrafos se conservan las letras: son la enumeracion.
 */
function limpiarApartado(texto) {
  return texto.replace(/^(\d+\.|[a-zñ]\))\s+/, '');
}

async function main() {
  const articulos = [];

  for (const s of SELECCION) {
    const identificador = NORMAS[s.norma];
    const parrafos = parrafosDelBloque(await textoDe(identificador), s.bloque);
    if (!parrafos)
      throw new Error(`${identificador}: no existe el bloque ${s.bloque}`);

    const citados = s.parrafos.map((inicio) => {
      const encontrados = parrafos.filter((p) => p.startsWith(inicio));
      if (encontrados.length !== 1) {
        throw new Error(
          `${s.norma} ${s.referencia}: "${inicio}" aparece ${encontrados.length} veces. ` +
            'La norma puede haber cambiado: revisa antes de seguir.',
        );
      }
      return encontrados[0];
    });

    const [primero, ...resto] = citados;
    articulos.push({
      ...s,
      texto: [limpiarApartado(primero), ...resto].join('\n'),
      url: `https://www.boe.es/buscar/act.php?id=${identificador}#${s.bloque}`,
    });
  }

  const ruta = await escribirDatos('referencia-estatal.json', {
    articulos: ordenarArticulos(
      articulos.map((a) => ({
        id: `${a.norma}#${a.referencia}`,
        norma: a.norma,
        referencia: a.referencia,
        epigrafe: a.epigrafe ?? null,
        textoLiteral: a.texto,
        urlAncla: a.url,
      })),
    ),
  });
  console.log(`Escrito ${ruta}: ${articulos.length} articulos.`);
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
