# Ficha de verificación 01 — marco estatal

**Estado: PENDIENTE DE TU APROBACIÓN.** Nada de esto está cargado en la base de
datos. No entrará hasta que lo apruebes.

Todo el texto citado se ha extraído del **texto consolidado del BOE** vía su API
de datos abiertos (`Accept: application/xml`), no de resúmenes ni de webs de
terceros. Fecha de extracción: **4 de septiembre de 2026**.

---

## Normas verificadas

| Norma                                                                                                           | Identificador      | Publicación | Entrada en vigor | Estado según el BOE                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------ | ----------- | ---------------- | ----------------------------------------- |
| Ley 7/2023, de 28 de marzo, de protección de los derechos y el bienestar de los animales                        | `BOE-A-2023-7936`  | 29/03/2023  | **29/09/2023**   | Vigente, consolidación finalizada         |
| Ley 50/1999, de 23 de diciembre, sobre el Régimen Jurídico de la Tenencia de Animales Potencialmente Peligrosos | `BOE-A-1999-24419` | 24/12/1999  | 25/12/1999       | **No derogada** (`estatus_derogacion: N`) |
| Real Decreto 287/2002, de 22 de marzo                                                                           | `BOE-A-2002-6016`  | 27/03/2002  | 28/03/2002       | **No derogada** (`estatus_derogacion: N`) |

> **Comprobación clave**: el brief afirmaba que la Ley 7/2023 no derogó el marco
> de perros potencialmente peligrosos. **Confirmado**: los metadatos oficiales
> de ambas normas dan `estatus_derogacion: N` y `vigencia_agotada: N`.

La entrada en vigor de la Ley 7/2023 se confirma con su propia disposición
final: «La presente ley entrará en vigor a los seis meses de su publicación en
el "Boletín Oficial del Estado"», publicada el 29/03/2023.

---

## R1 — Seguro de responsabilidad civil para perros

**Estado propuesto: `obligatorio_pendiente_reglamento`** · Ámbito: estatal

**Fuente:** Ley 7/2023, **artículo 30.3**. Cita literal:

> En el caso de la tenencia de perros y durante toda la vida del animal, la
> persona titular deberá contratar y mantener en vigor un seguro de
> responsabilidad civil por daños a terceros, que incluya en su cobertura a las
> personas responsables del animal, por un importe de cuantía suficiente para
> sufragar los posibles gastos derivados, **que se establecerá
> reglamentariamente**.

**Por qué no es `obligatorio` sin más:** la ley enuncia el deber, pero remite el
importe a un reglamento. Sin ese reglamento no hay cuantía exigible. Es
exactamente el caso que el estado `obligatorio_pendiente_reglamento` existe para
representar.

**Aviso:** esto es el mínimo estatal. Si una comunidad ya lo exigía por su
cuenta, allí sí es exigible hoy. Eso se resuelve con una regla autonómica que
gana por especificidad, y **está sin verificar** (ver «Lo que falta»).

---

## R2 — Curso de tenencia responsable de perros

**Estado propuesto: `obligatorio_pendiente_reglamento`** · Ámbito: estatal

**Fuente:** Ley 7/2023, **artículo 30.1 y 30.2**. Cita literal:

> 1. Las personas que opten a ser titulares de perros deberán acreditar la
>    realización un curso de formación para la tenencia de perros que tendrá una
>    validez indefinida.
>
> 2. Dicho curso de formación será gratuito y su contenido **se determinará
>    reglamentariamente**.

_(El «realización un curso» sin preposición está así en el texto oficial.)_

**Verificado:** que es obligatorio, gratuito y de validez indefinida.

**NO verificado y por tanto NO se carga:** que sea telemático y de un mínimo de
4 horas. Eso venía en el §1 del brief y procede de un **proyecto de real decreto
en tramitación**, no del texto vigente. No lo escribiré en ninguna parte hasta
verificarlo en fuente oficial, y aun entonces iría etiquetado como «previsto».

---

## R3 — Identificación y esterilización de gatos

**Estado propuesto: `obligatorio`** · Ámbito: estatal

**Fuente:** Ley 7/2023, **artículo 26.i**. Cita literal:

> i) Identificar mediante microchip y proceder a la esterilización quirúrgica de
> todos los gatos antes de los seis meses de edad salvo aquellos inscritos en el
> registro de identificación como reproductores y a nombre de un criador
> registrado en el Registro de Criadores de Animales de Compañía.

**Por qué sí es `obligatorio`:** a diferencia de R1 y R2, aquí la ley no remite
a reglamento. El plazo (seis meses de edad) y la conducta exigida están en el
texto.

**Condiciones para el motor de reglas:**
`especie = gato` **y** `edad_meses >= 6`.
La excepción de criador registrado no se puede evaluar con los datos que pide el
asistente, así que debe aparecer como nota en la tarjeta, no como condición.

