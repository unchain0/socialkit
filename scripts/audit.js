#!/usr/bin/env node
// Custom audit script that filters out known acceptable vulnerabilities
// for this static documentation site

import { execSync } from 'child_process';

const ACCEPTABLE_ADVISORIES = new Set([
  // Next.js 14.x vulnerabilities that don't apply to static Linux-hosted docs site
  '1193677', // Unauthenticated RCE on Windows-hosted servers
  '1193733', // Unauthenticated RCE in Image Optimization API with AVIF
]);

function isAcceptable(vuln) {
  const via = vuln.via;
  if (!Array.isArray(via)) return false;

  for (const v of via) {
    if (typeof v === 'object' && v.url) {
      const advisoryId = v.url.split('/').pop();
      if (ACCEPTABLE_ADVISORIES.has(advisoryId)) {
        return true;
      }
    }
  }
  return false;
}

function collectVulnerabilities(audit) {
  const critical = [];
  const high = [];

  if (!audit.vulnerabilities) return { critical, high };

  for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
    if (isAcceptable(vuln)) continue;

    const severity = vuln.severity;
    if (severity === 'critical') {
      critical.push({ name, ...vuln });
    } else if (severity === 'high') {
      high.push({ name, ...vuln });
    }
  }

  return { critical, high };
}

function runAudit() {
  try {
    const output = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return JSON.parse(output);
  } catch (error) {
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout.toString());
      } catch {
        // fall through
      }
    }
    throw error;
  }
}

function reportAndExit(critical, high) {
  if (critical.length > 0) {
    console.error('Critical vulnerabilities found:');
    for (const vuln of critical) {
      console.error(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
    }
    process.exit(1);
  }

  if (high.length > 0) {
    console.warn('High vulnerabilities found (informational):');
    for (const vuln of high) {
      console.warn(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
    }
  }

  console.log('Audit passed: no unacceptable critical vulnerabilities');
  process.exit(0);
}

function main() {
  try {
    const audit = runAudit();
    const { critical, high } = collectVulnerabilities(audit);
    reportAndExit(critical, high);
  } catch (error) {
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

main();
