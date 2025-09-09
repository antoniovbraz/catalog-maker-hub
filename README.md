# Catalog Maker Hub - Agora com Integração ao Mercado Livre

![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

![Catalog Maker Hub](https://raw.githubusercontent.com/antoniovbraz/catalog-maker-hub/main/public/logo.png)

**Catalog Maker Hub** é uma aplicação de código aberto projetada para centralizar e simplificar a gestão de catálogos de produtos em múltiplos marketplaces. Esta versão introduz uma poderosa integração nativa com a **API do Mercado Livre**, permitindo que você gerencie seus anúncios, vendas e estoque de forma automatizada e eficiente.

O desenvolvimento desta integração foi acelerado utilizando uma metodologia de **Vibe Coding**, com prototipagem em **Lovable.dev** e refinamento de produção com **Codex Cloud da OpenAI**.

---

## ✨ Funcionalidades Principais

*   **Gestão Centralizada de Catálogo**: Crie, edite e gerencie seus produtos em um único lugar.
*   **Framework Baseado em Componentes**: Construído com React, TypeScript e Vite para uma experiência de desenvolvimento moderna.
*   **Backend Serverless com Supabase**: Utiliza a robustez do PostgreSQL e a escalabilidade das Edge Functions.
*   **UI Moderna e Responsiva**: Interface limpa e intuitiva construída com Tailwind CSS e Shadcn/ui.

### 🚀 Novo: Integração com Mercado Livre

*   **Autenticação Segura OAuth 2.0**: Conecte sua conta do Mercado Livre com segurança.
*   **Sincronização Bidirecional de Produtos**: Crie e atualize anúncios no Mercado Livre diretamente do Catalog Maker Hub. Vincule anúncios existentes para evitar duplicatas.
*   **Gestão de Vendas em Tempo Real**: Receba notificações de vendas via webhooks e visualize todos os seus pedidos em um único painel.
*   **Sincronização Automática de Estoque**: Mantenha o estoque consistente entre o Catalog Maker Hub e o Mercado Livre para evitar overselling.
*   **Dashboard de Integração**: Monitore o status da sua conexão, logs de sincronização e muito mais.

### Fluxos de Sincronização

*   **Enviar ao Mercado Livre**: envie produtos cadastrados no Catalog Maker Hub para criar ou atualizar anúncios no ML. Disponível individualmente pelo botão "Enviar ao Mercado Livre" ou em lote selecionando vários produtos.
*   **Importar do ML**: traga dados de anúncios existentes no Mercado Livre para o Catalog Maker Hub quando um produto ainda não possui `ml_item_id`.

---

## 🚀 Começando

Siga estas instruções para obter uma cópia do projeto e executá-lo em sua máquina local para fins de desenvolvimento e teste.

### Pré-requisitos

*   Node.js (versão 18 ou superior)
*   npm
*   Uma conta no [Supabase](https://supabase.com/) para o backend.
*   Uma conta de desenvolvedor no [Mercado Livre](https://developers.mercadolivre.com.br/) para criar sua aplicação de integração.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/antoniovbraz/catalog-maker-hub.git
    cd catalog-maker-hub
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto, copiando o `.env.example`. Preencha com suas chaves do Supabase e credenciais do Mercado Livre:
    ```
    VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
    VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
    VITE_ML_CLIENT_ID=<seu-client-id-ml>

    MELI_CLIENT_ID=<seu-client-id-ml>
    MELI_CLIENT_SECRET=<seu-client-secret>
    MELI_REDIRECT_URI=http://localhost:54321/api/ml/callback
    MELI_WEBHOOK_SECRET=<seu-webhook-secret>
    ```

4.  **Execute a aplicação:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173`.

### Qualidade de Código

Execute as verificações de lint para manter o código padronizado:

```bash
npm run lint       # verifica problemas
npm run lint:fix   # corrige automaticamente
```

---

## ⚙️ Configurando a Integração com o Mercado Livre

Para ativar a integração, siga os passos detalhados em nossa documentação completa:

➡️ **[Documentação da Integração com o Mercado Livre](./docs/integration/overview.md)**

O guia inclui instruções sobre:

*   Como criar e configurar sua aplicação no DevCenter do Mercado Livre.
*   Como obter seu `Client ID` e `Client Secret`.
*   Como configurar as URLs de redirecionamento e webhooks.
*   Como ativar e autenticar a integração no painel do Catalog Maker Hub.

---

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn/ui
*   **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
*   **Metodologia de Desenvolvimento**: Vibe Coding (Lovable.dev + OpenAI Codex Cloud)

---

## 🤝 Contribuindo

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

Por favor, leia nosso **[Guia de Contribuição](./CONTRIBUTING.md)** para mais detalhes sobre nosso código de conduta e o processo para submeter pull requests.

---

## 📄 Licença

Distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.
