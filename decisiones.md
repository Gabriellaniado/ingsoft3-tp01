# Decisiones TP1

## Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera

### Por qué no pudo resolverlo solo:

Git fusiona cambios de forma automática cuando afectan distintas partes de un archivo. En este caso, ambas ramas modificaron exactamente la misma línea y partiendo de un mismo historial en común. Git no puede saber por sí mismo cuál versión es la correcta, por lo que pausa el proceso y delega la decisión en el usuario.

### Qué tendría que haber pasado para que nunca apareciera:

Para que no ocurriera conflicto, cada rama debería haber editado lineas diferentes o archivos distintos o que antes de crear los cambios en la rama B se hubiera hecho un pull para incorporar los cambios ya mergeados de la rama A.


## Qué problemas encontraste y cómo los solucionaste

No encontré problemas muy grandes. La guía estaba clara. La única duda inicial fue la sintaxis de Markdown para enlazar imágenes locales, pero se resolvió rápido consultando a la IA.

## Declaración de uso de IA

Como dije en el punto anterior, utilice Gemini para consultarle cómo subir las imagenes al MarkDown pero el resto del trabajo fue realizado por mi mismo.



# Decisiones TP2

## Qué app elegiste y por qué (contra los criterios de la guía).
Elegi hacer una aplicación web propia para gestionar reservas de canchas de fútbol. Permite a clientes ver disponibilidad en un calendario y crear reservas; los administradores gestionan canchas, confirman/cancelan turnos y monitorean ingresos del mes.

La app quizas tiene algunas vistas mas de las que pide la consigna pero no agrega demasiada dificultad extra. La hice en go que es un lenguaje que medianamente domino y react el frontend.

La app tiene los test que pide la catedra, se puede buildear localmente. No es compartida, genere un plan y la IA la genero para mi.

## Decisiones de contenerización: imágenes base elegidas, estructura multi-stage, qué persiste y qué no.

### Imágenes base elegidas
| Componente | Imagen de build | Imagen final | Razón |
|---|---|---|---|
| Backend | `golang:1.25-alpine` | `alpine:latest` | El compilador de Go no hace falta en runtime. El binario es estático (`CGO_ENABLED=0`), solo necesita ca-certificates y tzdata |
| Frontend | `node:20-alpine` | `nginx:alpine` | Node y Vite no hacen falta en runtime. nginx sirve los estáticos y hace de proxy inverso para `/api/` |
| Base de datos | — | `postgres:15-alpine` | Versión que usa el proyecto. Alpine por el peso mínimo |

### Estructura multi-stage y persistence

**¿Por qué multi-stage?**
Sin multi-stage, la imagen final del backend incluiría el SDK completo de Go (~300 MB). Con multi-stage, la imagen final pesa ~45 MB y solo contiene el binario compilado. Lo mismo para el frontend: sin multi-stage, viajarían Node, Vite y `node_modules`. con multi-stage, solo viajan los HTML/JS/CSS del `dist/`.

**Orden de instrucciones para aprovechar el cache:**
Copiamos primero `go.mod`/`go.sum` (o `package*.json`), instalamos dependencias, y recién después copiamos el código fuente. Así Docker no reinstala todas las dependencias cada vez que cambia una línea de código, solo cuando cambian los manifiestos de dependencias.

**Que persiste**
En el docker compose definimos los volumes para que persistan los datos de la base de datos, de manera que si se reinicia el contenedor los datos no se pierdan.

En este caso hay un volumen que se llama `pgdata` que es el que persiste los datos de la base de datos.

## Problemas encontrados y cómo los resolviste.
Tuve algunas complicaciones sobre todo con el uso de comandos para go que eran distintos a los de la consigna que estaban para .net. 
Tuve que seguir el video porque la guia se me hizo dificil de seguir.
Me costo subir las imagenes al registro, generar el token, ponerlo en la terminal y pushear con el comando correcto. Pero lo resolvi consultandolo con la IA.

## Declaración de uso de IA

