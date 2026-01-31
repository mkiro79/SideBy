// Script to detect hardcoded secrets in staged files
const fs = require('node:fs');

const files = process.argv.slice(2);
const secretPatterns = [
  { pattern: /password\s*[=:]\s*["'][^"'\n]+["']/gi, name: 'password assignment' },
  { pattern: /password\s*=\s*[^\s,;)}\n]+/gi, name: 'password value' },
  { pattern: /SECRET\s*[=:]\s*["'][^"'\n]+["']/gi, name: 'SECRET constant' },
  { pattern: /API_KEY\s*[=:]\s*["'][^"'\n]+["']/gi, name: 'API_KEY constant' },
  { pattern: /TOKEN\s*[=:]\s*["'][^"'\n]+["']/gi, name: 'TOKEN constant' },
  { pattern: /PRIVATE_KEY\s*[=:]\s*["'][^"'\n]+["']/gi, name: 'PRIVATE_KEY constant' },
  { pattern: /mongodb:\/\/[^@\s]*:[^@\s"']+@/gi, name: 'MongoDB connection string with credentials' },
  { pattern: /postgres:\/\/[^@\s]*:[^@\s"']+@/gi, name: 'PostgreSQL connection string with credentials' },
  { pattern: /mysql:\/\/[^@\s]*:[^@\s"']+@/gi, name: 'MySQL connection string with credentials' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]{20,}={0,2}/gi, name: 'Bearer token' },
  { pattern: /ghp_[A-Za-z0-9]{36}/gi, name: 'GitHub Personal Access Token' },
  { pattern: /sk_live_[0-9a-zA-Z]{24}/gi, name: 'Stripe Live Secret Key' },
];

let foundSecrets = false;

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Try to detect UTF-16 LE and convert
    if (content.includes('\u0000')) {
      // Re-read as UTF-16 LE
      const buffer = fs.readFileSync(file);
      content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
    }
    
    // Skip .env.example files, test files, and the check-secrets.js script itself
    if (file.includes('.env.example') || 
        file.includes('__tests__') || 
        file.includes('.test.') || 
        file.includes('.spec.') ||
        file.includes('check-secrets.js')) {
      return;
    }
    
    secretPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`\n⛔ SECURITY ALERT in ${file}:`);
        console.error(`   Type: ${name}`);
        console.error(`   Found: ${matches.join(', ')}`);
        foundSecrets = true;
      }
    });
  } catch (err) {
    // File doesn't exist or can't be read (might be deleted)
  }
});

if (foundSecrets) {
  console.error('\n❌ COMMIT BLOCKED: Hardcoded secrets detected!');
  console.error('👉 Use environment variables instead (process.env.VAR_NAME)');
  console.error('👉 Make sure sensitive data is in .env files (listed in .gitignore)');
  process.exit(1);
}

console.log('✅ No hardcoded secrets detected');
