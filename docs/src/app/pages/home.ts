import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <!-- Background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-nest-red/10 via-transparent to-transparent"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-nest-red/5 rounded-full blur-3xl"></div>

        <div class="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div class="max-w-3xl">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium
                        bg-nest-red/10 text-nest-red rounded-full border border-nest-red/20">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-nest-red opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-nest-red"></span>
              </span>
              v0.1.0 Now Available
            </div>

            <!-- Title -->
            <h1 class="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span class="gradient-text">NestJS</span> meets
              <span class="text-text-primary"> Bun's</span>
              <br />
              <span class="text-text-primary">blazing speed</span>
            </h1>

            <!-- Description -->
            <p class="text-xl text-text-secondary mb-8 leading-relaxed">
              A high-performance HTTP adapter for NestJS that runs on Bun's native server.
              Get up to <span class="text-nest-red font-semibold">5x faster</span> than Express
              and <span class="text-nest-red font-semibold">2x faster</span> than Fastify.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-wrap gap-4">
              <a
                routerLink="/quick-start"
                class="inline-flex items-center gap-2 px-6 py-3 bg-nest-red text-white font-semibold
                       rounded-lg hover:bg-nest-red-dark transition-colors shadow-lg shadow-nest-red/25"
              >
                Get Started
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </a>
              <a
                href="https://github.com/PegasusHeavyIndustries/nestjs-bun"
                target="_blank"
                class="inline-flex items-center gap-2 px-6 py-3 bg-bg-tertiary text-text-primary font-semibold
                       rounded-lg hover:bg-bg-card transition-colors border border-border"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>

            <!-- Install command -->
            <div class="mt-10 p-4 bg-bg-code rounded-lg border border-border inline-block">
              <code class="text-sm">
                <span class="text-text-muted">$</span>
                <span class="text-text-secondary"> pnpm add</span>
                <span class="text-nest-red-light"> @pegasusheavy/nestjs-platform-bun</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="max-w-6xl mx-auto px-6 py-20">
        <h2 class="text-3xl font-bold text-center mb-4">Why Choose @pegasusheavy/nestjs-platform-bun?</h2>
        <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          Built from the ground up for performance, with full compatibility for your existing middleware.
        </p>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (feature of features; track feature.title) {
            <div class="p-6 bg-bg-secondary rounded-xl border border-border hover:border-nest-red/30
                        transition-colors group">
              <div class="w-12 h-12 mb-4 rounded-lg bg-nest-red/10 flex items-center justify-center
                          group-hover:bg-nest-red/20 transition-colors">
                <span [innerHTML]="feature.icon" class="text-nest-red"></span>
              </div>
              <h3 class="text-lg font-semibold mb-2 text-text-primary">{{ feature.title }}</h3>
              <p class="text-text-secondary text-sm leading-relaxed">{{ feature.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Performance Section -->
      <section class="max-w-6xl mx-auto px-6 py-20">
        <div class="bg-bg-secondary rounded-2xl border border-border p-8 md:p-12">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl font-bold mb-4">Unmatched Performance</h2>
              <p class="text-text-secondary mb-6 leading-relaxed">
                Bun's native HTTP server delivers exceptional throughput with minimal latency.
                Our adapter brings this performance to your NestJS applications without sacrificing
                the framework features you love.
              </p>
              <a
                routerLink="/benchmarks"
                class="inline-flex items-center gap-2 text-nest-red hover:text-nest-red-light transition-colors"
              >
                View full benchmarks
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </a>
            </div>

            <div class="space-y-4">
              @for (stat of performanceStats; track stat.label) {
                <div class="bg-bg-tertiary rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-text-secondary text-sm">{{ stat.label }}</span>
                    <span class="text-nest-red font-bold">{{ stat.value }}</span>
                  </div>
                  <div class="h-2 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-nest-red to-nest-red-light rounded-full transition-all duration-1000"
                      [style.width]="stat.percentage + '%'"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Start Section -->
      <section class="max-w-6xl mx-auto px-6 py-20">
        <h2 class="text-3xl font-bold text-center mb-4">Quick Start</h2>
        <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          Get up and running in under 5 minutes with minimal changes to your existing NestJS application.
        </p>

        <div class="max-w-3xl mx-auto">
          <div class="bg-bg-code rounded-xl border border-border overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 bg-bg-secondary border-b border-border">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span class="text-text-muted text-sm ml-2">main.ts</span>
            </div>
            <pre class="p-6 overflow-x-auto text-sm"><code><span class="token-keyword">import</span> &#123; NestBunFactory &#125; <span class="token-keyword">from</span> <span class="token-string">'@pegasusheavy/nestjs-platform-bun'</span>;
<span class="token-keyword">import</span> &#123; AppModule &#125; <span class="token-keyword">from</span> <span class="token-string">'./app.module'</span>;

<span class="token-keyword">async function</span> <span class="token-function">bootstrap</span>() &#123;
  <span class="token-keyword">const</span> app = <span class="token-keyword">await</span> NestBunFactory.<span class="token-function">create</span>(AppModule);

  <span class="token-comment">// Enable CORS</span>
  app.<span class="token-function">enableCors</span>();

  <span class="token-comment">// Start server on port 3000</span>
  <span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>);

  console.<span class="token-function">log</span>(<span class="token-string">'🚀 Server running on http://localhost:3000'</span>);
&#125;

<span class="token-function">bootstrap</span>();</code></pre>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-border">
        <div class="max-w-6xl mx-auto px-6 py-12">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-nest-red flex items-center justify-center">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span class="font-semibold text-text-primary">@pegasusheavy/nestjs-platform-bun</span>
            </div>
            <p class="text-text-muted text-sm">
              © 2026 Pegasus Heavy Industries LLC. MIT Licensed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class HomeComponent {
  features = [
    {
      title: 'Lightning Fast',
      description: 'Up to 5x faster than Express and 2x faster than Fastify thanks to Bun\'s native HTTP server.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
    },
    {
      title: 'Drop-in Replacement',
      description: 'Replace your existing Express or Fastify adapter with minimal code changes.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>'
    },
    {
      title: 'Full Middleware Support',
      description: 'Compatible with Express and Fastify middleware through our compatibility layers.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>'
    },
    {
      title: 'TypeScript Native',
      description: 'Written in TypeScript with full type definitions for excellent developer experience.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>'
    },
    {
      title: 'Production Ready',
      description: 'Comprehensive test coverage and CI/CD verified performance benchmarks.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>'
    },
    {
      title: 'Active Development',
      description: 'Regular updates, quick bug fixes, and responsive community support.',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    }
  ];

  performanceStats = [
    { label: 'vs Express (Requests/sec)', value: '+400%', percentage: 100 },
    { label: 'vs Fastify (Requests/sec)', value: '+80%', percentage: 80 },
    { label: 'Latency Reduction', value: '-75%', percentage: 75 },
    { label: 'Memory Efficiency', value: '+40%', percentage: 60 }
  ];
}