---

## R4 — Licencia municipal para perros potencialmente peligrosos

**Estado propuesto: `obligatorio`** · Ámbito: estatal, con trámite municipal

**Fuente:** RD 287/2002, **artículo 3**. Citas literales:

> 1.e) Acreditación de haber formalizado un seguro de responsabilidad civil por
> daños a terceros con una cobertura no inferior a **ciento veinte mil euros
> (120.000 €)**.
>
> 2. La licencia administrativa será otorgada o renovada, a petición del
>    interesado, por el **órgano municipal competente** […]
>
> 3. La licencia tendrá un periodo de validez de **cinco años** pudiendo ser
>    renovada por periodos sucesivos de igual duración.

Otros requisitos del art. 3.1, verificados: ser mayor de edad (a), certificados
negativos de antecedentes (b y c) y capacidad física y aptitud psicológica (d).

**Parámetros para la regla:** `{"cobertura_minima_eur": 120000, "validez_anios": 5}`

**Salvedad que hay que vigilar.** La **disposición final segunda** del mismo RD
faculta al Ministro de Economía para actualizar esa cuantía según el IPC. El
texto consolidado a día de hoy sigue diciendo 120.000 €, así que ese es el dato
vigente, pero conviene revisarlo periódicamente. Va a la cola de revisión.

---

## R5 — Qué perro es potencialmente peligroso (marco estatal)

**Fuente:** RD 287/2002, **artículo 2** y **Anexo I**.

Art. 2.1, en su redacción vigente (modificada por el RD 1570/2007,
`BOE-A-2007-21322`):

> a) Los que pertenezcan a las razas relacionadas en el anexo I del presente
> real decreto y a sus cruces.
>
> b) Aquellos cuyas características se correspondan con todas o la mayoría de
> las que figuran en el anexo II, **salvo que se trate de perros-guía o de
> perros de asistencia** acreditados y adiestrados en centros oficialmente
> reconocidos […]

**Anexo I, literal y completo (8 razas):**

| #   | Texto oficial                 |
| --- | ----------------------------- |
| a   | Pit Bull Terrier              |
| b   | Staffordshire Bull Terrier    |
| c   | American Staffodshire Terrier |
| d   | Rottweiler                    |
| e   | Dogo Argentino                |
| f   | Fila Brasileiro               |
| g   | Tosa Inu                      |
| h   | Akita Inu                     |

> **Ojo con la «c»**: el BOE dice «American **Staffodshire** Terrier», sin la
> «r». Es una errata del texto oficial que sigue ahí. Propongo guardar el
> literal en la ficha de la norma y usar el nombre correcto («American
> Staffordshire Terrier») en el catálogo de razas del buscador, para que la
> gente lo encuentre. **Dime si te parece bien.**

Además, el art. 2.2 considera potencialmente peligroso a cualquier perro «que
manifieste un carácter marcadamente agresivo o que haya protagonizado
agresiones», apreciado por la autoridad competente. Eso **no es evaluable** por
el asistente y debe aparecer como nota.

**Crítico para el modelo de datos:** esta lista es el **mínimo estatal**. Varias
comunidades amplían el anexo I. Por eso `razas_ppp_autonomicas` existe y por eso
`razas.es_ppp_estatal` admite `NULL` («no verificado»), distinto de `false`.

---

## Lo que falta, y es mucho

Esto cubre **solo el marco estatal**. Pendiente de investigar y verificar:

1. **Las 17 comunidades más Ceuta y Melilla.** Cada una con su ley y, varias, su
   propia ampliación de la lista de razas. Es el grueso del trabajo.
2. **Ordenanzas municipales**: censo canino, tasas, recogida de excrementos,
   zonas de esparcimiento, transporte público. Aquí hay 8132 municipios; hay que
   decidir cuáles cargamos primero.
3. **El proyecto de real decreto de desarrollo.** Cargarlo como norma en estado
   `en_tramitacion`, para poder decir «esto está previsto» sin afirmar que rige.
4. **Sanciones**: los tramos literales de la Ley 7/2023 y de la Ley 50/1999,
   para `/multas`.

---

## Lo que necesito de ti

1. **¿Apruebas R1 a R5 tal como están?** Si algo no te convence, dímelo y no
   entra.
2. **La errata «Staffodshire»**: ¿literal en la norma y corregido en el
   catálogo, como propongo?
3. **¿Por qué comunidad empiezo?** Sugiero **Madrid, Cataluña y Andalucía**: son
   las de más población y las tres tienen normativa propia con diferencias
   reales, así que ejercitan bien el motor de reglas.
4. **¿Qué municipios?** Sugiero arrancar con las capitales de esas tres
   comunidades y ampliar después.
