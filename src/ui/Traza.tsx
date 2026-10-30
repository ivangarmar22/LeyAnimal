import { ArrowRight } from 'lucide-preact';
import { ruta } from '@/lib/rutas';
import type { Traductor } from '@/i18n/traductor';
import type { ObligacionEvaluada } from '@/lib/datos/evaluacion';

/**
 * "¿Por que me sale esto?". Traduce la traza del motor a frases. Las reglas
 * de otros territorios se omiten: son la mayoria y no explican nada del caso
 * concreto.
 */
export function Traza({
  obligacion,
  t,
}: {
  obligacion: ObligacionEvaluada;
  t: Traductor;
}) {
  const tt = t.en('traza');
  const { resultado, requisito } = obligacion;
  const pasos = resultado.traza.filter(
    (p) => p.motivo !== 'territorio_distinto',
  );
  const revisadas = pasos.filter((p) => p.reglaId !== '').length;

  const frases = pasos.map((paso) => {
    const ambito = t(`ambitosRegla.${paso.ambito}`);
    if (paso.motivo !== 'gana') {
      return paso.motivo === 'aplica' ? null : tt(paso.motivo, { ambito });
    }
    // Pasos finales sin regla: el motor explica por que no hay afirmacion.
    if (paso.reglaId === '') {
      if (paso.estado === 'no_aplica') return tt('noAplica');
      if (requisito.exigeNormaTerritorial) return tt('dependeTerritorio');
      return resultado.faltanDatosDelUsuario
        ? tt('sinEvaluar')
        : tt('sinReglas');
    }
    // Una regla "gana" pero el resultado es sin_datos: es una duda que habria
    // prevalecido y que no se puede resolver sin un dato de la persona.
    if (resultado.estado === 'sin_datos')
      return tt('dudaRelevante', { ambito });
    return tt('gana', { ambito, estado: t(`estados.${paso.estado}`) });
  });

  return (
    <details class="no-imprimir group border-t border-borde pt-3">
      <summary class="resumen gap-2 text-[0.9375rem] text-marca-700">
        <ArrowRight
          class="size-4 transition-transform group-open:rotate-90"
          aria-hidden
        />
        {t('tarjeta.porQue')}
      </summary>
      <div class="grid gap-3 pt-2 pb-1 text-[0.9375rem]">
        {revisadas > 0 ? (
          <p class="text-texto-3">{tt('revisadas', { n: revisadas })}</p>
        ) : null}
        <ol class="vinetas grid gap-2">
          {frases.map((frase, i) => (frase ? <li key={i}>{frase}</li> : null))}
        </ol>
        <a
          href={`${ruta('/metodologia')}#conflictos`}
          class="enlace-texto self-start text-sm"
        >
          {tt('metodo')}
        </a>
      </div>
    </details>
  );
}
