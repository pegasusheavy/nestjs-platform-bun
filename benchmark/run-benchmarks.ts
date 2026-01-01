import { spawn, ChildProcess } from "child_process";
import autocannon from "autocannon";

// Configuration
const WARMUP_DURATION = 3; // seconds
const BENCHMARK_DURATION = 10; // seconds
const CONNECTIONS = 100;
const PIPELINING = 10;

interface BenchmarkResult {
  adapter: string;
  endpoint: string;
  requests: number;
  latency: {
    avg: number;
    p50: number;
    p99: number;
    max: number;
  };
  throughput: {
    avg: number;
    total: number;
  };
  errors: number;
  timeouts: number;
}

interface AdapterConfig {
  name: string;
  command: string;
  args: string[];
  port: number;
  env?: Record<string, string>;
}

const adapters: AdapterConfig[] = [
  {
    name: "Express",
    command: "npx",
    args: ["tsx", "apps/express-app.ts"],
    port: 4001,
    env: { PORT: "4001" },
  },
  {
    name: "Fastify",
    command: "npx",
    args: ["tsx", "apps/fastify-app.ts"],
    port: 4002,
    env: { PORT: "4002" },
  },
  {
    name: "Bun",
    command: "bun",
    args: ["apps/bun-app.ts"],
    port: 4003,
    env: { PORT: "4003" },
  },
];

const endpoints = [
  { path: "/", name: "Hello World (text)" },
  { path: "/json", name: "JSON Response" },
  { path: "/users/123", name: "Path Parameter" },
  { path: "/health", name: "Health Check" },
  { path: "/cpu/light", name: "CPU Light (fib 20)" },
];

const postEndpoints = [
  {
    path: "/items",
    name: "POST JSON Body",
    body: JSON.stringify({ name: "Test Item", value: 42 }),
    headers: { "Content-Type": "application/json" },
  },
];

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(port: number, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await sleep(100);
  }
  return false;
}

function startServer(config: AdapterConfig): ChildProcess {
  const proc = spawn(config.command, config.args, {
    cwd: process.cwd(),
    env: { ...process.env, ...config.env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let stderr = "";

  proc.stdout?.on("data", (data) => {
    const output = data.toString();
    if (output.includes("listening")) {
      console.log(`    ${output.trim()}`);
    }
  });

  proc.stderr?.on("data", (data) => {
    stderr += data.toString();
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null && stderr) {
      console.error(`    Server error: ${stderr.split("\n")[0]}`);
    }
  });

  return proc;
}

async function runBenchmark(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections: CONNECTIONS,
        pipelining: PIPELINING,
        duration: BENCHMARK_DURATION,
        method: (options.method as autocannon.Request["method"]) ?? "GET",
        body: options.body,
        headers: options.headers,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );

    // Suppress autocannon output
    autocannon.track(instance, { renderProgressBar: false });
  });
}

