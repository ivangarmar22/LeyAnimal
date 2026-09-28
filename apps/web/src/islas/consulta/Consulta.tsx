import {
  ArrowLeft,
  ArrowRight,
  Info,
  Loader2,
  MapPin,
  Pencil,
} from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import {
  cargarMunicipios,
  type IndiceMunicipios,
} from '@/lib/datos/cargar-municipios';
import { resolverConsulta } from '@/lib/datos/evaluacion';
import { provincia } from '@/lib/datos/geografia';
import { raza } from '@/lib/datos/normativa';
import { cn } from '@/lib/cn';
import {
  aQuery,
  ESPECIES,
  leerConsulta,
  pasoMaximoAlcanzable,
  type EstadoConsulta,
} from '@/lib/validacion/consulta';
import { Combobox } from '@/ui/Combobox';
import { PasosWizard } from '@/ui/PasosWizard';
import { fueraDelListado, ICONOS_ESPECIE } from './especies';
import { PasoAnimal } from './PasoAnimal';
import { Resultado } from './Resultado';

type Ciudad = { slug: string; nombre: string };

/**
 * Asistente de consulta. El estado vive en la URL (?paso=2&especie=perro...):
 * el enlace se puede compartir y el boton de atras del navegador vuelve al
 * paso anterior. Todo se calcula aqui, en el navegador, con el mismo motor de
 * reglas que las paginas; no se envia la consulta a ningun servidor.
 */
