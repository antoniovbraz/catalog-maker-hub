# Catalog Maker Hub

## Visão Geral
Catalog Maker Hub é uma plataforma SaaS para gestão de marketplaces e definição de preços. O projeto utiliza React, TypeScript e Supabase para oferecer um painel moderno e escalável de administração.

## Requisitos
- Node.js 20 ou superior
- npm 10 ou superior

## Instalação
1. Clone o repositório: `git clone <URL-do-repositório>`
2. Acesse a pasta do projeto: `cd catalog-maker-hub`
3. Instale as dependências: `npm install`
4. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis de ambiente conforme necessário
5. Inicie o ambiente de desenvolvimento: `npm run dev`

## Variáveis de Ambiente
- `VITE_AUTH_REDIRECT_URL`: URL utilizada pelo Supabase para redirecionar o usuário após o cadastro. Caso não seja definida, o aplicativo utilizará `window.location.origin`.

## Scripts Disponíveis
- `npm run dev` – inicia o servidor de desenvolvimento
- `npm run build` – gera o build de produção
- `npm run build:dev` – gera o build em modo de desenvolvimento
- `npm run lint` – executa a verificação de lint
- `npm test` – executa a suite de testes
- `npm run test:coverage` – executa os testes com relatório de cobertura
- `npm run test:e2e` – executa testes end-to-end de overflow horizontal
- `npm run preview` – visualiza o build de produção localmente

## Diretrizes de Contribuição
1. Faça um fork do repositório e crie um branch para a sua feature ou correção.
2. Garanta que o código está formatado e que `npm run lint` e `npm test` executam sem erros.
3. Descreva claramente as alterações no Pull Request.
4. Aguarde revisão e aprovação antes de realizar o merge.

