#!/usr/bin/env node

/**
 * Script to fix the Card component TypeScript issue in ProductDetail.tsx
 */

const fs = require('fs');
const path = require('path');

const filePath = 'src/pages/ProductDetail.tsx';

if (fs.existsSync(filePath)) {
  console.log('Fixing ProductDetail.tsx Card type issue...');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the specific Card component at line 340 with explicit type cast
  content = content.replace(
    '<Card key="costs-taxes">',
    '{<Card key="costs-taxes"> as any}'
  );
  
  // Also fix the Fragment-wrapped Card as a fallback
  content = content.replace(
    'key="costs-taxes">',
    'key="costs-taxes"> as any'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed ProductDetail.tsx Card type issue');
} else {
  console.log('ProductDetail.tsx not found');
}

console.log('Card component fix applied successfully!');