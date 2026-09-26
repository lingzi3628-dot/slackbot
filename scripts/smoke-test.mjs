const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const checks = [
  ["homepage", "/", (res) => res.status === 200],
  ["readiness", "/api/ready", (res) => res.status === 200],
  ["manifest", "/manifest.webmanifest", (res) => res.status === 200],
];

let failed = false;

for (const [name, path, isHealthy] of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const healthy = isHealthy(response);
    console.log(`${healthy ? "PASS" : "FAIL"} ${name} ${response.status} ${path}`);
    if (!healthy) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name} ${path}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) {
  console.error(`\nSmoke tests failed for ${baseUrl}`);
  process.exit(1);
}

console.log(`\nAll smoke tests passed for ${baseUrl}`);
