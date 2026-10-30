import type { EstadoRequisito } from '@/lib/reglas';
import {
  ArrowRight,
  Check,
  Clock,
  HelpCircle,
  Info,
  Link2,
  Minus,
  Printer,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ruta } from '@/lib/rutas';
import type { Traductor } from '@/i18n/traductor';
import type { ConsultaResuelta } from '@/lib/datos/evaluacion';
import { comunidad, provincia } from '@/lib/datos/geografia';
import { ORDEN_ESTADOS } from '@/lib/dominio/estados';
import { formatearFecha } from '@/lib/fechas';
import {
  queryCompartible,
  type EstadoConsulta,
} from '@/lib/validacion/consulta';
import { ChipEstado } from '@/ui/Chips';
import { TarjetaObligacion } from '@/ui/TarjetaObligacion';
import { fueraDelListado } from './especies';

/** Guia por situacion que se ofrece al final del resultado. */
export type EnlaceSituacion = {
  slug: string;
  titulo: string;
  /** Animales por los que filtra la guia. */
  animales: string[];
};

/** Especie de la consulta -> animal del filtro de las guias. */
const ANIMAL_GUIA: Record<string, string> = {
  perro: 'perro',
  gato: 'gato',
  huron: 'huron',
  ave: 'ave',
};

/**
 * Guias por situacion para el animal consultado, filtradas por el: la de
 * perros de asistencia solo para perros, y la primera si lo es.
 */
