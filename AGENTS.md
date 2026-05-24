<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

- Mantener la modularidad.
- No usar estilos inline, mantener estilos en archivos separados.
- No crear archivos de más de 300 lìneas
- DRY - Investiga si algo ya existe en el proyecto.
- Separar UI, lógica de negocio y persistencia.
- Si un archivo supera 300 líneas, evaluar extracción inmediata.
- Si una función supera 40-60 líneas, evaluar dividirla.
- Reutilizar patrones y utilidades existentes antes de crear nuevas.
- No duplicar reglas de negocio entre pantallas; extraer helpers compartidos.
- No mezclar refactors grandes con cambios funcionales sin necesidad.
- Validar cada cambio con build, typecheck, test o verificación manual relevante.
- Contemplar siempre loading, error y estados vacíos.
- Mantener accesibilidad básica en formularios, botones y modales.
- No agregar dependencias nuevas sin una razón clara.
- Comentar decisiones no obvias, especialmente reglas clínicas o de sincronización.
- Preservar invariantes del dominio en cada flujo.
<!-- END:nextjs-agent-rules -->