export default function Consulta({
  idioma,
  textos,
  ciudades,
}: {
  idioma: Idioma;
  textos: Mensajes;
  ciudades: Ciudad[];
}) {
  const tg = crearTraductor(textos, idioma);
  const t = tg.en('consulta');
  const [estado, setEstado] = useState<EstadoConsulta>(() =>
    leerConsulta(new URLSearchParams(location.search)),
  );
  const [indice, setIndice] = useState<IndiceMunicipios | null>(null);
  const [errorIndice, setErrorIndice] = useState(false);
  const arriba = useRef<HTMLDivElement>(null);

  // El indice de municipios se descarga en cuanto hace falta: paso 2 o un
  // enlace que ya trae municipio.
  const necesitaIndice = estado.paso >= 2 || Boolean(estado.municipio);
  useEffect(() => {
    if (!necesitaIndice || indice) return;
    let vivo = true;
    cargarMunicipios()
      .then((i) => vivo && setIndice(i))
      .catch(() => vivo && setErrorIndice(true));
    return () => {
      vivo = false;
    };
  }, [necesitaIndice, indice]);

  // Atras y adelante del navegador.
  useEffect(() => {
    const alVolver = () =>
      setEstado(leerConsulta(new URLSearchParams(location.search)));
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  function ir(cambios: Partial<EstadoConsulta>) {
    const nuevo = { ...estado, ...cambios };
    history.pushState(null, '', `?${aQuery(nuevo)}`);
    setEstado(nuevo);
    arriba.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const m =
    estado.municipio && indice ? indice.municipio(estado.municipio) : undefined;
  const p = m ? provincia(m.provincia) : undefined;
  const r = estado.raza ? raza(estado.raza) : undefined;
  const alcanzable = pasoMaximoAlcanzable(estado);
  // No se puede saltar a un paso sin haber respondido los anteriores.
  const paso = Math.min(estado.paso, alcanzable);
  const etiquetas = [
    t('pasos.especie'),
    t('pasos.municipio'),
    t('pasos.animal'),
    t('pasos.resultado'),
  ];

  const edad = [
    estado.edadAnios ? t('resumen.anios', { n: estado.edadAnios }) : null,
    estado.edadMeses ? t('resumen.meses', { n: estado.edadMeses }) : null,
  ].filter((x): x is string => Boolean(x));
  const resumen: { etiqueta: string; valor: string; paso: number }[] = [];
  if (estado.especie)
    resumen.push({
      etiqueta: t('resumen.especie'),
      valor: tg(`especies.${estado.especie}`),
      paso: 1,
    });
  if (m)
    resumen.push({
      etiqueta: t('resumen.municipio'),
      valor: `${m.nombre} (${p?.nombre ?? ''})`,
      paso: 2,
    });
  if (r)
    resumen.push({ etiqueta: t('resumen.raza'), valor: r.nombre, paso: 3 });
  if (edad.length > 0) {
    resumen.push({
      etiqueta: t('resumen.edad'),
      valor:
        edad.length === 2
          ? t('resumen.y', { a: edad[0] ?? '', b: edad[1] ?? '' })
          : (edad[0] ?? ''),
      paso: 3,
    });
  }

  const esperandoIndice = Boolean(estado.municipio) && !indice && !errorIndice;
  const consulta = paso === 4 && m ? resolverConsulta(estado, m) : null;

  let contenido;
  if (esperandoIndice && paso >= 3) {
    contenido = (
      <p class="flex items-center gap-3 py-10 text-texto-3" role="status">
        <Loader2 class="size-5 animate-spin" aria-hidden />
        {tg('comun.cargando')}
      </p>
    );
  } else if (paso >= 3 && estado.municipio && !m) {
    contenido = (
      <div class="grid gap-4 py-6">
        <h2 class="titulo-3">{tg('resultado.municipioDesconocido')}</h2>
        <p>{tg('resultado.municipioDesconocidoTexto')}</p>
        <button
          type="button"
          class="boton boton--principal justify-self-start"
          onClick={() => ir({ paso: 2, municipio: undefined })}
        >
          <ArrowLeft aria-hidden />
          {tg('resultado.volverPaso', { paso: 2 })}
        </button>
      </div>
    );
  } else if (paso === 1) {
    contenido = (
      <PasoEspecie
        estado={estado}
        t={tg}
        onElegir={(especie) => ir({ especie, paso: 2 })}
        onSiguiente={() => ir({ paso: 2 })}
      />
    );
  } else if (paso === 2) {
    contenido = (
      <PasoMunicipio
        estado={estado}
        indice={indice}
        ciudades={ciudades}
        t={tg}
        onElegir={(slug) => ir({ municipio: slug, paso: 3 })}
        onAtras={() => ir({ paso: 1 })}
      />
    );
  } else if (paso === 3) {
    contenido = (
      <PasoAnimal
        estado={estado}
        comunidad={m?.comunidad}
        t={tg}
        onEnviar={ir}
        onAtras={() => ir({ paso: 2 })}
      />
    );
  } else if (consulta) {
    contenido = <Resultado consulta={consulta} estado={estado} t={tg} />;
  }

  return (
    <div
      ref={arriba}
      class="grid scroll-mt-28 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12"
    >
      <div class="min-w-0 rounded-[28px] border border-borde bg-superficie p-5 shadow-alta sm:p-8 lg:p-10">
        <div class="mb-10">
          <PasosWizard
            paso={paso}
            etiquetas={etiquetas}
            alcanzable={alcanzable}
            onIr={(n) => ir({ paso: n })}
            t={t}
          />
        </div>
        {contenido}
      </div>

      <aside class="lg:sticky lg:top-[calc(var(--cabecera)+24px)] lg:self-start">
        <div class="tarjeta gap-5 p-6">
          <h2 class="rotulo">
            {paso === 4 ? tg('resultado.resumenAnimal') : t('resumen.titulo')}
          </h2>
          {resumen.length === 0 ? (
            <p class="text-[0.9375rem] text-texto-3">{t('resumen.vacio')}</p>
          ) : (
            <dl class="resumen-consulta">
              {resumen.map((fila) => (
                <div
                  key={fila.etiqueta}
                  class="flex items-start justify-between gap-3"
                >
                  <div>
                    <dt>{fila.etiqueta}</dt>
                    <dd>{fila.valor}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => ir({ paso: fila.paso })}
                    class="no-imprimir inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-marca-700"
                  >
                    <Pencil class="size-3.5" aria-hidden />
                    {t('acciones.cambiar')}
                    <span class="sr-only">{fila.etiqueta}</span>
                  </button>
                </div>
              ))}
            </dl>
          )}
          <p class="border-t border-borde pt-4 text-sm text-texto-3">
            {t('resumen.privacidad')}
          </p>
          <p class="text-sm font-medium text-texto-2">{tg('comun.descargo')}</p>
        </div>
      </aside>
    </div>
  );
}

function PasoEspecie({
  estado,
  t: tg,
  onElegir,
  onSiguiente,
}: {
  estado: EstadoConsulta;
  t: ReturnType<typeof crearTraductor>;
  onElegir: (especie: EstadoConsulta['especie']) => void;
  onSiguiente: () => void;
}) {
  const t = tg.en('consulta');
  return (
    <div>
      <fieldset>
        <legend class="titulo-3">{t('especie.titulo')}</legend>
        <p class="mt-2">{t('especie.texto')}</p>
        <div class="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ESPECIES.map((especie) => {
            const Icono = ICONOS_ESPECIE[especie];
            return (
              <button
                key={especie}
                type="button"
                class="especie"
                aria-pressed={estado.especie === especie}
                onClick={() => onElegir(especie)}
              >
                <span class="caja-icono">
                  <Icono aria-hidden />
                </span>
                <span class="especie__nombre">{tg(`especies.${especie}`)}</span>
              </button>
            );
          })}
        </div>
        {fueraDelListado(estado.especie) ? (
          <div class="mt-6 flex gap-3 rounded-2xl border border-pendiente-borde bg-pendiente-fondo p-4 text-pendiente-texto">
            <Info class="mt-0.5 size-5 shrink-0" aria-hidden />
            <div class="text-[0.9375rem]">
              <p class="font-semibold">{t('especie.listadoTitulo')}</p>
              <p class="mt-1">{t('especie.listadoTexto')}</p>
            </div>
          </div>
        ) : null}
      </fieldset>
      <div class="barra-accion lg:mt-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="boton boton--principal min-w-0 flex-1 lg:flex-none"
            disabled={!estado.especie}
            onClick={onSiguiente}
          >
            {t('acciones.siguiente')}
            <ArrowRight aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function PasoMunicipio({
  estado,
  indice,
  ciudades,
  t: tg,
  onElegir,
  onAtras,
}: {
  estado: EstadoConsulta;
  indice: IndiceMunicipios | null;
  ciudades: Ciudad[];
  t: ReturnType<typeof crearTraductor>;
  onElegir: (slug: string) => void;
  onAtras: () => void;
}) {
  const t = tg.en('consulta.municipio');
  const ta = tg.en('consulta.acciones');
  const elegido =
    estado.municipio && indice ? indice.municipio(estado.municipio) : undefined;
  const provinciaElegida = elegido ? provincia(elegido.provincia) : undefined;

  return (
    <div>
      <h2 class="titulo-3">{t('titulo')}</h2>
      <p class="mt-2">{t('texto')}</p>

      <Combobox
        class="mt-7"
        textoInicial={
          elegido
            ? `${elegido.nombre} (${provinciaElegida?.nombre ?? ''})`
            : undefined
        }
        cargando={!indice}
        buscar={(termino) =>
          (indice?.buscar(termino, 8) ?? []).map((m) => ({
            valor: m.slug,
            principal: m.nombre,
            secundario: provincia(m.provincia)?.nombre,
          }))
        }
        etiqueta={t('etiqueta')}
        descripcion={t('ayuda')}
        marcador={t('marcador')}
        Icono={MapPin}
        onElegir={(m) => onElegir(m.valor)}
      />

      <p class="mt-7 text-sm font-medium text-texto">{t('rapidos')}</p>
      <ul class="mt-3 flex flex-wrap gap-2">
        {ciudades.map((c) => (
          <li key={c.slug}>
            <button
              type="button"
              class={cn(
                'pastilla min-h-11 cursor-pointer px-4 transition-colors hover:border-marca-300',
                estado.municipio === c.slug &&
                  'border-marca-600 bg-marca-50 font-semibold text-marca-700',
              )}
              aria-pressed={estado.municipio === c.slug}
              onClick={() => onElegir(c.slug)}
            >
              {c.nombre}
            </button>
          </li>
        ))}
      </ul>

      {elegido ? (
        <p class="mt-7 text-[0.9375rem] text-texto" aria-live="polite">
          {t('elegido', {
            municipio: elegido.nombre,
            provincia: provinciaElegida?.nombre ?? '',
          })}
        </p>
      ) : null}

      <p class="mt-4 flex gap-2.5 text-sm text-texto-3">
        <Info class="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('avisoOrdenanza')}
      </p>

      <div class="barra-accion lg:mt-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={onAtras}
            class="boton boton--contorno shrink-0 max-[420px]:w-[52px] max-[420px]:px-0"
          >
            <ArrowLeft aria-hidden />
            <span class="max-[420px]:sr-only">{ta('atras')}</span>
          </button>
          <button
            type="button"
            class="boton boton--principal min-w-0 flex-1 lg:flex-none"
            disabled={!estado.municipio}
            onClick={() => estado.municipio && onElegir(estado.municipio)}
          >
            {ta('siguiente')}
            <ArrowRight aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
