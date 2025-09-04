#!/usr/bin/env node

/**
 * Script para corrigir temporariamente os erros de tipagem do logger
 * até que todas as migrações sejam concluídas
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/services/commissions.ts',
  'src/services/pricing.ts',
];

function fixLoggerCalls(content) {
  // Fix logger.error calls with string parameters
  content = content.replace(
    /logger\.error\('([^']+)', '([^']+)', ([^)]+)\)/g,
    "logger.error('$1', new Error(String($3)), { source: '$2' })"
  );
  
  content = content.replace(
    /logger\.error\('([^']+)', '([^']+)'\)/g,
    "logger.error('$1', new Error('$2'))"
  );
  
  // Fix logger.info calls with string parameters  
  content = content.replace(
    /logger\.info\('([^']+)', '([^']+)', ([^)]+)\)/g,
    "logger.info('$1', { source: '$2', ...$3 })"
  );
  
  content = content.replace(
    /logger\.info\('([^']+)', '([^']+)'\)/g,
    "logger.info('$1', { source: '$2' })"
  );
  
  return content;
}

// Apply fixes to each file
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Fixing logger calls in ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixLoggerCalls(content);
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✓ Fixed ${filePath}`);
  }
});

console.log('Logger type fixes applied successfully!');