# Diseño — Módulo Alimento (RF-005, RF-006, RF-007)

## Contexto

El módulo `Paciente` (CRUD completo, Postgres/Sequelize) ya está implementado
siguiendo arquitectura hexagonal. El módulo `Alimento` es el siguiente en el
SRS (RF-005 registrar, RF-006 editar, RF-007 eliminar alimentos de un
paciente), y debe seguir la misma estructura y estilo.

Restricción adicional del stack del curso: 1 BD relacional + 1 BD no
relacional. Hoy Mongo/Mongoose está conectado (`Infraestructura/database/mongo.js`)
pero ningún módulo lo usa. `Alimento` es el candidato natural: entidad simple,
sin relaciones complejas, y encaja bien como documento.

## Decisiones de diseño

| Decisión | Elegido | Alternativa descartada |
|---|---|---|
| Motor de BD | MongoDB (Mongoose) | Postgres/Sequelize (como en el DER) |
| Rutas | Anidadas: `/api/paciente/:idPaciente/alimento` | Planas `/api/alimento` con idPaciente en body |
| Autorización de propiedad | Middleware `verificarPropietarioPaciente` | Chequeo repetido dentro de cada caso de uso |
| UI de gestión | Modal "Alimentos" por tarjeta de paciente | Página de detalle nueva (requiere routing) |
| Test runner | `node --test` nativo (sin dependencias nuevas) | Jest |
| Validación de forma de `id` Mongo (ObjectId) | En el controller (Infraestructura/http) | En Dominio/Aplicación (rompería agnosticismo de persistencia) |
| Sanitización de errores 500 | Fix pequeño en `app.js` (afecta también Nutriólogo/Paciente) | Mitigación solo local a Alimento |

## Estructura de archivos (backend)

```
backend/src/lib/Alimento/
  Dominio/
    Entidades/Alimento.js
    Ports/IAlimentoRepository.js
    Errores.js                      # AppError, ValidationError, NotFoundError
    __tests__/
      Alimento.test.js
  Aplicacion/
    RegistrarAlimento.js
    EditarAlimento.js
    EliminarAlimento.js
    ListarAlimentosPorPaciente.js
    __tests__/
      RegistrarAlimento.test.js
      EditarAlimento.test.js
      EliminarAlimento.test.js
      ListarAlimentosPorPaciente.test.js
  Infraestructura/
    AlimentoModel.js                 # schema Mongoose, colección "alimentos"
    AlimentoRepositoryMongo.js
    http/
      AlimentoController.js
      AlimentoRoutes.js
      verificarPropietarioPaciente.js
      index.js
```

## Dominio

### Entidad `Alimento`

Campos: `id`, `idPaciente` (entero positivo, requerido), `nombre` (String,
requerido), `cantidad` (número finito > 0, requerido), `unidadMedida`
(String, requerido).

Valida en el constructor igual que `Paciente.js`, pero lanza `ValidationError`
(no `Error` plano) para que el controller pueda mapearlo a 400 de forma
explícita. Validaciones concretas (evita los huecos de `!valor` con `NaN`/
`Infinity`, que son truthy y se cuelan por un chequeo ingenuo):

```js
const idPacienteNum = Number(idPaciente);
if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
  throw new ValidationError("El id del paciente no es válido");

if (!nombre || nombre.trim().length === 0)
  throw new ValidationError("El nombre es requerido");

if (!Number.isFinite(cantidad) || cantidad <= 0)
  throw new ValidationError("La cantidad debe ser mayor a 0");

if (!unidadMedida || unidadMedida.trim().length === 0)
  throw new ValidationError("La unidad de medida es requerida");
```

