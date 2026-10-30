/**
 * Genera src/datos/referencia-estatal.json: articulos estatales que no
 * fundamentan ninguna regla del motor pero que las guias citan (sanciones,
 * medidas de seguridad de los PPP, perdida del animal, abandono, y lo que
 * piden las guias por situacion: compra y adopcion, transporte, viajes y
 * perros de asistencia).
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
  'rd-409-2025-perros-asistencia': 'BOE-A-2025-10490',
  'rd-1428-2003-reglamento-general-circulacion': 'BOE-A-2003-23514',
};

/**
 * `bloque`: id del bloque en el XML del BOE, que es tambien el ancla del
 * articulo en su pagina web. `parrafos`: comienzo literal de cada parrafo
 * que se cita, en orden.
 */
const SELECCION = [
  // --- Ley 7/2023: ambito. Los perros de caza, pastoreo y trabajo quedan
  // fuera, y el motor no les aplica sus reglas (DECISIONES.md, D55).
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a1',
    referencia: 'art. 1.3.e',
    epigrafe: 'Animales excluidos: caza, pastoreo y actividades profesionales',
    parrafos: ['e) Los animales utilizados en actividades específicas'],
  },
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

  // --- Ley 7/2023: guias por situacion (src/lib/contenido/situaciones.ts) ---
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a3',
    referencia: 'art. 3.cc',
    epigrafe: 'Definición de perro de asistencia',
    parrafos: ['cc) Perro de asistencia'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.2.d',
    epigrafe: 'Obligaciones generales. Vehículos cerrados',
    parrafos: ['d) No dejarlos solos dentro de vehículos cerrados'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-6',
    referencia: 'art. 24.2.f',
    epigrafe: 'Obligaciones generales. Localizado e identificado',
    parrafos: ['f) Mantener permanentemente localizado'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-9',
    referencia: 'art. 27.l',
    epigrafe: 'Prohibiciones. Venta en tiendas',
    parrafos: ['l) La comercialización de perros, gatos y hurones'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-9',
    referencia: 'art. 27.m',
    epigrafe: 'Prohibiciones. Animales sin identificar',
    parrafos: ['m) La comercialización, donación o entrega en adopción'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-11',
    referencia: 'art. 29.1',
    epigrafe: 'Acceso a medios de transporte',
    parrafos: [
      '1. Los transportes públicos y privados',
      'No obstante, los conductores',
      'Los operadores ferroviarios',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-11',
    referencia: 'art. 29.2',
    epigrafe: 'Acceso a establecimientos',
    parrafos: [
      '2. Los establecimientos públicos y privados',
      'En caso de no admitir la entrada',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-11',
    referencia: 'art. 29.5',
    epigrafe: 'Condiciones del acceso',
    parrafos: [
      '5. Las personas responsables de animales de compañía que puedan acceder',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-11',
    referencia: 'art. 29.6',
    epigrafe: 'Acceso de perros de asistencia',
    parrafos: ['6. El acceso a medios de transporte'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a2-11',
    referencia: 'art. 29.7',
    epigrafe: 'Playas, parques y espacios públicos',
    parrafos: ['7. Sin perjuicio de lo establecido en sus ordenanzas'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-3',
    referencia: 'art. 51.1',
    epigrafe: 'Identificación según la especie',
    parrafos: ['1. Los animales de compañía se identificarán individualmente'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-3',
    referencia: 'art. 51.2',
    epigrafe: 'Identificación obligatoria',
    parrafos: ['2. Sin perjuicio de lo anterior, serán obligatoriamente'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-3',
    referencia: 'art. 51.4',
    epigrafe: 'Animales procedentes de la Unión Europea',
    parrafos: ['4. Los perros, gatos y hurones procedentes de otros países'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.1',
    epigrafe: 'Venta. Solo desde el criador',
    parrafos: ['1. La venta, de perros, gatos y hurones'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.2',
    epigrafe: 'Venta. Contrato escrito',
    parrafos: ['2. La venta de cualquier animal de compañía deberá'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.4',
    epigrafe: 'Venta. Animal identificado',
    parrafos: ['4. Queda prohibida la venta de animales no identificados'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.5',
    epigrafe: 'Venta. Información por escrito',
    parrafos: ['5. Con carácter previo a la venta'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.6',
    epigrafe: 'Venta. Comunicación al registro',
    parrafos: ['6. La venta debe comunicarse'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-7',
    referencia: 'art. 55.7',
    epigrafe: 'Venta. Edad mínima',
    parrafos: ['7. Los perros y gatos deberán tener una edad mínima'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.1',
    epigrafe: 'Cesión y adopción. Animal identificado',
    parrafos: ['1. Queda prohibida la cesión o adopción'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.2',
    epigrafe: 'Cesión gratuita. Contrato',
    parrafos: ['2. La cesión gratuita'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.3',
    epigrafe: 'Cesión. Edad mínima',
    parrafos: ['3. No se permitirá la cesión'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.4',
    epigrafe: 'Adopción. Quién puede darla',
    parrafos: ['4. La entrega en adopción'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.7',
    epigrafe: 'Adopción. Información y certificado veterinario',
    parrafos: ['7. La adopción se llevará a cabo con la entrega'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.8',
    epigrafe: 'Adopción. Tratamientos, identificación y esterilización',
    parrafos: ['8. Los animales objeto de adopción'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-10',
    referencia: 'art. 58.9',
    epigrafe: 'Adopción. Sin transacción comercial',
    parrafos: ['9. La adopción no será en ningún caso'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a5-11',
    referencia: 'art. 59.1',
    epigrafe: 'Condiciones generales de transporte',
    parrafos: [
      '1. Sin perjuicio de la aplicación',
      'a) Que los animales estén',
      'b) Que se atienden',
      'c) Que el medio de transporte',
      'd) Que los medios de transporte',
      'e) Que el animal está protegido',
      'f) Que a los animales se les proporcione',
    ],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a6-2',
    referencia: 'art. 60.2',
    epigrafe: 'Transporte. Vehículos estacionados',
    parrafos: ['2. Cuando los animales de compañía deban permanecer'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a6-2',
    referencia: 'art. 60.6',
    epigrafe: 'Transporte. Habitáculo adaptado',
    parrafos: ['6. El transporte de animales de compañía deberá'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a6-3',
    referencia: 'art. 61.1',
    epigrafe: 'Entrada en España. Documentación y registro',
    parrafos: ['1. En el momento de su entrada'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'a6-3',
    referencia: 'art. 61.3',
    epigrafe: 'Entrada y salida de España. Vacunación antirrábica',
    parrafos: ['3. Los animales de compañía que sean objeto de introducción'],
  },
  {
    norma: 'ley-7-2023-bienestar-animal',
    bloque: 'da',
    referencia: 'disp. adic. 1.ª',
    epigrafe: 'Perros de asistencia',
    parrafos: ['Los perros de asistencia se regirán'],
  },

  // --- Ley 50/1999: cambio de titular y traslados ---
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a4',
    referencia: 'art. 4.1',
    epigrafe: 'Importación y transmisión con licencia',
    parrafos: ['1. La importación o entrada en territorio nacional'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a4',
    referencia: 'art. 4.4',
    epigrafe: 'Cambio de titular',
    parrafos: [
      '4. Las operaciones de compraventa',
      'a) Existencia de licencia vigente',
      'b) Obtención previa de licencia',
      'c) Acreditación de la cartilla',
      'd) Inscripción de la transmisión',
    ],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a6',
    referencia: 'art. 6.5',
    epigrafe: 'Registro. Venta, pérdida o muerte',
    parrafos: ['5. Deberá comunicarse al Registro municipal'],
  },
  {
    norma: 'ley-50-1999-animales-potencialmente-peligrosos',
    bloque: 'a6',
    referencia: 'art. 6.6',
    epigrafe: 'Registro. Traslado a otra comunidad',
    parrafos: ['6. El traslado de un animal potencialmente peligroso'],
  },

  // --- RD 1428/2003, Reglamento General de Circulacion ---
  {
    norma: 'rd-1428-2003-reglamento-general-circulacion',
    bloque: 'a18',
    referencia: 'art. 18.1',
    epigrafe: 'Animales transportados en el vehículo',
    parrafos: ['1. El conductor de un vehículo está obligado'],
  },

  // --- RD 409/2025: perros de asistencia ---
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a2',
    referencia: 'art. 2.b',
    epigrafe: 'Personas usuarias',
    parrafos: [
      'b) Las personas usuarias del servicio de perros de asistencia, que son',
      'Además de lo establecido en el párrafo anterior',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a3',
    referencia: 'art. 3.2',
    epigrafe: 'Validez en toda España de la unidad de vinculación',
    parrafos: ['2. El reconocimiento de la unidad de vinculación'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a6',
    referencia: 'art. 6.1',
    epigrafe: 'Reconocimiento por la comunidad autónoma',
    parrafos: [
      '1. Las comunidades autónomas y las ciudades de Ceuta y Melilla determinarán el procedimiento',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a6',
    referencia: 'art. 6.3',
    epigrafe: 'Validez en toda España del reconocimiento',
    parrafos: ['3. El reconocimiento de la condición de un perro'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.1.a',
    epigrafe: 'Acceso a lugares públicos y de uso público',
    parrafos: ['a) Lugares públicos o de uso público'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.1.b',
    epigrafe: 'Acceso a espacios privados de uso colectivo',
    parrafos: ['b) Lugares y espacios privados de uso colectivo'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.1.c',
    epigrafe: 'Acceso al puesto de trabajo',
    parrafos: ['c) Puesto de trabajo'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.1.d',
    epigrafe: 'Acceso a medios de transporte',
    parrafos: [
      'd) Medios de transporte colectivos',
      'En el caso del transporte aéreo',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.2',
    epigrafe: 'Únicos supuestos para limitar el acceso',
    parrafos: [
      '2. Únicamente se podrá limitar',
      'a) Cuando el perro muestre',
      'b) En situaciones de riesgo inminente',
      'c) En el caso del transporte aéreo, en aquellas excepciones',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.3',
    epigrafe: 'Denegación por escrito',
    parrafos: ['3. La limitación de acceso'],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.4',
    epigrafe: 'Espacios sin acceso',
    parrafos: [
      '4. En todo caso, la unidad de vinculación no podrá acceder',
      'a) Zonas de manipulación',
      'b) Quirófanos',
      'c) Agua de piscinas',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a7',
    referencia: 'art. 7.7',
    epigrafe: 'Perros de asistencia de otros países',
    parrafos: [
      '7. Los perros de asistencia reconocidos y acreditados por otro país',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a8',
    referencia: 'art. 8.2',
    epigrafe: 'Obligaciones de la persona usuaria',
    parrafos: [
      '2. Las personas usuarias del servicio de asistencia',
      'a) Cumplir la normativa en vigor en materia de protección, bienestar',
      'b) Tratar al perro de asistencia',
      'c) Utilizar el perro de asistencia',
      'd) Responsabilizarse',
      'e) Registrar a la unidad',
      'f) Mantener colocado',
      'g) Denunciar la pérdida',
    ],
  },
  {
    norma: 'rd-409-2025-perros-asistencia',
    bloque: 'a9',
    referencia: 'art. 9',
    epigrafe: 'Denegar el acceso es discriminación',
    parrafos: ['A este respecto, sin perjuicio'],
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

/** `--actualizar` vuelve a descargar del BOE aunque haya copia local. */
const ACTUALIZAR = process.argv.includes('--actualizar');

async function textoDe(identificador) {
  const ruta = join(CACHE, `${identificador}.xml`);
  if (ACTUALIZAR || !existsSync(ruta)) {
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
 * apartado suelto ("g) Comunicar..." -> "Comunicar...", tambien las letras
 * dobles de las definiciones: "cc) Perro..."), como en estatal.json.
 * En citas de varios parrafos se conservan las letras: son la enumeracion.
 */
function limpiarApartado(texto) {
  return texto.replace(/^(\d+\.|[a-zñ]{1,2}\))\s+/, '');
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
