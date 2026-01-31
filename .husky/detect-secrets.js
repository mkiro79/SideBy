#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');

// Patrones peligrosos
const PATTERNS = [
  /password\s*=\s*["'][^"']+["']/gi,
  /passwd\s*=\s*["'][^"']+["']/gi,
  /secret\s*=\s*["'][^"']+["']/gi,
  /api[_-]?key\s*=\s*["'][^"']+["']/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI keys
  /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g, // MongoDB URIs with credentials
];

// Patrones específicos para Dockerfile/docker-compose
const DOCKER_PATTERNS = [
  /ENV\s+\w+\s*=\s*["']?(?!\$\{)[^"'\s]+["']?(?!\})/gi, // ENV VAR=value (no ${VAR})
  /ARG\s+\w+\s*=\s*["']?(?!\$\{)[^"'\s]+["']?(?!\})/gi,
];

const EXCLUDED_PATTERNS = [
  /password\s*=\s*process\.env/gi,
  /secret\s*=\s*process\.env/gi,
  /=\s*["']?\$\{[^}]+\}["']?/g, // Allow ${VAR}
  /=\s*["']?<[^>]+>["']?/g, // Allow placeholders like <YOUR_KEY>
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8'
    });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('❌ Error getting staged files:', error.message);
    return [];
  }
}

function isExcluded(line) {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(line));
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  const isDockerFile = /dockerfile|docker-compose/i.test(filePath);
  const patternsToCheck = isDockerFile 
    ? [...PATTERNS, ...DOCKER_PATTERNS]
    : PATTERNS;

  lines.forEach((line, index) => {
    if (isExcluded(line)) return;

    for (const pattern of patternsToCheck) {
      const matches = line.match(pattern);
      if (matches) {
        findings.push({
          file: filePath,
          line: index + 1,
          match: matches[0],
          content: line.trim()
        });
      }
    }
  });

  return findings;
}

function main() {
  console.log('🔍 Scanning for hardcoded secrets...\n');

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('✅ No files to scan');
    process.exit(0);
  }

  // Filtrar archivos relevantes
  const filesToScan = stagedFiles.filter(file => {
    const ext = file.split('.').pop();
    return ['js', 'ts', 'jsx', 'tsx', 'json', 'yml', 'yaml', 'env'].includes(ext) ||
           file.includes('Dockerfile') ||
           file.includes('docker-compose');
  });

  let allFindings = [];
  
  for (const file of filesToScan) {
    const findings = scanFile(file);
    allFindings = allFindings.concat(findings);
  }

  if (allFindings.length > 0) {
    console.error('\x1b[41m\x1b[37m%s\x1b[0m', ' ⚠️  HARD BLOCK: SECRETS DETECTED ');
    console.error('\x1b[31m%s\x1b[0m\n', '═'.repeat(60));
    
    allFindings.forEach(({ file, line, match, content }) => {
      console.error(`\x1b[31m📁 ${file}:${line}\x1b[0m`);
      console.error(`   🔑 Pattern: \x1b[33m${match}\x1b[0m`);
      console.error(`   📝 Line: ${content}\n`);
    });

    console.error('\x1b[31m%s\x1b[0m', '═'.repeat(60));
    console.error('\x1b[31m❌ COMMIT BLOCKED\x1b[0m');
    console.error('\x1b[33m💡 Solution:\x1b[0m');
    console.error('   1. Move secrets to .env files');
    console.error('   2. Use environment variables: ${VAR_NAME}');
    console.error('   3. For Docker: ENV VAR=${VAR} (not ENV VAR=value)\n');
    
    process.exit(1);
  }

  console.log('\x1b[32m✅ No secrets detected. Commit allowed.\x1b[0m\n');
  process.exit(0);
}

main();
