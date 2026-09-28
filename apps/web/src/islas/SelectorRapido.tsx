import { ArrowRight, Cat, Dog, MapPin, PawPrint } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ruta, type Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import {
  cargarMunicipios,
  type IndiceMunicipios,
} from '@/lib/datos/cargar-municipios';
import { provincia } from '@/lib/datos/geografia';
import { Combobox } from '@/ui/Combobox';

const ESPECIES = [
  { valor: 'perro', Icono: Dog },
  { valor: 'gato', Icono: Cat },
  { valor: 'otra', Icono: PawPrint },
] as const;

/**
 * Mini-selector del hero: especie + municipio, y arranca la consulta en el
 * primer paso que falte. El indice de municipios se descarga al enfocar el
 * campo, no al cargar la portada. Sin JavaScript el boton lleva a /consulta.
 */
export default function SelectorRapido({
  idioma,
  textos,
}: {
  idioma: Idioma;
  textos: Mensajes;
}) {
  const tg = crearTraductor(textos, idioma);
  const t = tg.en('inicio.hero');
  const [especie, setEspecie] = useState<'perro' | 'gato' | 'otra'>('perro');
  const [municipio, setMunicipio] = useState<string>();
  const [indice, setIndice] = useState<IndiceMunicipios | null>(null);
  const accion = ruta('/consulta', idioma);

  function cargar() {
    if (!indice) void cargarMunicipios().then(setIndice);
  }

  function empezar(evento: SubmitEvent) {
    evento.preventDefault();
    const params = new URLSearchParams();
    if (especie !== 'otra') params.set('especie', especie);
    if (municipio) params.set('municipio', municipio);
    // Otra especie: el paso 1 muestra la lista completa y el aviso del
    // listado positivo pendiente.
    params.set('paso', especie === 'otra' ? '1' : municipio ? '3' : '2');
    window.location.assign(`${accion}?${params.toString()}`);
  }

  return (
    <form
      action={accion}
      onSubmit={empezar}
      class="rounded-[26px] border border-borde bg-superficie p-4 shadow-alta sm:p-5"
      aria-label={t('selectorTitulo')}
    >
      <fieldset>
        <legend class="mb-2.5 text-[0.9375rem] font-semibold text-texto">
          {t('especie')}
        </legend>
        <div class="grid grid-cols-3 gap-2">
          {ESPECIES.map(({ valor, Icono }) => (
            <label
              key={valor}
              class="opcion min-h-12 px-2 text-center leading-tight max-sm:min-h-[68px] max-sm:flex-col max-sm:gap-1 max-sm:rounded-2xl max-sm:py-2"
            >
              <input
                type="radio"
                name="especie"
                value={valor}
                checked={especie === valor}
                onChange={() => setEspecie(valor)}
              />
              <Icono class="size-[18px]" aria-hidden />
              {valor === 'otra' ? t('otraEspecie') : tg(`especies.${valor}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <Combobox
          class="flex-1"
          cargando={!indice}
          alEnfocar={cargar}
          buscar={(termino) =>
            (indice?.buscar(termino, 8) ?? []).map((m) => ({
              valor: m.slug,
              principal: m.nombre,
              secundario: provincia(m.provincia)?.nombre,
            }))
          }
          etiqueta={t('municipio')}
          ocultarEtiqueta
          marcador={t('marcador')}
          Icono={MapPin}
          onElegir={(m) => setMunicipio(m.valor)}
          onBorrar={() => setMunicipio(undefined)}
        />
        <button type="submit" class="boton boton--principal h-[54px] shrink-0">
          {t('boton')}
          <ArrowRight aria-hidden />
        </button>
      </div>
    </form>
  );
}
