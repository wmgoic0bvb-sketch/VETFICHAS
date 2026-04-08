@AGENTS.md
# VetFichas Project Rules
- **Stack:** Next.js 14 (App Router), Mongoose (No Prisma), Tailwind, Sonner.
- **Language:** Spanish (UI and Content).
- **Architecture:** - Max 250 lines per file.
    - Business logic in `src/lib/`.
    - Database schemas in `src/models/`.
- **Database:** Avoid hardcoding. Check `src/models/` for existing enums. Propose new collections for dynamic data.
- **Testing:** Mandatory Vitest/Jest for `src/lib/` and core API routes.