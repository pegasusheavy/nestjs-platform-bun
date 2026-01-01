#!/usr/bin/env tsx
/**
 * Verify that Bun adapter is always faster than Express and Fastify
 *
 * This script reads benchmark results and fails if Bun is not faster.
 */

import { spawn, ChildProcess } from "child_process";
import autocannon from "autocannon";

const BENCHMARK_DURATION = 5; // Shorter duration for CI
const CONNECTIONS = 50;
const PIPELINING = 5;

interface BenchmarkResult {
  adapter: string;
  reqPerSec: number;
  avgLatency: number;
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
    port: 5001,
    env: { PORT: "5001" },
  },
  {
    name: "Fastify",
    command: "npx",
    args: ["tsx", "apps/fastify-app.ts"],
    port: 5002,
    env: { PORT: "5002" },
  },
  {
    name: "Bun",
    command: "bun",
    args: ["apps/bun-app.ts"],
    port: 5003,
    env: { PORT: "5003" },
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
      // Server not ready
    }
    await sleep(100);
  }
  return false;
}

function startServer(config: AdapterConfig): ChildProcess {
  return spawn(config.command, config.args, {
    cwd: process.cwd(),
    env: { ...process.env, ...config.env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function runBenchmark(url: string): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections: CONNECTIONS,
        pipelining: PIPELINING,
        duration: BENCHMARK_DURATION,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

async function main(): Promise<void> {
  console.log("🔍 Verifying Bun adapter performance...\n");

  const results: BenchmarkResult[] = [];

  for (const adapter of adapters) {
    console.log(`  Testing ${adapter.name}...`);

    const server = startServer(adapter);
    const ready = await waitForServer(adapter.port);

    if (!ready) {
      console.error(`  ❌ Failed to start ${adapter.name} server`);
      server.kill();
      continue;
    }

    // Run benchmark on /json endpoint
    const result = await runBenchmark(`http://localhost:${adapter.port}/json`);

    results.push({
      adapter: adapter.name,
      reqPerSec: result.requests.average,
      avgLatency: result.latency.average,
    });

    server.kill();
    await sleep(500);
  }

  console.log("\n📊 Results:\n");

  for (const result of results) {
    console.log(`  ${result.adapter}:`);
    console.log(`    - Requests/sec: ${result.reqPerSec.toFixed(2)}`);
    console.log(`    - Avg Latency: ${result.avgLatency.toFixed(2)}ms`);
  }

  // Verify Bun is faster
  const bunResult = results.find((r) => r.adapter === "Bun");
  const expressResult = results.find((r) => r.adapter === "Express");
  const fastifyResult = results.find((r) => r.adapter === "Fastify");

  if (!bunResult) {
    console.error("\n❌ FAIL: Bun benchmark did not complete");
    process.exit(1);
  }

  let failed = false;

  if (expressResult && bunResult.reqPerSec <= expressResult.reqPerSec) {
    console.error(`\n❌ FAIL: Bun (${bunResult.reqPerSec.toFixed(0)} req/s) is NOT faster than Express (${expressResult.reqPerSec.toFixed(0)} req/s)`);
    failed = true;
  } else if (expressResult) {
    const improvement = ((bunResult.reqPerSec / expressResult.reqPerSec - 1) * 100).toFixed(1);
    console.log(`\n✅ Bun is ${improvement}% faster than Express`);
  }

  if (fastifyResult && bunResult.reqPerSec <= fastifyResult.reqPerSec) {
    console.error(`\n❌ FAIL: Bun (${bunResult.reqPerSec.toFixed(0)} req/s) is NOT faster than Fastify (${fastifyResult.reqPerSec.toFixed(0)} req/s)`);
    failed = true;
  } else if (fastifyResult) {
    const improvement = ((bunResult.reqPerSec / fastifyResult.reqPerSec - 1) * 100).toFixed(1);
    console.log(`✅ Bun is ${improvement}% faster than Fastify`);
  }

  if (failed) {
    console.error("\n💥 Performance verification FAILED!");
    process.exit(1);
  }

  console.log("\n🎉 Performance verification PASSED!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
