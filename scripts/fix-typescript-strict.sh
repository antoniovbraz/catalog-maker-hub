#!/bin/bash

# Script para implementar correções TypeScript críticas
# Parte do PR-A da auditoria técnica

echo "🔧 Implementando correções TypeScript críticas..."

# 1. Configurar TypeScript strict mode
echo "📝 Configurando TypeScript strict mode..."
cat > tsconfig.json << 'EOF'
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
EOF

# 2. Atualizar tsconfig.app.json
echo "📝 Atualizando tsconfig.app.json..."
cat > tsconfig.app.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx"
  ]
}
EOF

# 3. Criar script de validação TypeScript
echo "📝 Criando scripts de validação..."
cat > scripts/validate-types.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Validando tipos TypeScript...');

try {
  // Executar typecheck
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  
  // Verificar uso de any
  const anyUsageCheck = execSync('grep -r "any" src/ --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l').toString().trim();
  
  if (parseInt(anyUsageCheck) > 5) {
    console.error(`❌ Muitos usos de 'any' encontrados: ${anyUsageCheck}`);
    process.exit(1);
  }
  
  console.log('✅ Validação TypeScript passou!');
  console.log(`📊 Usos de 'any': ${anyUsageCheck}`);
  
} catch (error) {
  console.error('❌ Falha na validação TypeScript');
  process.exit(1);
}
EOF

chmod +x scripts/validate-types.js

# 4. Atualizar package.json scripts
echo "📝 Atualizando scripts do package.json..."
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint . --max-warnings=0"
npm pkg set scripts.test:ci="vitest run --coverage"
npm pkg set scripts.validate="./scripts/validate-types.js"
npm pkg set scripts.analyze:bundle="vite build && npx source-map-explorer 'dist/assets/*.js'"
npm pkg set scripts.dep:audit="npx depcheck && npm audit --audit-level=high"

# 5. Configurar ESLint mais rigoroso
echo "📝 Configurando ESLint rigoroso..."
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  plugins: ['react-refresh'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-any': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
EOF

# 6. Executar validação
echo "🧪 Executando validação inicial..."
npm run typecheck

echo "✅ Configuração TypeScript strict implementada!"
echo "📋 Próximos passos:"
echo "   1. Corrigir erros de tipagem restantes"
echo "   2. Implementar testes unitários"
echo "   3. Configurar CI/CD quality gates"