### Errores (`Errores.js`)

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
```

### Puerto `IAlimentoRepository`

```js
class IAlimentoRepository {
  async save(alimento) {}
  async findByIdAndPaciente(id, idPaciente) {}
  async findAllByPaciente(idPaciente) {}
  async updateByIdAndPaciente(id, idPaciente, cambios) {}
  async deleteByIdAndPaciente(id, idPaciente) {}
}
```

Nótese que **no existe un `findById(id)` ni `updateById(id)`/`deleteById(id)`
sin `idPaciente`**: toda lectura o escritura de un alimento concreto va
siempre acompañada de su paciente dueño, tanto en el nombre del método (el
contrato deja explícito el filtro compuesto, para que una futura
implementación no pueda "olvidarlo") como en la query final a Mongo. Esto es
intencional — cierra el hueco que motivó este ajuste: un `updateById(id)`
desnudo permitiría editar/borrar el alimento de un paciente ajeno con solo
adivinar su `_id`.

## Casos de uso

### `RegistrarAlimento.ejecutar(data)`
Construye `new Alimento(data)` (valida) y guarda.

### `EditarAlimento.ejecutar(id, idPaciente, data)`
```js
const existente = await repo.findByIdAndPaciente(id, idPaciente);
if (!existente) throw new NotFoundError("Alimento no encontrado");

// revalida el estado completo resultante del merge (constructor de Alimento)
const actualizado = new Alimento({ ...existente, ...data, id, idPaciente });

