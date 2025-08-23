# Documentação da API do Mercado Livre - Análise Completa

## Resumo Executivo
A API do Mercado Livre permite integração completa com a plataforma para gestão de anúncios, pedidos, pagamentos e notificações via webhooks.

## Processo de Criação de Aplicação

### Pré-requisitos
- Conta do Mercado Livre (preferencialmente pessoa jurídica)
- Acesso ao DevCenter
- URLs de redirecionamento com protocolo HTTPS

### Passos para Criação
1. **Acesso ao DevCenter**: Fazer login e acessar "Minhas aplicações"
2. **Preenchimento de Dados Obrigatórios**:
   - Nome da aplicação (deve ser único)
   - Nome curto (para geração de URL)
   - Descrição (até 150 caracteres)
   - Logo da empresa
   - URLs de redirecionamento (protocolo HTTPS obrigatório)

### Limitações por País
- Argentina, México, Brasil e Chile: apenas 1 aplicação por conta
- Necessária validação dos dados do titular da conta

## Configurações de Segurança

### PKCE (Proof Key for Code Exchange)
- Validação adicional para gerar tokens
- Previne ataques de injeção de código e CSRF
- Uso opcional, mas recomendado

### Device Grant
- Fluxo para aplicativos que acessam recursos próprios
- Não requer interação do usuário final
- Chamadas recorrentes até finalização da permissão

## Escopos de Permissão

### Tipos de Escopo
1. **Leitura**: Permite métodos GET HTTPS
2. **Escrita**: Permite métodos PUT, POST e DELETE HTTPS

### Aplicações por Tipo
1. **Somente Leitura**: Usuários anônimos ou autenticados consultam dados
2. **Leitura e Escrita**: Gestão completa de recursos
3. **Aplicações Completas**: Acesso total às funcionalidades

## Tópicos de Notificação (Webhooks)

### Principais Tópicos Disponíveis
- **Orders**: Notificações de pedidos
- **Messages**: Mensagens entre usuários
- **Items**: Alterações em anúncios
- **Catalog**: Mudanças no catálogo
- **Shipments**: Atualizações de envio
- **Promotions**: Promoções e ofertas

### Configuração de Webhooks
- Campo obrigatório: "URL de retorno de notificações"
- URL deve ser válida e configurada para receber notificações
- Mercado Livre faz solicitações POST para a URL configurada

## Principais Endpoints da API

### Autenticação
- `/oauth/token`: Geração de tokens de acesso

### Usuários
- `/users/{user_id}`: Informações do usuário

### Anúncios (Items)
- `/items`: CRUD de anúncios
- `/items/{item_id}`: Detalhes específicos
- `/items/{item_id}/description`: Gestão de descrições
- `/categories/{category_id}/attributes`: Atributos por categoria

### Pedidos (Orders)
- `/orders/{order_id}`: Detalhes do pedido
- `/users/{user_id}/orders/search`: Busca de pedidos

### Pagamentos
- `/mercadopago/payments`: Gestão de pagamentos

### Envios
- `/shipments`: Gestão de envios

### Busca
- `/sites/{site_id}/search`: Busca de produtos com filtros

## Fluxo de Autenticação OAuth

### Tokens
- **Access Token**: Usado para chamadas à API (expira em 6 horas)
- **Refresh Token**: Renovação de access tokens
- **Client ID** e **Client Secret**: Credenciais da aplicação

### Processo
1. Redirecionamento para autorização
2. Recebimento do código de autorização
3. Troca do código por tokens
4. Uso do access token nas chamadas
5. Renovação via refresh token

## Gestão de Client Secret

### Opções de Renovação
1. **Renovar Agora**: Renovação imediata
2. **Programar Renovação**: Agendamento até 7 dias
3. **Cancelar Renovação**: Cancelamento de renovação programada

### Considerações de Segurança
- Client Secret deve ser mantido em segredo
- Renovação programada permite preparação dos ambientes
- Período de transição com 2 secrets válidos

## Boas Práticas Identificadas

### Desenvolvimento
- Usar ngrok para testes locais de webhooks
- Marcar todos os escopos inicialmente para acesso amplo
- Implementar renovação automática de tokens

### Segurança
- Usar HTTPS obrigatoriamente
- Implementar validação de webhooks
- Manter Client Secret seguro
- Renovar credenciais periodicamente

### Integração
- Implementar tratamento de erros robusto
- Usar refresh tokens para manter autenticação
- Configurar webhooks para automação
- Validar dados recebidos via webhooks

## Limitações e Considerações

### Técnicas
- Access tokens expiram em 6 horas
- Limite de 1 aplicação em alguns países
- HTTPS obrigatório para URLs de redirecionamento

### Funcionais
- Dependência de conta pessoa jurídica recomendada
- Validação de dados do titular necessária
- Configuração adequada de webhooks essencial

