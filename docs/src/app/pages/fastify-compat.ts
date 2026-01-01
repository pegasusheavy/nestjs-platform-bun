import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fastify-compat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <h1 class="text-4xl font-bold mb-4">Fastify Compatibility</h1>
      <p class="text-text-secondary text-lg mb-8">
        Use Fastify hooks and plugins with the Bun adapter.
      </p>

      <!-- Overview -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Overview</h2>
        <p class="text-text-secondary mb-4">
          The adapter includes a Fastify compatibility layer that supports hooks, plugins,
          and decorators. This allows you to use Fastify-style middleware patterns.
        </p>
      </section>

      <!-- Hooks -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Lifecycle Hooks</h2>
        <p class="text-text-secondary mb-4">
          Fastify-style lifecycle hooks are fully supported:
        </p>

        <div class="bg-bg-code rounded-lg border border-border overflow-hidden mb-6">
          <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-keyword">import</span> &#123; NestBunFactory, BunAdapter &#125; <span class="token-keyword">from</span> <span class="token-string">'@pegasusheavy/nestjs-platform-bun'</span>;

<span class="token-keyword">async function</span> <span class="token-function">bootstrap</span>() &#123;
  <span class="token-keyword">const</span> app = <span class="token-keyword">await</span> NestBunFactory.<span class="token-function">create</span>(AppModule);
  <span class="token-keyword">const</span> adapter = app.<span class="token-function">getHttpAdapter</span>() <span class="token-keyword">as</span> BunAdapter;

  <span class="token-comment">// onRequest hook - runs before routing</span>
  adapter.<span class="token-function">addHook</span>(<span class="token-string">'onRequest'</span>, <span class="token-keyword">async</span> (request, reply, done) => &#123;
    console.<span class="token-function">log</span>(<span class="token-string">'Request received:'</span>, request.url);
    <span class="token-function">done</span>();
  &#125;);

  <span class="token-comment">// preHandler hook - runs before the handler</span>
  adapter.<span class="token-function">addHook</span>(<span class="token-string">'preHandler'</span>, <span class="token-keyword">async</span> (request, reply, done) => &#123;
    <span class="token-comment">// Authentication check</span>
    <span class="token-keyword">if</span> (!request.headers.authorization) &#123;
      reply.<span class="token-function">code</span>(<span class="token-number">401</span>).<span class="token-function">send</span>(&#123; error: <span class="token-string">'Unauthorized'</span> &#125;);
      <span class="token-keyword">return</span>;
    &#125;
    <span class="token-function">done</span>();
  &#125;);

  <span class="token-comment">// onSend hook - runs before sending response</span>
  adapter.<span class="token-function">addHook</span>(<span class="token-string">'onSend'</span>, <span class="token-keyword">async</span> (request, reply, payload, done) => &#123;
    <span class="token-comment">// Modify payload before sending</span>
    <span class="token-keyword">const</span> modified = &#123; ...payload, timestamp: Date.<span class="token-function">now</span>() &#125;;
    <span class="token-function">done</span>(<span class="token-keyword">null</span>, modified);
  &#125;);

  <span class="token-comment">// onResponse hook - runs after response sent</span>
  adapter.<span class="token-function">addHook</span>(<span class="token-string">'onResponse'</span>, <span class="token-keyword">async</span> (request, reply, done) => &#123;
    console.<span class="token-function">log</span>(<span class="token-string">'Response time:'</span>, reply.<span class="token-function">getResponseTime</span>(), <span class="token-string">'ms'</span>);
    <span class="token-function">done</span>();
  &#125;);

  <span class="token-keyword">await</span> app.<span class="token-function">listen</span>(<span class="token-number">3000</span>);
&#125;</code></pre>
        </div>

        <div class="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-bg-tertiary border-b border-border">
                <th class="px-4 py-3 text-left text-text-muted font-medium">Hook</th>
                <th class="px-4 py-3 text-left text-text-muted font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              @for (hook of hooks; track hook.name) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 font-mono text-nest-red">{{ hook.name }}</td>
                  <td class="px-4 py-3 text-text-secondary">{{ hook.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Decorators -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Decorators</h2>
        <p class="text-text-secondary mb-4">
          Add custom properties to request and reply objects:
        </p>

        <div class="bg-bg-code rounded-lg border border-border overflow-hidden">
          <pre class="p-4 overflow-x-auto"><code class="text-sm"><span class="token-keyword">const</span> adapter = app.<span class="token-function">getHttpAdapter</span>() <span class="token-keyword">as</span> BunAdapter;

<span class="token-comment">// Decorate request with user data</span>
adapter.<span class="token-function">decorateRequest</span>(<span class="token-string">'user'</span>, <span class="token-keyword">null</span>);

<span class="token-comment">// Decorate reply with custom method</span>
adapter.<span class="token-function">decorateReply</span>(<span class="token-string">'sendError'</span>, <span class="token-keyword">function</span>(code, message) &#123;
  <span class="token-keyword">this</span>.<span class="token-function">code</span>(code).<span class="token-function">send</span>(&#123; error: message &#125;);
&#125;);

<span class="token-comment">// Check if decorator exists</span>
<span class="token-keyword">if</span> (adapter.<span class="token-function">hasRequestDecorator</span>(<span class="token-string">'user'</span>)) &#123;
  console.<span class="token-function">log</span>(<span class="token-string">'User decorator is available'</span>);
&#125;</code></pre>
        </div>
      </section>

      <!-- Reply Object -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Reply Object</h2>
        <p class="text-text-secondary mb-4">
          The Fastify-compatible reply object:
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
              @for (method of replyMethods; track method.name) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 font-mono text-nest-red">{{ method.name }}</td>
                  <td class="px-4 py-3 text-text-secondary">{{ method.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Request Object -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Request Object</h2>
        <p class="text-text-secondary mb-4">
          The Fastify-compatible request object:
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

      <!-- Compatibility Notes -->
      <section class="p-6 bg-bg-secondary rounded-xl border border-border">
        <h2 class="text-xl font-bold mb-4">Compatibility Notes</h2>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">All standard lifecycle hooks supported</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Request and reply decorators</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Response time tracking</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-green-400">✓</span>
            <span class="text-text-secondary">Custom serializers</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-yellow-400">⚠</span>
            <span class="text-text-secondary">Schema validation uses simplified implementation</span>
          </div>
        </div>
      </section>
    </article>
  `,
})
export class FastifyCompatComponent {
  hooks = [
    { name: 'onRequest', description: 'Before routing, after headers received' },
    { name: 'preHandler', description: 'After routing, before handler execution' },
    { name: 'onSend', description: 'Before sending response payload' },
    { name: 'onResponse', description: 'After response has been sent' },
    { name: 'onError', description: 'When an error occurs' },
  ];

  replyMethods = [
    { name: 'code(statusCode)', description: 'Set HTTP status code' },
    { name: 'status(statusCode)', description: 'Alias for code()' },
    { name: 'header(key, value)', description: 'Set response header' },
    { name: 'headers(obj)', description: 'Set multiple headers' },
    { name: 'send(payload)', description: 'Send response' },
    { name: 'type(contentType)', description: 'Set Content-Type' },
    { name: 'redirect(url)', description: 'Redirect to URL' },
    { name: 'getResponseTime()', description: 'Get elapsed time in ms' },
  ];

  requestProps = [
    { name: 'id', type: 'string', description: 'Unique request ID' },
    { name: 'params', type: 'object', description: 'Route parameters' },
    { name: 'query', type: 'object', description: 'Query string parameters' },
    { name: 'body', type: 'any', description: 'Request body' },
    { name: 'headers', type: 'object', description: 'Request headers' },
    { name: 'method', type: 'string', description: 'HTTP method' },
    { name: 'url', type: 'string', description: 'Full URL' },
    { name: 'ip', type: 'string', description: 'Client IP address' },
    { name: 'hostname', type: 'string', description: 'Request hostname' },
  ];
}
