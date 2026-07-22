# Diseño — Módulo Menú y Recomendación (RF-008 a RF-0012)

## Contexto

Paciente (RF-001 a RF-004, Postgres/Sequelize) y Alimento (RF-005 a RF-007,
Mongo) ya están completos y probados. Menú es el módulo central del sistema
según el BPM: el nutriólogo solicita un menú, el sistema arma un prompt con
el perfil del paciente y sus alimentos, una API externa genera el menú, y el
nutriólogo lo revisa y ajusta antes de aprobarlo. Recomendación (RF-0012) se
diseña junto con Menú porque se genera en la misma llamada a la IA y
comparte el mismo perfil de paciente, pero vive en su propio módulo porque
tiene persistencia, consultas y ciclo de vida distintos (así lo modela el
DER, con tablas separadas, y "Ver recomendaciones" es un caso de uso propio
en el diagrama de casos de uso).

**API externa elegida: Groq** (nivel gratuito, endpoint compatible con
OpenAI `/chat/completions`), reutilizando el mismo patrón ya validado en
otro proyecto del equipo (`Proyecto-Sistema-de-control-de-gastos-personales`):
prompt que exige JSON estricto sin texto adicional, parseo, validación de
forma. Se usa el modelo de texto `llama-3.3-70b-versatile` (no
`llama-4-scout`, que es multimodal y se eligió allá para leer fotos de
facturas — aquí no hay imágenes).

## Decisiones de diseño

| Decisión | Elegido | Alternativa descartada |
|---|---|---|
| Alcance de este spec | Menú (RF-008 a RF-0011) + Recomendación (RF-0012) juntos | Solo Menú, Recomendación como spec aparte — descartado porque comparten la misma llamada a IA y el mismo perfil de paciente |
| División en módulos | `Menu/` y `Recomendacion/` como bounded contexts separados, mismo patrón que Nutriologo/Paciente/Alimento | Fusionar Recomendacion dentro de Menu — descartado: DER usa tablas separadas y "Ver recomendaciones" es caso de uso propio |
| Motor de BD para Menú/Recomendación | Postgres/Sequelize, como dice el DER | Mongo, como Alimento — descartado: la cuota de "1 relacional + 1 no relacional" del curso ya la cubre Alimento |
| Comunicación entre módulos | Cada módulo depende de la **API pública (casos de uso)** de otro módulo, nunca de su repositorio interno. Ej.: `GenerarMenuSemanal` llama a `ListarAlimentosPorPaciente` (Alimento) y a `RegistrarRecomendacion` (Recomendacion), no a `AlimentoRepositoryMongo` ni `RecomendacionRepositorySequelize` directamente | Menu escribiendo directo en el repositorio de Recomendacion — descartado, acopla a un módulo con la persistencia interna de otro |
| Chequeo de propiedad de paciente | Puerto existente `IPacienteRepository` (ya expone `findById`), inyectado en la composition root — mismo patrón que ya usa Alimento | Puerto nuevo `IPacienteOwnershipChecker` — descartado, YAGNI: el puerto existente ya alcanza |
| Adaptador IA | `Infraestructura/ia/groqClient.js` (HTTP/auth/timeout, transversal) + `Menu/Infraestructura/GeneradorMenuGroq.js` (prompt, parseo, validación **técnica** de forma) | Meter todo en un solo archivo — descartado, mezclaría transporte con contrato de dominio |
| División de validación | **Técnica** (JSON parseable, 7 días, N comidas por día, tipos correctos) en `GeneradorMenuGroq`; **de negocio** (IDs de alimento pertenecen al paciente, snapshot de nombre/unidad) en `GenerarMenuSemanal` | Validar todo en el adapter — descartado, el adapter no debería conocer reglas de negocio del paciente |
| Snapshot de alimento en el menú | `DetalleComidaAlimento` guarda `nombre_alimento`/`unidad_medida` **copiados del mapa de alimentos ya cargado de Mongo**, nunca de lo que devuelve Groq | Confiar en que Groq devuelva nombre/unidad — descartado: permitiría que la IA altere datos que el nutriólogo registró |
| `id_alimento` en Postgres | `VARCHAR(24)` (ObjectId de Mongo como string), **sin FK real** — cross-engine, no se puede. Validado por formato (regex) y por pertenencia (`idsPermitidos`) en el caso de uso | FK real — imposible, Alimento vive en otro motor |
| Atomicidad Menú+Recomendación | Transacción Postgres compartida: `GenerarMenuSemanal` la abre después de llamar a Groq (nunca antes — no dejar una transacción abierta esperando una API externa) y la pasa como `{ contextoPersistencia }` a `RegistrarRecomendacion.ejecutar()` | Sin transacción, con rollback manual si falla el segundo guardado — descartado, más código y menos robusto para esta escala |
| Fallo de la IA (timeout, malformado, tarda) | Error controlado inmediato, sin reintentos automáticos. Coincide con el SRS (2.6.2: "si alguno de estos servicios no está disponible la función no funcionará") | Reintentar 1-2 veces — descartado, añade complejidad y alarga el error final |
| RNF-001 (<3s) vs. latencia de Groq | Se documenta como **excepción explícita**: el objetivo de 3s aplica a operaciones locales; generar menú depende de un proveedor externo con timeout propio y sin reintento síncrono | Forzar <3s con streaming/cache — fuera de alcance para un MVP académico |
| Ajustar un menú `aprobado` | **Prohibido** (409 Conflict). El BPM solo muestra "Ajustar menú" dentro del bucle de revisión, antes de llegar a la caja terminal "Menú aprobado" | Permitir ajuste post-aprobación con versionado — descartado, no lo pide ningún RF y añade complejidad de versionado |
| Recalcular calorías al ajustar manualmente | El nutriólogo **ingresa la cifra de calorías** de la comida ajustada; el sistema no la recalcula sola | Recalcular automáticamente — imposible: `Alimento` no tiene campo de calorías por unidad, no existe una fuente propia de ese dato fuera de la estimación de la IA |

