/**
 * Comprueba el contenido de src/datos/ antes de que llegue a la web.
 *
 *   pnpm datos:comprobar
 *
 * Dos bloques: integridad (cada referencia apunta a algo que existe, cada
 * valor es uno de los permitidos) y contenido legal (ninguna afirmacion sin
 * fuente, ninguna cita que no este en su articulo, y las decisiones D32, D33,
 * D34 y D42 respetadas). Falla con codigo 1 si algo no se cumple.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATOS } from './comun.mjs';

const leer = async (nombre) =>
  JSON.parse(await readFile(join(DATOS, nombre), 'utf8'));

const [
  geografia,
  municipios,
  catalogo,
  estatal,
  autonomico,
  referencia,
  cambios,
] = await Promise.all(
  [
    'geografia.json',
    'municipios.json',
    'catalogo.json',
    'estatal.json',
    'autonomico.json',
    'referencia-estatal.json',
    'cambios.json',
  ].map(leer),
);

const normas = [...estatal.normas, ...autonomico.normas];
const articulos = [
  ...estatal.articulos,
  ...autonomico.articulos,
  ...referencia.articulos,
];
const requisitos = [...estatal.requisitos, ...autonomico.requisitos];
const reglas = [...estatal.reglas, ...autonomico.reglas];
const fuentes = [...estatal.fuentes, ...autonomico.fuentes];

let fallos = 0;
function ok(descripcion, errores) {
  if (errores.length === 0) {
    console.log(`  ok    ${descripcion}`);
    return;
  }
  fallos++;
  console.error(`  FALLO ${descripcion}`);
  for (const e of errores.slice(0, 10)) console.error(`          ${e}`);
  if (errores.length > 10)
    console.error(`          ... y ${errores.length - 10} mas`);
}

const repetidos = (lista, clave) => {
  const vistos = new Set();
  return lista.map(clave).filter((k) => vistos.size === vistos.add(k).size);
};
const fueraDe = (lista, campo, permitidos) =>
  lista
    .filter((x) => !permitidos.includes(x[campo]))
    .map((x) => `${x.slug ?? x.id ?? x.clave}: ${campo} = ${x[campo]}`);

const AMBITOS = ['estatal', 'autonomico', 'provincial', 'municipal'];
const comunidades = new Set(geografia.comunidades.map((c) => c.codigoIne));
const provincias = new Set(geografia.provincias.map((p) => p.codigoIne));
const codigosMunicipio = new Set(municipios.map(([codigo]) => codigo));

/** Cada ambito exige su territorio y ninguno mas concreto. */
function territorio(x) {
  const nombre = x.slug ?? x.id;
  const { ambito, comunidad, provincia = null, municipio = null } = x;
  const coherente = {
    estatal: comunidad === null && provincia === null && municipio === null,
    autonomico: comunidad !== null && provincia === null && municipio === null,
    provincial: provincia !== null && municipio === null,
    municipal: municipio !== null,
  }[ambito];
  const errores = [];
  if (!coherente)
    errores.push(`${nombre}: territorio incoherente con ${ambito}`);
  if (comunidad !== null && !comunidades.has(comunidad))
    errores.push(`${nombre}: comunidad ${comunidad} no existe`);
  if (provincia !== null && !provincias.has(provincia))
    errores.push(`${nombre}: provincia ${provincia} no existe`);
  if (municipio !== null && !codigosMunicipio.has(municipio))
    errores.push(`${nombre}: municipio ${municipio} no existe`);
  return errores;
}

// --- Integridad -------------------------------------------------------------

console.log('\nIntegridad');

ok('Geografia: 19 comunidades, 52 provincias y 8.132 municipios', [
  ...(geografia.comunidades.length === 19
    ? []
    : [`${geografia.comunidades.length} comunidades`]),
  ...(geografia.provincias.length === 52
    ? []
    : [`${geografia.provincias.length} provincias`]),
  ...(municipios.length === 8132 ? [] : [`${municipios.length} municipios`]),
]);
ok('Geografia sin codigos ni slugs repetidos', [
  ...repetidos(geografia.comunidades, (c) => c.slug),
  ...repetidos(geografia.provincias, (p) => p.slug),
  ...repetidos(municipios, ([codigo]) => codigo),
  ...repetidos(municipios, ([, , slug]) => slug),
]);
ok(
  'Cada provincia pertenece a una comunidad y cada municipio a una provincia',
  [
    ...geografia.provincias
      .filter((p) => !comunidades.has(p.comunidad))
      .map((p) => `${p.slug}: comunidad ${p.comunidad}`),
    ...municipios
      .filter(
        ([codigo]) =>
          !/^\d{5}$/.test(codigo) || !provincias.has(codigo.slice(0, 2)),
      )
      .map(([codigo, nombre]) => `${nombre}: codigo ${codigo}`),
  ],
);

