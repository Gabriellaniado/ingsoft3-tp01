# Decisiones TP1

## Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera

### Por qué no pudo resolverlo solo:

Git fusiona cambios de forma automática cuando afectan distintas partes de un archivo. Usa un algoritmo de merge de 3 vías: compara el commit base común (el ancestro de donde salieron las dos ramas) contra las puntas de ambas ramas.
Cuando los cambios tocan distintas partes de un archivo, Git los combina automáticamente. Pero en este caso, ambas ramas modificaron exactamente la misma línea (la línea 1 del README.md) y con textos diferentes. Como Git no sabe cuál versión es la que realmente tiene que quedar, frena el merge, marca el archivo con los delimitadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`) y le deja la decisión a la persona para que elija el contenido final.

### Qué tendría que haber pasado para que nunca apareciera:

Para que no ocurriera conflicto, cada rama debería haber editado lineas diferentes o archivos distintos o que antes de crear los cambios en la rama B se hubiera hecho un pull para incorporar los cambios ya mergeados de la rama A.
Tambien deberia existir una comunicacion si son dos miembros de un equipo para que sepan cuando alguien mergea a main.


## Qué problemas encontraste y cómo los solucionaste

No encontré problemas muy grandes. La guía estaba clara. La única duda inicial fue la sintaxis de Markdown para enlazar imágenes locales, pero se resolvió rápido consultando a la IA.

## Declaración de uso de IA

Como dije en el punto anterior utilicé asistencia de IA (Gemini) para consultar la sintaxis correcta de rutas relativas de imágenes en Markdown para armar el archivo evidencias.md.
Para verificarlo comprobé en el navegador y en el editor que las imágenes renderizaran correctamente.


# Decisiones TP2

## Qué app elegiste y por qué (contra los criterios de la guía).
Elegi hacer una aplicación web propia para gestionar reservas de canchas de fútbol. Permite a clientes ver disponibilidad en un calendario y crear reservas; los administradores gestionan canchas(alta, baja y modificacion), confirman/cancelan turnos y monitorean ingresos del mes.

La app quizas tiene algunas vistas mas de las que pide la consigna pero no agrega demasiada dificultad extra. 
Cuenta con una arquitectura de tres capas (backend con API REST en Go, frontend SPA en React con Vite y base de datos relacional PostgreSQL). La hice en go que es un lenguaje que medianamente domino y react el frontend.

Además, corre y compila de forma 100% local sin depender de servicios externos en la nube, y cuenta con tests unitarios en Go para validar la lógica de turnos, lo que me va a servir para el TP5. Si bien el panel de administración agrega alguna pantalla extra, el alcance sigue siendo acotado y manejable, y al estar hecha en Go —un lenguaje que comprendo— puedo mantenerla y modificarla sin problemas para la defensa del integrador.

No es una app compartida, generé un plan y la IA la generó para mi.

## Decisiones de contenerización: imágenes base elegidas, estructura multi-stage, qué persiste y qué no.

### Imágenes base elegidas
| Componente | Imagen de build | Imagen final | Razón |
|---|---|---|---|
| Backend | `golang:1.25-alpine` | `alpine:latest` | El compilador de Go no hace falta en runtime. El binario es estático (`CGO_ENABLED=0`), solo necesita ca-certificates y tzdata |
| Frontend | `node:20-alpine` | `nginx:alpine` | Node y Vite no hacen falta en runtime. nginx sirve los estáticos y hace de proxy inverso para `/api/` |
| Base de datos | — | `postgres:15-alpine` | Versión que usa el proyecto. Alpine por el peso mínimo |

Para el backend utilicé `golang:1.25-alpine` como imagen de compilación y `alpine:latest` para la imagen final. El compilador y las herramientas de Go solo hacen falta durante el build, por lo que compilar el binario de forma estática (`CGO_ENABLED=0`) me permitió descartar todo el SDK y dejar una imagen de runtime de apenas ~40 MB, instalando únicamente `ca-certificates` y `tzdata` para el manejo de certificados y zonas horarias. En el frontend apliqué el mismo criterio: usé `node:20-alpine` para instalar dependencias y generar el build con Vite, y luego pasé los archivos estáticos a `nginx:alpine`. Nginx no solo sirve la SPA, sino que actúa como proxy inverso redirigiendo las peticiones relativas de `/api/` hacia el servicio `http://backend:8080`, lo que evita problemas de CORS y permite que la imagen sea portable a cualquier entorno.

