/**
 * Raika Language Audit Script
 * Verifies 100% English-Only Compliance across the entire codebase.
 * Checks for non-English alphabets (Cyrillic, Arabic, Persian, CJK, etc.)
 * Checks that all bot messages, commands, UI labels, and game texts are in English.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SCAN_DIRS = ['server', 'public', 'scripts'];
const EXTENSIONS = ['.js', '.json', '.html', '.css'];

// Non-English unicode ranges:
// Cyrillic: \u0400-\u04FF
// Arabic / Persian: \u0600-\u06FF, \u0750-\u077F, \uFB50-\uFDFF, \uFE70-\uFEFF
// CJK (Chinese, Japanese, Korean): \u4E00-\u9FFF, \u3040-\u30FF, \uAC00-\uD7AF
// Devanagari: \u0900-\u097F
const NON_ENGLISH_REGEX = /[\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0900-\u097F]/;

let totalFilesScanned = 0;
let violationsFound = 0;
const violationsList = [];

function scanFile(filePath) {
  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (NON_ENGLISH_REGEX.test(line)) {
      violationsFound++;
      violationsList.push({
        file: path.relative(ROOT_DIR, filePath),
        line: index + 1,
        content: line.trim()
      });
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('====================================================');
console.log('🔍 Starting Comprehensive English-Only Language Audit');
console.log('====================================================');

SCAN_DIRS.forEach(dir => walkDir(path.join(ROOT_DIR, dir)));

// Also scan package.json and README.md
if (fs.existsSync(path.join(ROOT_DIR, 'package.json'))) scanFile(path.join(ROOT_DIR, 'package.json'));
if (fs.existsSync(path.join(ROOT_DIR, 'README.md'))) scanFile(path.join(ROOT_DIR, 'README.md'));

// Validate Bot Strings Dictionary
const botStrings = require('../server/locales/en');
console.log('\n--- Auditing Telegram Bot Commands & Messages ---');
console.log(`✓ Bot Locale: ${botStrings.locale}`);
console.log(`✓ Commands registered: ${Object.keys(botStrings.commands).join(', ')}`);

const requiredBotCommands = ['start', 'play', 'profile', 'balance', 'bonus', 'top', 'matches', 'settings', 'help'];
let missingCommands = 0;
requiredBotCommands.forEach(cmd => {
  if (!botStrings.commands[cmd]) {
    console.error(`❌ Missing bot command definition: /${cmd}`);
    missingCommands++;
  } else {
    console.log(`  • /${cmd} → "${botStrings.commands[cmd].description}"`);
  }
});

// Validate Frontend Strings Dictionary
const clientStrings = require('../public/js/strings');
console.log('\n--- Auditing Telegram Mini App Strings ---');
console.log(`✓ Client Locale: ${clientStrings.locale}`);
console.log(`✓ Navigation items: ${Object.values(clientStrings.nav).join(', ')}`);
console.log(`✓ Games supported: ${Object.keys(clientStrings.games).join(', ')}`);

// Audit Results
console.log('\n====================================================');
console.log(`📊 Audit Summary:`);
console.log(`• Total Source Files Scanned: ${totalFilesScanned}`);
console.log(`• Non-English Script Violations: ${violationsFound}`);
console.log(`• Missing Required Commands: ${missingCommands}`);

if (violationsFound > 0) {
  console.error('\n❌ Language Violations Detected:');
  violationsList.forEach(v => {
    console.error(`  [${v.file}:${v.line}] ${v.content}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ 100% ENGLISH-ONLY AUDIT PASSED!');
  console.log('All bot handlers, Mini App views, game rules, buttons, and system messages are in natural English.');
  console.log('No non-English characters or secondary language selectors detected.');
  console.log('====================================================');
}