async function warmup(port: number, path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `http://localhost:${port}${path}`,
        connections: 10,
        duration: WARMUP_DURATION,
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${formatNumber(size)} ${units[unitIndex]}`;
}

function printResults(results: BenchmarkResult[]): void {
  console.log("\n" + "=".repeat(100));
  console.log("BENCHMARK RESULTS");
  console.log("=".repeat(100));

  // Group by endpoint
  const byEndpoint = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    const existing = byEndpoint.get(result.endpoint) ?? [];
    existing.push(result);
    byEndpoint.set(result.endpoint, existing);
  }

  for (const [endpoint, endpointResults] of byEndpoint) {
    console.log(`\n📊 ${endpoint}`);
    console.log("-".repeat(100));
    console.log(
      "| Adapter  | Req/sec    | Avg Latency | P99 Latency | Throughput  | Errors | vs Express | vs Fastify |"
    );
    console.log("-".repeat(100));

    // Sort by requests per second (highest first)
    endpointResults.sort((a, b) => b.requests - a.requests);

    const expressResult = endpointResults.find((r) => r.adapter === "Express");
    const fastifyResult = endpointResults.find((r) => r.adapter === "Fastify");

    for (const result of endpointResults) {
      const reqPerSec = result.requests / BENCHMARK_DURATION;
      const expressReqPerSec = expressResult ? expressResult.requests / BENCHMARK_DURATION : 0;
      const fastifyReqPerSec = fastifyResult ? fastifyResult.requests / BENCHMARK_DURATION : 0;

      const vsExpress = expressReqPerSec > 0 ? ((reqPerSec / expressReqPerSec - 1) * 100).toFixed(1) : "N/A";
      const vsFastify = fastifyReqPerSec > 0 ? ((reqPerSec / fastifyReqPerSec - 1) * 100).toFixed(1) : "N/A";

      const vsExpressStr = typeof vsExpress === "string" ? vsExpress : `${vsExpress > 0 ? "+" : ""}${vsExpress}%`;
      const vsFastifyStr = typeof vsFastify === "string" ? vsFastify : `${vsFastify > 0 ? "+" : ""}${vsFastify}%`;

      console.log(
        `| ${result.adapter.padEnd(8)} | ${formatNumber(reqPerSec).padStart(10)} | ${(result.latency.avg.toFixed(2) + " ms").padStart(11)} | ${(result.latency.p99.toFixed(2) + " ms").padStart(11)} | ${formatBytes(result.throughput.avg).padStart(11)} | ${String(result.errors).padStart(6)} | ${vsExpressStr.padStart(10)} | ${vsFastifyStr.padStart(10)} |`
      );
    }
  }

  // Summary
  console.log("\n" + "=".repeat(100));
  console.log("SUMMARY");
  console.log("=".repeat(100));

  const bunResults = results.filter((r) => r.adapter === "Bun");
  const expressResults = results.filter((r) => r.adapter === "Express");
  const fastifyResults = results.filter((r) => r.adapter === "Fastify");

  const bunTotal = bunResults.reduce((sum, r) => sum + r.requests, 0);
  const expressTotal = expressResults.reduce((sum, r) => sum + r.requests, 0);
  const fastifyTotal = fastifyResults.reduce((sum, r) => sum + r.requests, 0);

  console.log(`\nTotal requests across all benchmarks:`);
  console.log(`  🚀 Bun:     ${formatNumber(bunTotal)} requests`);
  console.log(`  ⚡ Fastify: ${formatNumber(fastifyTotal)} requests`);
  console.log(`  📦 Express: ${formatNumber(expressTotal)} requests`);

  if (bunTotal > expressTotal) {
    const improvement = ((bunTotal / expressTotal - 1) * 100).toFixed(1);
    console.log(`\n✅ Bun is ${improvement}% faster than Express overall`);
  }

  if (bunTotal > fastifyTotal) {
    const improvement = ((bunTotal / fastifyTotal - 1) * 100).toFixed(1);
    console.log(`✅ Bun is ${improvement}% faster than Fastify overall`);
  }

  console.log("\n" + "=".repeat(100));
}

async function main(): Promise<void> {
  console.log("🏁 NestJS Adapter Benchmark Suite");
  console.log("==================================\n");
  console.log(`Configuration:`);
  console.log(`  - Warmup duration: ${WARMUP_DURATION}s`);
  console.log(`  - Benchmark duration: ${BENCHMARK_DURATION}s`);
  console.log(`  - Connections: ${CONNECTIONS}`);
  console.log(`  - Pipelining: ${PIPELINING}`);
  console.log("");

  const results: BenchmarkResult[] = [];

  for (const adapter of adapters) {
    console.log(`\n🚀 Starting ${adapter.name} server on port ${adapter.port}...`);

    const server = startServer(adapter);
    const ready = await waitForServer(adapter.port);

    if (!ready) {
      console.error(`❌ Failed to start ${adapter.name} server`);
      server.kill();
      continue;
    }

    console.log(`✅ ${adapter.name} server is ready`);

    // Run GET benchmarks
    for (const endpoint of endpoints) {
      console.log(`  📈 Benchmarking ${endpoint.name}...`);

      // Warmup
      await warmup(adapter.port, endpoint.path);

      // Benchmark
      const result = await runBenchmark(`http://localhost:${adapter.port}${endpoint.path}`);

      results.push({
        adapter: adapter.name,
        endpoint: endpoint.name,
        requests: result.requests.total,
        latency: {
          avg: result.latency.average,
          p50: result.latency.p50,
          p99: result.latency.p99,
          max: result.latency.max,
        },
        throughput: {
          avg: result.throughput.average,
          total: result.throughput.total,
        },
        errors: result.errors,
        timeouts: result.timeouts,
      });
    }

    // Run POST benchmarks
    for (const endpoint of postEndpoints) {
      console.log(`  📈 Benchmarking ${endpoint.name}...`);

      // Warmup
      await warmup(adapter.port, endpoint.path);

      // Benchmark
      const result = await runBenchmark(`http://localhost:${adapter.port}${endpoint.path}`, {
        method: "POST",
        body: endpoint.body,
        headers: endpoint.headers,
      });

      results.push({
        adapter: adapter.name,
        endpoint: endpoint.name,
        requests: result.requests.total,
        latency: {
          avg: result.latency.average,
          p50: result.latency.p50,
          p99: result.latency.p99,
          max: result.latency.max,
        },
        throughput: {
          avg: result.throughput.average,
          total: result.throughput.total,
        },
        errors: result.errors,
        timeouts: result.timeouts,
      });
    }

    // Stop server
    console.log(`  🛑 Stopping ${adapter.name} server...`);
    server.kill();
    await sleep(500);
  }

  // Print results
  printResults(results);
}

main().catch(console.error);
