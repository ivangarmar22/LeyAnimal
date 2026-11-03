/**
 * Genera el mapa de comunidades autonomas que dibuja /mapa.
 *
 * Fuentes:
 *   1. Comunidades: limites del Instituto Geografico Nacional (CC BY 4.0),
 *      en TopoJSON del paquete es-atlas (https://github.com/martgnz/es-atlas).
 *   2. Paises vecinos, solo de contexto: Natural Earth (dominio publico), en
 *      TopoJSON del paquete world-atlas.
 *
 * Proyeccion conica conforme de Lambert. Canarias va en un recuadro abajo a
 * la derecha, algo reducida. Se simplifica arco a arco para que dos
 * comunidades vecinas compartan la misma frontera, sin huecos.
 *
 *   pnpm datos:mapa
 *
 * Escribe src/datos/mapa.json.
 */
import { escribirDatos } from './comun.mjs';

const URL_TOPOJSON =
  'https://unpkg.com/es-atlas@0.6.0/es/autonomous_regions.json';
const URL_PAISES = 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json';

/** Portugal, Francia, Andorra, Marruecos, Argelia y Gibraltar (ISO 3166). */
const VECINOS = new Set(['620', '250', '020', '504', '012', '292']);

/** Ancho del mapa en unidades del viewBox. */
const ANCHO = 1000;
const MARGEN = 16;
/** Tolerancia de simplificacion, en unidades del viewBox. */
const TOLERANCIA = 0.7;
/** Escala de Canarias respecto a la Peninsula, para que quepa en su hueco. */
const ESCALA_CANARIAS = 0.85;
/** Franja extra al sur para que se vea la costa de Marruecos. */
const SUR = 60;
/** Islotes mas pequenos que esto (unidades al cuadrado) no se dibujan. */
const AREA_MINIMA = 2.5;

/** Donde va el icono de cada comunidad: [codigo INE, [lon, lat]]. */
const MARCAS = new Map([
  ['01', [-4.6, 37.45]],
  ['02', [-0.75, 41.45]],
  ['03', [-5.9, 43.28]],
  ['04', [2.95, 39.62]],
  ['05', [-15.6, 27.95]],
  ['06', [-4.05, 43.15]],
  ['07', [-4.6, 41.8]],
  ['08', [-3.1, 39.4]],
  ['09', [1.45, 41.85]],
  ['10', [-0.6, 39.45]],
  ['11', [-6.15, 39.2]],
  ['12', [-7.9, 42.75]],
  ['13', [-3.72, 40.45]],
  ['14', [-1.5, 38.0]],
  ['15', [-1.65, 42.68]],
  ['16', [-2.6, 43.06]],
  ['17', [-2.5, 42.27]],
  ['18', [-5.32, 35.89]],
  ['19', [-2.95, 35.29]],
]);

/** Rotulos geograficos de contexto: [clave, lon, lat]. */
const ROTULOS = [
  ['francia', 0.9, 43.35],
  ['portugal', -8.1, 39.9],
  ['marruecos', -4.6, 34.85],
  ['mediterraneo', 1.6, 37.6],
];

// ---------------------------------------------------------------------------
// Proyeccion
// ---------------------------------------------------------------------------

const RAD = Math.PI / 180;
const [P1, P2, LAT0] = [36 * RAD, 43 * RAD, 40 * RAD];
const t = (phi) => Math.tan(Math.PI / 4 + phi / 2);
const N = Math.log(Math.cos(P1) / Math.cos(P2)) / Math.log(t(P2) / t(P1));
const F = (Math.cos(P1) * t(P1) ** N) / N;
const RHO0 = F / t(LAT0) ** N;

function lambert(lon, lat, lon0) {
  const rho = F / t(lat * RAD) ** N;
  const theta = N * (lon - lon0) * RAD;
  return [rho * Math.sin(theta), -(RHO0 - rho * Math.cos(theta))];
}

const esCanarias = (lon) => lon < -12;
const proyectar = (lon, lat) =>
  lambert(lon, lat, esCanarias(lon) ? -15.8 : -3.5);

// ---------------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------------

