# 🤖 AGENTS.md – Guia para Agentes OpenAI Codex

> **Propósito:** Este arquivo define, de forma concisa, **como um agente Codex deve operar dentro do repositório *****Catalog Maker Hub***. Ele mistura as boas‑práticas sugeridas pela OpenAI no anúncio do Codex com as regras específicas do projeto.

---

## 1. Contexto mínimo a carregar

Antes de executar qualquer tarefa, carregue estes arquivos:

1. `CUSTOM_KNOWLEDGE.md` – arquitetura, regras de negócio e convenções.
2. `docs/DESIGN_SYSTEM.md` – tokens de tema (Corporate) e padrões de UI.
3. `docs/continuous-improvement.md` – protocolo de reflexão/registro de aprendizado.

Se um desses arquivos mudar, refaça o parsing para manter o contexto atualizado.

---

## 2. Objetivos de alto nível (OpenAI Codex)

- **Ajude, não atrapalhe:** gere código que compile, teste e siga as regras.
- **Mantenha contexto:** use as instruções acima como memória curta; pergunte quando faltarem detalhes.
- **Seja incremental:** prefira PRs pequenos e atômicos.
- **Explique‑se:** cada trecho de código não‑trivial precisa de comentário sucinto (ou link para docs).
- **Aprenda:** registre reflexões no protocolo "Continuous Improvement" ao fechar a tarefa.

---

## 3. Comportamento esperado

| Situação                         | Ação do agente                                             |
| -------------------------------- | ---------------------------------------------------------- |
| Nova feature                     | criar branch `feat/<slug>`; abrir PR com descrição humana. |
| Bug fix                          | branch `fix/<slug>`; PR com causa‑raiz.                    |
| Dúvida / requisito ambíguo       | emitir pergunta no PR em vez de assumir.                   |
| Falha de testes ou lint          | corrigir antes de pedir merge.                             |
| Fórmula de precificação alterada | incluir teste unitário cobrindo casos extremos.            |

---

## 4. Padrões de código (resumo)

- **TypeScript estrito** – `noImplicitAny`, `strictNullChecks` habilitados.
- **React Hook Form + Zod** em todo formulário.
- **React Query** para dados remotos; nunca `fetch` direto.
- **Estilos** → apenas Tailwind CSS + shadcn/ui; cores e tipografia via tokens `brand-*` (tema Corporate); sem CSS legado.
- **Commits**: *conventional* em **português** (`feat:`, `fix:` …).

---

## 5. Pipeline de verificação rápida

1. `pnpm lint && pnpm type-check` – sem erros.
2. `pnpm test --run` – cobertura ≥ metas por camada.
3. `rg '#[0-9a-fA-F]{3,6}' -g '!node_modules'` – não deve haver cores hex fora dos tokens `brand-*`.
4. `pnpm dev` – UI carrega em tema Corporate sem erros de console.
5. Mobile (375 px), Desktop (1280 px) – layout íntegro.
6. `raw_reflection_log.md` atualizado com aprendizados.

---

## 6. Estrutura de diretórios – lembrete rápido

```
src/components/ui      # NÃO editar – shadcn original
src/services           # Acesso Supabase (CRUD / RPC)
src/hooks              # React Query hooks
memory-bank/           # Logs de reflexão (raw + consolidado)
```

Qualquer novo diretório deve ser documentado no PR.

---

## 7. Checklist automático antes de PR

- `rg '#[0-9a-fA-F]{3,6}' -g '!node_modules'` – confirmar ausência de cores fora dos tokens `brand-*`.

> **Falha em qualquer item bloqueia merge.**

---

© Catalog Maker Hub • adaptado das recomendações OpenAI Codex.

