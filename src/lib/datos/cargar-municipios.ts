/**
 * Descarga (una sola vez por pagina) el indice de municipios para las islas
 * del navegador: la consulta y el selector de la portada.
 */
import { ruta } from '@/lib/rutas';
import { provincias } from './geografia';
import {
  crearIndice,
  desdeTuplas,
  type TuplaMunicipio,
} from './indice-municipios';

export type IndiceMunicipios = ReturnType<typeof crearIndice>;

let promesa: Promise<IndiceMunicipios> | null = null;

export function cargarMunicipios(): Promise<IndiceMunicipios> {
  promesa ??= fetch(ruta('/datos/municipios.json'))
    .then((r) => {
      if (!r.ok) throw new Error(`municipios.json: HTTP ${r.status}`);
      return r.json() as Promise<TuplaMunicipio[]>;
    })
    .then((tuplas) =>
      crearIndice(
        desdeTuplas(tuplas),
        new Map(provincias().map((p) => [p.codigoIne, p.nombre])),
      ),
    )
    .catch((error: unknown) => {
      // Si falla, se puede reintentar en el siguiente uso.
      promesa = null;
      throw error;
    });
  return promesa;
}