/** Douglas-Peucker sobre una linea abierta: conserva los extremos. */
function simplificar(puntos, tolerancia) {
  if (puntos.length < 3) return puntos;
  const conservar = new Uint8Array(puntos.length);
  conservar[0] = conservar[puntos.length - 1] = 1;
  const pila = [[0, puntos.length - 1]];
  while (pila.length) {
    const [a, b] = pila.pop();
    const [ax, ay] = puntos[a];
    const [bx, by] = puntos[b];
    const dx = bx - ax;
    const dy = by - ay;
    const largo = Math.hypot(dx, dy) || 1;
    let maximo = 0;
    let indice = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = puntos[i];
      const d =
        dx === 0 && dy === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs(dy * px - dx * py + bx * ay - by * ax) / largo;
      if (d > maximo) [maximo, indice] = [d, i];
    }
    if (maximo > tolerancia) {
      conservar[indice] = 1;
      pila.push([a, indice], [indice, b]);
    }
  }
  return puntos.filter((_, i) => conservar[i]);
}

/** Arcos de un TopoJSON (cuantizados y en diferencias), ya proyectados. */
function arcosProyectados(topologia, lon0) {
  const {
    scale: [sx, sy],
    translate: [tx, ty],
  } = topologia.transform;
  return topologia.arcs.map((arco) => {
    let [x, y] = [0, 0];
    return arco.map(([dx, dy]) => {
      x += dx;
      y += dy;
      const [lon, lat] = [x * sx + tx, y * sy + ty];
      return lon0 === undefined ? proyectar(lon, lat) : lambert(lon, lat, lon0);
    });
  });
}

/** Recorta un anillo por un rectangulo (Sutherland-Hodgman). */
function recortar(anillo, [xmin, ymin, xmax, ymax]) {
  const bordes = [
    [(p) => p[0] >= xmin, (a, b) => corte(a, b, 0, xmin)],
    [(p) => p[0] <= xmax, (a, b) => corte(a, b, 0, xmax)],
    [(p) => p[1] >= ymin, (a, b) => corte(a, b, 1, ymin)],
    [(p) => p[1] <= ymax, (a, b) => corte(a, b, 1, ymax)],
  ];
  let puntos = anillo;
  for (const [dentro, cruce] of bordes) {
    const entrada = puntos;
    puntos = [];
    for (let i = 0; i < entrada.length; i++) {
      const actual = entrada[i];
      const previo = entrada[(i + entrada.length - 1) % entrada.length];
      if (dentro(actual)) {
        if (!dentro(previo)) puntos.push(cruce(previo, actual));
        puntos.push(actual);
      } else if (dentro(previo)) puntos.push(cruce(previo, actual));
    }
    if (!puntos.length) break;
  }
  return puntos;
}

function corte(a, b, eje, valor) {
  const k = (valor - a[eje]) / (b[eje] - a[eje]);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

function area(anillo) {
  let s = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++)
    s += (anillo[j][0] + anillo[i][0]) * (anillo[j][1] - anillo[i][1]);
  return Math.abs(s / 2);
}

const fmt = (n) => String(Math.round(n * 10) / 10);

