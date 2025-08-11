# Assistants Service

Camada responsável por integrar a aplicação com a edge function `assistants` no Supabase.

## Operações
- **Criar**: `supabase.functions.invoke('assistants', { body })`
- **Atualizar**: `supabase.functions.invoke('assistants/${id}', { method: 'PUT', body })`
- **Remover**: `supabase.functions.invoke('assistants/${id}', { method: 'DELETE' })`

Todas as operações utilizam o cliente autenticado do Supabase, garantindo que o token do usuário seja enviado automaticamente.

## Hooks
Os métodos são expostos via React Query para reaproveitar cache e estados:

- `useAssistants` – lista assistentes.
- `useCreateAssistant` – cria novo assistente.
- `useUpdateAssistant` – atualiza assistente existente.
- `useDeleteAssistant` – remove assistente.
- `useAssistantByMarketplace` – obtém assistente por marketplace.

Esses hooks invalidam a chave `['assistants']` após mutações, mantendo os dados sincronizados.