## Estructura de archivos (backend)

```
backend/src/
├── Infraestructura/
│   └── ia/
│       └── groqClient.js
└── lib/
    ├── Menu/
    │   ├── Dominio/
    │   │   ├── Entidades/
    │   │   │   ├── Menu.js
    │   │   │   ├── DiaMenu.js
    │   │   │   └── ComidaMenu.js
    │   │   ├── Ports/
    │   │   │   ├── IMenuRepository.js
    │   │   │   └── IGeneradorMenuIA.js
    │   │   ├── Errores.js
    │   │   └── __tests__/
    │   ├── Aplicacion/
    │   │   ├── GenerarMenuSemanal.js
    │   │   ├── ObtenerMenuPorPaciente.js
    │   │   ├── AjustarComidaMenu.js
    │   │   ├── AprobarMenu.js
    │   │   └── __tests__/
    │   └── Infraestructura/
    │       ├── MenuModel.js (+ DiaMenuModel, ComidaMenuModel, DetalleComidaAlimentoModel)
    │       ├── MenuRepositorySequelize.js
    │       ├── GeneradorMenuGroq.js
    │       ├── __tests__/
    │       └── http/
    │           ├── MenuController.js
    │           ├── MenuRoutes.js
    │           └── index.js
    └── Recomendacion/
        ├── Dominio/
        │   ├── Entidades/Recomendacion.js
        │   ├── Ports/IRecomendacionRepository.js
        │   └── Errores.js
        ├── Aplicacion/
        │   ├── RegistrarRecomendacion.js
        │   ├── ListarRecomendacionesPorPaciente.js
        │   └── __tests__/
        └── Infraestructura/
            ├── RecomendacionModel.js
            ├── RecomendacionRepositorySequelize.js
            └── http/
                ├── RecomendacionController.js
                ├── RecomendacionRoutes.js
                └── index.js
```

## Dominio

### `Errores.js` (Menu y Recomendacion)