function Situaciones({
  situaciones,
  estado,
  t,
}: {
  situaciones: EnlaceSituacion[];
  estado: EstadoConsulta;
  t: Traductor;
}) {
  const animal = estado.especie
    ? (ANIMAL_GUIA[estado.especie] ?? 'otro')
    : undefined;
  const lista = situaciones
    .filter((s) => s.slug !== 'perro-de-asistencia' || animal === 'perro')
    .sort(
      (a, b) =>
        Number(
          b.slug === 'perro-de-asistencia' && estado.uso === 'asistencia',
        ) -
        Number(a.slug === 'perro-de-asistencia' && estado.uso === 'asistencia'),
    );
  return (
    <aside class="no-imprimir" aria-labelledby="h-situaciones">
      <h3 id="h-situaciones" class="titulo-3">
        {t('situaciones.consulta.titulo')}
      </h3>
      <p class="mt-1 text-[0.9375rem]">{t('situaciones.consulta.texto')}</p>
      <ul class="mt-4 flex flex-wrap gap-2">
        {lista.map((s) => {
          const filtro =
            animal && s.animales.length > 1 && s.animales.includes(animal)
              ? `?animal=${animal}`
              : '';
          return (
            <li key={s.slug}>
              <a
                href={`${ruta(`/situaciones/${s.slug}`)}${filtro}`}
                class="pastilla pastilla--enlace font-medium text-texto"
              >
                {s.titulo}
                <ArrowRight aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

type Grupo = {
  estado: EstadoRequisito;
  titulo: string;
  texto: string;
  Icono: LucideIcon;
  color: string;
};

/** Copiar enlace e imprimir. El enlace no lleva el nombre del animal. */
function Acciones({ estado, t }: { estado: EstadoConsulta; t: Traductor }) {
  const [situacion, setSituacion] = useState<'inicial' | 'copiado' | 'manual'>(
    'inicial',
  );
  const [enlace, setEnlace] = useState('');

  async function copiar() {
    const url = `${location.origin}${location.pathname}?${queryCompartible(estado)}`;
    setEnlace(url);
    try {
      await navigator.clipboard.writeText(url);
      setSituacion('copiado');
    } catch {
      // Sin permiso de portapapeles: se muestra para copiarlo a mano.
      setSituacion('manual');
    }
  }

  return (
    <div class="no-imprimir">
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="boton boton--sm boton--contorno"
          onClick={() => void copiar()}
        >
          {situacion === 'copiado' ? (
            <Check aria-hidden />
          ) : (
            <Link2 aria-hidden />
          )}
          {situacion === 'copiado' ? t('copiado') : t('copiar')}
        </button>
        <button
          type="button"
          class="boton boton--sm boton--contorno"
          onClick={() => window.print()}
        >
          <Printer aria-hidden />
          {t('imprimir')}
        </button>
      </div>
      <p class="sr-only" aria-live="polite">
        {situacion === 'copiado' ? t('copiado') : ''}
      </p>
      {situacion !== 'inicial' ? (
        <p class="mt-3 text-sm text-texto-3">{t('avisoEnlace')}</p>
      ) : null}
      {situacion === 'manual' ? (
        <div class="mt-3 max-w-xl">
          <label for="enlace-consulta" class="text-sm text-texto-2">
            {t('copiarManual')}
          </label>
          <input
            id="enlace-consulta"
            readOnly
            value={enlace}
            onFocus={(e) => e.currentTarget.select()}
            class="campo mt-1.5 h-11 text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Paso 4, calculado con el motor de reglas: primero lo exigible hoy, luego lo
 * que la ley enuncia pero aun no se puede exigir, luego lo que no sabemos y al
 * final lo que no te afecta.
 */
export function Resultado({
  consulta,
  estado,
  situaciones,
  t: tg,
}: {
  consulta: ConsultaResuelta;
  estado: EstadoConsulta;
  situaciones: EnlaceSituacion[];
  t: Traductor;
}) {
  const t = tg.en('resultado');
  const { obligaciones, municipio } = consulta;
  const p = provincia(municipio.provincia);
  const c = comunidad(municipio.comunidad);
  const cuentas = ORDEN_ESTADOS.map((e) => ({
    estado: e,
    n: obligaciones.filter((o) => o.resultado.estado === e).length,
  })).filter((x) => x.n > 0);

  const grupos: Grupo[] = [
    {
      estado: 'obligatorio',
      titulo: t('ojo'),
      texto: t('ojoTexto'),
      Icono: ShieldAlert,
      color: 'text-obligatorio-texto',
    },
    {
      estado: 'obligatorio_pendiente_reglamento',
      titulo: t('pendiente'),
      texto: t('pendienteTexto'),
      Icono: Clock,
      color: 'text-pendiente-texto',
    },
    {
      estado: 'recomendado',
      titulo: tg('estados.recomendado'),
      texto: tg('estadosDescripcion.recomendado'),
      Icono: Info,
      color: 'text-recomendado-texto',
    },
    {
      estado: 'sin_datos',
      titulo: t('sinDatos'),
      texto: t('sinDatosTexto'),
      Icono: HelpCircle,
      color: 'text-sindatos-texto',
    },
    {
      estado: 'no_aplica',
      titulo: t('noAplica'),
      texto: t('noAplicaTexto'),
      Icono: Minus,
      color: 'text-noaplica-texto',
    },
  ];
  const colabora = `${ruta('/colabora')}?tipo=falta_ordenanza&municipio=${encodeURIComponent(`${municipio.nombre} (${p?.nombre ?? ''})`)}`;

  return (
    <div class="grid gap-12">
      <p class="sr-only" aria-live="polite">
        {t('anuncio', { n: obligaciones.length, municipio: municipio.nombre })}
      </p>

      <header class="grid gap-5 border-b border-borde pb-8">
        {typeof location === 'undefined' ? null : (
          <p class="hidden text-sm text-texto-3 print:block">
            {t('impreso', {
              url: `${location.origin}${location.pathname}?${queryCompartible(estado)}`,
            })}
          </p>
        )}
        <div>
          <h2 class="titulo-2">
            {estado.nombre
              ? t('tituloNombre', { nombre: estado.nombre })
              : t('titulo')}
          </h2>
          <p class="entradilla mt-2">
            {t('lugar', {
              municipio: municipio.nombre,
              provincia: p?.nombre ?? '',
              comunidad: c?.nombre ?? '',
            })}
          </p>
        </div>
        <ul class="flex flex-wrap gap-2" aria-label={t('semaforo')}>
          {cuentas.map(({ estado: e, n }) => (
            <li
              key={e}
              class="inline-flex items-center gap-2 rounded-full border border-borde bg-superficie py-1 pr-3 pl-1 shadow-suave"
            >
              <ChipEstado estado={e} t={tg} />
              <span class="cifras text-sm font-semibold text-texto">{n}</span>
            </li>
          ))}
        </ul>
        <p class="text-sm text-texto-3">
          {t('hoy', { fecha: formatearFecha(new Date()) })}
        </p>
        <Acciones estado={estado} t={t} />
      </header>

      {fueraDelListado(estado.especie) ? (
        <p class="flex gap-3 rounded-2xl border border-pendiente-borde bg-pendiente-fondo p-4 text-[0.9375rem] text-pendiente-texto">
          <Info class="mt-0.5 size-5 shrink-0" aria-hidden />
          {t('especieLimitada')}
        </p>
      ) : null}

      {grupos.map((grupo) => {
        const lista = obligaciones.filter(
          (o) => o.resultado.estado === grupo.estado,
        );
        if (lista.length === 0) return null;
        const compacta = grupo.estado === 'no_aplica';
        return (
          <section key={grupo.estado} aria-labelledby={`grupo-${grupo.estado}`}>
            <div class="flex items-start gap-3">
              <grupo.Icono
                class={`mt-1 size-6 shrink-0 ${grupo.color}`}
                aria-hidden
              />
              <div>
                <h3 id={`grupo-${grupo.estado}`} class="titulo-3">
                  {grupo.titulo}{' '}
                  <span class="cifras text-texto-3">· {lista.length}</span>
                </h3>
                {grupo.texto ? (
                  <p class="mt-1 text-[0.9375rem]">{grupo.texto}</p>
                ) : null}
              </div>
            </div>
            <div class={`mt-6 grid gap-4 ${compacta ? 'md:grid-cols-2' : ''}`}>
              {lista.map((o) => (
                <TarjetaObligacion
                  key={o.requisito.clave}
                  obligacion={o}
                  t={tg}
                  compacta={compacta}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div class="no-imprimir">
        <Situaciones situaciones={situaciones} estado={estado} t={tg} />
      </div>

      <aside class="no-imprimir tarjeta seccion--suave gap-3 border-dashed">
        <h3 class="titulo-3">
          {t('ordenanzaTitulo', { municipio: municipio.nombre })}
        </h3>
        <p>{t('ordenanzaTexto')}</p>
        <a href={colabora} class="enlace-flecha mt-1 self-start">
          {t('ordenanzaCta')}
          <ArrowRight aria-hidden />
        </a>
      </aside>
    </div>
  );
}