### Estructura multi-stage y persistence

**¿Por qué multi-stage?**
Sin multi-stage, la imagen final del backend incluiría el SDK completo de Go (~300 MB). Con multi-stage, la imagen final pesa ~45 MB y solo contiene el binario compilado. Lo mismo para el frontend: sin multi-stage, viajarían Node, Vite y `node_modules`. con multi-stage, solo viajan los HTML/JS/CSS del `dist/`.

**Orden de instrucciones para aprovechar el cache:**
Las instrucciones del Dockerfile se ordenaron de lo que cambia con menos frecuencia a lo que cambia más seguido, ya que cuando una capa se modifica, Docker invalida esa y todas las que vienen después. Por eso, primero se copian únicamente los manifiestos de dependencias (`go.mod`/`go.sum` y `package*.json`) y se ejecutan las descargas (`go mod download` y `npm ci`). Recién después se copia el resto del código fuente (`COPY . .`) y se compila. Así, cuando tocamos una línea de código, Docker no vuelve a descargar paquetes externos y reutiliza la caché, haciendo los builds casi instantáneos.

**Que persiste**
En el docker compose definimos los volumes para que persistan los datos de la base de datos, de manera que si se reinicia el contenedor los datos no se pierdan.

En este caso hay un volumen que se llama `pgdata` que es el que persiste los datos de la base de datos dentro del contenedor de PostgreSQL. De esta manera, las canchas y reservas registradas sobreviven a reinicios del servicio y a un `docker compose down` tradicional. Solo se limpian cuando se ejecuta explícitamente `docker compose down -v`. Además, agregué un `healthcheck` con `pg_isready` en el servicio de la base de datos para que el backend espere a que Postgres esté realmente listo antes de arrancar.

## Problemas encontrados y cómo los resolviste.
Tuve algunas complicaciones sobre todo con el uso de comandos para go que eran distintos a los de la consigna que estaban para .net. 
Tuve que seguir el video porque la guia se me hizo dificil de seguir.
Me costo subir las imagenes al registro, generar el token, ponerlo en la terminal y pushear con el comando correcto. Pero lo resolvi consultandolo con la IA.

## Declaración de uso de IA

Utilice la IA para que me de los comandos correctos que deberia utilizar. Ademas, iba autocompletando con lo que me sugeria chequeando a la vez el ejemplo de la guia.

La app la hizo completamente la IA, yo le di indicaciones previas de lo que queria que haga, defini algunos ADRs y condiciones necesarias de cumplimiento y caracteristicas y el generó todo. Luego yo fui haciendo pruebas para asegurarme de que todo funcione correctamente.