Mismo patrón que Alimento, con dos clases adicionales propias de Menú:

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}
class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}
class ConflictError extends AppError {
  constructor(message) { super(message, 409); } // ajustar un menú ya aprobado
}
class ServicioExternoError extends AppError {
  constructor(message) { super(message, 502); } // Groq no responde / malformado
}
```

### Entidades `Menu`, `DiaMenu`, `ComidaMenu`

Validan la forma mínima que ya viene comprobada técnicamente por
`GeneradorMenuGroq` (defensa en profundidad, igual que `Alimento`/`Paciente`):
`numeroDia` entero 1-7, `calorias`/`caloriasTotales` números finitos ≥ 0,
`tipoComida`/`orden` no vacíos. Lanzan `ValidationError`.

### Entidad `Recomendacion`

Campos: `id`, `idPaciente` (entero positivo, requerido), `texto` (string no
vacío, requerido), `fechaGeneracion`. Mismo estilo de validación que
`Alimento.js`.

### Puertos

```js
// Menu/Dominio/Ports/IMenuRepository.js
class IMenuRepository {
  async ejecutarEnTransaccion(fn) {} // fn recibe (contextoPersistencia)
  async crear(menu, dias, { contextoPersistencia }) {}
  async obtenerVigentePorPaciente(idPaciente) {}
  async obtenerMenuConPropietario(idMenu, idNutriologo) {}
  async obtenerComidaConPropietario(idComidaMenu, idNutriologo) {}
  async actualizarComida(idComidaMenu, cambios, { contextoPersistencia }) {}
  async aprobar(idMenu) {}
}

// Menu/Dominio/Ports/IGeneradorMenuIA.js
class IGeneradorMenuIA {
  async generar({ perfilPaciente, alimentosDisponibles }) {}
  // devuelve { dias: [...], recomendacion: string } ya validado técnicamente
}

