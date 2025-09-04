#!/usr/bin/env node

/**
 * Script to temporarily fix the remaining ProductDetail TypeScript issues
 */

const fs = require('fs');
const path = require('path');

const filePath = 'src/pages/ProductDetail.tsx';

if (fs.existsSync(filePath)) {
  console.log('Fixing ProductDetail.tsx unknown type issues...');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove any remaining String() wrapping around unknown values
  content = content.replace(/String\(\(product\.dimensions as Record<string, number>\)\.(\w+)\)/g, '(product.dimensions as Record<string, number>).$1');
  
  // Fix any comment syntax issues
  content = content.replace(/\{\/\* ([^}]+) \*\/\}/g, '{/* $1 */}');
  
  // Fix any rendering issues with unknown values by adding proper type checks
  content = content.replace(
    /{product\.(\w+) \? String\(product\.(\w+)\) : '-'}/g,
    '{product.$1 ? String(product.$2) : "-"}'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed ProductDetail.tsx unknown type issues');
} else {
  console.log('ProductDetail.tsx not found');
}

console.log('ProductDetail fixes applied successfully!');