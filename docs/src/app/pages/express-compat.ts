import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-express-compat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <h1 class="text-4xl font-bold mb-4">Express Compatibility</h1>
      <p class="text-text-secondary text-lg mb-8">
        Use your existing Express middleware with the Bun adapter.
      </p>

      <!-- Overview -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Overview</h2>
        <p class="text-text-secondary mb-4">
          The adapter includes an Express compatibility layer that provides Express-like
          <code>req</code> and <code>res</code> objects. This allows you to use most Express
          middleware without modifications.
        </p>
        <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p class="text-text-primary text-sm">
            <strong>✓ Supported:</strong> Most Express middleware works out of the box, including
            body parsers, CORS, helmet, compression, and more.
          </p>
        </div>
      </section>

      <!-- Using Middleware -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Using Express Middleware</h2>

        <div class="space-y-6">
          <div class="bg-bg-code rounded-lg border border-border overflow-hidden">
            <div class="flex items-center px-4 py-2 bg-bg-secondary border-b border-border">
              <span class="text-text-muted text-sm">main.ts</span>
            </div>
            <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-keyword">import</span> &#123; NestBunFactory &#125; <span class="token-keyword">from</span> <span class="token-string">'@pegasusheavy/nestjs-platform-bun'</span>;
<span class="token-keyword">import</span> helmet <span class="token-keyword">from</span> <span class="token-string">'helmet'</span>;
<span class="token-keyword">import</span> compression <span class="token-keyword">from</span> <span class="token-string">'compression'</span>;

<span class="token-keyword">async function</span> <span class="token-function">bootstrap</span>() &#123;
  <span class="token-keyword">const</span> app = <span class="token-keyword">await</span> NestBunFactory.<span class="token-function">create</span>(AppModule);

  <span class="token-comment">// Use helmet for security headers</span>
  app.<span class="token-function">use</span>(<span class="token-function">helmet</span>());

  <span class="token-comment">// Use compression</span>
  app.<span class="token-function">use</span>(<span class="token-function">compression</span>());

  <span class="token-comment">// Custom logging middleware</span>
  app.<span class="token-function">use</span>((req, res, next) => &#123;
    console.<span class="token-function">log</span>(<span class="token-string">\`[\$&#123;new Date().toISOString()&#125;] \$&#123;req.method&#125; \$&#123;req.url&#125;\`</span>);
    <span class="token-function">next</span>();
  &#125;);

  <span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>);
&#125;

<span class="token-function">bootstrap</span>();</code></pre>
          </div>
        </div>
      </section>

      <!-- Request Object -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Request Object</h2>
        <p class="text-text-secondary mb-4">
          The Express-compatible request object provides familiar properties and methods:
        </p>

        <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-bg-tertiary border-b border-border">
                <th class="px-4 py-3 text-left text-text-muted font-medium">Property</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Type</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              @for (prop of requestProps; track prop.name) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 font-mono text-nest-red">{{ prop.name }}</td>
                  <td class="px-4 py-3 text-text-secondary font-mono text-xs">{{ prop.type }}</td>
                  <td class="px-4 py-3 text-text-secondary">{{ prop.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Response Object -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Response Object</h2>
        <p class="text-text-secondary mb-4">
          The Express-compatible response object provides familiar methods:
        </p>

        <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-bg-tertiary border-b border-border">
                <th class="px-4 py-3 text-left text-text-muted font-medium">Method</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              @for (method of responseMethods; track method.name) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 font-mono text-nest-red">{{ method.name }}</td>
                  <td class="px-4 py-3 text-text-secondary">{{ method.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Error Middleware -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Error Middleware</h2>
        <p class="text-text-secondary mb-4">
          Express-style error middleware (4 arguments) is fully supported:
        </p>

        <div class="bg-bg-code rounded-lg border border-border overflow-hidden">
          <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-comment">// Error handling middleware</span>
app.<span class="token-function">use</span>((err, req, res, next) => &#123;
  console.<span class="token-function">error</span>(<span class="token-string">'Error:'</span>, err.message);

  res.<span class="token-function">status</span>(err.status ?? <span class="token-number">500</span>).<span class="token-function">json</span>(&#123;
    error: err.message,
    stack: process.env.NODE_ENV === <span class="token-string">'development'</span> ? err.stack : <span class="token-keyword">undefined</span>
  &#125;);
&#125;);</code></pre>
        </div>
      </section>

      <!-- Cookies -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Cookies</h2>
        <p class="text-text-secondary mb-4">
          Cookie handling is built-in:
        </p>

        <div class="bg-bg-code rounded-lg border border-border overflow-hidden">
          <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-comment">// Reading cookies</span>
app.<span class="token-function">use</span>((req, res, next) => &#123;
  <span class="token-keyword">const</span> sessionId = req.cookies.session;
  <span class="token-keyword">const</span> userId = req.cookies.userId;
  <span class="token-function">next</span>();
&#125;);

<span class="token-comment">// Setting cookies</span>
res.<span class="token-function">cookie</span>(<span class="token-string">'session'</span>, <span class="token-string">'abc123'</span>, &#123;
  httpOnly: <span class="token-keyword">true</span>,
  secure: <span class="token-keyword">true</span>,
  sameSite: <span class="token-string">'strict'</span>,
  maxAge: <span class="token-number">86400</span> * <span class="token-number">1000</span> <span class="token-comment">// 1 day</span>
&#125;);

<span class="token-comment">// Clearing cookies</span>
res.<span class="token-function">clearCookie</span>(<span class="token-string">'session'</span>);</code></pre>
        </div>
      </section>

      <!-- Compatibility Notes -->
      <section class="p-6 bg-bg-secondary rounded-xl border border-border">
        <h2 class="text-xl font-bold mb-4">Compatibility Notes</h2>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Most Express middleware works without modification</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Body parsing (JSON, URL-encoded, multipart)</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Cookie handling and signed cookies</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Error middleware (4-argument functions)</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-yellow-400">⚠</span>
            <span class="text-text-secondary">Some low-level Node.js stream APIs may differ</span>
          </div>
        </div>
      </section>
    </article>
  `,
})
export class ExpressCompatComponent {
  requestProps = [
    { name: 'method', type: 'string', description: 'HTTP method (GET, POST, etc.)' },
    { name: 'url', type: 'string', description: 'Full URL path with query string' },
    { name: 'path', type: 'string', description: 'URL path without query string' },
    { name: 'params', type: 'object', description: 'Route parameters' },
    { name: 'query', type: 'object', description: 'Parsed query string' },
    { name: 'body', type: 'any', description: 'Parsed request body' },
    { name: 'headers', type: 'object', description: 'Request headers' },
    { name: 'cookies', type: 'object', description: 'Parsed cookies' },
    { name: 'ip', type: 'string', description: 'Client IP address' },
    { name: 'hostname', type: 'string', description: 'Request hostname' },
  ];

  responseMethods = [
    { name: 'status(code)', description: 'Set HTTP status code' },
    { name: 'json(data)', description: 'Send JSON response' },
    { name: 'send(data)', description: 'Send response (auto-detects type)' },
    { name: 'set(header, value)', description: 'Set response header' },
    { name: 'cookie(name, value, opts)', description: 'Set cookie' },
    { name: 'clearCookie(name)', description: 'Clear cookie' },
    { name: 'redirect(url)', description: 'Redirect to URL' },
    { name: 'type(contentType)', description: 'Set Content-Type header' },
    { name: 'end()', description: 'End the response' },
  ];
}