const especies = new Set(catalogo.especies.map((e) => e.clave));
const temas = new Set(catalogo.temas.map((t) => t.clave));
ok('Catalogo sin repetidos y cada raza con su especie', [
  ...repetidos(catalogo.especies, (e) => e.clave),
  ...repetidos(catalogo.temas, (t) => t.clave),
  ...repetidos(catalogo.temas, (t) => t.slug),
  ...repetidos(catalogo.razas, (r) => `${r.especie}/${r.slug}`),
  ...catalogo.razas
    .filter((r) => !especies.has(r.especie))
    .map((r) => `${r.slug}: especie ${r.especie}`),
  ...catalogo.razas.flatMap((r) =>
    r.autonomicas
      .filter((a) => !comunidades.has(a.comunidad))
      .map((a) => `${r.slug}: comunidad ${a.comunidad}`),
  ),
]);

ok('Normas: slug unico, valores permitidos, enlace oficial y territorio', [
  ...repetidos(normas, (n) => n.slug),
  ...fueraDe(normas, 'ambito', AMBITOS),
  ...fueraDe(normas, 'tipo', [
    'ley',
    'ley_organica',
    'real_decreto',
    'decreto',
    'orden',
    'ordenanza',
    'proyecto',
  ]),
  ...fueraDe(normas, 'estado', [
    'vigente',
    'derogada',
    'pendiente_desarrollo',
    'en_tramitacion',
  ]),
  ...normas
    .filter((n) => !n.urlOficial?.trim())
    .map((n) => `${n.slug}: sin enlace oficial`),
  ...normas
    .filter((n) => n.anio !== null && (n.anio < 1800 || n.anio > 2200))
    .map((n) => `${n.slug}: anio ${n.anio}`),
  ...normas.flatMap(territorio),
]);

const normaPorSlug = new Map(normas.map((n) => [n.slug, n]));
ok('Articulos: id unico y norma existente', [
  ...repetidos(articulos, (a) => a.id),
  ...articulos
    .filter((a) => a.id !== `${a.norma}#${a.referencia}`)
    .map((a) => `${a.id}: no corresponde a ${a.norma}#${a.referencia}`),
  ...articulos
    .filter((a) => !normaPorSlug.has(a.norma))
    .map((a) => `${a.id}: norma inexistente`),
]);

ok('Requisitos: clave unica, tema existente y valores permitidos', [
  ...repetidos(requisitos, (r) => r.clave),
  ...requisitos
    .filter((r) => !temas.has(r.tema))
    .map((r) => `${r.clave}: tema ${r.tema}`),
  ...fueraDe(requisitos, 'tipo', [
    'obligacion',
    'prohibicion',
    'tramite',
    'recomendacion',
  ]),
  ...fueraDe(requisitos, 'periodicidad', [
    'unica',
    'anual',
    'periodica',
    'permanente',
  ]),
  ...requisitos
    .filter((r) => !Number.isInteger(r.orden))
    .map((r) => `${r.clave}: sin orden`),
]);

const esObjeto = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const claves = new Set(requisitos.map((r) => r.clave));
ok('Reglas: id unico, requisito existente, valores permitidos y territorio', [
  ...repetidos(reglas, (r) => r.id),
  ...reglas
    .filter((r) => !claves.has(r.requisito))
    .map((r) => `${r.id}: requisito ${r.requisito}`),
  ...fueraDe(reglas, 'ambito', AMBITOS),
  ...fueraDe(reglas, 'estado', [
    'obligatorio',
    'obligatorio_pendiente_reglamento',
    'recomendado',
    'no_aplica',
    'sin_datos',
  ]),
  ...reglas
    .filter((r) => !esObjeto(r.condiciones) || !esObjeto(r.parametros))
    .map((r) => `${r.id}: condiciones o parametros no son un objeto`),
  ...reglas
    .filter(
      (r) =>
        r.vigenteDesde && r.vigenteHasta && r.vigenteHasta < r.vigenteDesde,
    )
    .map((r) => `${r.id}: vigencia invertida`),
  ...reglas.flatMap(territorio),
]);

const articuloPorId = new Map(articulos.map((a) => [a.id, a]));
const idsRegla = new Set(reglas.map((r) => r.id));
ok('Fuentes: regla y articulo existentes, sin duplicados', [
  ...repetidos(fuentes, (f) => `${f.regla} ${f.articulo}`),
  ...fuentes
    .filter((f) => !idsRegla.has(f.regla))
    .map((f) => `regla ${f.regla} no existe`),
  ...fuentes
    .filter((f) => !articuloPorId.has(f.articulo))
    .map((f) => `articulo ${f.articulo} no existe`),
]);