Todas las decisiones tomadas y la estructura de la app se pueden encontrar en el README.md: [Decisiones Arquitectónicas en README.md](README.md#7-decisiones-arquitectónicas)

# Decisiones TP3

## Duración del sprint.
El sprint que elegí es de una duración de una semana. La idea es poder seguir el cronograma de la materia y realizar un tp por semana. Si me estiro más allá de una semana probablemente no llegue con el tiempo para la entrega final del proyecto.
Trabajar con sprints cortos en un desarrollo individual reduce la incertidumbre, obliga a planificar incrementos de valor pequeños y proporciona retroalimentación rápida cada semana, evitando retrasos o acumulaciones de trabajo.

## Número del límite de trabajo en progreso
Como bien sugiere el video y la guía, elegí 2 tareas como límite de la columna In Progress para evitar el hecho de hacer demasiadas cosas al mismo tiempo y que nada se termine, estancando el progreso. El video sugiere n trabajadores +1. Al ser individual 1+1. 

La meta es sostener el principio de Kanban de empezar menos y terminar más, evitando el costo cognitivo de la multitarea y el inventario de código a medio hacer. El cupo extra (+1) funciona como una válvula operativa por si una tarea queda momentáneamente frenada y necesito avanzar en otra sin romper el flujo de trabajo.

## Diagnóstico de la historia mal escrita: por qué está mal escrita y cómo la reescribirías.
No aporta valor de negocio ni está enfocada en el usuario final. Es una tarea técnica. Además, el rol Como desarrollador es incorrecto porque el desarrollador es quien implementa la solución, no el beneficiario del valor, mientras que "crear la tabla para guardar datos" es un detalle de implementación y no una necesidad del cliente

Como usuario registrado, quiero poder actualizar mis datos de perfil para mantener mi información de contacto al día. 
(Criterio de aceptación: los cambios modificados en el formulario se guardan correctamente en la base de datos y se reflejan al recargar la vista).

## Problemas encontrados y cómo los resolviste.
No encontre grandes problemas en la realización de este trabajo. El único paso a verificar fue la versión de GitHub CLI para confirmar si podía vincular sub-issues con --add-sub-issue desde la terminal o si debía hacerlo por la web. No pude desde ubuntu descargar la version mas reciente por lo que lo hice desde la web.

## Declaración de uso de IA
No utilice IA en este trabajo. Únicamente consulté a la IA (Gemini) para revisar la redacción y síntesis de este archivo `decisiones.md`, verificando personalmente que cada justificación reflejara exactamente las decisiones tomadas en el repositorio.


# Decisiones TP4

## Estructura elegida del pipeline (¿por qué esos jobs? ¿por qué en paralelo?).
El pipeline divide la ejecución en los jobs build-backend y build-frontend para aislar los entornos según la arquitectura desacoplada de la app (un backend en Go y un frontend en React/Vite). Al correr en paralelo sobre runners limpios, se optimiza el tiempo de feedback reduciendo la duración total al tiempo del job más pesado. Esta separación responde a la arquitectura desacoplada del proyecto, los cuales no comparten código ni necesitan de los artefactos del otro para construirse.

En GitHub Actions cada job se ejecuta en un runner limpio y efímero (`ubuntu-latest`) con su propio sistema de archivos aislado. Al no haber dependencias secuenciales entre ellos, corren en paralelo por defecto. Esto optimiza notablemente el ciclo de feedback en los Pull Requests, ya que la duración total de la verificación equivale únicamente al tiempo del job más pesado y no a la suma de ambos.

## Qué cachea tu pipeline (capas: cuáles se reutilizan y cuáles no) y qué pasa si el cache desaparece.
A través del paso `docker/setup-buildx-action`, se habilita el constructor BuildKit de Docker para exportar e importar las capas de las imágenes directamente hacia el almacén de GitHub Actions utilizando `cache-from` y `cache-to` con `type=gha,mode=max`. Para evitar que un job sobreescriba el almacenamiento del otro en cada corrida, se configuró un estante separado mediante `scope=backend` y `scope=frontend`

Gracias al orden de instrucciones definido en los Dockerfiles, las capas tempranas que descargan dependencias externas (`go.mod`/`go.sum` con `go mod download`, y `package*.json` con `npm ci`) se reutilizan marcándose como `CACHED` siempre que dichos manifiestos no sufran cambios. En cambio, las capas posteriores donde se copia el código fuente (`COPY . .`) y se genera la compilación se invalidan y se reconstruyen en cada commit.

Si GitHub Actions borra el almacén de caché (por superar el límite de cuota o por inactividad), el pipeline funciona exactamente igual: descarga las dependencias y compila todo de cero sin fallar, simplemente tardando unos segundos más. El caché es solo una optimización de velocidad y el pipeline no depende de él para completar el build con éxito.

## Por qué el pipeline construye con tu Dockerfile en vez de compilar por su cuenta.

Construir las imágenes a través de los Dockerfiles asegura la paridad absoluta entre los entornos de desarrollo local, integración continua y los futuros despliegues. Si el pipeline compilara nativamente sobre la máquina virtual ejecutando comandos de Go o Node directamente, tendríamos dos recetas de build paralelas que con el tiempo divergen, arriesgándonos a que el código compile en el runner pero falle al empaquetarse en el contenedor. 

Además, utilizar Dockerfile convierte al workflow en un proceso desacoplado y agnóstico al stack tecnológico: el runner no necesita tener preinstalados SDKs específicos ni lidiar con versiones del sistema operativo host, encargándose únicamente de orquestar la construcción del mismo contenedor inmutable que viajará hacia producción.

## Problemas encontrados y cómo los resolviste.
Tuve algunos problemas cuando hacia push de los commits porque la ruta la habia definido mal y porque me olvide de ponerle el constructor para la cache al backend entonces el job del backend tiraba error. Me di cuenta viendo los logs de actions en donde claramente te decia cual era el problema.

## Declaración de uso de IA.
No use ia para este tp. Solo me ayude de la ia para escribir mejor mis ideas en este archivo de decisiones.md.


# Decisiones TP5

## Qué lógica elegiste testear y por qué ESA (¿dónde duele un bug en tu app?)

Elegí testear la capa de **servicio** en dos paquetes con lógica de negocio propia: `internal/bookings/service.go` y `internal/courts/service.go`.

**`bookings/service.go`** es el núcleo de la app: decide si una reserva puede crearse, si una transición de estado es válida y si un usuario tiene permiso para cancelar. Un bug ahí tiene consecuencias directas:
- Si falla la validación de horarios (RN#2), un cliente puede reservar a las 2 AM.
- Si falla el control de solapamiento (RN#1), dos equipos quedan en la misma cancha al mismo horario.
- Si falla la máquina de estados (RN#4), un turno cancelado podría "resucitar" como confirmado.
- Si falla la autorización (RN#5), cualquier usuario puede cancelar la reserva de otro.

**`courts/service.go`** tiene lógica propia en `Update`: busca la cancha por ID y falla con un error claro si no existe. Si esa rama no está testeada y se rompe, el admin recibe un panic o un mensaje de error críptico en lugar de un 404 controlado.

Los otros servicios (`users`, `settings`, `dashboard`) son delegación pura al repositorio — no tienen ramas de decisión propias, y testearlos sería verificar que Go llama una función, no que una regla de negocio funciona.

Los handlers HTTP y repositorios no se testearon: los handlers son cableado fino (parsear JSON y llamar al servicio), y los repositorios hablan con PostgreSQL — ambos requieren infraestructura real y pertenecen a la categoría de tests de integración.

En el **frontend** se testean `Login.tsx` y `BookingCalendar.tsx` por las mismas razones de impacto en el usuario final.

## Tu umbral de coverage: el número, sobre qué métrica (línea, rama o las dos) y por qué ése — y el número de rama que te da hoy, lo hayas usado o no como umbral.

Elegí un **umbral del 80% sobre statements** aplicado a la capa de servicio de los dos paquetes testeados: `internal/bookings/service.go` y `internal/courts/service.go` combinados.

**Por qué 80%:**
- La medición real hoy filtrada a ambos `service.go` es **~82%** — el umbral está anclado en un número real y deja un margen justo: cualquier función nueva sin tests lo cruza, pero el código actual lo pasa.
- Las funciones con lógica de negocio real tienen cobertura alta: `Create` (88%), `UpdateStatus` (85.7%), `CancelMy` (88.9%), `GetAvailability` (75%), `validTransition` (100%), `courts.Create` (100%), `courts.Update` (100%).
- Lo que queda sin cubrir son funciones de delegación pura (`GetAll`, `GetMyFuture`, `courts.Delete`) — un delegador sin lógica propia no tiene ramas que testear; subirlo requeriria tests de integración.
- El umbral en 80% es el elegido intencionalmente para que la demo del **PR bloqueado** funcione: al agregar una función nueva sin test, la cobertura baja de 80% y el gate se pone en rojo.

**Sobre la métrica de ramas (branch coverage):**
Go no reporta branch coverage nativamente con `go test -cover` — solo statements. Para obtener branch coverage se necesitaría el flag experimental `-gcflags="-cover"` o herramientas externas como `go-test-coverage`. Hoy el reporte de statements combinado es **~80%**.

## Qué dejaste afuera de la cuenta de cobertura, backend y frontend, y por qué cada cosa (§2.4)

### Backend (Go)

El umbral se aplica sobre `./internal/bookings` y `./internal/courts` con `go test -coverprofile=coverage.out ./internal/bookings ./internal/courts`. Dentro del `coverage.out` resultante se filtran solo las líneas de `service.go` de cada paquete para el cálculo del gate.

Quedaron afuera:
- **`cmd/server/main.go`**: es el arranque (cablea el router, conecta la BD, llama a `http.Listen`). No hay reglas de negocio ahí; si está mal, la app no levanta y te enterás inmediatamente.
- **`internal/bookings/handler.go` y `internal/courts/handler.go`**: cableado HTTP fino — parsean JSON, llaman al servicio y escriben la respuesta. Testearlos requiere un HTTP server real: test de integración, no unitario.
- **`internal/bookings/repository.go` y `internal/courts/repository.go`**: hablan con PostgreSQL vía GORM. Requieren base de datos real: integración.
- **`model.go` en todos los paquetes**: solo structs con tags de GORM/JSON. Sin comportamiento que verificar.
- **`internal/auth/`, `internal/dashboard/`, `internal/middleware/`, `internal/settings/`, `internal/users/`**: servicios sin lógica de negocio propia (delegación pura) o infraestructura de autenticación. El umbral no se aplica ahí porque medir un delegador sin ramas no agrega información.

Excluir eso no es trampa: es medir lo que importa. La trampa sería excluir lógica de negocio real porque no la testeé.

### Frontend (Vitest + @vitest/coverage-v8)

La cobertura se mide sobre los archivos declarados en `include` de `vite.config.ts`: `Login.tsx` y `BookingCalendar.tsx`. El umbral es **58% de statements** — distinto al 80% del backend, y la diferencia está justificada:

- **`Login.tsx` (50%)**: la mitad de sus statements están en el bloque `handleLogin` (la llamada a la API, el manejo del token, la navegación post-login). Testear ese flujo unitariamente requiere mockear `useNavigate`, el contexto de auth y la respuesta HTTP simultaneous — es territorio de test de integración o e2e. Lo que sí se testea unitariamente (la habilitación del botón según los campos) está cubierto al 100%.
- **`BookingCalendar.tsx` (60.91%)**: el componente tiene más de 200 líneas de renderizado condicional que solo se activa tras secuencias de interacción del usuario: seleccionar una fecha en el calendario, elegir un slot, escribir el nombre del equipo y confirmar. Cubrir esos estados unitariamente requiere montar el componente completo con datos mockeados de slots, simular clicks en celdas del calendario y verificar las transiciones de estado — esto supera el scope de un unit test y pertenece a e2e (TP7). Los statements cubiertos corresponden a la carga inicial y el manejo del caso sin canchas, que sí son testables en aislamiento.
- **El 58% es el piso, no el techo**: es el número que da la cobertura real hoy sobre el código que tiene sentido testear unitariamente. Ponerlo más alto forçaría a escribir tests que simulan interacción compleja de DOM — test de integración disfrazados de unit tests, que son más fruto de alcanzar un número que de verificar comportamiento.

El resto del frontend queda afuera porque:
- **`src/api/`**: clientes HTTP puros (axios). Se mockean en los tests, no se testean directamente.
- **`src/store/AuthContext.tsx`**: contexto de React. Se mockea con `vi.mock`.
- **`src/components/`**: componentes de UI sin lógica de negocio propia (Sidebar, LoadingSpinner, etc.).
- **`src/pages/admin/`**: páginas de administración sin tests por ahora.
- **`main.tsx`**: arranque de la SPA, no tiene comportamiento testeable.

## Por qué coverage alto no garantiza calidad (con TU ejemplo)

En `service.go`, la función `GetAvailability` (línea 103) genera los slots de disponibilidad de una cancha para un día. Si escribiera este test:

```go
func TestGetAvailability_EjecucionSinAssert(t *testing.T) {
    svc := newSvc(&mockRepo{})
    svc.GetAvailability(uuid.New(), "2026-12-01")   // se ejecuta... pero no hay ningún Assert
}
```

Ese test llevaría la cobertura de `GetAvailability` del 0% al 100% en statements. El reporte quedaría verde. Pero si la función devolviera slots con horarios incorrectos, o una lista vacía cuando debería tener 14 slots, o si se rompiera el cálculo del número de slots según `SlotDurationMinutes`, **ningún test se pondría en rojo**.

Coverage mide ejecución, no verificación. El test de arriba ejecuta `GetAvailability` sin comprobar nada de lo que devuelve: sube el número y no custodia ninguna regla.

## Tu Pull Request bloqueado: qué check se puso en rojo, en qué métrica (el log lo dice), por qué, y qué escribiste para arreglarlo.

*(Esta sección se completa después de configurar el umbral en el pipeline y ver el PR fallar — ver §3 de la guía.)*

## Si refactorizaste para poder mockear: qué cambiaste y por qué no se podía testear antes

### `bookings/service.go` — sin refactor necesario

El servicio de reservas ya estaba diseñado para DI desde el TP2:
- `BookingRepository` es una **interfaz** que declara los métodos de acceso a datos. La implementación concreta `GORMBookingRepository` habla con PostgreSQL; el mock la implementa en memoria.
- `settingsGetter` es una **interfaz privada** con un único método `Get()`. El mock devuelve configuración fija.

En los tests se inyectan `mockRepo` y `mockSettings` sin tocar el código de producción.

### `courts/service.go` — refactor en este TP

`courts.Service` **antes** tenía acoplamiento concreto al repositorio:
```go
// ANTES — no testeable
type Service struct{ repo *Repository }  // *Repository concreto
func NewService(repo *Repository) *Service { ... }
```

Esto impedía reemplazar el repositorio por un mock en los tests: `*Repository` necesita una conexión real a PostgreSQL para funcionar.

**El refactor** consistió en extraer la interfaz `CourtRepository` y hacerla el contrato del servicio:
```go
// DESPUÉS — testeable
type CourtRepository interface {
    FindAll() ([]Court, error)
    FindByID(id uuid.UUID) (*Court, error)
    Create(c *Court) error
    Update(c *Court) error
    SoftDelete(id uuid.UUID) error
}
type Service struct{ repo CourtRepository }
func NewService(repo CourtRepository) *Service { ... }
```

El código de producción (`NewRepository` devuelve un `*Repository` que implementa `CourtRepository`) no cambió su comportamiento — solo el contrato se volvió explícito. En los tests se pasa `mockCourtRepo` implementado a mano, sin base de datos.

## Si tu stack no es el de la cátedra (.NET + vitest): qué herramienta usaste para cada fila de la tabla «Tu stack, de un vistazo»

| Lo que tenés que lograr | 🐹 Go (backend) | Vitest (frontend) |
| :--- | :--- | :--- |
| **Dónde viven los tests** | Al lado del código, en archivos con el sufijo `_test.go` (mismo paquete con `_test` como sufijo del package name para tests de caja negra) | `src/tests/`, importando los componentes desde `src/pages/` |
| **Un test parametrizado** | **Table-Driven Tests**: un `slice` de structs recorrido con un `for` y `t.Run(tc.name, func(t *testing.T){...})` | `it.each([...])('nombre $campo', async ({...}) => {...})` de Vitest |
| **Que la dependencia entre desde afuera** | **Interfaz** pasada como parámetro en `NewService(repo BookingRepository, settingsRepo settingsGetter)` — Go no tiene DI automático, la inyección es manual en el constructor | Props del componente o `vi.mock()` que intercepta la importación del módulo |
| **Fabricar el doble (mock)** | Implementar la interfaz a mano (`mockRepo` y `mockSettings` como structs que implementan la interfaz) — no se necesita ningún framework | `vi.mock('../api/courts', () => ({...}))` de Vitest intercepta el módulo completo |
| **Medir la cobertura** | `go test -coverprofile=coverage.out ./internal/bookings` y `go tool cover -func=coverage.out` para el desglose | `npx vitest run --coverage` con `@vitest/coverage-v8` |
| 🔴 **Un umbral que ROMPE el build** | No es nativo. Se automatiza en el pipeline con un script: `go tool cover -func=coverage.out \| grep total \| awk '{print $3}' \| sed 's/%//'` y se compara el número contra el umbral con `bc` o Python | `coverage.thresholds` en `vite.config.ts` o `vitest.config.ts` |
| 🔴 **Qué ENTRA en la cuenta** | `go test -coverprofile=coverage.out ./internal/bookings` (solo el paquete con lógica de negocio). Con `-coverpkg=./...` se mide todo y el número se desploma al ~8.7% por incluir handlers y repos sin tests | El `include:` en la config de coverage de Vitest filtra qué archivos entran |
| **Reporte legible del resultado** | `go tool cover -html=coverage.out -o coverage.html` genera un HTML interactivo con líneas coloreadas por cobertura | Reporte HTML generado por `@vitest/coverage-v8` en `./coverage/` |
| 🔴 **Que las herramientas de test ENTREN a la etapa de tests del Dockerfile** | El toolchain de Go ya viene incluido en la imagen oficial `FROM golang:X.X-alpine` — no requiere instalar nada extra. `go test` está disponible sin dependencias adicionales | `npm ci` (sin `--omit=dev`) para que `vitest` y `@vitest/coverage-v8` estén disponibles |

## El ejercicio del camino sin cubrir

Al abrir el reporte HTML (`go tool cover -html=coverage.out`) en `bookings/service.go`, la **línea 47** aparecía coloreada en naranja (rama parcialmente cubierta):

```go
sett, err := s.settingsRepo.Get()
if err != nil {                         // ← línea 47: rama "err != nil" no recorrida
    return nil, errors.New("no se pudo obtener la configuración")
}
```

**1. Qué línea era:** Línea 47 de `service.go` — la rama `err != nil` del `if` que maneja el fallo de `settingsRepo.Get()`.

**2. Qué entrada la recorre:** Pasar un `mockSettingsError` que devuelva error en `Get()`:

```go
type mockSettingsError struct{}
func (m *mockSettingsError) Get() (*settings.Settings, error) {
    return nil, errors.New("fallo simulado de configuración")
}
```

**3. Qué decidí:** En la iteración anterior lo dejé pendiente. En la iteración siguiente **lo agregué** como `TestCreate_SettingsRepoError` en `service_test.go`. El test pasa `mockSettingsError` como dependencia y verifica que `Create` devuelva error cuando la configuración no está disponible — cubre la rama de infraestructura que el reporte marcaba en naranja.

## Problemas encontrados y cómo los resolviste.

No estaba en la tabla Go, así que la completé (ver tabla «Tu stack, de un vistazo» arriba).

El principal problema fue que `@vitest/coverage-v8` no estaba instalado en el frontend. Al correr `npx vitest run --coverage` el CLI preguntaba interactivamente si instalarlo, lo que bloqueaba el pipeline. La solución fue instalarlo explícitamente como devDependency con `npm install -D @vitest/coverage-v8@^4.1.10` antes de integrar el step en el CI.

También detecté que los tests originales de `BookingCalendar.test.tsx` tenían condicionales defensivos (`if (btn)` / `else`) que hacían que siempre pasaran independientemente del comportamiento real del componente — falsos positivos. Los reescribí para que verifiquen comportamiento concreto observable: que el nombre de la cancha devuelta por el mock aparezca como `<option>` en el `<select>`, y que cuando no hay canchas el componente muestre el mensaje "No hay canchas disponibles" y no renderice el selector.

**`RUN` vs `ENTRYPOINT` en la etapa de tests del Dockerfile, y por qué Docker en lugar de `setup-go` directamente:**

La cátedra usa `ENTRYPOINT` en la etapa `test` del Dockerfile de .NET:
```dockerfile
FROM build AS test
ENTRYPOINT ["dotnet", "test", "Backend.sln", "--logger", "trx;LogFileName=tests.trx", "--results-directory", "/out"]
```

En Go seguí el mismo patrón con `ENTRYPOINT` apuntando a un script [`scripts/run_tests.sh`](app/backend/scripts/run_tests.sh):
```dockerfile
FROM builder AS test
COPY scripts/run_tests.sh /run_tests.sh
RUN chmod +x /run_tests.sh
ENTRYPOINT ["/run_tests.sh"]
```

Y en el CI:
```yaml
- docker build --target test --load -t backend-test:ci .
- docker run --rm -v "$GITHUB_WORKSPACE/TestResults:/out" backend-test:ci
```

**¿Por qué `ENTRYPOINT` y no `RUN`?**
Con `RUN` los tests corren durante el `docker build` y los archivos generados quedan dentro de la capa del contenedor sin forma de extraerlos. Para sacar `coverage.html`, `coverage.out` y `test-results.txt` al runner (y poder subirlos como artifact) se necesita un volumen, y para montarlo hay que ejecutar el contenedor con `docker run` — que solo dispara el script si el contenedor tiene `ENTRYPOINT` o `CMD`.

**¿Por qué Docker y no `actions/setup-go` directo?**
Para Go, el patrón más idiomático en la industria es correr `go test` directamente en el runner con `actions/setup-go` — más simple, sin overhead de capas Docker. Sin embargo, elegí el enfoque Docker por dos razones:

1. **Consistencia con la consigna**: el patrón de la cátedra usa Docker para los tests, y seguirlo facilita la comparación y la discusión en clase.
2. **Aislamiento de entorno**: los tests corren en la misma imagen base (`golang:1.25-alpine`) que el pipeline de build. Si el runner cambia versión de Go, los tests siguen corriendo con la versión del `go.mod`, no la del runner.

La desventaja es el overhead del `docker build` + `docker run` vs. un `go test` directo. Para este proyecto el tiempo extra es aceptable.

## Declaración de uso de IA.

Utilicé IA (Antigravity/Gemini) a lo largo de todo el TP para: analizar si los tests cumplían los criterios de la consigna, reformatear los tests al patrón AAA, agregar el test parametrizado Table-Driven en Go y el `it.each` en Vitest, calcular los números de cobertura, reescribir los tests débiles de BookingCalendar, e identificar el camino sin cubrir en el reporte de coverage. Verifiqué cada cambio corriendo los tests localmente y revisando que los resultados fueran coherentes con lo que el código hace.