function trazado(anillos) {
  return anillos
    .map(
      (anillo) =>
        `M${anillo.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L')}Z`,
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

const respuesta = await fetch(URL_TOPOJSON);
if (!respuesta.ok) throw new Error(`No se pudo descargar ${URL_TOPOJSON}`);
const topo = await respuesta.json();
const { scale, translate } = topo.transform;

const arcos = arcosProyectados(topo);

const geometrias = topo.objects.autonomous_regions.geometries.filter((g) =>
  MARCAS.has(g.id),
);
const faltan = [...MARCAS.keys()].filter(
  (id) => !geometrias.some((g) => g.id === id),
);
if (faltan.length) throw new Error(`Faltan comunidades: ${faltan.join(', ')}`);

// Encuadre: la Peninsula, Baleares, Ceuta y Melilla fijan la escala.
const usados = new Set();
for (const g of geometrias) {
  const poligonos = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  for (const p of poligonos)
    for (const anillo of p) for (const a of anillo) usados.add(a < 0 ? ~a : a);
}
const caja = (puntos) => {
  const xs = puntos.map((p) => p[0]);
  const ys = puntos.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const peninsula = [];
const canarias = [];
for (const i of usados) {
  const g = topo.arcs[i];
  const lon = g[0][0] * scale[0] + translate[0];
  (esCanarias(lon) ? canarias : peninsula).push(...arcos[i]);
}
const [x0, y0, x1, y1] = caja(peninsula);
const escala = (ANCHO - 2 * MARGEN) / (x1 - x0);
const [cx0, cy0, cx1, cy1] = caja(canarias);

const altoPeninsula = (y1 - y0) * escala;
const ALTO = Math.ceil(MARGEN + altoPeninsula + SUR);

// Canarias: abajo a la derecha, en el mar al sur de Baleares.
const escalaCanarias = escala * ESCALA_CANARIAS;
const anchoCanarias = (cx1 - cx0) * escalaCanarias;
const altoCanarias = (cy1 - cy0) * escalaCanarias;
const HOLGURA = 14;
const recuadro = {
  x: ANCHO - MARGEN - anchoCanarias - 2 * HOLGURA,
  y: ALTO - MARGEN - altoCanarias - 2 * HOLGURA,
  ancho: anchoCanarias + 2 * HOLGURA,
  alto: altoCanarias + 2 * HOLGURA,
};

const aPantalla = ([x, y], enCanarias) =>
  enCanarias
    ? [
        recuadro.x + HOLGURA + (x - cx0) * escalaCanarias,
        recuadro.y + HOLGURA + (y - cy0) * escalaCanarias,
      ]
    : [MARGEN + (x - x0) * escala, MARGEN + (y - y0) * escala];

const simplificados = arcos.map((arco, i) => {
  const lon = topo.arcs[i][0][0] * scale[0] + translate[0];
  return simplificar(
    arco.map((p) => aPantalla(p, esCanarias(lon))),
    TOLERANCIA,
  );
});

function anillo(indices) {
  const puntos = [];
  for (const i of indices) {
    const arco = i < 0 ? [...simplificados[~i]].reverse() : simplificados[i];
    puntos.push(...(puntos.length ? arco.slice(1) : arco));
  }
  return puntos;
}

const comunidades = {};
for (const g of geometrias) {
  const poligonos = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  const anillos = poligonos
    .flatMap((p) => p.map(anillo))
    .filter((a) => a.length > 3 && area(a) >= AREA_MINIMA);
  const [lon, lat] = MARCAS.get(g.id);
  const [mx, my] = aPantalla(proyectar(lon, lat), esCanarias(lon));
  comunidades[g.id] = {
    nombre: g.properties.name,
    d: trazado(anillos),
    marca: { x: Math.round(mx), y: Math.round(my) },
  };
}

// Paises vecinos: recortados con holgura fuera del encuadre, para que el
// corte no se vea; el propio SVG recorta el resto.
const paises = await (await fetch(URL_PAISES)).json();
const arcosPaises = arcosProyectados(paises, -3.5);
const encuadre = [-60, -60, ANCHO + 60, ALTO + 60];
const vecinos = paises.objects.countries.geometries
  .filter((g) => VECINOS.has(g.id))
  .flatMap((g) => (g.type === 'Polygon' ? [g.arcs] : g.arcs))
  .flatMap((poligono) =>
    poligono.map((indices) => {
      const puntos = [];
      for (const i of indices) {
        const arco = i < 0 ? [...arcosPaises[~i]].reverse() : arcosPaises[i];
        puntos.push(...(puntos.length ? arco.slice(1) : arco));
      }
      const pantalla = puntos.map((p) => aPantalla(p, false));
      return simplificar(recortar(pantalla, encuadre), TOLERANCIA);
    }),
  )
  .filter((a) => a.length > 3 && area(a) >= AREA_MINIMA);

const rotulos = ROTULOS.map(([clave, lon, lat]) => {
  const [x, y] = aPantalla(proyectar(lon, lat), false);
  return { clave, x: Math.round(x), y: Math.round(y) };
});

await escribirDatos('mapa.json', {
  fuente:
    'Comunidades: Instituto Geográfico Nacional (CC BY 4.0), vía es-atlas 0.6.0. Países vecinos: Natural Earth, vía world-atlas 2.0.2. Generado con pnpm datos:mapa.',
  ancho: ANCHO,
  alto: ALTO,
  recuadro: Object.fromEntries(
    Object.entries(recuadro).map(([k, v]) => [k, Math.round(v)]),
  ),
  rotulos,
  vecinos: trazado(vecinos),
  comunidades,
});

const peso = JSON.stringify(comunidades).length;
console.log(
  `Mapa: ${Object.keys(comunidades).length} comunidades, ${ANCHO}x${ALTO}, ${(peso / 1024).toFixed(1)} KB de trazados.`,
);