// solo los campos de negocio pasan al repositorio; nunca id/idPaciente/timestamps
const cambios = {
  nombre: actualizado.nombre,
  cantidad: actualizado.cantidad,
  unidadMedida: actualizado.unidadMedida,
};
return await repo.updateByIdAndPaciente(id, idPaciente, cambios);
```

### `EliminarAlimento.ejecutar(id, idPaciente)`
```js
const existente = await repo.findByIdAndPaciente(id, idPaciente);
if (!existente) throw new NotFoundError("Alimento no encontrado");
return await repo.deleteByIdAndPaciente(id, idPaciente);
```

### `ListarAlimentosPorPaciente.ejecutar(idPaciente)`
Delegación directa a `repo.findAllByPaciente(idPaciente)`.

## Infraestructura Mongo

### `AlimentoModel.js`
```js
const AlimentoSchema = new mongoose.Schema(
  {
    idPaciente: { type: Number, required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    cantidad: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isFinite(v) && v > 0,
        message: "La cantidad debe ser mayor a 0",
      },
    },
    unidadMedida: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Alimento", AlimentoSchema, "alimentos");
```
Las validaciones de schema son defensa en profundidad (la entidad de dominio
ya valida antes de llegar aquí); se activan también en updates gracias a
`runValidators: true` más abajo.

### `AlimentoRepositoryMongo.js`
- `findByIdAndPaciente(id, idPaciente)` → `AlimentoModel.findOne({ _id: id, idPaciente })`
- `updateByIdAndPaciente(id, idPaciente, cambios)` →
  ```js
  AlimentoModel.findOneAndUpdate(
    { _id: id, idPaciente },
    { $set: cambios }, // solo nombre/cantidad/unidadMedida — nunca _id/idPaciente/timestamps
    { new: true, runValidators: true },
  );
  ```
- `deleteByIdAndPaciente(id, idPaciente)` → `AlimentoModel.findOneAndDelete({ _id: id, idPaciente })`
- `findAllByPaciente(idPaciente)` → `AlimentoModel.find({ idPaciente }).sort({ createdAt: -1 })`
  (orden estable; no es paginación, solo evita que la lista cambie de orden
  arbitrariamente entre consultas)
- Mapea `_id` (ObjectId) → `id` (string) al construir la entidad de dominio.
- **No valida formato de `id`/ObjectId aquí** — eso ya lo filtró el
  controller antes de llamar al caso de uso (ver sección HTTP). Si de todas
  formas llega un `id` mal formado (llamada directa al repo, por ejemplo en
  un test), Mongoose lanzará `CastError`; se deja sin capturar a propósito
  para que sea evidente en desarrollo — no es el camino que toma una petición
  HTTP real.

## HTTP

### `verificarPropietarioPaciente.js` (middleware, factory)

Valida el **formato** de `idPaciente` (evita el `SequelizeDatabaseError` de
Postgres confirmado más abajo) antes de consultarlo, y deja el valor ya
normalizado en `req.idPaciente` para que el controller no repita la
conversión:

```js
module.exports = (pacienteRepository) => async (req, res, next) => {
  try {
    const idPacienteNum = Number(req.params.idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0) {
      return res.status(400).json({ message: "El id del paciente no es válido" });
    }

    const paciente = await pacienteRepository.findById(idPacienteNum);
    if (!paciente) return res.status(404).json({ message: "Paciente no encontrado" });
    if (paciente.idNutriologo !== req.nutriologo.id)
      return res.status(403).json({ message: "No autorizado" });

    req.idPaciente = idPacienteNum;
    next();
  } catch (error) {
    next(error); // 500 vía error handler global
  }
};
```

**Evidencia que motiva este chequeo:** se probó localmente qué genera
Sequelize para `findByPk('abc')` contra una PK entera —
`WHERE "t"."id" = 'abc'` — que Postgres rechaza en ejecución
(`invalid input syntax for type integer`), y sin este chequeo esa excepción
llegaría como 500 en vez de 400.

### `AlimentoController.js`
- `registrar`: toma `idPaciente` **solo** de `req.idPaciente` (puesto por el
  middleware); cualquier `idPaciente` en `req.body` se ignora explícitamente.
- `editar`/`eliminar`: valida primero que `req.params.id` sea un ObjectId
  válido —
  ```js
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "El id del alimento no es válido" });
  ```
  antes de invocar el caso de uso. Esta validación vive aquí (capa HTTP) y no
  en Dominio/Aplicación: `ObjectId` es un detalle de Mongo, y si el caso de
  uso lo conociera el dominio dejaría de ser agnóstico a la persistencia
  (rompería el aislamiento hexagonal que el proyecto ya declara en RNF-008).
- Todos los métodos: `catch (error) { if (error instanceof AppError) return
  res.status(error.statusCode).json({ message: error.message }); next(error);
  }` — así 400/404 salen del propio módulo y cualquier error inesperado cae al
  error handler global de `app.js` como 500 (ver ajuste a `app.js` más abajo).

### `AlimentoRoutes.js`
```js
const router = express.Router({ mergeParams: true }); // necesario para leer :idPaciente
router.post("/", controller.registrar);
router.get("/", controller.listar);
router.put("/:id", controller.editar);
router.delete("/:id", controller.eliminar);
```

### Registro en `app.js` / `index.js` del módulo
```js
app.use(
  "/api/paciente/:idPaciente/alimento",
  authMiddleware,
  verificarPropietarioPaciente(pacienteRepositorySequelize),
  AlimentoRoutes(controller),
);
```
Requiere importar `PacienteRepositorySequelize` desde el módulo Paciente
(dependencia cruzada de solo-lectura, mismo estilo que Paciente ya importa
`authMiddleware` de Nutriólogo).

## Frontend

### `services/alimentoService.js`
```js
listarAlimentos(idPaciente)
registrarAlimento(idPaciente, datos)
editarAlimento(idPaciente, idAlimento, datos)
eliminarAlimento(idPaciente, idAlimento)
```
Mismo estilo que `pacienteService.js`, todas las rutas construidas como
`` `/paciente/${idPaciente}/alimento...` ``.

### `Pacientes.jsx`
Reemplaza el estado `modalAbierto` (booleano único, solo para el form de
paciente) por:
```js
const [modal, setModal] = useState({ tipo: null, paciente: null });
// tipo: null | "paciente" | "alimentos"
```
Solo se renderiza **un** `<Modal>` a la vez, condicionado por `modal.tipo`.
Abrir "Alimentos" para un paciente cierra automáticamente cualquier modal de
paciente abierto (y viceversa) porque comparten el mismo estado.

### Nuevo: gestión de alimentos dentro del modal
Dentro del modal de tipo `"alimentos"`, se alterna entre una vista de **lista**
y una vista de **formulario** mediante un estado local del propio contenido del
modal (no un segundo `<Modal>` apilado):
- `components/ListaAlimentos.jsx`: lista + botones editar/eliminar (igual
  patrón que la lista de pacientes).
- `components/FormularioAlimento.jsx`: nombre, cantidad, unidad de medida —
  mismo patrón de estado/validación que `FormularioPaciente.jsx`.

## Manejo de errores — resumen end-to-end

| Situación | Código | Dónde se genera |
|---|---|---|
| `idPaciente` con formato inválido (no entero positivo) | 400 | Middleware `verificarPropietarioPaciente` |
| `id` de alimento con formato inválido (no ObjectId) | 400 | `AlimentoController` |
| Campo inválido (nombre vacío, cantidad ≤ 0 o no finita, etc.) | 400 | `ValidationError` en la entidad `Alimento` |
| Alimento no existe para ese paciente | 404 | `NotFoundError` en `EditarAlimento`/`EliminarAlimento` |
| Paciente no existe | 404 | Middleware `verificarPropietarioPaciente` |
| Paciente pertenece a otro nutriólogo | 403 | Middleware `verificarPropietarioPaciente` |
| Error inesperado (Mongo caído, etc.) | 500, mensaje genérico | `next(error)` → error handler global de `app.js` (sanitizado, ver abajo) |

## Ajuste global en `app.js` (sanitización de errores 500)

Fuera del árbol de archivos de Alimento, pero necesario para que la fila
anterior sea cierta: el error handler actual devuelve `err.message` incluso
en 500, lo que puede filtrar detalles internos de Sequelize/Mongoose/stack al
cliente. Cambio mínimo (3 líneas), afecta también a Nutriólogo y Paciente
(para bien, no cambia su comportamiento en casos 400/401 ya manejados
explícitamente por ellos):

```js
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Error interno del servidor" : err.message;
  res.status(statusCode).json({ message });
});
```

Es el único archivo fuera de `Alimento/` que este cambio toca.

## Pruebas unitarias (básicas)

Runner: `node --test` (nativo, sin dependencias nuevas; confirmado
Node v22.23.1 en el entorno de desarrollo). Script en `backend/package.json`:
`"test": "node --test"` (sin path fijo — descubre `*.test.js`
recursivamente; pasar un directorio explícito es innecesario y menos
portable entre versiones de Node).

Cobertura, con repositorio falso (objeto plano con stubs manuales, no hace
falta librería de mocking):
- `Alimento.test.js`: construcción válida; lanza `ValidationError` por cada
  campo inválido/faltante, incluyendo casos límite:
  - `idPaciente` decimal (`1.5`) y negativo.
  - `cantidad: NaN` y `cantidad: Infinity`.
  - `nombre`/`unidadMedida` compuestos solo por espacios.
  - Normalización: `nombre`/`unidadMedida` con espacios al borde quedan
    recortados (`trim()`) en la entidad resultante.
- `RegistrarAlimento.test.js`: guarda la entidad construida; falla si los
  datos son inválidos.
- `EditarAlimento.test.js`: lanza `NotFoundError` si no existe; revalida el
  merge (un dato inválido en el merge también lanza `ValidationError`); llama
  a `updateByIdAndPaciente` con `(id, idPaciente, cambios)` donde `cambios`
  contiene solo `nombre`/`cantidad`/`unidadMedida`.
- `EliminarAlimento.test.js`: lanza `NotFoundError` si no existe; llama a
  `deleteByIdAndPaciente(id, idPaciente)`.
- `ListarAlimentosPorPaciente.test.js`: delega correctamente en
  `findAllByPaciente`.

Fuera de alcance de estas pruebas: middleware Express, controller HTTP,
repositorio Mongo real — se dejan para una futura ronda de integración si el
proyecto decide adoptarla más adelante.

## Fuera de alcance de este cambio

- No se resuelve el bloqueo actual de Postgres (`idNutriologo` NOT NULL sobre
  filas existentes) — es independiente, pero impedirá probar el flujo
  completo end-to-end hasta resolverlo aparte.
- No se toca `mongo.js` — la conexión ya existe y funciona.
- No se añade paginación ni búsqueda a `listar` — no está en el alcance de
  RF-005/006/007.
