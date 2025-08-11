# Catalog Maker Hub

## Visão Geral
Catalog Maker Hub é uma plataforma SaaS para gestão de marketplaces e definição de preços. O projeto utiliza React, TypeScript e Supabase para oferecer um painel moderno e escalável de administração.

## Requisitos
- Node.js 20 ou superior
- pnpm 9 ou superior

## Instalação
1. Clone o repositório: `git clone <URL-do-repositório>`
2. Acesse a pasta do projeto: `cd catalog-maker-hub`
3. Instale as dependências: `pnpm install`
4. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis de ambiente conforme necessário
5. Inicie o ambiente de desenvolvimento: `pnpm dev`

## Variáveis de Ambiente
- `VITE_AUTH_REDIRECT_URL`: URL utilizada pelo Supabase para redirecionar o usuário após o cadastro. Caso não seja definida, o aplicativo utilizará `window.location.origin`.

## Scripts Disponíveis
- `pnpm dev` – inicia o servidor de desenvolvimento
- `pnpm build` – gera o build de produção
- `pnpm build:dev` – gera o build em modo de desenvolvimento
- `pnpm lint` – executa o ESLint nos arquivos `ts/tsx` de `src`, `app`, `components` e `pages`
- `pnpm lint:fix` – corrige automaticamente os problemas reportados pelo ESLint
- `pnpm format` – formata o código com Prettier
- `pnpm test` – executa a suite de testes
- `pnpm test:coverage` – executa os testes com relatório de cobertura
- `pnpm preview` – visualiza o build de produção localmente

## Estilo e Componentes
- Estilos devem ser escritos exclusivamente com **Tailwind CSS**.
- Componentes base devem seguir o catálogo **shadcn/ui**.
- Cores e tipografia usam apenas tokens `brand-*`; CSS legado ou bibliotecas de estilo extras não são permitidos.

## Diretrizes de Contribuição
1. Faça um fork do repositório e crie um branch para a sua feature ou correção.
2. Garanta que o código está formatado e que `pnpm lint` e `pnpm test` executam sem erros.
3. Descreva claramente as alterações no Pull Request.
4. Aguarde revisão e aprovação antes de realizar o merge.

