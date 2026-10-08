# SignalGuard: encabezado y resultados de búsqueda

Generados el 8 de octubre de 2026 con la herramienta integrada image_gen.
Dos imágenes universales opacas PNG 5244×2950, una por idioma; cada una es compatible con PRODUCT_PAGE_HEADER_ASSET y APP_STORE_SEARCH_RESULTS_ASSET, perfil DEFAULT_PROFILE. Apple confirmó specId c8f4e2b1-7a3d-5c9e-8b6f-2d1a0e9c8b7a.

- es-ES-universal.png: español.
- en-US-universal.png: inglés, incluida la interfaz representada.
- sources/: maestros originales generados.
- PROMPTS.json: prompts completos y modo de generación.
- MANIFEST.json: tamaños, SHA-256, IDs de biblioteca, resultado de las asociaciones y estado de la versión.

El icono y la pantalla activa del proyecto sirvieron de referencia. Son composiciones promocionales con IA, no capturas sin retocar. Sharp solo normalizó resolución y formato; no se cambió la app ni su icono. Conservan el comportamiento real (Internet y red móvil independientes) y no prometen llamadas garantizadas.

## Estado en Apple

Ambas imágenes están subidas, procesadas y en PREPARE_FOR_SUBMISSION, sin errores de procesamiento. No están aprobadas ni asociadas a la ficha: los cuatro intentos de asociación recibieron HTTP 409 STATE_ERROR.INVALID_STATE porque la versión está WAITING_FOR_REVIEW.

La primera versión 1.0.0 (7) fue enviada por el usuario y sigue esperando revisión. No hay una versión aprobada previa; según Apple, la revisión independiente de creatividades requiere una versión ya aprobada. Por tanto no se creó ni envió una revisión independiente. No se retiró ni reenvió la revisión existente y no se lanzó otra build.

Cuando Apple apruebe la primera versión, revisar la disponibilidad del flujo de revisión independiente en Asset Library. Tras aprobar las imágenes, seleccionar cada imagen en Encabezado y Resultados de búsqueda de su idioma (usar el encabezado en búsqueda) y publicar la actualización de creatividades cuando la versión esté disponible en App Store. No automatizado ni programado.

Documentación:
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets
- https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-assets-from-asset-library
- https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications

## Validación local

Dimensiones 5244×2950 y ausencia de canal alfa verificadas con Sharp. Revisión visual de ambos idiomas completada. npm run check: TypeScript, lint, 43 tests Jest y 21 tests Swift correctos. No se modificó código de la app.
