/**
 * Lo que la gente escribe en los buscadores. Si una raza de la lista no se
 * encuentra, la consulta acaba diciendo que el perro no es PPP.
 */
import { describe, expect, it } from 'vitest';
import { municipio, todosLosMunicipios } from './municipios';
import { crearIndice } from './indice-municipios';
import { provincias } from './geografia';
import { buscarRazas, razaPorNombre } from './normativa';

const indice = crearIndice(
  todosLosMunicipios(),
  new Map(provincias().map((p) => [p.codigoIne, p.nombre])),
);
const primero = (termino: string) => indice.buscar(termino)[0]?.nombre;
const raza = (termino: string) => buscarRazas(termino)[0]?.slug;

describe('Razas', () => {
  it.each([
    ['pitbull', 'pit-bull-terrier'],
    ['American Pit Bull Terrier', 'pit-bull-terrier'],
    ['amstaff', 'american-staffordshire-terrier'],
    ['staffy', 'staffordshire-bull-terrier'],
    ['rotweiler', 'rottweiler'],
    ['dobermann', 'doberman'],
    ['dogo canario', 'presa-canario'],
    ['ca de bou', 'presa-mallorquin'],
    ['fila brasileño', 'fila-brasileiro'],
    ['bull mastiff', 'bullmastiff'],
    ['tosa japonés', 'tosa-inu'],
    ['mastín tibetano', 'dogo-del-tibet'],
  ])('«%s» encuentra %s', (termino, slug) => {
    expect(raza(termino)).toBe(slug);
  });

  it('no propone una raza de la lista por otra que no lo es', () => {
    for (const termino of [
      'labrador',
      'pastor alemán',
      'bóxer',
      'boston terrier',
      'yorkshire terrier',
      'cane corso',
    ])
      expect(buscarRazas(termino), termino).toEqual([]);
  });

  it('una raza escrita sin elegir solo vale si es exacta', () => {
    expect(razaPorNombre('Pitbull')?.slug).toBe('pit-bull-terrier');
    expect(razaPorNombre('rottweiler')?.slug).toBe('rottweiler');
    expect(razaPorNombre('rotwailer')).toBeUndefined();
    expect(raza('rotwailer')).toBe('rottweiler');
  });
});

describe('Municipios', () => {
  it('un municipio de cada diez se encuentra por su nombre', () => {
    for (const m of todosLosMunicipios().filter((_, i) => i % 10 === 0))
      expect(
        indice.buscar(m.nombre).some((x) => x.codigoIne === m.codigoIne),
        m.nombre,
      ).toBe(true);
  }, 30000);

  it.each([
    ['Lérida', 'Lleida'],
    ['Mahón', 'Maó'],
    ['Ibiza', 'Eivissa'],
    ['Ciudadela', 'Ciutadella de Menorca'],
    ['Tarrasa', 'Terrassa'],
    ['Villarreal', 'Vila-real'],
    ['Sangenjo', 'Sanxenxo'],
    ['Guecho', 'Getxo'],
    ['San Sebastián', 'Donostia/San Sebastián'],
    ['Santiago', 'Santiago de Compostela'],
    ['La Coruña', 'A Coruña'],
    ['zaragosa', 'Zaragoza'],
  ])('«%s» encuentra %s', (termino, nombre) => {
    expect(primero(termino)).toBe(nombre);
  });

  it('el articulo pospuesto del INE va delante sin romper el nombre', () => {
    expect(municipio('03139')?.nombre).toBe('la Vila Joiosa/Villajoyosa');
    expect(municipio('17048')?.nombre).toBe(
      "Castell d'Aro, Platja d'Aro i s'Agaró",
    );
  });
});
