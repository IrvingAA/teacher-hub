import { apiName, apiVersion } from '../../config/app.meta';
import type { HealthResponse } from '../../types/common/health.type';

const brandCss = `
  :root {
    --bg: #000000;
    --text: #ffffff;
    --text-muted: #e0e7ff;
    --primary-blue: #1e7fff;
    --deep-blue: #0d47a1;
    --bright-blue: #2196f3;
    --accent-blue: #64b5f6;
  }
  body {
    color: var(--text);
    background-color: var(--bg);
    background-image:
      radial-gradient(circle at 15% 20%, rgba(30, 127, 255, 0.32) 0, rgba(30, 127, 255, 0) 40%),
      radial-gradient(circle at 85% 75%, rgba(33, 150, 243, 0.3) 0, rgba(33, 150, 243, 0) 38%),
      linear-gradient(145deg, #000000 20%, #031533 100%);
  }
`;

export function renderLandingPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${apiName} · ${apiVersion}</title>
    
    <!-- SEO & Social Media Metatags -->
    <meta name="description" content="Empowering educators with a robust, enterprise-grade academic management API. Modular, scalable, and secure.">
    <meta property="og:title" content="${apiName} - Smart Academic Orchestration">
    <meta property="og:description" content="Enterprise-grade backend for smart school management. Built with Clean Architecture.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://api-teacherhub.iayala.dev">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${apiName}">
    <meta name="twitter:description" content="The future of academic management is here. Smart, modular, and fast.">

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/assets/iconify.min.js"></script>
    <style>${brandCss}</style>
  </head>
  <body class="min-h-screen">
    <main class="mx-auto max-w-4xl px-6 py-16">
      <section class="rounded-3xl border border-blue-400/35 bg-slate-950/65 p-8 shadow-[0_30px_90px_rgba(30,127,255,0.2)] backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/75">API Gateway</p>
            <h1 class="mt-2 text-4xl font-semibold tracking-tight text-white">${apiName}</h1>
            <p class="mt-1 text-sm text-blue-100/80">v${apiVersion}</p>
          </div>
          <div class="hidden h-16 w-16 items-center justify-center rounded-2xl border border-blue-300/35 bg-blue-950/45 sm:flex">
            <svg viewBox="0 0 24 24" class="h-9 w-9 text-cyan-300" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </div>
        </div>

        <p class="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/70">Stack</p>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/35 p-4 text-center">
            <iconify-icon icon="material-icon-theme:nginx" class="mx-auto text-3xl"></iconify-icon>
          </article>
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/35 p-4 text-center">
            <iconify-icon icon="skill-icons:expressjs-light" class="mx-auto text-3xl"></iconify-icon>
          </article>
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/35 p-4 text-center">
            <iconify-icon icon="devicon:postgresql-wordmark" class="mx-auto text-3xl"></iconify-icon>
          </article>
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/35 p-4 text-center">
            <iconify-icon icon="devicon:redis" class="mx-auto text-3xl"></iconify-icon>
          </article>
        </div>

        <p class="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/70">Access Hub</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <a href="/health?format=html" class="rounded-xl border border-blue-300/35 bg-blue-950/35 p-4 text-blue-100 transition hover:-translate-y-0.5 hover:border-cyan-300/80">
            <p class="flex items-center gap-2 font-semibold">
              <iconify-icon icon="arcticons:samsung-health-monitor" class="text-lg"></iconify-icon>
              Health
            </p>
            <p class="mt-1 text-xs text-blue-100/70">Service status dashboard</p>
          </a>
          <a href="/docs" class="rounded-xl border border-blue-300/35 bg-blue-950/35 p-4 text-blue-100 transition hover:-translate-y-0.5 hover:border-cyan-300/80">
            <p class="flex items-center gap-2 font-semibold">
              <iconify-icon icon="material-icon-theme:swagger" class="text-lg"></iconify-icon>
              Docs
            </p>
            <p class="mt-1 text-xs text-blue-100/70">OpenAPI / Swagger UI</p>
          </a>
          <a href="/openapi.json?download=1" class="rounded-xl border border-blue-300/35 bg-blue-950/35 p-4 text-blue-100 transition hover:-translate-y-0.5 hover:border-cyan-300/80">
            <p class="flex items-center gap-2 font-semibold">
              <iconify-icon icon="bi:filetype-json" class="text-lg"></iconify-icon>
              Download JSON
            </p>
            <p class="mt-1 text-xs text-blue-100/70">Import OpenAPI in your GUI tools</p>
          </a>
        </div>
      </section>
      <footer class="mt-6 rounded-2xl border border-blue-300/25 bg-slate-950/50 px-5 py-4 font-mono text-xs text-blue-100/80">
        <div class="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <p class="inline-flex items-center gap-2">
            <iconify-icon icon="mdi:copyright" class="text-sm text-cyan-300"></iconify-icon>
            <span>${new Date().getFullYear()}</span>
            <a href="https://iayala.dev" target="_blank" rel="noopener noreferrer" class="text-cyan-300 hover:text-cyan-200">Irving Ayala</a>
          </p>
          <span class="hidden text-blue-100/40 sm:inline">|</span>
          <p class="inline-flex items-center gap-3">
           <a href="https://github.com/IrvingAA" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
              <iconify-icon icon="mdi:github" class="text-sm"></iconify-icon>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/irving-ayala06/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
              <iconify-icon icon="mdi:linkedin" class="text-sm"></iconify-icon>
              LinkedIn
            </a>
          </p>
        </div>
      </footer>
    </main>
  </body>
