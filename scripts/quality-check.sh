#!/bin/bash

# Script de verificação de qualidade do código
echo "🔍 Executando verificações de qualidade..."

# Type check
echo "📝 Verificando tipos TypeScript..."
pnpm type-check
if [ $? -ne 0 ]; then
    echo "❌ Erro na verificação de tipos"
    exit 1
fi

# Lint
echo "🧹 Executando ESLint..."
pnpm lint
if [ $? -ne 0 ]; then
    echo "❌ Erro no linting"
    exit 1
fi

# Tests
echo "🧪 Executando testes..."
pnpm test
if [ $? -ne 0 ]; then
    echo "❌ Erro nos testes"
    exit 1
fi

# Tests with coverage
echo "📊 Gerando relatório de cobertura..."
pnpm test:coverage
if [ $? -ne 0 ]; then
    echo "❌ Erro na cobertura dos testes"
    exit 1
fi

echo "✅ Todas as verificações passaram!"
echo "📊 Verifique o relatório de cobertura em coverage/"
