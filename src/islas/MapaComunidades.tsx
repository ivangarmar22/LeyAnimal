import type { Ambito, EstadoRequisito } from '@/lib/reglas';
import { ArrowRight } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import mapa from '@/datos/mapa.json';
import { ruta } from '@/lib/rutas';
import {
  crearTraductor,
  type Mensajes,
  type Traductor,
} from '@/i18n/traductor';
import { ESTADOS, ORDEN_ESTADOS } from '@/lib/dominio/estados';
import { cn } from '@/lib/cn';
import { ChipAmbito, ChipEstado } from '@/ui/Chips';

export type Capa = 'seguro' | 'identificacion' | 'censo';
export type EstadoCapa = {
  estado: EstadoRequisito;
  /** Norma y articulo que lo regulan, si estan verificados. */
  norma: string | null;
  ambito: Ambito | null;
};
export type CasillaMapa = {
  codigo: string;
  nombre: string;
  slug: string;
  capas: Record<Capa, EstadoCapa>;
};

/** Trazado SVG y punto donde va su icono. */
type Region = { d: string; marca: { x: number; y: number } };
const REGIONES: Record<string, Region> = mapa.comunidades;
const { ancho: ANCHO, alto: ALTO, recuadro: RECUADRO } = mapa;

/** Prefijo de los tokens de color de cada estado (--color-<tono>-texto). */
const TONO: Record<EstadoRequisito, string> = {
  obligatorio: 'obligatorio',
  obligatorio_pendiente_reglamento: 'pendiente',
  recomendado: 'recomendado',
  no_aplica: 'noaplica',
  sin_datos: 'sindatos',
};

/** Ciudades autonomas: tan pequenas que se marcan con un punto y su nombre. */
const CIUDADES = new Set(['18', '19']);

const CAPAS: Capa[] = ['seguro', 'identificacion', 'censo'];

/** Posicion en porcentaje del contenedor, para lo que va sobre el SVG. */
const enPorcentaje = (x: number, y: number) => ({
  left: `${(x / ANCHO) * 100}%`,
  top: `${(y / ALTO) * 100}%`,
});

