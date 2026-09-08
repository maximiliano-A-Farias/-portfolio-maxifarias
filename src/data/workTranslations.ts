import type { Language } from "./translations";

export type GherkinLine = { keyword: "feature" | "scenario" | "step" | "blank"; text: string };

// Local supplement data — what Jira can't store (Gherkin, steps, fix)
export type BugDetail = {
  defKey: string;                                      // matches Jira DEF ticket key
  environment: string;
  device: string;
  browser: string;
  gherkin: GherkinLine[];
  stepsToReproduce?: { action: string; detail?: string }[];
  actualResult?: string;
  expectedResult?: string;
  fix?: string;
};

// Shape returned by /api/jira-defects — exported so WorkContent can type it
export type JiraDefect = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority: string;
  url: string;
  linkedTickets: string[];
};

export type TestCase = {
  id: string;
  title: string;
  bugId: string;            // DEF ticket key (e.g. "DEF-1")
  environment: string;
  device: string;
  browser: string;
  discoverer: string;
  testData: string;
  fixCommit: string;
  status: string;
  preconditions: string[];
  steps: { action: string; detail: string }[];
  expectedResult: string[];
  ticketRef?: string;       // SCRUM ticket (e.g. "SCRUM-8")
};

export type WorkTranslations = {
  nav: {
    back: string;
    sprintBoard: string;
    testCases: string;
    bugReports: string;
    automation: string;
    apiTesting: string;
    analytics: string;
  };
  hero: {
    label: string;
    heading: string;
    subtitle: string;
  };
  bugDetails: BugDetail[];
  testCases: TestCase[];
  sections: {
    sprintBoard:  { label: string; heading: string; description: string; empty: string; };
    testCases:    { label: string; heading: string; description: string; empty: string; };
    bugReports:   { label: string; heading: string; description: string; empty: string; };
    automation:   { label: string; heading: string; description: string; empty: string; };
    apiTesting:   { label: string; heading: string; description: string; empty: string; };
    analytics:    { label: string; heading: string; description: string; empty: string; };
  };
};

