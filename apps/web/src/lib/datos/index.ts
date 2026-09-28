/**
 * Acceso al contenido para las paginas (se ejecuta al compilar).
 *
 * El contenido son los JSON de src/datos/ (DECISIONES.md, D49). Las islas del
 * navegador no importan este modulo, sino geografia.ts y normativa.ts, para no
 * cargar los municipios.
 */
import { comunidades, provincias } from './geografia';
import { todosLosMunicipios } from './municipios';
import { normas, reglas, totalArticulos, totalFuentes } from './normativa';

export * from './geografia';
export * from './municipios';
export * from './normativa';
export * from './situacion';
export type * from './tipos';

export function cifras() {
  return {
    comunidades: comunidades().length,
    provincias: provincias().length,
    municipios: todosLosMunicipios().length,
    normas: normas().length,
    reglas: reglas().length,
    citas: totalFuentes(),
    articulos: totalArticulos(),
  };
}
