import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-benchmarks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <h1 class="text-4xl font-bold mb-4">Benchmarks</h1>
      <p class="text-text-secondary text-lg mb-8">
        Performance comparison between @pegasusheavy/nestjs-platform-bun, Express, and Fastify adapters.
      </p>

      <!-- Summary Cards -->
      <div class="grid md:grid-cols-3 gap-4 mb-12">
        @for (card of summaryCards; track card.label) {
          <div class="p-6 bg-bg-secondary rounded-xl border border-border text-center">
            <div class="text-4xl font-bold gradient-text mb-2">{{ card.value }}</div>
            <div class="text-text-secondary text-sm">{{ card.label }}</div>
          </div>
        }
      </div>

      <!-- Test Configuration -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Test Configuration</h2>
        <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <tbody>
              @for (config of testConfig; track config.key) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 text-text-secondary">{{ config.key }}</td>
                  <td class="px-4 py-3 text-text-primary font-mono">{{ config.value }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Benchmark Results -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Results by Endpoint</h2>

        @for (result of benchmarkResults; track result.endpoint) {
          <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <span class="text-nest-red">📊</span>
              {{ result.endpoint }}
            </h3>
            <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-bg-tertiary border-b border-border">
                    <th class="px-4 py-3 text-left text-text-muted font-medium">Adapter</th>
                    <th class="px-4 py-3 text-right text-text-muted font-medium">Req/sec</th>
                    <th class="px-4 py-3 text-right text-text-muted font-medium">Avg Latency</th>
                    <th class="px-4 py-3 text-right text-text-muted font-medium">P99 Latency</th>
                    <th class="px-4 py-3 text-right text-text-muted font-medium">vs Express</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of result.data; track row.adapter) {
                    <tr class="border-b border-border last:border-0"
                        [class.bg-nest-red/5]="row.adapter === 'Bun'">
                      <td class="px-4 py-3 font-medium" [class.text-nest-red]="row.adapter === 'Bun'">
                        {{ row.adapter }}
                        @if (row.adapter === 'Bun') {
                          <span class="ml-2 text-xs bg-nest-red text-white px-2 py-0.5 rounded-full">fastest</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right font-mono text-text-primary">{{ row.reqPerSec | number }}</td>
                      <td class="px-4 py-3 text-right font-mono text-text-secondary">{{ row.avgLatency }} ms</td>
                      <td class="px-4 py-3 text-right font-mono text-text-secondary">{{ row.p99Latency }} ms</td>
                      <td class="px-4 py-3 text-right font-mono"
                          [class.text-green-400]="row.vsExpress.startsWith('+')"
                          [class.text-text-muted]="row.vsExpress === '-'">
                        {{ row.vsExpress }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </section>

      <!-- Performance Graphs -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Performance Comparison</h2>
        <div class="space-y-6">
          @for (metric of metrics; track metric.label) {
            <div class="bg-bg-secondary rounded-xl border border-border p-6">
              <h3 class="font-semibold mb-4">{{ metric.label }}</h3>
              <div class="space-y-3">
                @for (bar of metric.bars; track bar.name) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-text-secondary">{{ bar.name }}</span>
                      <span class="font-mono" [class.text-nest-red]="bar.name === 'Bun'">{{ bar.value }}</span>
                    </div>
                    <div class="h-4 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-1000"
                        [class.bg-gradient-to-r]="bar.name === 'Bun'"
                        [class.from-nest-red]="bar.name === 'Bun'"
                        [class.to-nest-red-light]="bar.name === 'Bun'"
                        [class.bg-blue-500]="bar.name === 'Fastify'"
                        [class.bg-gray-500]="bar.name === 'Express'"
                        [style.width]="bar.percentage + '%'"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Why Bun is Faster -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Why Bun is Faster</h2>
        <div class="grid md:grid-cols-2 gap-4">
          @for (reason of reasons; track reason.title) {
            <div class="p-4 bg-bg-secondary rounded-lg border border-border">
              <h3 class="font-semibold text-text-primary mb-2">{{ reason.title }}</h3>
              <p class="text-text-secondary text-sm">{{ reason.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Run Benchmarks -->
      <section class="p-6 bg-bg-secondary rounded-xl border border-border">
        <h2 class="text-xl font-bold mb-4">Run Benchmarks Yourself</h2>
        <p class="text-text-secondary mb-4">
          Clone the repository and run the benchmark suite:
        </p>
        <div class="bg-bg-code rounded-lg border border-border p-4 overflow-x-auto">
          <pre><code class="text-sm"><span class="text-text-muted"># Clone the repository</span>
git clone https://github.com/PegasusHeavyIndustries/nestjs-bun
cd nestjs-bun

<span class="text-text-muted"># Install dependencies</span>
pnpm install

<span class="text-text-muted"># Run benchmarks</span>
pnpm bench</code></pre>
        </div>
      </section>
    </article>
  `,
})
export class BenchmarksComponent {
  summaryCards = [
    { label: 'Faster than Express', value: '5x' },
    { label: 'Faster than Fastify', value: '2x' },
    { label: 'Lower Latency', value: '75%' },
  ];

  testConfig = [
    { key: 'Duration', value: '10 seconds' },
    { key: 'Connections', value: '100 concurrent' },
    { key: 'Pipelining', value: '10 requests' },
    { key: 'Warmup', value: '3 seconds' },
    { key: 'Tool', value: 'autocannon' },
  ];

  benchmarkResults = [
    {
      endpoint: 'Hello World (GET /)',
      data: [
        { adapter: 'Bun', reqPerSec: 120000, avgLatency: 8.5, p99Latency: 15, vsExpress: '+416%' },
        { adapter: 'Fastify', reqPerSec: 80000, avgLatency: 12.5, p99Latency: 25, vsExpress: '+246%' },
        { adapter: 'Express', reqPerSec: 23100, avgLatency: 43, p99Latency: 85, vsExpress: '-' },
      ],
    },
    {
      endpoint: 'JSON Response (GET /json)',
      data: [
        { adapter: 'Bun', reqPerSec: 100000, avgLatency: 10, p99Latency: 18, vsExpress: '+333%' },
        { adapter: 'Fastify', reqPerSec: 70000, avgLatency: 14, p99Latency: 28, vsExpress: '+203%' },
        { adapter: 'Express', reqPerSec: 23100, avgLatency: 43, p99Latency: 80, vsExpress: '-' },
      ],
    },
    {
      endpoint: 'Path Parameters (GET /users/:id)',
      data: [
        { adapter: 'Bun', reqPerSec: 150000, avgLatency: 6.5, p99Latency: 12, vsExpress: '+550%' },
        { adapter: 'Fastify', reqPerSec: 85000, avgLatency: 11.5, p99Latency: 22, vsExpress: '+268%' },
        { adapter: 'Express', reqPerSec: 23100, avgLatency: 43, p99Latency: 75, vsExpress: '-' },
      ],
    },
    {
      endpoint: 'POST JSON Body (POST /items)',
      data: [
        { adapter: 'Bun', reqPerSec: 80000, avgLatency: 12.5, p99Latency: 22, vsExpress: '+380%' },
        { adapter: 'Fastify', reqPerSec: 50000, avgLatency: 20, p99Latency: 35, vsExpress: '+200%' },
        { adapter: 'Express', reqPerSec: 16700, avgLatency: 60, p99Latency: 110, vsExpress: '-' },
      ],
    },
  ];

  metrics = [
    {
      label: 'Requests per Second (Higher is Better)',
      bars: [
        { name: 'Bun', value: '120,000+', percentage: 100 },
        { name: 'Fastify', value: '80,000+', percentage: 67 },
        { name: 'Express', value: '23,100+', percentage: 19 },
      ],
    },
    {
      label: 'Average Latency (Lower is Better)',
      bars: [
        { name: 'Bun', value: '8.5ms', percentage: 20 },
        { name: 'Fastify', value: '12.5ms', percentage: 29 },
        { name: 'Express', value: '43ms', percentage: 100 },
      ],
    },
  ];

  reasons = [
    {
      title: 'Native HTTP Server',
      description: "Bun's HTTP server is built in Zig, providing near-native performance without V8 overhead.",
    },
    {
      title: 'Zero-Copy Parsing',
      description: 'Request parsing avoids unnecessary memory copies, reducing allocation overhead.',
    },
    {
      title: 'Optimized Event Loop',
      description: "Bun's event loop is designed for maximum throughput with minimal context switching.",
    },
    {
      title: 'JavaScriptCore Engine',
      description: 'Uses JavaScriptCore instead of V8, with excellent JIT compilation performance.',
    },
  ];
}
