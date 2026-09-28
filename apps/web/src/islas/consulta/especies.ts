import {
  Bird,
  Cat,
  Dog,
  Fish,
  PawPrint,
  Rat,
  Squirrel,
  Turtle,
  type LucideIcon,
} from 'lucide-preact';
import {
  ESPECIES_CON_LISTADO,
  type ClaveEspecie,
} from '@/lib/validacion/consulta';

export const ICONOS_ESPECIE: Record<ClaveEspecie, LucideIcon> = {
  perro: Dog,
  gato: Cat,
  huron: Squirrel,
  ave: Bird,
  reptil: Turtle,
  pez: Fish,
  roedor: Rat,
  otro: PawPrint,
};

/** True si la especie queda fuera del listado positivo ya definido en la ley. */
export function fueraDelListado(especie?: ClaveEspecie): boolean {
  if (!especie) return false;
  return !(ESPECIES_CON_LISTADO as readonly string[]).includes(especie);
}
