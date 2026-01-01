import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-adapter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <h1 class="text-4xl font-bold mb-4">Bun Adapter</h1>
      <p class="text-text-secondary text-lg mb-8">
        The core adapter that bridges NestJS with Bun's native HTTP server.
      </p>

      <!-- Overview -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Overview</h2>
        <p class="text-text-secondary mb-4">
          The <code>BunAdapter</code> extends NestJS's <code>AbstractHttpAdapter</code> to provide
          a high-performance HTTP layer using Bun's native server. It's designed to be a drop-in
          replacement for Express or Fastify adapters.
        </p>
        <div class="p-4 bg-nest-red/10 border border-nest-red/20 rounded-lg">
          <p class="text-text-primary text-sm">
            <strong>Note:</strong> The adapter automatically handles request/response lifecycle,
            routing, and middleware execution.
          </p>
        </div>
      </section>

      <!-- NestBunFactory -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">NestBunFactory</h2>
        <p class="text-text-secondary mb-4">
          The factory class for creating NestJS applications with the Bun adapter.
        </p>

        <h3 class="text-lg font-semibold mb-3">create()</h3>
        <div class="bg-bg-code rounded-lg border border-border overflow-hidden mb-4">
          <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-keyword">import</span> &#123; NestBunFactory &#125; <span class="token-keyword">from</span> <span class="token-string">'@pegasusheavy/nestjs-platform-bun'</span>;

<span class="token-keyword">const</span> app = <span class="token-keyword">await</span> NestBunFactory.<span class="token-function">create</span>(AppModule, &#123;
  logger: [<span class="token-string">'error'</span>, <span class="token-string">'warn'</span>],  <span class="token-comment">// Logging levels</span>
  cors: <span class="token-keyword">true</span>,                    <span class="token-comment">// Enable CORS</span>
  bodyParser: <span class="token-keyword">true</span>,              <span class="token-comment">// Enable body parsing</span>
&#125;);</code></pre>
        </div>

        <h3 class="text-lg font-semibold mb-3">Options</h3>
        <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-bg-tertiary border-b border-border">
                <th class="px-4 py-3 text-left text-text-muted font-medium">Option</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Type</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Default</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border">
                <td class="px-4 py-3 font-mono text-nest-red">logger</td>
                <td class="px-4 py-3 text-text-secondary">LogLevel[] | false</td>
                <td class="px-4 py-3 text-text-muted">true</td>
                <td class="px-4 py-3 text-text-secondary">Configure logging</td>
              </tr>
              <tr class="border-b border-border">
                <td class="px-4 py-3 font-mono text-nest-red">cors</td>
                <td class="px-4 py-3 text-text-secondary">boolean | CorsOptions</td>
                <td class="px-4 py-3 text-text-muted">false</td>
                <td class="px-4 py-3 text-text-secondary">CORS configuration</td>
              </tr>
              <tr class="border-b border-border">
                <td class="px-4 py-3 font-mono text-nest-red">bodyParser</td>
                <td class="px-4 py-3 text-text-secondary">boolean</td>
                <td class="px-4 py-3 text-text-muted">true</td>
                <td class="px-4 py-3 text-text-secondary">Enable body parsing</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-nest-red">httpsOptions</td>
                <td class="px-4 py-3 text-text-secondary">TlsOptions</td>
                <td class="px-4 py-3 text-text-muted">undefined</td>
                <td class="px-4 py-3 text-text-secondary">HTTPS configuration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Application Methods -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Application Methods</h2>

        <div class="space-y-6">
          <!-- listen -->
          <div class="bg-bg-secondary rounded-xl border border-border p-6">
            <h3 class="text-lg font-semibold mb-2 font-mono text-nest-red">listen(port, hostname?)</h3>
            <p class="text-text-secondary mb-4">Starts the HTTP server on the specified port.</p>
            <div class="bg-bg-code rounded-lg border border-border p-4 overflow-x-auto">
              <pre><code class="text-sm"><span class="token-comment">// Listen on port 3000</span>
<span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>);

<span class="token-comment">// Listen on specific hostname</span>
<span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>, <span class="token-string">'0.0.0.0'</span>);

<span class="token-comment">// Listen with callback</span>
<span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>, () => &#123;
  console.<span class="token-function">log</span>(<span class="token-string">'Server started'</span>);
&#125;);</code></pre>
            </div>
          </div>

          <!-- enableCors -->
          <div class="bg-bg-secondary rounded-xl border border-border p-6">
            <h3 class="text-lg font-semibold mb-2 font-mono text-nest-red">enableCors(options?)</h3>
            <p class="text-text-secondary mb-4">Enables CORS with optional configuration.</p>
            <div class="bg-bg-code rounded-lg border border-border p-4 overflow-x-auto">
              <pre><code class="text-sm"><span class="token-comment">// Enable with defaults</span>
app.<span class="token-function">enableCors</span>();

