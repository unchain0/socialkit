#!/usr/bin/env node
// Custom audit script that filters out known acceptable vulnerabilities
// for this static documentation site

import { execSync } from 'child_process';

const ACCEPTABLE_ADVISORIES = [
  // Next.js 14.x vulnerabilities that don't apply to static Linux-hosted docs site
  '1193677', // Unauthenticated Remote Code Execution on windows-hosted servers
  '1193733', // Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used
];

function main() {
  try {
    // Run npm audit with JSON output, suppress stderr completely
    const output = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'], // ignore stderr
    });
    const audit = JSON.parse(output);

    const criticalVulns = [];
    const highVulns = [];

    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const severity = vuln.severity;
        const via = vuln.via;

        for (const v of via) {
          if (typeof v === 'object' && v.url) {
            const advisoryId = v.url.split('/').pop();
            if (ACCEPTABLE_ADVISORIES.includes(advisoryId)) {
              continue; // Skip acceptable advisory
            }
          }

          if (severity === 'critical') {
            criticalVulns.push({ name, ...vuln });
          } else if (severity === 'high') {
            highVulns.push({ name, ...vuln });
          }
        }
      }
    }

    if (criticalVulns.length > 0) {
      console.error('Critical vulnerabilities found:');
      for (const vuln of criticalVulns) {
        console.error(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
      }
      process.exit(1);
    }

    if (highVulns.length > 0) {
      console.warn('High vulnerabilities found (informational):');
      for (const vuln of highVulns) {
        console.warn(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
      }
    }

    console.log('Audit passed: no unacceptable critical vulnerabilities');
    process.exit(0);
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    // Try to parse the output anyway
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout.toString());
        const criticalVulns = [];
        const highVulns = [];

        if (audit.vulnerabilities) {
          for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
            const severity = vuln.severity;
            const via = vuln.via;

            for (const v of via) {
              if (typeof v === 'object' && v.url) {
                const advisoryId = v.url.split('/').pop();
                if (ACCEPTABLE_ADVISORIES.includes(advisoryId)) {
                  continue;
                }
              }

              if (severity === 'critical') {
                criticalVulns.push({ name, ...vuln });
              } else if (severity === 'high') {
                highVulns.push({ name, ...vuln });
              }
            }
          }
        }

        if (criticalVulns.length > 0) {
          console.error('Critical vulnerabilities found:');
          for (const vuln of criticalVulns) {
            console.error(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
          }
          process.exit(1);
        }

        if (highVulns.length > 0) {
          console.warn('High vulnerabilities found (informational):');
          for (const vuln of highVulns) {
            console.warn(`  - ${vuln.name}: ${vuln.via[0]?.url || 'unknown'}`);
          }
        }

        console.log('Audit passed: no unacceptable critical vulnerabilities');
        process.exit(0);
      } catch (e) {
        // Ignore parse error, fall through
      }
    }
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

main();