// Recomendacion/Dominio/Ports/IRecomendacionRepository.js
class IRecomendacionRepository {
  async crear(recomendacion, { contextoPersistencia }) {}
  async listarPorPaciente(idPaciente) {}
}
```

`IPacienteRepository` (Paciente) y `ListarAlimentosPorPaciente` (Alimento) se
reutilizan tal cual existen hoy — no se crean puertos nuevos para ellos.

## Casos de uso

### `GenerarMenuSemanal.ejecutar(idPaciente, idNutriologo)`

El orquestador. Constructor recibe `{ pacienteRepository, listarAlimentosPorPaciente, generadorMenuIA, menuRepository, registrarRecomendacion }`.

```js
async ejecutar(idPaciente, idNutriologo) {
  const paciente = await this.pacienteRepository.findById(idPaciente);
  if (!paciente) throw new NotFoundError("Paciente no encontrado");
  if (paciente.idNutriologo !== idNutriologo)
    throw new NotFoundError("Paciente no encontrado"); // no revela existencia a otro nutriólogo

  const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(idPaciente);
  if (alimentosDisponibles.length === 0)
    throw new ValidationError("El paciente no tiene alimentos registrados");

  // 1. Llamada a IA (fuera de cualquier transacción)
  const resultado = await this.generadorMenuIA.generar({
    perfilPaciente: paciente,
    alimentosDisponibles,
  }); // GeneradorMenuGroq ya validó forma: 7 días, N comidas, tipos correctos.
      // Si falla o es inválido, lanza ServicioExternoError aquí mismo.

  // 2. Validación de negocio: todo idAlimento debe pertenecer al paciente
  const alimentosPorId = new Map(
    alimentosDisponibles.map((a) => [a.id.toString(), a]),
  );
  for (const dia of resultado.dias) {
    for (const comida of dia.comidas) {
      for (const detalle of comida.alimentos) {
        if (!alimentosPorId.has(detalle.idAlimento.toString())) {
          throw new ValidationError(
            "La IA devolvió un alimento no disponible para este paciente",
          );
        }
      }
    }
  }

  // 3. Snapshot: nombre/unidad SIEMPRE del mapa cargado de Mongo, nunca de Groq
  const diasPersistibles = resultado.dias.map((dia) => ({
    ...dia,
    comidas: dia.comidas.map((comida) => ({
      ...comida,
      alimentos: comida.alimentos.map((detalle) => {
        const alimento = alimentosPorId.get(detalle.idAlimento.toString());
        return {
          idAlimento: alimento.id.toString(),
          nombreAlimento: alimento.nombre,
          unidadMedida: alimento.unidadMedida,
          cantidadUtilizada: detalle.cantidad,
        };
      }),
    })),
  }));

  // 4. Persistencia atómica (Menú + Recomendación)
  return await this.menuRepository.ejecutarEnTransaccion(async (contextoPersistencia) => {
    const menu = await this.menuRepository.crear(
      { idPaciente, estado: "generado" },
      diasPersistibles,
      { contextoPersistencia },
    );
    await this.registrarRecomendacion.ejecutar(
      { idPaciente, texto: resultado.recomendacion, fechaGeneracion: new Date() },
      { contextoPersistencia },
    );
    return menu;
  });
}
```

`menuRepository.ejecutarEnTransaccion` envuelve `sequelize.transaction()` para
que `GenerarMenuSemanal` no importe Sequelize directamente — solo su
repositorio lo hace. `contextoPersistencia` es, en la práctica, el objeto
`Transaction` de Sequelize; se acepta ese acoplamiento controlado (Menu y
Recomendacion corren en el mismo proceso y comparten Postgres) en vez de
introducir Unit of Work o eventos, innecesario para este alcance.

### `ObtenerMenuPorPaciente.ejecutar(idPaciente, idNutriologo)`

Valida propiedad igual que arriba, delega en
`menuRepository.obtenerVigentePorPaciente(idPaciente)` (RF-009/RF-0010: trae
Menu + DiaMenu + ComidaMenu + DetalleComidaAlimento ya con el snapshot, sin
tocar Mongo).

### `AjustarComidaMenu.ejecutar(idComidaMenu, idNutriologo, cambios)`

`cambios = { calorias, alimentos: [{ idAlimento, cantidad }] }` — el
nutriólogo decide la nueva cifra de calorías (no se recalcula sola, ver
tabla de decisiones).

```js
async ejecutar(idComidaMenu, idNutriologo, cambios) {
  const comida = await this.menuRepository.obtenerComidaConPropietario(idComidaMenu, idNutriologo);
  if (!comida) throw new NotFoundError("Comida no encontrada");
  if (comida.menu.estado === "aprobado")
    throw new ConflictError("No se puede ajustar un menú ya aprobado");

  const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(comida.menu.idPaciente);
  const idsPermitidos = new Set(alimentosDisponibles.map((a) => a.id.toString()));
  const alimentosPorId = new Map(alimentosDisponibles.map((a) => [a.id.toString(), a]));

  for (const detalle of cambios.alimentos) {
    if (!idsPermitidos.has(detalle.idAlimento.toString()))
      throw new ValidationError("Alimento no disponible para este paciente");
  }

  const detallesConSnapshot = cambios.alimentos.map((d) => {
    const alimento = alimentosPorId.get(d.idAlimento.toString());
    return {
      idAlimento: alimento.id.toString(),
      nombreAlimento: alimento.nombre,
      unidadMedida: alimento.unidadMedida,
      cantidadUtilizada: d.cantidad,
    };
  });

  return await this.menuRepository.actualizarComida(idComidaMenu, {
    calorias: cambios.calorias,
    alimentos: detallesConSnapshot,
  });
  // el repositorio recalcula DiaMenu.calorias_totales como suma de sus ComidaMenu.calorias
}
```

### `AprobarMenu.ejecutar(idMenu, idNutriologo)`

```js
async ejecutar(idMenu, idNutriologo) {
  const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
  if (!menu) throw new NotFoundError("Menú no encontrado");
  if (menu.estado === "aprobado") return menu; // idempotente: aprobar dos veces no daña nada

  return await this.menuRepository.aprobar(idMenu);
}
```

### `RegistrarRecomendacion.ejecutar(data, { contextoPersistencia })` / `ListarRecomendacionesPorPaciente.ejecutar(idPaciente, idNutriologo)`

Simples: construyen/validan la entidad `Recomendacion` y delegan en el
repositorio; `ListarRecomendacionesPorPaciente` valida propiedad vía
`IPacienteRepository` igual que el resto de casos de uso de lectura.

## Infraestructura — IA

### `Infraestructura/ia/groqClient.js`

Solo transporte: HTTP, autenticación (`GROQ_API_KEY` por variable de
entorno), timeout (20s — generar 7 días completos con un modelo de 70B tarda
más que una respuesta corta) vía `AbortController`, y normalización de
errores de red/HTTP a una excepción única (`GroqRequestError`) que
`GeneradorMenuGroq` traduce a `ServicioExternoError`. No conoce nada de
menús, pacientes ni alimentos.

### `Menu/Infraestructura/GeneradorMenuGroq.js` (implementa `IGeneradorMenuIA`)

Arma el prompt, llama a `groqClient`, parsea el JSON y valida su **forma**
(no su contenido de negocio — eso es de `GenerarMenuSemanal`):

**Prompt** (resumen; el perfil y los alimentos se interpolan):
```
Eres un asistente nutricional. Genera un menú semanal de 7 días para un
paciente con este perfil: peso, altura, objetivo, nivel de actividad,
número de comidas por día, presupuesto, tiempo para cocinar, restricciones,
preferencias.