<span class="token-comment">// Custom configuration</span>
app.<span class="token-function">enableCors</span>(&#123;
  origin: <span class="token-string">'https://example.com'</span>,
  methods: [<span class="token-string">'GET'</span>, <span class="token-string">'POST'</span>],
  credentials: <span class="token-keyword">true</span>,
  maxAge: <span class="token-number">86400</span>
&#125;);</code></pre>
            </div>
          </div>

          <!-- setGlobalPrefix -->
          <div class="bg-bg-secondary rounded-xl border border-border p-6">
            <h3 class="text-lg font-semibold mb-2 font-mono text-nest-red">setGlobalPrefix(prefix)</h3>
            <p class="text-text-secondary mb-4">Sets a global prefix for all routes.</p>
            <div class="bg-bg-code rounded-lg border border-border p-4 overflow-x-auto">
              <pre><code class="text-sm"><span class="token-comment">// All routes will be prefixed with /api</span>
app.<span class="token-function">setGlobalPrefix</span>(<span class="token-string">'api'</span>);

<span class="token-comment">// /users becomes /api/users</span></code></pre>
            </div>
          </div>

          <!-- use -->
          <div class="bg-bg-secondary rounded-xl border border-border p-6">
            <h3 class="text-lg font-semibold mb-2 font-mono text-nest-red">use(middleware)</h3>
            <p class="text-text-secondary mb-4">Registers global middleware.</p>
            <div class="bg-bg-code rounded-lg border border-border p-4 overflow-x-auto">
              <pre><code class="text-sm"><span class="token-comment">// Global middleware</span>
app.<span class="token-function">use</span>((req, res, next) => &#123;
  console.<span class="token-function">log</span>(<span class="token-string">\`\$&#123;req.method&#125; \$&#123;req.path&#125;\`</span>);
  <span class="token-function">next</span>();
&#125;);

<span class="token-comment">// Path-specific middleware</span>
app.<span class="token-function">use</span>(<span class="token-string">'/api'</span>, authMiddleware);</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Request/Response -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Request & Response</h2>
        <p class="text-text-secondary mb-4">
          The adapter provides Express-compatible request and response objects.
        </p>

        <div class="bg-bg-code rounded-lg border border-border overflow-hidden">
          <div class="flex items-center px-4 py-2 bg-bg-secondary border-b border-border">
            <span class="text-text-muted text-sm">Controller Example</span>
          </div>
          <pre class="p-4 overflow-x-auto"><code class="text-sm">&#64;<span class="token-function">Controller</span>(<span class="token-string">'users'</span>)
<span class="token-keyword">export class</span> <span class="token-variable">UsersController</span> &#123;
  &#64;<span class="token-function">Get</span>(<span class="token-string">':id'</span>)
  <span class="token-function">getUser</span>(
    &#64;<span class="token-function">Param</span>(<span class="token-string">'id'</span>) id: <span class="token-variable">string</span>,
    &#64;<span class="token-function">Query</span>(<span class="token-string">'include'</span>) include?: <span class="token-variable">string</span>,
    &#64;<span class="token-function">Headers</span>(<span class="token-string">'authorization'</span>) auth?: <span class="token-variable">string</span>
  ) &#123;
    <span class="token-keyword">return</span> &#123; id, include, auth &#125;;
  &#125;

  &#64;<span class="token-function">Post</span>()
  <span class="token-function">createUser</span>(
    &#64;<span class="token-function">Body</span>() body: CreateUserDto,
    &#64;<span class="token-function">Ip</span>() ip: <span class="token-variable">string</span>
  ) &#123;
    <span class="token-keyword">return</span> &#123; ...body, ip &#125;;
  &#125;

  &#64;<span class="token-function">Get</span>(<span class="token-string">'download'</span>)
  &#64;<span class="token-function">Header</span>(<span class="token-string">'Content-Type'</span>, <span class="token-string">'application/pdf'</span>)
  <span class="token-function">downloadFile</span>(&#64;<span class="token-function">Res</span>() res: Response) &#123;
    res.<span class="token-function">sendFile</span>(<span class="token-string">'/path/to/file.pdf'</span>);
  &#125;
&#125;</code></pre>
        </div>
      </section>

      <!-- Lifecycle -->
      <section class="p-6 bg-bg-secondary rounded-xl border border-border">
        <h2 class="text-xl font-bold mb-4">Server Lifecycle</h2>
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <div class="font-semibold text-text-primary">Create Application</div>
              <div class="text-text-secondary text-sm">NestBunFactory.create() initializes the adapter</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <div class="font-semibold text-text-primary">Configure</div>
              <div class="text-text-secondary text-sm">Set up CORS, middleware, prefix, etc.</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <div class="font-semibold text-text-primary">Listen</div>
              <div class="text-text-secondary text-sm">app.listen() starts Bun's HTTP server</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <div class="font-semibold text-text-primary">Handle Requests</div>
              <div class="text-text-secondary text-sm">Adapter routes requests through NestJS pipeline</div>
            </div>
          </div>
        </div>
      </section>
    </article>
  `,
})
export class AdapterComponent {}