export default function MapaComunidades({
  textos,
  casillas,
}: {
  textos: Mensajes;
  casillas: CasillaMapa[];
}) {
  const tg = crearTraductor(textos);
  const t = tg.en('mapa');
  const [capa, setCapa] = useState<Capa>('seguro');
  const [resaltado, setResaltado] = useState<EstadoRequisito | null>(null);
  const [activa, setActiva] = useState<string | null>(null);
  const [barrido, setBarrido] = useState(false);

  // El retardo del barrido solo vale al cambiar de capa, no al pasar el cursor
  useEffect(() => {
    if (!barrido) return;
    const id = setTimeout(() => setBarrido(false), 1000);
    return () => clearTimeout(id);
  }, [barrido, capa]);

  const total = casillas.length;
  const recuento = new Map<EstadoRequisito, number>();
  for (const c of casillas) {
    const e = c.capas[capa].estado;
    recuento.set(e, (recuento.get(e) ?? 0) + 1);
  }
  const presentes = ORDEN_ESTADOS.filter((e) => recuento.has(e));
  const activaCasilla = casillas.find((c) => c.codigo === activa) ?? null;
  const activaRegion = activaCasilla ? REGIONES[activaCasilla.codigo] : null;
  const atenuada = (c: CasillaMapa) =>
    resaltado !== null && resaltado !== c.capas[capa].estado;

  const elegirCapa = (c: Capa) => {
    if (c === capa) return;
    setCapa(c);
    setResaltado(null);
    setBarrido(true);
  };

  return (
    <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
      {/* En escritorio, capa y recuento van a la derecha del mapa */}
      <div class="flex flex-col gap-6 xl:order-2">
        <div
          class="flex flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label={t('capa')}
        >
          {CAPAS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={capa === c}
              onClick={() => elegirCapa(c)}
              class={cn(
                'min-h-11 rounded-full border px-5 text-[0.9375rem] font-medium transition-colors',
                capa === c
                  ? 'border-marca-600 bg-marca-50 font-semibold text-marca-700 shadow-[inset_0_0_0_1px_var(--color-marca-600)]'
                  : 'border-borde-control bg-superficie text-texto-2 hover:border-marca-600 hover:text-texto',
              )}
            >
              {t(c)}
            </button>
          ))}
        </div>

        <div class="rounded-2xl border border-borde bg-superficie-2 p-4 sm:p-5">
          <p class="mb-3 text-sm font-medium text-texto">
            {t('resumen', { capa: t(capa), n: total })}
          </p>
          <div
            class="flex h-2.5 overflow-hidden rounded-full bg-borde"
            aria-hidden="true"
          >
            {ORDEN_ESTADOS.map((e) => (
              <span
                key={e}
                class="recuento-tramo"
                style={{
                  width: `${((recuento.get(e) ?? 0) / total) * 100}%`,
                  background: `var(--color-${TONO[e]}-texto)`,
                  opacity: resaltado && resaltado !== e ? 0.25 : 1,
                }}
              />
            ))}
          </div>
          <div
            class="mt-4 flex flex-wrap gap-2 xl:flex-col xl:items-stretch"
            role="group"
            aria-label={t('resaltar')}
          >
            {presentes.map((e) => {
              const { Icono, chip } = ESTADOS[e];
              const pulsado = resaltado === e;
              const n = recuento.get(e) ?? 0;
              return (
                <button
                  key={e}
                  type="button"
                  aria-pressed={pulsado}
                  onClick={() => setResaltado(pulsado ? null : e)}
                  class={cn(
                    'flex min-h-11 items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3.5 text-left text-sm font-medium transition-[box-shadow,opacity]',
                    chip,
                    pulsado && 'shadow-[inset_0_0_0_1px_currentColor]',
                    resaltado && !pulsado && 'opacity-60 hover:opacity-100',
                  )}
                >
                  <Icono class="size-4 shrink-0" aria-hidden />
                  <span class="grow">{tg(`estados.${e}`)}</span>
                  <span class="rounded-full bg-superficie px-2 py-0.5 font-display text-[0.8125rem] font-semibold tabular-nums">
                    <span aria-hidden="true">{n}</span>
                    <span class="sr-only">{t('comunidades', { n })}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p class="hidden text-sm text-texto-3 xl:block">{t('pista')}</p>
      </div>

      <div class={cn('mapa', barrido && 'mapa--barrido')}>
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          class="block h-auto w-full"
          role="group"
          aria-label={t(capa)}
        >
          <path d={mapa.vecinos} class="mapa__vecinos" />
          <rect
            x={RECUADRO.x}
            y={RECUADRO.y}
            width={RECUADRO.ancho}
            height={RECUADRO.alto}
            rx="14"
            class="mapa__recuadro"
          />
          {casillas.map((c) => {
            const region = REGIONES[c.codigo];
            if (!region) return null;
            const { estado, norma } = c.capas[capa];
            const tono = TONO[estado];
            return (
              <a
                key={c.codigo}
                href={ruta(`/comunidades/${c.slug}`)}
                aria-label={`${c.nombre}: ${tg(`estados.${estado}`)}. ${norma ?? t('sinNorma')}`}
                class={cn(
                  'mapa__region',
                  atenuada(c) && 'mapa__region--atenuada',
                )}
                style={{
                  '--relleno': `var(--color-${tono}-borde)`,
                  '--intenso': `var(--color-${tono}-texto)`,
                  '--retardo': `${Math.round((region.marca.x / ANCHO) * 450)}ms`,
                }}
                onPointerEnter={() => setActiva(c.codigo)}
                onPointerLeave={() => setActiva(null)}
                onFocus={() => setActiva(c.codigo)}
                onBlur={() => setActiva(null)}
              >
                <path d={region.d} />
                {CIUDADES.has(c.codigo) && (
                  <circle
                    cx={region.marca.x}
                    cy={region.marca.y}
                    r="7"
                    class="mapa__punto"
                  />
                )}
              </a>
            );
          })}
          {/* Contorno de la comunidad activa por encima de sus vecinas */}
          {activaCasilla && activaRegion && (
            <path
              d={activaRegion.d}
              class="mapa__contorno"
              style={{
                stroke: `var(--color-${TONO[activaCasilla.capas[capa].estado]}-texto)`,
              }}
            />
          )}
        </svg>

        {/* Lo que va sobre el mapa es HTML para que no encoja con el SVG */}
        <div class="mapa__capa" aria-hidden="true">
          {mapa.rotulos.map((r) => (
            <span
              key={r.clave}
              class="mapa__rotulo"
              style={enPorcentaje(r.x, r.y)}
            >
              {t(r.clave)}
            </span>
          ))}
          {casillas.map((c) => {
            const region = REGIONES[c.codigo];
            if (!region) return null;
            const { x, y } = region.marca;
            const { estado } = c.capas[capa];
            const { Icono, chip } = ESTADOS[estado];
            return (
              <span
                key={c.codigo}
                class={cn(
                  'mapa__marca',
                  chip,
                  atenuada(c) && 'opacity-30',
                  activa === c.codigo && 'mapa__marca--activa',
                  CIUDADES.has(c.codigo) && 'mapa__marca--ciudad',
                )}
                style={enPorcentaje(x, y)}
              >
                <Icono aria-hidden />
                {CIUDADES.has(c.codigo) && (
                  <span class="mapa__ciudad">{c.nombre}</span>
                )}
              </span>
            );
          })}
          {activaCasilla && (
            <Ficha casilla={activaCasilla} capa={capa} tg={tg} />
          )}
        </div>
      </div>

      {/* En movil el mapa queda pequeno: debajo, una tarjeta por comunidad */}
      <ul class="lista-mapa">
        {casillas.map((c) => {
          const { estado, norma } = c.capas[capa];
          const { Icono, bloque, chip } = ESTADOS[estado];
          // La primera clase del chip es su color de texto.
          const colorTexto = chip.split(' ')[0];
          return (
            <li key={c.codigo}>
              <a
                href={ruta(`/comunidades/${c.slug}`)}
                class={cn(
                  'ficha-mapa h-full border',
                  bloque,
                  atenuada(c) && 'ficha-mapa--atenuada',
                )}
              >
                <span class="font-semibold text-texto">{c.nombre}</span>
                <span
                  class={cn(
                    'flex items-center gap-1.5 font-medium',
                    colorTexto,
                  )}
                >
                  <Icono class="size-4 shrink-0" aria-hidden />
                  {tg(`estados.${estado}`)}
                </span>
                <span class="text-xs leading-snug text-texto-3">
                  {norma ?? t('sinNorma')}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Tarjeta que sale sobre la comunidad que se senala, anclada a su icono.
 * Se gira hacia dentro cerca de los bordes para no salirse del mapa.
 */
function Ficha({
  casilla,
  capa,
  tg,
}: {
  casilla: CasillaMapa;
  capa: Capa;
  tg: Traductor;
}) {
  const { x, y } = REGIONES[casilla.codigo]?.marca ?? { x: 0, y: 0 };
  const { estado, norma, ambito } = casilla.capas[capa];
  const horizontal =
    x < ANCHO * 0.22 ? '-12%' : x > ANCHO * 0.78 ? '-88%' : '-50%';
  const debajo = y < ALTO * 0.3;
  return (
    <div
      key={casilla.codigo}
      class="mapa__ficha"
      style={{
        ...enPorcentaje(x, y),
        transform: `translate(${horizontal}, ${debajo ? '22px' : 'calc(-100% - 22px)'})`,
      }}
    >
      <p class="font-display text-base font-semibold text-texto">
        {casilla.nombre}
      </p>
      <ChipEstado estado={estado} t={tg} class="mt-2" />
      {norma ? (
        <p class="mt-3 text-[0.8125rem] leading-snug text-texto-2">
          {ambito && <ChipAmbito ambito={ambito} t={tg} class="mr-1.5 mb-1" />}
          {norma}
        </p>
      ) : (
        <p class="mt-3 text-[0.8125rem] text-texto-3">{tg('mapa.sinNorma')}</p>
      )}
      <p class="mt-3 flex items-center gap-1 text-[0.8125rem] font-semibold text-marca-700">
        {tg('mapa.verComunidad')}
        <ArrowRight class="size-3.5" aria-hidden />
      </p>
    </div>
  );
}
