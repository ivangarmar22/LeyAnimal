import { describe, expect, it } from 'vitest';
import { camposUsados, evaluarCondicion } from './condiciones';
import type { Condicion, PerfilAnimal } from './tipos';

const perro: PerfilAnimal = {
  especie: 'perro',
  raza: 'rottweiler',
  es_ppp: true,
  edad_meses: 36,
  sexo: 'macho',
  esterilizado: false,
  tiene_microchip: true,
  uso: 'compania',
  numero_animales_hogar: 1,
  comunidad: '01',
  provincia: '29',
  municipio: '29067',
};

describe('operadores', () => {
  it('compara igualdad y desigualdad', () => {
    expect(
      evaluarCondicion({ campo: 'especie', op: 'eq', valor: 'perro' }, perro),
    ).toBe('si');
    expect(
      evaluarCondicion({ campo: 'especie', op: 'eq', valor: 'gato' }, perro),
    ).toBe('no');
    expect(
      evaluarCondicion({ campo: 'especie', op: 'neq', valor: 'gato' }, perro),
    ).toBe('si');
  });

  it('compara pertenencia a lista', () => {
    expect(
      evaluarCondicion(
        { campo: 'raza', op: 'in', valor: ['rottweiler', 'pitbull'] },
        perro,
      ),
    ).toBe('si');
    expect(
      evaluarCondicion(
        { campo: 'raza', op: 'nin', valor: ['rottweiler'] },
        perro,
      ),
    ).toBe('no');
  });

  it('compara numeros', () => {
    expect(
      evaluarCondicion({ campo: 'edad_meses', op: 'gte', valor: 36 }, perro),
    ).toBe('si');
    expect(
      evaluarCondicion({ campo: 'edad_meses', op: 'lt', valor: 12 }, perro),
    ).toBe('no');
  });

  it('devuelve indeterminado si el valor de la regla no es comparable', () => {
    expect(
      evaluarCondicion({ campo: 'edad_meses', op: 'gt', valor: 'doce' }, perro),
    ).toBe('indeterminado');
    expect(
      evaluarCondicion(
        { campo: 'raza', op: 'in', valor: 'no-es-una-lista' },
        perro,
      ),
    ).toBe('indeterminado');
  });
});

describe('logica de tres valores', () => {
  const sinSaber: PerfilAnimal = { especie: 'perro', esterilizado: null };

  it('un campo desconocido no vale como false', () => {
    expect(
      evaluarCondicion(
        { campo: 'esterilizado', op: 'eq', valor: true },
        sinSaber,
      ),
    ).toBe('indeterminado');
    expect(
      evaluarCondicion(
        { campo: 'esterilizado', op: 'eq', valor: false },
        sinSaber,
      ),
    ).toBe('indeterminado');
  });

  it('un campo ausente se trata igual que uno desconocido', () => {
    expect(
      evaluarCondicion(
        { campo: 'acceso_exterior', op: 'eq', valor: true },
        sinSaber,
      ),
    ).toBe('indeterminado');
  });

  it('"existe" si sabe responder sobre lo desconocido', () => {
    expect(
      evaluarCondicion({ campo: 'esterilizado', op: 'existe' }, sinSaber),
    ).toBe('no');
    expect(evaluarCondicion({ campo: 'especie', op: 'existe' }, sinSaber)).toBe(
      'si',
    );
    expect(
      evaluarCondicion(
        { campo: 'esterilizado', op: 'existe', valor: false },
        sinSaber,
      ),
    ).toBe('si');
  });

  it('all: un no manda sobre cualquier indeterminado', () => {
    const c: Condicion = {
      all: [
        { campo: 'especie', op: 'eq', valor: 'gato' },
        { campo: 'esterilizado', op: 'eq', valor: true },
      ],
    };
    expect(evaluarCondicion(c, sinSaber)).toBe('no');
  });

  it('all: sin ningun no, un indeterminado contagia', () => {
    const c: Condicion = {
      all: [
        { campo: 'especie', op: 'eq', valor: 'perro' },
        { campo: 'esterilizado', op: 'eq', valor: true },
      ],
    };
    expect(evaluarCondicion(c, sinSaber)).toBe('indeterminado');
  });

  it('any: un si manda sobre cualquier indeterminado', () => {
    const c: Condicion = {
      any: [
        { campo: 'especie', op: 'eq', valor: 'perro' },
        { campo: 'esterilizado', op: 'eq', valor: true },
      ],
    };
    expect(evaluarCondicion(c, sinSaber)).toBe('si');
  });

  it('not conserva el indeterminado', () => {
    const c: Condicion = {
      not: { campo: 'esterilizado', op: 'eq', valor: true },
    };
    expect(evaluarCondicion(c, sinSaber)).toBe('indeterminado');
    expect(
      evaluarCondicion(
        { not: { campo: 'especie', op: 'eq', valor: 'perro' } },
        sinSaber,
      ),
    ).toBe('no');
  });

  it('all vacio es si y any vacio es no', () => {
    expect(evaluarCondicion({ all: [] }, perro)).toBe('si');
    expect(evaluarCondicion({ any: [] }, perro)).toBe('no');
  });
});

describe('anidamiento', () => {
  it('resuelve arboles combinados', () => {
    const c: Condicion = {
      all: [
        { campo: 'especie', op: 'eq', valor: 'perro' },
        {
          any: [
            { campo: 'es_ppp', op: 'eq', valor: true },
            { campo: 'numero_animales_hogar', op: 'gte', valor: 5 },
          ],
        },
        { not: { campo: 'uso', op: 'eq', valor: 'asistencia' } },
      ],
    };
    expect(evaluarCondicion(c, perro)).toBe('si');
  });
});

describe('camposUsados', () => {
  it('recoge los campos de todo el arbol', () => {
    const c: Condicion = {
      all: [
        { campo: 'especie', op: 'eq', valor: 'perro' },
        { any: [{ campo: 'es_ppp', op: 'eq', valor: true }] },
        { not: { campo: 'edad_meses', op: 'lt', valor: 3 } },
      ],
    };
    expect(camposUsados(c).sort()).toEqual(['edad_meses', 'es_ppp', 'especie']);
  });
});
