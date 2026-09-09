# Maximiliano Farias — QA Portfolio

**[EN]** Professional portfolio of Maximiliano Farias, QA Tester Semi-Senior. Built to demonstrate real QA work: test cases, bug reports, automation, CI/CD integration, and analytical thinking — not just a visual CV.

**[ES]** Portfolio profesional de Maximiliano Farias, QA Tester Semi-Senior. Construido para demostrar trabajo real de QA: test cases, bug reports, automatización, integración CI/CD y pensamiento analítico — no solo un CV visual.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Automation:** Cypress + Playwright
- **CI/CD:** GitHub Actions + Cypress Cloud
- **Integrations:** Jira API · GitHub API
- **Deploy:** Vercel

---

## Project structure / Estructura del proyecto

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── jira-sprints/ # Jira board integration (server-side)
│   │   └── cypress-status/ # GitHub Actions CI status
│   ├── work/             # /work page — QA evidence sections
│   └── page.tsx          # Home page
├── components/           # UI components
├── context/              # Language context (ES/EN)
├── data/                 # Single source of truth for all content
│   ├── profile.ts
│   ├── translations.ts
│   └── workTranslations.ts
└── types/                # TypeScript types
```

---

## Running locally / Correr localmente

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables / Variables de entorno

Create a `.env.local` file in the root:

```env
JIRA_BASE_URL=https://<your-domain>.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=your_token
JIRA_BOARD_ID=1
GITHUB_TOKEN=your_github_token
```

---

## Features / Características

| Section | Description |
|---|---|
| **Hero** | Identity + philosophy |
| **How I Think** | QA mindset and approach |
| **About** | Professional background |
| **Skills** | Technical stack with interactive bug popup |
| **Experience** | Career timeline |
| **Training** | Courses and certifications |
| **Competencies** | Professional soft skills |
| **Contact** | Direct contact links |
| **/work** | Sprint Board · Test Cases · Bug Reports · Automation · Analytics |

---

## Testing attributes / Atributos de testing

All interactive elements include `data-testid` attributes for Cypress and Playwright selectors. Naming convention: `camelCase` component identifier (e.g. `heroSection`, `sprintBoard`, `sprintIssue-SCRUM-1`).

---

## QA Philosophy / Filosofía QA

> **Test like a QA. Think like a user.**
> **Probar como QA. Pensar como usuario.**

Quality starts before the first test is executed.

---

## Author

**Maximiliano Farias** · QA Tester Semi-Senior  
[LinkedIn](https://www.linkedin.com/in/maximilianofarias) · maxifarias81@gmail.com