const en: WorkTranslations = {
  nav: {
    back: "← Portfolio",
    sprintBoard: "Sprint Board",
    testCases: "Test Cases",
    bugReports: "Bug Reports",
    automation: "Automation",
    apiTesting: "API Testing",
    analytics: "Analytics",
  },
  hero: {
    label: "Work samples",
    heading: "Real QA work.",
    subtitle: "Bug reports, test cases, automation scripts and test execution reports from real projects.",
  },
  bugDetails: [
    {
      defKey: "DEF-1",
      environment: "Main",
      device: "Mobile < 640px",
      browser: "Any",
      gherkin: [
        { keyword: "feature",  text: "Feature: Mobile page navigation" },
        { keyword: "blank",    text: "" },
        { keyword: "scenario", text: "  Scenario: Access the Work page from a mobile device" },
        { keyword: "step",     text: '    Given the user opens the portfolio on a mobile device (viewport < 640px)' },
        { keyword: "step",     text: '    When  they look at the navigation bar' },
        { keyword: "step",     text: '    Then  the "Work →" button should be visible' },
        { keyword: "step",     text: '    But   the button is hidden inside a "hidden sm:flex" container' },
        { keyword: "step",     text: '    And   the user has no access to the /work page' },
      ],
      stepsToReproduce: [
        { action: "Open the portfolio on a mobile device.", detail: "Navigate to the portfolio URL on a real device or set DevTools viewport to 390 × 844px." },
        { action: "Set the viewport to 390 × 844px.", detail: "Confirm the viewport is within the mobile range (< 640px)." },
        { action: "Observe the top navigation bar.", detail: "Identify which elements are visible in the nav." },
        { action: 'Look for the "Work →" access.', detail: "Verify if the navigation item to /work is present and visible." },
        { action: "Verify that the access is not available.", detail: "Confirm there is no visible link or button to navigate to /work." },
      ],
      actualResult: 'The "Work →" button remains hidden on mobile viewports, preventing direct access to /work from the navigation.',
      expectedResult: "The user should be able to see and use the Work access regardless of the viewport.",
      fix: 'Moved the button outside the hidden <ul> — always visible on any viewport.',
    },
  ],
  testCases: [
    {
      id: "TC-001",
      title: '"Work →" button visibility on mobile',
      bugId: "DEF-1",
      environment: "Main",
      device: "Mobile < 640px",
      browser: "Any",
      discoverer: "Maximiliano Farias",
      testData: "390 × 844px · Chrome",
      fixCommit: "a4e4f7e",
      status: "PASS",
      ticketRef: "SCRUM-8",
      preconditions: [
        "Portfolio deployed and accessible on Vercel (Main)",
        "Viewport set to < 640px (real device or DevTools)",
      ],
      steps: [
        { action: 'Open the portfolio on mobile', detail: 'URL: portfolio-maxifarias.vercel.app · Viewport: 390px' },
        { action: 'Observe the top navigation bar', detail: 'Identify visible elements in the nav bar' },
        { action: 'Look for the "Work →" button', detail: 'Verify if the button is present and visible' },
        { action: 'Tap the "Work →" button', detail: 'Touch interaction on real device or click in emulator' },
        { action: 'Verify URL changes to /work', detail: 'Work page loads correctly on mobile viewport' },
      ],
      expectedResult: [
        '"Work →" button is visible in the nav on any viewport',
        'Tapping it navigates correctly to /work',
        'Page transition animation fires (left ← right)',
        '/work content loads without errors on mobile',
      ],
    },
  ],
  sections: {
    sprintBoard: {
      label: "Sprint Board",
      heading: "What we're building.",
      description: "Active and completed sprints — tickets organized by status to show what's in scope, in progress, and done.",
      empty: "Examples coming soon.",
    },
    testCases: {
      label: "Test Cases",
      heading: "How we decided to validate it.",
      description: "Structured test cases that cover happy paths, edge cases and risk areas.",
      empty: "Examples coming soon.",
    },
    bugReports: {
      label: "Bug Reports",
      heading: "What we found.",
      description: "Clear, reproducible, actionable. Every bug report tells a story.",
      empty: "Examples coming soon.",
    },
    automation: {
      label: "Automation",
      heading: "What we automated to protect it.",
      description: "Cypress and Playwright scripts written for real feature coverage — wired to CI.",
      empty: "Examples coming soon.",
    },
    apiTesting: {
      label: "API Testing",
      heading: "Live checks against real APIs.",
      description: "Status codes, response shape and key field validation against the Jira and GitHub Actions APIs powering this portfolio.",
      empty: "Examples coming soon.",
    },
    analytics: {
      label: "Analytics",
      heading: "These were the results.",
      description: "Pass rates, bug resolution, automation coverage and CI run history.",
      empty: "Examples coming soon.",
    },
  },
};