Utilice la IA para que me de los comandos correctos que deberia utilizar. Ademas, iba autocompletando con lo que me sugeria chequeando a la vez el ejemplo de la guia.

La app la hizo completamente la IA, yo le di indicaciones previas de lo que queria que haga, defini algunos adr y condiciones necesarias de cumplimiento y caracteristicas y el generó todo. Luego yo fui haciendo pruebas para asegurarme de que todo funcione correctamente.



# Decisiones TP3

## Duración del sprint.
El sprint que elegí es de una duración de una semana. La idea es poder seguir el cronograma de la materia y realizar un tp por semana. Si me estiro más allá de una semana probablemente no llegue con el tiempo para la entrega final del proyecto.

## Número del límite de trabajo en progreso
Como bien sugiere el video y la guía, elegí 2 tareas como límite para evitar el hecho de hacer demasiadas cosas al mismo tiempo y que nada se termine estancando el progreso. El video sugiere n trabajadores +1.

## Diagnóstico de la historia mal escrita: por qué está mal escrita y cómo la reescribirías. Dos renglones.
No aporta valor de negocio ni está enfocada en el usuario final. Es una tarea técnica. Además, el rol Como desarrollador es incorrecto porque el desarrollador es quien implementa la solución, no el beneficiario del valor, y el beneficio para guardar los datos es una obviedad técnica, no una necesidad real del negocio.

Como usuario registrado, quiero poder actualizar mis datos de perfil para mantener mi información de contacto al día. 
(Criterio de aceptación: Validar que los cambios se persistan correctamente en la base de datos).

## Problemas encontrados y cómo los resolviste.
No encontre grandes problemas en la realización de este trabajo. El único paso a verificar fue la versión de GitHub CLI para confirmar si podía vincular sub-issues con --add-sub-issue desde la terminal o si debía hacerlo por la web. No pude desde ubuntu descargar la version mas reciente por lo que lo hice desde la web.

## Declaración de uso de IA
No utilice IA en este trabajo.



# Decisiones TP4

## Estructura elegida del pipeline (¿por qué esos jobs? ¿por qué en paralelo?).
El pipeline divide la ejecución en los jobs build-backend y build-frontend para aislar los entornos según la arquitectura desacoplada de la app. Al correr en paralelo sobre runners limpios, se optimiza el tiempo de feedback reduciendo la duración total al tiempo del job más pesado, ya que no existen dependencias de archivos entre sí.

## Qué cachea tu pipeline (capas: cuáles se reutilizan y cuáles no) y qué pasa si el cache desaparece.
A través de setup-buildx-action, las capas generadas por Docker se exportan al almacén de GitHub Actions (type=gha). Gracias al orden del Dockerfile, las capas de dependencias se marcan como CACHED y se reutilizan si no hubo cambios, mientras que las de código fuente se invalidan y reconstruyen en cada commit. Si la plataforma borrara el almacén por límite de espacio, el pipeline funcionaría exactamente igual de bien, solo que más lento.

## Por qué el pipeline construye con tu Dockerfile en vez de compilar por su cuenta.
En lugar de compilar de forma nativa en la máquina virtual, el pipeline ejecuta el Dockerfile de cada servicio. Esto asegura la paridad de entornos (desarrollo, CI y producción) y evita divergencias de versiones de compiladores o entornos de ejecución en el servidor, convirtiendo al workflow en un proceso agnóstico al stack tecnológico.

Asi, siempre sera el mismo artefacto el que pasa por todas las etapas y evitamos hacer el build mas de una vez.

## Problemas encontrados y cómo los resolviste.
Tuve algunos problemas cuando hacia push de los commits porque la ruta la habia definido mal y porque me olvide de ponerle el constructor para la cache al backend entonces el job del backend tiraba error. Me di cuenta viendo los logs de actions en donde claramente te decia cual era el problema.

## Declaración de uso de IA.
No use ia para este tp. Solo me ayude de la ia para escribir mejor mis ideas en este archivo de decisiones.md.