ok('Cambios normativos con referencias existentes', [
  ...cambios
    .filter((c) => c.norma && !normaPorSlug.has(c.norma))
    .map((c) => `${c.id}: norma ${c.norma}`),
  ...cambios
    .filter((c) => c.requisito && !claves.has(c.requisito))
    .map((c) => `${c.id}: requisito ${c.requisito}`),
  ...cambios
    .filter((c) => c.comunidad && !comunidades.has(c.comunidad))
    .map((c) => `${c.id}: comunidad ${c.comunidad}`),
]);

// --- Contenido legal ----------------------------------------------------------

console.log('\nContenido legal');

const fuentesPorRegla = Map.groupBy(fuentes, (f) => f.regla);
ok(
  'Ninguna regla afirma nada sin fuente (solo sin_datos puede no tenerla)',
  reglas
    .filter((r) => r.estado !== 'sin_datos' && !fuentesPorRegla.has(r.id))
    .map(
      (r) =>
        `${r.requisito} (${r.ambito} ${r.comunidad ?? ''}): ${r.estado} sin fuente`,
    ),
);

ok(
  'Ninguna cita vacia ni truncada',
  fuentes
    .filter(
      (f) =>
        (f.cita ?? articuloPorId.get(f.articulo)?.textoLiteral ?? '').trim()
          .length < 40,
    )
    .map((f) => `${f.articulo}: cita demasiado corta`),
);

// Las elisiones "[...]" separan trozos; cada trozo tiene que estar tal cual.
const normalizar = (t) => t.replace(/\s+/g, ' ').trim();
ok(
  'Toda cita aparece literalmente en el texto de su articulo',
  fuentes
    .filter((f) => f.cita)
    .filter((f) => {
      const texto = normalizar(
        articuloPorId.get(f.articulo)?.textoLiteral ?? '',
      );
      return !normalizar(f.cita)
        .split(/\s*(?:\[\.\.\.\]|\[…\]|…)\s*/)
        .filter(Boolean)
        .every((trozo) => texto.includes(trozo));
    })
    .map((f) => `${f.articulo}: la cita no esta en el articulo`),
);

const autonomicas = reglas.filter((r) => r.ambito === 'autonomico');
const nombreComunidad = new Map(
  geografia.comunidades.map((c) => [c.codigoIne, c.nombre]),
);
for (const r of autonomicas) {
  console.log(
    `        ${nombreComunidad.get(r.comunidad)?.padEnd(28)} ${r.requisito.padEnd(24)} ${r.estado}`,
  );
}

// Cambia este numero, a conciencia, cuando se anadan o retiren reglas.
ok(
  'Hay 14 reglas autonomicas',
  autonomicas.length === 14 ? [] : [`hay ${autonomicas.length}`],
);

const regla = (comunidad, requisito) =>
  autonomicas.find(
    (r) => r.comunidad === comunidad && r.requisito === requisito,
  );
ok(
  'Madrid: seguro pendiente de reglamento (D33)',
  regla('13', 'seguro_rc_perros')?.estado === 'obligatorio_pendiente_reglamento'
    ? []
    : [String(regla('13', 'seguro_rc_perros')?.estado)],
);
ok(
  'Pais Vasco: seguro obligatorio, la remision solo alcanza a otras especies',
  regla('16', 'seguro_rc_perros')?.estado === 'obligatorio'
    ? []
    : [String(regla('16', 'seguro_rc_perros')?.estado)],
);
ok(
  'La Rioja sin reglas autonomicas (D32)',
  autonomicas.filter((r) => r.comunidad === '17').map((r) => r.requisito),
);
ok(
  'Ceuta y Melilla sin reglas autonomicas (D34)',
  autonomicas
    .filter((r) => ['18', '19'].includes(r.comunidad))
    .map((r) => r.requisito),
);
// Sin condicion de especie la regla se aplicaria a cualquier animal: a un pez
// le saldria obligatorio un microchip que su ley no le exige.
ok(
  'Toda regla autonomica se limita a las especies que nombra su articulo (D42)',
  autonomicas
    .filter((r) => !JSON.stringify(r.condiciones).includes('"especie"'))
    .map((r) => `${r.comunidad} ${r.requisito}`),
);
ok(
  'Galicia: identificacion obligatoria solo para perros (art. 12.1)',
  regla('12', 'identificacion_animales')?.condiciones?.valor === 'perro'
    ? []
    : [JSON.stringify(regla('12', 'identificacion_animales')?.condiciones)],
);

console.log(
  `\n${fallos === 0 ? 'Todo correcto.' : `${fallos} comprobaciones fallan.`}`,
);
process.exit(fallos === 0 ? 0 : 1);
