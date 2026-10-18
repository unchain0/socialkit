#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS Node script */
'use strict';

const { execSync } = require('child_process');

const ACCEPTABLE_ADVISORIES = new Set([
  // Next.js 14.x issues that do not apply to a static Linux-hosted docs site
  'GHSA-p293-qw3h-jr36', // Unauthenticated RCE on Windows-hosted servers
  'GHSA-2xp9-vwfh-vxw4', // Unauthenticated RCE in Image Optimization API with AVIF
]);

function advisoryUrl(vuln) {
  const advisory = vuln.advisory;
  if (advisory && advisory.url) {
    return advisory.url;
  }
  return 'unknown';
}

function isAcceptable(vuln) {
  const advisory = vuln.advisory;
  if (!advisory || !advisory.url) return false;

  const advisoryId = String(advisory.url).split('/').pop();
  return ACCEPTABLE_ADVISORIES.has(advisoryId);
}

function collectVulnerabilities(auditLines) {
  const critical = [];
  const high = [];

  for (const line of auditLines) {
    if (!line || line.trim() === '') continue;

    try {
      const entry = JSON.parse(line);
      if (entry.type !== 'auditAdvisory') continue;

      const vuln = entry.data;
      if (isAcceptable(vuln)) continue;

      const severity = vuln.advisory?.severity;
      if (severity === 'critical') critical.push(vuln);
      else if (severity === 'high') high.push(vuln);
    } catch {
      // Skip malformed lines
    }
  }

  return { critical, high };
}

function runAudit() {
  try {
    const output = execSync('yarn audit --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return output.trim().split('\n');
  } catch (error) {
    // yarn audit returns non-zero exit code when vulnerabilities found
    // but still outputs JSON to stdout
    if (error.stdout) {
      return error.stdout.toString().trim().split('\n');
    }
    throw error;
  }
}

function printList(label, list, writer) {
  if (list.length === 0) return;
  writer(`${label}:`);
  for (const vuln of list) {
    writer(`  - ${vuln.advisory?.module_name || 'unknown'}: ${advisoryUrl(vuln)}`);
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
    const auditLines = runAudit();
    const { critical, high } = collectVulnerabilities(auditLines);
    reportAndExit(critical, high);
  } catch (error) {
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

main();
