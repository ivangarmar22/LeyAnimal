import {
  ave,
  gato,
  huellas,
  huron,
  perro,
  pez,
  reptil,
  roedor,
  type IconoColor,
} from '@/lib/contenido/ilustraciones';
import {
  ESPECIES_CON_LISTADO,
  type ClaveEspecie,
} from '@/lib/validacion/consulta';

export const ICONOS_ESPECIE: Record<ClaveEspecie, IconoColor> = {
  perro,
  gato,
  huron,
  ave,
  reptil,
  pez,
  roedor,
  otro: huellas,
};

/** True si la especie queda fuera del listado positivo ya definido en la ley. */
export function fueraDelListado(especie?: ClaveEspecie): boolean {
  if (!especie) return false;
  return !(ESPECIES_CON_LISTADO as readonly string[]).includes(especie);
}
