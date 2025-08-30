# Configuração do Ambiente

## Instalação

1. Certifique-se de ter o Node.js 18 ou superior instalado.
2. Instale as dependências com npm:

```bash
npm install
```

## Execução

Inicie o servidor de desenvolvimento com:

```bash
npm run dev
```

## Supabase CLI

1. Instale a CLI:

   ```bash
   npm install -g supabase
   ```

2. Inicie os serviços locais:

   ```bash
   supabase start
   ```

3. Aplique as migrações existentes:

   ```bash
   supabase db reset
   ```

4. Configure os secrets necessários:

   ```bash
   cp supabase/.env.example supabase/.env
   supabase secrets set --env-file supabase/.env
   ```

5. Valide o schema com o documento [database-schema.md](database-schema.md).

## Verificações de Qualidade

Execute todas as verificações antes de abrir um pull request:

```bash
npm run lint
npm run lint:fix
npm run type-check
npm test
npm run test:coverage
```

## Referências de Documentação

- Escreva a documentação em português.
- Utilize o estilo descrito em [docs/README.md](../README.md).
- Prefira links relativos e use `https://peepers-hub.lovable.app` para URLs de produção.

