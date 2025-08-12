# Assistants Service

Camada responsável por integrar a aplicação com a edge function `assistants` no Supabase.

## Operações
- **Criar**: `supabase.functions.invoke('assistants', { body })`
- **Atualizar**: `supabase.functions.invoke('assistants/${id}', { method: 'PUT', body })`
- **Remover**: `supabase.functions.invoke('assistants/${id}', { method: 'DELETE' })`

Todas as operações utilizam o cliente autenticado do Supabase, garantindo que o token do usuário seja enviado automaticamente.

### Exemplos de requisição e resposta

#### Criar
**Corpo da requisição**
```ts
const { data, error } = await supabase.functions.invoke('assistants', {
  body: {
    name: 'Precificador',
    marketplace: 'meli',
    instructions: 'Calcule o preço ideal'
  }
});
```
**Corpo da resposta**
```json
{
  "id": "c0f3e2d4-1234-5678-90ab-1c2d3e4f5g6h",
  "name": "Precificador",
  "marketplace": "meli",
  "instructions": "Calcule o preço ideal",
  "created_at": "2025-01-01T12:00:00Z"
}
```

#### Atualizar
**Corpo da requisição**
```ts
const { data, error } = await supabase.functions.invoke(`assistants/${id}`, {
  method: 'PUT',
  body: {
    name: 'Precificador v2'
  }
});
```
**Corpo da resposta**
```json
{
  "id": "c0f3e2d4-1234-5678-90ab-1c2d3e4f5g6h",
  "name": "Precificador v2",
  "marketplace": "meli",
  "instructions": "Calcule o preço ideal",
  "updated_at": "2025-01-02T08:30:00Z"
}
```

#### Remover
**Corpo da requisição**
```ts
const { data, error } = await supabase.functions.invoke(`assistants/${id}`, {
  method: 'DELETE'
});
```
**Corpo da resposta**
```json
{
  "success": true
}
```

## Códigos de erro e estratégias de retry

| Código | Motivo                           | Retry sugerido                               |
| ------ | --------------------------------- | -------------------------------------------- |
| 400    | Dados inválidos                  | Corrigir a requisição antes de reenviar       |
| 401    | Não autenticado                  | Revalidar sessão e tentar novamente          |
| 404    | Assistente não encontrado        | Verificar ID; não repetir se persistir       |
| 429    | Limite de requisições excedido   | Exponential backoff (1s, 2s, 4s...)          |
| 500    | Erro interno da função           | Retry com backoff; abrir chamado se constante|

## Hooks
Os métodos são expostos via React Query para reaproveitar cache e estados:

- `useAssistants` – lista assistentes.
- `useCreateAssistant` – cria novo assistente.
- `useUpdateAssistant` – atualiza assistente existente.
- `useDeleteAssistant` – remove assistente.
- `useAssistantByMarketplace` – obtém assistente por marketplace.

Esses hooks invalidam a chave `['assistants']` após mutações, mantendo os dados sincronizados.
