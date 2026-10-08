# SignalGuard: borrador de App Store

Preparado el 8 de octubre de 2026 en App Store Connect. **No enviado a revisión ni publicado.**

https://appstoreconnect.apple.com/apps/6736607323/distribution/ios/version/inflight

## Guardado y verificado

- Versión 1.0.0, build 7, Apple build ID c26e9d34-993d-406f-94ec-d338cc617a06 (VALID, IN_BETA_TESTING).
- Estado PREPARE_FOR_SUBMISSION; publicación MANUAL. No se creó una reviewSubmission ni se ejecutó una acción de envío/publicación.
- Nombre SignalGuard, subtítulo, descripción, texto promocional y palabras clave en en-US y es-ES.
- Política de privacidad y soporte con URL según idioma; marketing URL del sitio existente.
- Copyright 2026 etcaterva Ltd.; categorías Utilities y Productivity.
- Cuestionario de edades actualizado: sin contenido adulto, violencia, apuestas, anuncios, chat, contenido de usuarios ni información médica. La aplicación no es un producto médico.
- Contacto de revisión existente del titular reutilizado, sin guardar teléfono ni credenciales en Git; no se necesita cuenta de demostración.
- Notas en inglés para probar preflight, inicio, BGContinuedProcessingTask, avisos urgentes, vigilancia, reconocimiento, recuperación, reanudación explícita y límites de iOS.
- Precio gratuito (0.00 USD en el territorio base, con equivalencias); disponibilidad existente de 175 territorios conservada. No se cambiaron precios o países.
- Exportación cifrado: build con ITSAppUsesNonExemptEncryption=false, usa HTTPS del sistema. No se adjuntó documentación de cifrado inexistente.

## Pendiente antes de una futura revisión

1. Capturas reales de la app actual en iPhone. App Store Connect no tenía capturas previas. No se han inventado ni subido capturas de monitorización nativa mediante Expo Go. Conviene Home con guardia activa, elección de condiciones y un historial real; en español e inglés si es posible. Apple establece los tamaños admitidos en https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/.
2. Cuestionario **Privacidad de la app** en el panel web de App Store Connect. La API pública de Apple permite las URL de la política, pero no ofrece el cuestionario de etiquetas de privacidad. No se ha marcado como completado ni publicado. Datos conocidos: historial/preferencias en el dispositivo; sin cuentas, anuncios, analítica, seguimiento, telemetría o backend; solicitudes mínimas a Google/Microsoft sin identificadores de SignalGuard. Los proveedores reciben la IP de conexión necesaria para servir la solicitud, como explica la política. Revisar las definiciones de Apple al responder: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/.
3. Revisar en el panel cualquier aviso de cuenta/comerciante/contratos aplicable antes de enviar. No se han aceptado términos ni modificado declaraciones legales de la cuenta.

Los textos editables se conservan en metadata.json. Las notas de revisión explican que no hay Critical Alerts ni garantía de llamadas o de ejecución permanente. No se ha generado una nueva build para preparar esta ficha.