Alimentos disponibles (usa ÚNICAMENTE estos "id"):
[{ "id": "...", "nombre": "...", "cantidad": ..., "unidadMedida": "..." }, ...]

Responde SOLO con un JSON con este formato exacto, sin texto adicional:
{
  "dias": [
    {
      "numeroDia": 1,
      "caloriasTotales": <numero>,
      "comidas": [
        {
          "orden": 1,
          "tipoComida": "Desayuno",
          "calorias": <numero>,
          "alimentos": [ { "idAlimento": "<id de la lista>", "cantidad": <numero> } ]
        }
      ]
    }
  ],
  "recomendacion": "<texto>"
}
El array "dias" debe tener exactamente 7 elementos. Cada día debe tener
exactamente <numeroComidas> comidas. Usa solo "id" que aparezcan en la
lista de alimentos disponibles.
```

Nota: a Groq **solo** se le pide `idAlimento` + `cantidad` por alimento —
nunca nombre ni unidad de medida, para que no pueda inventarlos (ver tabla
de decisiones).

**Validación técnica** (si algo falla, `ServicioExternoError`, sin
reintento):
- El texto de respuesta parsea como JSON válido.
- `dias` es un array de longitud exactamente 7.
- Cada día tiene exactamente `paciente.numeroComidas` comidas.
- Cada comida tiene al menos un alimento.
- `caloriasTotales`/`calorias`/`cantidad` son números finitos ≥ 0.
- `tipoComida`/`recomendacion` son strings no vacíos.
- `idAlimento` tiene formato de ObjectId (`/^[a-fA-F0-9]{24}$/`) — el
  chequeo de que además **pertenezca al paciente** es de negocio y vive en
  el caso de uso, no aquí.

## Infraestructura — Postgres

### Modelos Sequelize

```js
// MenuModel.js
{
  idPaciente: { type: DataTypes.INTEGER, allowNull: false, index: true },
  estado: { type: DataTypes.ENUM("generado", "aprobado"), allowNull: false, defaultValue: "generado" },
  fechaGeneracion: DataTypes.DATE,
  fechaInicio: DataTypes.DATEONLY,
  fechaFin: DataTypes.DATEONLY,
}

// DiaMenuModel.js
{
  idMenu: { type: DataTypes.INTEGER, allowNull: false },
  numeroDia: { type: DataTypes.INTEGER, allowNull: false },
  caloriasTotales: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}
// UNIQUE(idMenu, numeroDia)

// ComidaMenuModel.js
{
  idDiaMenu: { type: DataTypes.INTEGER, allowNull: false },
  orden: { type: DataTypes.INTEGER, allowNull: false },
  tipoComida: { type: DataTypes.STRING, allowNull: false },
  calorias: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}
// UNIQUE(idDiaMenu, orden)

// DetalleComidaAlimentoModel.js
{
  idComidaMenu: { type: DataTypes.INTEGER, allowNull: false },
  idAlimento: {
    type: DataTypes.STRING(24),
    allowNull: false,
    validate: { is: /^[a-fA-F0-9]{24}$/ }, // NO es FK — Alimento vive en Mongo.
    // Integridad se valida solo al generar/ajustar (idsPermitidos); si el
    // alimento se borra después, el histórico sigue íntegro por el snapshot.
  },
  nombreAlimento: { type: DataTypes.STRING(120), allowNull: false }, // snapshot
  unidadMedida: { type: DataTypes.STRING(30), allowNull: false },    // snapshot
  cantidadUtilizada: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}
