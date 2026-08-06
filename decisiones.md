# Decisiones para este TP

## Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera

### Por qué no pudo resolverlo solo:

Git fusiona cambios de forma automática cuando afectan distintas partes de un archivo. En este caso, ambas ramas modificaron exactamente la misma línea y partiendo de un mismo historial en común. Git no puede saber por sí mismo cuál versión es la correcta, por lo que pausa el proceso y delega la decisión en el usuario.

### Qué tendría que haber pasado para que nunca apareciera:

Para que no ocurriera conflicto, cada rama debería haber editado lineas diferentes o archivos distintos o que antes de crear los cambios en la rama B se hubiera hecho un pull para incorporar los cambios ya mergeados de la rama A.


## Qué problemas encontraste y cómo los solucionaste

No encontré problemas muy grandes. La guía estaba clara. El único momento en el que tuve que acudir a la IA fue cuando habia que subir las evidencias al .md. Nunca lo habia hecho entonces me fijé como prosguir.

## Declaración de uso de IA

Como dije en el punto anterior, utilice Gemini para consultarle cómo subir las imagenes al MarkDown pero el resto del trabajo fue realizado por mi mismo.