</html>`;
}

export function renderHealthPage(response: HealthResponse): string {
  const postgresOk = response.services.postgres === 'connected';
  const redisOk = response.services.redis === 'connected';
  const overallOk = postgresOk && redisOk;
  const jsonPreview = JSON.stringify(response, null, 2).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Health · ${apiName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/assets/iconify.min.js"></script>
    <style>${brandCss}</style>
  </head>
  <body class="min-h-screen">
    <main class="mx-auto max-w-4xl px-6 py-14">
      <a href="/" class="inline-flex items-center gap-2 text-sm text-blue-100/80 hover:text-white">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
        Back
      </a>

      <section class="mt-3 rounded-2xl border border-blue-400/35 bg-slate-950/60 p-8 shadow-[0_20px_80px_rgba(30,127,255,0.2)] backdrop-blur-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight text-white">Health</h1>
          <span class="rounded-full px-3 py-1 text-xs font-semibold ${
            overallOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }">
            ${overallOk ? 'Operational' : 'Degraded'}
          </span>
        </div>

        <p class="mt-2 text-blue-100/80">${apiName} · v${apiVersion}</p>
        <p class="mt-1 text-sm text-blue-100/65">${response.timestamp}</p>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/25 p-4">
            <p class="flex items-center gap-2 font-medium text-blue-100">
              <iconify-icon icon="logos:postgresql" class="text-xl"></iconify-icon>
              PostgreSQL
            </p>
            <p class="mt-1 text-sm ${postgresOk ? 'text-emerald-300' : 'text-rose-300'}">${response.services.postgres}</p>
          </article>
          <article class="rounded-xl border border-blue-300/30 bg-blue-950/25 p-4">
            <p class="flex items-center gap-2 font-medium text-blue-100">
              <iconify-icon icon="logos:redis" class="text-xl"></iconify-icon>
              Redis
            </p>
            <p class="mt-1 text-sm ${redisOk ? 'text-emerald-300' : 'text-rose-300'}">${response.services.redis}</p>
          </article>
        </div>

        <section class="mt-6 overflow-hidden rounded-xl border border-blue-300/30">
          <header class="border-b border-blue-300/20 bg-blue-950/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-blue-100/75">
            JSON Preview
          </header>
          <pre class="overflow-x-auto bg-slate-900 p-4 text-xs leading-6 text-emerald-300">${jsonPreview}</pre>
        </section>

        <div class="mt-6 flex flex-wrap gap-3">
          <a href="/health?format=json" class="rounded-lg border border-blue-300/35 bg-blue-950/35 px-4 py-2 text-sm text-blue-100 hover:border-blue-300/70 hover:bg-blue-900/35">
            <iconify-icon icon="mdi:code-json" class="mr-1 align-text-bottom"></iconify-icon>
            Open JSON
          </a>
          <a href="/docs" class="rounded-lg border border-blue-300/35 bg-blue-950/35 px-4 py-2 text-sm text-blue-100 hover:border-blue-300/70 hover:bg-blue-900/35">
            <iconify-icon icon="mdi:file-document-outline" class="mr-1 align-text-bottom"></iconify-icon>
            Open Docs
          </a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}
