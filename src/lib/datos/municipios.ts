/**
 * Los 8.132 municipios del INE. Solo para la compilacion: en el navegador el
 * mismo fichero se descarga bajo demanda desde /datos/municipios.json.
 */
import municipiosJson from '@/datos/municipios.json';
import { provincias } from './geografia';
import {
  crearIndice,
  desdeTuplas,
  type TuplaMunicipio,
} from './indice-municipios';
import type { Municipio } from './tipos';

export const TUPLAS = municipiosJson as TuplaMunicipio[];
const MUNICIPIOS = desdeTuplas(TUPLAS);
const indice = crearIndice(
  MUNICIPIOS,
  new Map(provincias().map((p) => [p.codigoIne, p.nombre])),
);

export const todosLosMunicipios = () => MUNICIPIOS;
export const municipio = indice.municipio;
export const capitalDe = indice.capitalDe;
export const capitales = indice.capitales;
export const municipiosDe = (codigoProvincia: string) =>
  MUNICIPIOS.filter((m) => m.provincia === codigoProvincia);

/**
 * Las diez ciudades mas pobladas de Espana. Se usan como accesos rapidos, no
 * como "las mas consultadas": sin base de datos no medimos consultas.
 */
const GRANDES_CIUDADES = [
  '28079', // Madrid
  '08019', // Barcelona
  '46250', // Valencia
  '41091', // Sevilla
  '50297', // Zaragoza
  '29067', // Malaga
  '30030', // Murcia
  '07040', // Palma
  '35016', // Las Palmas de Gran Canaria
  '48020', // Bilbao
];

export const grandesCiudades = () =>
  GRANDES_CIUDADES.map((c) => municipio(c)).filter((m): m is Municipio =>
    Boolean(m),
  );