```

No se agrega `UNIQUE(idComidaMenu, idAlimento)` — no hay confirmación de que
un mismo alimento no pueda repetirse en una comida (p. ej. usado en dos
preparaciones distintas), no se asume sin que el DER o un RF lo pidan.

### `MenuRepositorySequelize.js`

- `ejecutarEnTransaccion(fn)` → `sequelize.transaction(fn)`, único punto que
  conoce Sequelize; `GenerarMenuSemanal` solo recibe `contextoPersistencia`.
- `crear(menu, dias, { contextoPersistencia })` → crea Menu + DiaMenu +
  ComidaMenu + DetalleComidaAlimento en cascada dentro de la transacción.
- `obtenerVigentePorPaciente(idPaciente)` → el `Menu` más reciente de ese
  paciente con sus relaciones (`include` anidado de Sequelize).
- `obtenerMenuConPropietario(idMenu, idNutriologo)` → un solo query con join
  hasta `Menu.idPaciente` y verificación de `idNutriologo`, usado por
  `AprobarMenu`.
- `obtenerComidaConPropietario(idComidaMenu, idNutriologo)` → un solo query
  con joins hasta `Menu.idPaciente` y verificación de `idNutriologo` (evita
  N+1: no se busca primero el menú y después el paciente por separado).
- `actualizarComida(idComidaMenu, cambios, { contextoPersistencia })` →
  reemplaza `DetalleComidaAlimento` de esa comida, actualiza
  `ComidaMenu.calorias`, y recalcula `DiaMenu.calorias_totales` como
  `SUM(ComidaMenu.calorias)` de ese día.
- `aprobar(idMenu)` → `UPDATE ... SET estado = 'aprobado' WHERE id = idMenu`.

## HTTP

Mismo patrón anidado que Alimento (`mergeParams`, `authMiddleware` +
`verificarPropietarioPaciente` reutilizado tal cual):

```js
// Menu/Infraestructura/http/index.js
app.use(
  "/api/paciente/:idPaciente/menu",
  authMiddleware,
  verificarPropietarioPaciente(pacienteRepositorySequelize),
  MenuRoutes(controller),
);
```

```js
// MenuRoutes.js
router.post("/generar", controller.generar);          // RF-008
router.get("/", controller.obtener);                  // RF-009 / RF-0010
router.put("/comida/:idComidaMenu", controller.ajustar); // RF-0011
router.post("/:idMenu/aprobar", controller.aprobar);
```

```js
// Recomendacion/Infraestructura/http/index.js
app.use(
  "/api/paciente/:idPaciente/recomendacion",
  authMiddleware,
  verificarPropietarioPaciente(pacienteRepositorySequelize),
  RecomendacionRoutes(controller), // solo GET "/" — RF-0012 es de lectura;
                                    // el registro ocurre internamente desde Menu
);
```

Composition roots de `Menu` y `Recomendacion` importan las clases concretas
que necesitan de otros módulos (`AlimentoRepositoryMongo` +
`ListarAlimentosPorPaciente` de Alimento; `PacienteRepositorySequelize` de
Paciente; `RecomendacionRepositorySequelize` + `RegistrarRecomendacion` de
Recomendacion, para Menu) e instancian sus propias copias — mismo estilo que
ya usa `Alimento/Infraestructura/http/index.js` con `PacienteRepositorySequelize`.

Controller: mismo `catch (error) { if (error instanceof AppError) ... }` que
ya usa Alimento, ahora con `ConflictError` (409) y `ServicioExternoError`
(502) sumados al mapeo.

## Manejo de errores — resumen end-to-end

| Situación | Código | Dónde se genera |
|---|---|---|
| Paciente no existe o pertenece a otro nutriólogo | 404 | Middleware `verificarPropietarioPaciente` / caso de uso |
| Paciente sin alimentos registrados | 400 | `GenerarMenuSemanal` |
| Groq no responde a tiempo, HTTP de error, o JSON malformado/con forma incorrecta | 502 | `GeneradorMenuGroq` (técnico) |
| La IA referencia un alimento que no pertenece al paciente | 400 | `GenerarMenuSemanal` / `AjustarComidaMenu` (negocio) |
| Ajustar una comida de un menú ya `aprobado` | 409 | `AjustarComidaMenu` |
| Comida/menú no encontrado | 404 | Caso de uso correspondiente |
| Error inesperado (Postgres caído, etc.) | 500 | `next(error)` → error handler global sanitizado (`app.js`) |

**Excepción documentada a RNF-001:** el objetivo de respuesta <3s aplica a
operaciones locales de consulta y persistencia. La generación de menú
depende de un proveedor externo de IA cuya latencia no puede garantizarse;
el endpoint usa un timeout de 20s, no hace reintentos síncronos, y devuelve
un error controlado (502) si el proveedor no responde a tiempo o de forma
válida.

## Pruebas unitarias (`node --test`, mismo estilo que Alimento)

Con repositorios/generador falsos (stubs manuales, sin librería de mocking):

- **`Menu/Aplicacion/__tests__/GenerarMenuSemanal.test.js`**: paciente no
  existe/no autorizado → `NotFoundError`; sin alimentos → `ValidationError`;
  el generador de IA falla → se propaga `ServicioExternoError` sin
  persistir nada; respuesta con `idAlimento` fuera de `idsPermitidos` →
  `ValidationError`, sin persistir nada; caso feliz → guarda Menú y
  Recomendación en la misma transacción falsa, y el snapshot de
  `nombreAlimento`/`unidadMedida` viene del repositorio de alimentos **aun
  si el fake de IA intenta colar un nombre distinto** (test explícito de
  esta invariante).
- **`AjustarComidaMenu.test.js`**: comida no encontrada → `NotFoundError`;
  menú en estado `aprobado` → `ConflictError`, sin llamar a
  `actualizarComida`; alimento no perteneciente al paciente →
  `ValidationError`; caso feliz → snapshot correcto y calorías tal como las
  ingresó el nutriólogo.
- **`AprobarMenu.test.js`**: no autorizado → `NotFoundError`; ya aprobado →
  no-op sin error; `generado` → transiciona.
- **`ObtenerMenuPorPaciente.test.js`**: delega correctamente, valida
  propiedad.
- **`Menu/Infraestructura/__tests__/GeneradorMenuGroq.test.js`** (con
  `groqClient` falso): JSON no parseable, `dias.length !== 7`,
  `comidas.length !== numeroComidas`, alimentos vacíos, campos no
  numéricos, `idAlimento` con formato inválido → todos lanzan
  `ServicioExternoError`; respuesta válida → devuelve el DTO esperado.
- **`Recomendacion/Aplicacion/__tests__/RegistrarRecomendacion.test.js`**:
  valida y guarda, acepta `contextoPersistencia` opcional.
- **`ListarRecomendacionesPorPaciente.test.js`**: valida propiedad, delega.

Fuera de alcance de estas pruebas: middleware Express, controllers HTTP,
repositorio Sequelize real, llamada real a Groq — igual que se dejó fuera
en el spec de Alimento.

## Frontend (resumen)

Mismo estilo que `alimentoService.js`/`FormularioAlimento.jsx`:

- `services/menuService.js`: `generarMenu(idPaciente)`,
  `obtenerMenu(idPaciente)`, `ajustarComida(idPaciente, idComidaMenu, cambios)`,
  `aprobarMenu(idPaciente, idMenu)`.
- `services/recomendacionService.js`: `listarRecomendaciones(idPaciente)`.
- Nueva vista `MenuPaciente.jsx` (o modal `"menu"` dentro del mismo patrón de
  `Pacientes.jsx`): botón "Generar menú semanal", vista de 7 días con sus
  comidas y calorías (RF-009/RF-0010), edición inline por comida
  (RF-0011), botón "Aprobar" (deshabilitado si `estado === "aprobado"`), y
  sección de recomendación textual (RF-0012).

## Fuera de alcance de este cambio

- Versionado de menús (ajustar uno ya aprobado) — no lo pide ningún RF.
- Recalcular calorías automáticamente al ajustar manualmente — no hay una
  fuente de datos nutricionales propia; el nutriólogo la ingresa.
- `LogAuditoria` (RNF-005) — transversal a los cuatro módulos existentes,
  pendiente como ítem aparte, no específico de Menú.
- Casos de uso de Administrador (gestionar accesos, soporte).
- Streaming de la respuesta de Groq o caché de menús generados.
