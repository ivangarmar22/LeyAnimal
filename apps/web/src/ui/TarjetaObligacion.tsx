import { ArrowRight, CircleAlert, Clock, UserRound } from 'lucide-preact';
import { ruta } from '@/i18n/idiomas';
import type { Traductor } from '@/i18n/traductor';
import type { ObligacionEvaluada } from '@/lib/datos/evaluacion';
import { notaRegla, parrafos, textosRequisito } from '@/lib/datos/textos';
import { cn } from '@/lib/cn';
import { ChipAmbito, ChipEstado } from './Chips';
import { CitaLegal } from './CitaLegal';
import { Traza } from './Traza';

const PARAMETROS = [
  'validez_anios',
  'cobertura_minima_eur',
  'edad_limite_meses',
] as const;
type Parametro = (typeof PARAMETROS)[number];
const esParametro = (clave: string): clave is Parametro =>
  (PARAMETROS as readonly string[]).includes(clave);

/** Espacios de textos que necesita la tarjeta (para las islas). */
export const TEXTOS_TARJETA = [
  'tarjeta',
  'traza',
  'requisitos',
  'parametros',
  'notasReglas',
  'estados',
  'estadosDescripcion',
  'ambitos',
  'ambitosRegla',
  'ley',
  'comun',
] as const;

/**
 * Una obligacion evaluada: estado, ambito, que significa, plazo, parametros
 * y su fundamento legal literal. Lo que el motor no puede afirmar (sin datos,
 * no aplica) se muestra en version compacta y sin citas: no hay nada que
 * citar cuando no afirmamos nada.
 */
export function TarjetaObligacion({
  obligacion,
  t,
  conTraza = true,
  compacta = false,
  class: clase,
}: {
  obligacion: ObligacionEvaluada;
  t: Traductor;
  conTraza?: boolean;
  compacta?: boolean;
  class?: string;
}) {
  const tt = t.en('tarjeta');
  const tp = t.en('parametros');
  const { requisito, resultado, ambito, fuentes, regla } = obligacion;
  const textos = textosRequisito(t.en('requisitos'), requisito);
  const afirma =
    resultado.estado !== 'sin_datos' && resultado.estado !== 'no_aplica';
  // Sin afirmacion no se muestra la descripcion del requisito, que esta
  // redactada para cuando si obliga ("Tu comunidad exige...").
  const descripcion = afirma
    ? textos.descripcion
    : t(`estadosDescripcion.${resultado.estado}`);
  const nota = afirma ? notaRegla(t.en('notasReglas'), regla) : null;
  const parametros = Object.entries(resultado.parametros).filter(
    (p): p is [Parametro, number] =>
      esParametro(p[0]) && typeof p[1] === 'number',
  );

  return (
    <article
      id={requisito.clave}
      class={cn('tarjeta scroll-mt-28 gap-4', compacta && 'p-5 sm:p-6', clase)}
    >
      <div class="flex flex-wrap items-center gap-2">
        <ChipEstado estado={resultado.estado} t={t} />
        {ambito && afirma ? <ChipAmbito ambito={ambito} t={t} /> : null}
      </div>

      <div>
        <h3 class="titulo-3">{textos.titulo}</h3>
        {descripcion ? <p class="mt-2">{descripcion}</p> : null}
      </div>

      {afirma && !compacta ? (
        <>
          <dl class="grid gap-x-8 gap-y-4 text-[0.9375rem] sm:grid-cols-2">
            {textos.plazo ? (
              <div class="flex gap-3">
                <Clock
                  class="mt-0.5 size-[18px] shrink-0 text-marca-600"
                  aria-hidden
                />
                <div>
                  <dt class="text-texto-3">{tt('plazo')}</dt>
                  <dd class="font-medium text-texto">{textos.plazo}</dd>
                </div>
              </div>
            ) : null}
            {textos.quien ? (
              <div class="flex gap-3">
                <UserRound
                  class="mt-0.5 size-[18px] shrink-0 text-marca-600"
                  aria-hidden
                />
                <div>
                  <dt class="text-texto-3">{tt('quien')}</dt>
                  <dd class="font-medium text-texto">{textos.quien}</dd>
                </div>
              </div>
            ) : null}
            {parametros.map(([clave, valor]) => (
              <div key={clave} class="rounded-2xl bg-marca-50 px-4 py-3">
                <dt class="text-sm text-texto-3">{tp(`${clave}.etiqueta`)}</dt>
                <dd class="cifras font-display text-lg font-semibold text-marca-700">
                  {tp(`${clave}.valor`, { valor })}
                </dd>
              </div>
            ))}
          </dl>

          {textos.explicacion ? (
            <details class="group rounded-2xl border border-borde px-4 py-1 open:pb-4">
              <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium text-texto [&::-webkit-details-marker]:hidden">
                {tt('queHacer')}
                <ArrowRight
                  class="size-4 text-texto-3 transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <div class="grid gap-3 text-[0.9375rem]">
                {parrafos(textos.explicacion).map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </details>
          ) : null}
        </>
      ) : null}

      {resultado.faltanDatosDelUsuario ? (
        <p class="flex gap-2 text-sm text-sindatos-texto">
          <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden />
          {tt('faltanDatos')}
        </p>
      ) : null}

      {/* Fundamento legal: sin esto no se afirma nada (brief, §16) */}
      {afirma ? (
        fuentes.length > 0 ? (
          <div class="grid gap-3">
            <p class="rotulo">{tt('fundamento')}</p>
            {fuentes.map((f) => (
              <CitaLegal
                key={f.articulo.id}
                norma={f.norma}
                articulo={f.articulo}
                cita={f.cita}
                t={t}
              />
            ))}
            {nota ? <p class="text-sm text-texto-3">{nota}</p> : null}
          </div>
        ) : (
          <p class="text-sm text-pendiente-texto">{tt('sinFundamento')}</p>
        )
      ) : null}

      {resultado.estado === 'sin_datos' ? (
        <a
          href={ruta('/colabora', t.idioma)}
          class="enlace-flecha self-start text-sm"
        >
          {tt('sinDatosCta')}
          <ArrowRight aria-hidden />
        </a>
      ) : null}

      {conTraza ? <Traza obligacion={obligacion} t={t} /> : null}
    </article>
  );
}