const es: WorkTranslations = {
  nav: {
    back: "← Portfolio",
    sprintBoard: "Sprint Board",
    testCases: "Casos de prueba",
    bugReports: "Bug Reports",
    automation: "Automatización",
    apiTesting: "API Testing",
    analytics: "Analítica",
  },
  hero: {
    label: "Trabajo real",
    heading: "QA en acción.",
    subtitle: "Bug reports, casos de prueba, scripts de automatización y reportes de ejecución de proyectos reales.",
  },
  bugDetails: [
    {
      defKey: "DEF-1",
      environment: "Main",
      device: "Mobile < 640px",
      browser: "Cualquier navegador",
      gherkin: [
        { keyword: "feature",  text: "Feature: Navegación mobile entre páginas" },
        { keyword: "blank",    text: "" },
        { keyword: "scenario", text: "  Scenario: Acceder a la página Work desde un mobile" },
        { keyword: "step",     text: "    Given el usuario abre el portfolio en un mobile (viewport < 640px)" },
        { keyword: "step",     text: '    When  observa la barra de navegación' },
        { keyword: "step",     text: '    Then  debería ver el botón "Work →"' },
        { keyword: "step",     text: '    But   el botón está oculto dentro de un elemento "hidden sm:flex"' },
        { keyword: "step",     text: "    And   el usuario no tiene ningún acceso a la página /work" },
      ],
      stepsToReproduce: [
        { action: "Abrir el portfolio desde un dispositivo mobile.", detail: "Acceder a la URL del portfolio desde un dispositivo real o simular con DevTools a 390 × 844px." },
        { action: "Configurar viewport de 390 × 844 px.", detail: "Confirmar que el viewport está dentro del rango mobile (< 640px)." },
        { action: "Observar la barra de navegación superior.", detail: "Identificar qué elementos son visibles en la nav." },
        { action: 'Buscar el acceso "Work →".', detail: "Verificar si el ítem de navegación hacia /work está presente y visible." },
        { action: "Verificar que el acceso no está disponible.", detail: "Confirmar que no existe ningún link o botón visible para navegar a /work." },
      ],
      actualResult: 'El botón "Work →" permanece oculto en viewport mobile, impidiendo acceder directamente a /work desde la navegación.',
      expectedResult: "El usuario debería poder visualizar y utilizar el acceso a Work independientemente del viewport.",
      fix: "Se movió el botón fuera del <ul> oculto — ahora siempre visible en cualquier viewport.",
    },
  ],
  testCases: [
    {
      id: "TC-001",
      title: 'Visibilidad del botón "Work →" en mobile',
      bugId: "DEF-1",
      environment: "Main",
      device: "Mobile < 640px",
      browser: "Cualquier navegador",
      discoverer: "Maximiliano Farias",
      testData: "390 × 844px · Chrome",
      fixCommit: "a4e4f7e",
      status: "PASS",
      ticketRef: "SCRUM-8",
      preconditions: [
        "Portfolio deployado y accesible en Vercel (Main)",
        "Viewport configurado en < 640px (dispositivo real o DevTools)",
      ],
      steps: [
        { action: "Abrir el portfolio en mobile", detail: "URL: portfolio-maxifarias.vercel.app · Viewport: 390px" },
        { action: "Observar la barra de navegación superior", detail: "Identificar los elementos visibles en la nav bar" },
        { action: 'Buscar el botón "Work →" en la nav', detail: "Verificar si el botón está presente y visible" },
        { action: 'Hacer tap en el botón "Work →"', detail: "Interacción táctil en dispositivo real o click en emulator" },
        { action: "Verificar que la URL cambia a /work", detail: "La página Work carga correctamente en viewport mobile" },
      ],
      expectedResult: [
        'El botón "Work →" es visible en la nav en cualquier viewport',
        "Al hacer tap navega correctamente a /work",
        "La transición de página se ejecuta (animación left ← right)",
        "El contenido de /work carga sin errores en mobile",
      ],
    },
  ],
  sections: {
    sprintBoard: {
      label: "Sprint Board",
      heading: "Esto es lo que tenemos que construir.",
      description: "Sprints activos y completados — tickets organizados por estado para ver qué está en alcance, en progreso y terminado.",
      empty: "Ejemplos próximamente.",
    },
    testCases: {
      label: "Casos de prueba",
      heading: "Así decidimos cómo validarlo.",
      description: "Casos estructurados que cubren caminos felices, bordes y áreas de riesgo.",
      empty: "Ejemplos próximamente.",
    },
    bugReports: {
      label: "Bug Reports",
      heading: "Esto fue lo que encontramos.",
      description: "Claro, reproducible y accionable. Cada bug report cuenta una historia.",
      empty: "Ejemplos próximamente.",
    },
    automation: {
      label: "Automatización",
      heading: "Esto automatizamos para poder repetirlo y protegerlo.",
      description: "Scripts de Cypress y Playwright escritos para cobertura real — integrados a CI.",
      empty: "Ejemplos próximamente.",
    },
    apiTesting: {
      label: "API Testing",
      heading: "Checks en vivo contra APIs reales.",
      description: "Validación de status codes, estructura de respuesta y campos clave sobre las APIs de Jira y GitHub Actions que potencian este portfolio.",
      empty: "Ejemplos próximamente.",
    },
    analytics: {
      label: "Analítica",
      heading: "Estos fueron los resultados.",
      description: "Tasas de pase, resolución de bugs, cobertura de automatización e historial de CI.",
      empty: "Ejemplos próximamente.",
    },
  },
};

export const workTranslations: Record<Language, WorkTranslations> = { en, es };
