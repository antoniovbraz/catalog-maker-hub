# Autenticação

A integração utiliza OAuth 2.0 para garantir acesso seguro à conta do Mercado Livre.

## Visão Geral do Fluxo OAuth 2.0

1. Usuário clica em "Conectar com Mercado Livre".
2. Catalog Maker Hub redireciona para a tela de autorização do Mercado Livre.
3. Usuário autoriza o acesso.
4. Mercado Livre retorna um código de autorização.
5. O sistema troca o código pelos tokens de acesso e renovação.
6. Tokens são armazenados de forma criptografada.

## Gerenciamento de Tokens

- **Access Token**: válido por cerca de 6 horas e enviado em cada chamada à API.
- **Refresh Token**: usado para renovar o access token automaticamente.
- Tokens são armazenados na tabela `ml_auth_tokens` e renovados quando necessário.
- Se o refresh token for invalidado, a integração é desativada e o usuário deve autenticar novamente.

