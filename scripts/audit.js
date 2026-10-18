#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS Node script without package "type":"module" */
'use strict';

const { execSync } = require('child_process');

const ACCEPTABLE_ADVISORIES = new Set([
  // Next.js 14.x issues that do not apply to a static Linux-hosted docs site
  '1193677', // Unauthenticated RCE on Windows-hosted servers
  '1193733', // Unauthenticated RCE in Image Optimization API with AVIF
]);

function advisoryUrl(vuln) {
  const first = Array.isArray(vuln.via) ? vuln.via[0] : null;
  if (first && typeof first === 'object' && first.url) {
    return first.url;
  }
  return 'unknown';
}

function isAcceptable(vuln) {
  const via = vuln.via;
  if (!Array.isArray(via)) return false;

  for (const entry of via) {
    if (typeof entry === 'object' && entry !== null && entry.url) {
      const advisoryId = String(entry.url).split('/').pop();
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
    if (vuln.severity === 'critical') critical.push({ name, ...vuln });
    else if (vuln.severity === 'high') high.push({ name, ...vuln });
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

function printList(label, list, writer) {
  if (list.length === 0) return;
  writer(`${label}:`);
  for (const vuln of list) {
    writer(`  - ${vuln.name}: ${advisoryUrl(vuln)}`);
  }
}

function reportAndExit(critical, high) {
  printList('Critical vulnerabilities found', critical, console.error);
  if (critical.length > 0) process.exit(1);

  printList('High vulnerabilities found (informational)', high, console.warn);
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
