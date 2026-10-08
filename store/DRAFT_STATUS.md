# SignalGuard: borrador de App Store

Preparado el 8 de octubre de 2026 en App Store Connect. **El usuario lo envió a revisión; estado verificado WAITING_FOR_REVIEW. Publicación MANUAL.**

https://appstoreconnect.apple.com/apps/6736607323/distribution/ios/version/inflight

## Guardado y verificado

- Versión 1.0.0, build 7, Apple build ID c26e9d34-993d-406f-94ec-d338cc617a06 (VALID, IN_BETA_TESTING).
- El borrador se preparó sin enviarlo. Después el usuario envió la versión; estado actual WAITING_FOR_REVIEW, reviewSubmission ca47e4c9-fb65-42e2-9351-3c1d382c5341. Esta actualización no retiró, reenvió ni publicó la versión.
- Nombre SignalGuard, subtítulo, descripción, texto promocional y palabras clave en en-US y es-ES.
- Política de privacidad y soporte con URL según idioma; marketing URL del sitio existente.
- Copyright 2026 etcaterva Ltd.; categorías Utilities y Productivity.
- Cuestionario de edades actualizado: sin contenido adulto, violencia, apuestas, anuncios, chat, contenido de usuarios ni información médica. La aplicación no es un producto médico.
- Contacto de revisión existente del titular reutilizado, sin guardar teléfono ni credenciales en Git; no se necesita cuenta de demostración.
- Notas en inglés para probar preflight, inicio, BGContinuedProcessingTask, avisos urgentes, vigilancia, reconocimiento, recuperación, reanudación explícita y límites de iOS.
- Precio gratuito (0.00 USD en el territorio base, con equivalencias); disponibilidad existente de 175 territorios conservada. No se cambiaron precios o países.
- Exportación cifrado: build con ITSAppUsesNonExemptEncryption=false, usa HTTPS del sistema. No se adjuntó documentación de cifrado inexistente.

## Capturas y seguimiento

1. Capturas **completadas**: portada promocional y tres capturas reales aportadas por el usuario, retocadas con IA para presentación. Subidas en orden a en-US y es-ES, tamaños APP_IPHONE_67 (1320×2868) y APP_IPHONE_61 (1206×2622). Las 16 reservas están COMPLETE, sin errores. El texto visual sigue en español en ambas fichas; una localización visual inglesa sería una mejora futura. Originales, maestros y prompts en store/screenshots/. No se modificó la interfaz de la app ni se generó otra build.
2. Cuestionario **Privacidad de la app** en el panel web de App Store Connect. La API pública de Apple permite las URL de la política, pero no ofrece el cuestionario de etiquetas de privacidad. El asistente no completó este cuestionario mediante API; posteriormente el usuario logró enviar la versión. No se ha vuelto a auditar la configuración de etiquetas. Datos conocidos: historial/preferencias en el dispositivo; sin cuentas, anuncios, analítica, seguimiento, telemetría o backend; solicitudes mínimas a Google/Microsoft sin identificadores de SignalGuard. Los proveedores reciben la IP de conexión necesaria para servir la solicitud, como explica la política. Revisar las definiciones de Apple al responder: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/.
3. Revisar en el panel cualquier aviso de cuenta/comerciante/contratos aplicable antes de enviar. No se han aceptado términos ni modificado declaraciones legales de la cuenta.

Los textos editables se conservan en metadata.json. Las notas de revisión explican que no hay Critical Alerts ni garantía de llamadas o de ejecución permanente. No se ha generado una nueva build para preparar esta ficha.

## Creatividades horizontales

Español e inglés generadas y subidas a Asset Library; PNG universales 5244×2950. Las imágenes están PREPARE_FOR_SUBMISSION. La asociación a encabezado/búsqueda está bloqueada por Apple mientras la versión espera revisión (HTTP 409). Al no haber una versión aprobada previa, no es posible enviarlas a revisión independiente todavía. Detalles, prompts y archivos en store/creative-assets/. El envío original permanece intacto.
