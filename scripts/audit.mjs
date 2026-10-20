#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires -- Node script */
'use strict';

import { execSync } from 'child_process';

const ACCEPTABLE_ADVISORIES = new Set([
  // Next.js 14.x issues that do not apply to a static Linux-hosted docs site (Pages Router, no Server Actions)
  'GHSA-p293-qw3h-jr36', // Unauthenticated RCE on Windows-hosted servers
  'GHSA-2xp9-vwfh-vxw4', // Unauthenticated RCE in Image Optimization API with AVIF
  // Next.js 14.x App Router/Server Actions vulnerabilities - not applicable to Pages Router static site
  'GHSA-89xv-2m56-2m9x', // SSRF in Server Actions on custom servers
  'GHSA-p9j2-gv94-2wf4', // SSRF in rewrites via attacker-controlled destination hostname
  'GHSA-h25m-26qc-wcjf', // SSRF in Server Actions (App Router)
  'GHSA-q4gf-8mx6-v5v3', // Cache confusion of response bodies
  'GHSA-8h8q-6873-q5fj', // Cache confusion with invalid UTF-8
  'GHSA-c4j6-fc7j-m34r', // Unbounded Server Action payload in Edge runtime
  'GHSA-36qx-fr4f-26g5', // Unauthenticated disclosure of internal Server Function endpoints
  'GHSA-m99w-x7hq-7vfj', // Next.js vulnerability (App Router)
  // Mitigated via package.json resolutions
  'GHSA-vfj7-8cjw-p6xm', // braces prototype pollution, resolved to >=3.0.3
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

function parseAuditLine(line) {
  if (!line || line.trim() === '') return null;

  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function processAuditEntry(entry, critical, high) {
  if (entry.type === 'error') {
    throw new Error(`npm audit error: ${entry.message || JSON.stringify(entry)}`);
  }
  if (entry.type !== 'auditAdvisory') return;

  const vuln = entry.data;
  if (isAcceptable(vuln)) return;

  const severity = vuln.advisory?.severity;
  if (severity === 'critical') critical.push(vuln);
  else if (severity === 'high') high.push(vuln);
}

function collectVulnerabilities(auditLines) {
  const critical = [];
  const high = [];

  for (const line of auditLines) {
    const entry = parseAuditLine(line);
    if (!entry) continue;

    try {
      processAuditEntry(entry, critical, high);
    } catch (error) {
      if (error.message.startsWith('npm audit error:')) {
        throw error;
      }
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

  printList('High vulnerabilities found', high, console.error);
  if (high.length > 0) process.exit(1);

  console.log('Audit passed: no unacceptable critical or high vulnerabilities');
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