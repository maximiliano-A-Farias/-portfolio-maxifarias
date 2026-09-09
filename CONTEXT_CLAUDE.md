# Context para Claude — Portfolio Maxi Farias

> Documento de handoff para sesiones futuras de Claude Code.
> Leer completo antes de tocar cualquier parte del proyecto.

---

## Estado actual (generado 2026-09-09)

- **Maxi salió de Crombie el 2026-09-09.** El contexto de NftyDoor ya no es activo.
- El foco es el portfolio personal y la búsqueda laboral.
- **Pendiente urgente:** cambiar `maximiliano.farias@crombie.dev` → `maxifarias81@gmail.com` en `README.md` y en el sitio (`src/data/profile.ts`).

---

## Identidad profesional

| Campo | Valor |
|---|---|
| Nombre | Maximiliano Ariel Farias (Maxi) |
| Apellido en CV | `Farias` SIN acento — regla fija |
| Rol | QA Tester Semi-Senior |
| Experiencia | +4 años — Trainee → Semi-Senior |
| Dominio | Fintech / Lending / Productos US |
| Frase central | "Probar como QA, pensar como usuario." |
| ISTQB CTFL | En preparación — NUNCA presentar como obtenida |
| Inglés | Intermediate / funcional |
| Ubicación | Almagro, Buenos Aires, Argentina |

**Regla de confidencialidad:** nunca nombrar clientes reales (NFTYDoor, Datision, Fincast, HiveMind). Usar: *"Client Project — Fintech / Lending Platform (US Market)"*.

---

## Repo

| Campo | Valor |
|---|---|
| Path local | `Desktop\portfolio-maxifarias\` |
| Jira personal | maxifarias-qa.atlassian.net — proyecto SCRUM — board ID 1 |
| Branch principal | `main` → Vercel production (deploy automático) |
| Branch diseño | `design/editorial-hero` — experimentos, no tocar main |
| Sprint activo | "portfolio Sprint 1" (id: 2) — SCRUM-8 creado |

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Variables de entorno (`.env.local` — no está en git)

```env
JIRA_BASE_URL=https://maxifarias-qa.atlassian.net
JIRA_EMAIL=maxifarias81@gmail.com
JIRA_API_TOKEN=[token en .env.local]
JIRA_BOARD_ID=1
JIRA_PROJECT_KEY=SCRUM
GITHUB_TOKEN=[token en .env.local]
```

---

## Stack

| Tecnología | Rol |
|---|---|
| Next.js 15 (App Router) | Framework |
| TypeScript | Lenguaje principal |
| Tailwind CSS v4 | Estilos (mobile-first) |
| Cypress + Cypress Cloud | Automation principal |
| Playwright | Automation alternativo |
| GitHub Actions | CI/CD |
| Jira API | Sprint board integration (server-side, cache 15s) |
| GitHub API | CI status en portfolio (polling 30s) |
| Vercel | Deploy / hosting |

---

## Estructura de archivos

```
src/
├── app/
│   ├── api/
│   │   ├── jira-sprints/route.ts      ← Jira (server-side, cache 15s)
│   │   └── cypress-status/route.ts    ← GitHub CI status
│   ├── work/                          ← /work page (evidencia QA)
│   └── page.tsx                       ← Home
├── components/                        ← Componentes UI
├── context/                           ← Language context ES/EN
├── data/                              ← FUENTE ÚNICA DE VERDAD del contenido
│   ├── profile.ts
│   ├── translations.ts
│   └── workTranslations.ts
└── types/
```

**Regla:** todo el texto visible vive en `src/data/`. Nunca hardcodear contenido en componentes.

---

## Integraciones

| Servicio | Polling | Nota |
|---|---|---|
| Jira | 60s (auto-para) | Se detiene cuando no hay sprint activo |
| GitHub CI | 30s (auto-para) | Se detiene cuando los runs terminan |
| Cypress Cloud | Bajo demanda | — |
| Vercel | — | Push a main = deploy |

**Regla:** Jira y CI son pollings **independientes**. Nunca unificarlos en un loop.

---

## Design system

### Tipografía

| Token | Fuente | Uso |
|---|---|---|
| `font-display` | DM Serif Display | Headings editoriales grandes |
| `font-body` | Inter | Contenido, nav, descripción |
| `font-mono` | JetBrains Mono | Labels, IDs, metadata, status, tags |

### Tokens CSS — paleta definitiva (NO modificar)

```
--bg          --surface       --surface-2
--text-1      --text-2
--petrol      (acento: #1B4D4A)
--ocre
--border
--pass        --fail
```

Usar siempre los tokens. Nunca colores hardcodeados en componentes. Excepción: el Hero, que es always-light.

### Hero

Split layout: izquierda (petrol/identity) | derecha (cream/profile).  
`height: 100svh; overflow: hidden`.  
Mobile (<640px): stack vertical, panel teal ~80px arriba, panel crema `flex-1`.  
Implementado con `flex-col sm:flex-row`.

### Editorial layout (todas las secciones)

```
Desktop:  grid grid-cols-[260px_1px_1fr]
Mobile:   grid-cols-1  →  heading + divider ocultos
```

### Dirección visual

Editorial + técnico + humano.  
**NO:** dashboard corporativo. **NO:** landing page SaaS genérica. **NO:** CV convertido en página web.

---

## Reglas de código

1. **Minimal change.** Si la tarea es cambiar una cosa, cambiar una cosa.
2. **Antes de modificar:** entender → identificar archivos → revisar existente → revisar datos → revisar tokens → implementar el mínimo.
3. **Contenido:** siempre en `src/data/`. Nunca hardcodeado en componentes.
4. **Bilingüe obligatorio.** Toda nueva cadena visible necesita ES y EN.
5. **Server components por defecto.** `use client` solo cuando hay state/browser API/events.
6. **Responsive obligatorio.** Verificar 375px, 390px, 768px, 1280px. Sin scroll horizontal.
7. **Touch targets ≥ 44px** en todos los elementos interactivos.
8. **Polling independiente.** Jira: 60s. CI: 30s. Parada automática. Nunca unificar.
9. **No exponer secrets.** Nunca logs de tokens. No hardcodear emails ni API keys.
10. **Definition of Done:** funciona · diseño respetado · responsive · no rompe otras secciones · ES/EN · accesibilidad · sin secrets.
11. **data-testid en elementos interactivos.** Naming: camelCase (ej. `heroSection`, `sprintBoard`).

---

## Reglas de contenido

1. **No inventar métricas.** Datos reales o nada.
2. **Seniority: QA Tester Semi-Senior.** No inflar a Senior / Lead / SDET salvo confirmación.
3. **ISTQB CTFL: en preparación.** Nunca presentar como obtenida.
4. **Confidencialidad.** Labels genéricos para clientes — nunca nombres internos.
5. **Voz:** primera persona en el summary, voz activa implícita en bullets.
6. **Anti-patterns:** no barras de % de skills, no estrellas, no "90% Cypress", no emojis como marcadores.
7. **Regla maestra:** si hay que elegir entre "más impresionante" y "más verdadero" — elegir verdadero.

---

## CV

| Campo | Valor |
|---|---|
| Carpeta | `Desktop\CV\` |
| Script | `CV\drafts\build_cv.py` (python-docx) |
| PDF final | `Maximiliano_Farias_CV_QA.pdf` — 2 páginas, Calibri, teal #1B4D4A |
| Historial | `CV\session-history\session-003_2026-08-27.md` — leer antes de retomar |
| EN title | "QA Engineer \| Functional, Manual & Automation Testing" |
| ES title | "Analista de QA \| Testing Funcional, Manual y de Automatización" |

**Apellido en CV:** `Farias` sin acento — regla fija, no revertir.  
**Email en CV:** `maxifarias81@gmail.com` — nunca el corporativo.

---

## Búsqueda laboral (estado al 2026-09-09)

**Pretensión:** 2.200 – 2.500 USD/mes · **Modalidad:** remoto o híbrido Buenos Aires

### Solicitudes enviadas (2026-09-04)

| Empresa | Rol |
|---|---|
| Stefanini LATAM | QA Automation Ssr |
| Smart IT Frame LLC | QA Automation Engineer |
| SunnyData | QA Engineer |
| Prex | QA Engineer Automation Analyst |
| Ultimate Jet Vacations | Technical QA Associate |
| Bridgenext | Senior Software Test Engineer |
| Qualitest (QualityAI) | Sr. Manual QA Engineer Data |
| KIU System Solutions | Functional Analyst Agentes IA |
| EPAM NEORIS | Manual QA Tester SSR |
| Nosis | Analista QA Funcional |

### Pendientes de evaluar (prioridad alta)

- Azumo — QA Automation Engineer
- Sky Systems — Quality Assurance Engineer
- Sistemas Activos SRL — QA Engineer Ssr/Sr

---

## Contacto

| Canal | Valor |
|---|---|
| **Email personal** | **maxifarias81@gmail.com** ← usar este |
| ~~Email Crombie~~ | ~~maximiliano.farias@crombie.dev~~ ← ya no activo |
| LinkedIn | linkedin.com/in/maximiliano-farias-38a913227 |
| Teléfono | +54 342 485-6512 |

---

*Generado por Claude Code el 2026-09-09. Fuentes: memories del sistema + archivos del repo.*
