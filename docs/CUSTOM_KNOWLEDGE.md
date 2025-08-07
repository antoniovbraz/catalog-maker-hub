# 📚 Catalog Maker Hub — Knowledge Base

> **Versão 1.0** · Última revisão: 2025‑08‑07

Esta referência rápida consolida arquitetura, padrões de código e regras de negócio do projeto.

---

## 1. Visão Geral

| Item         | Detalhe                                                        |
| ------------ | -------------------------------------------------------------- |
| **Tipo**     | SaaS de gestão de marketplaces e precificação                  |
| **Stack**    | React + TypeScript + Supabase + Tailwind CSS + shadcn/ui       |
| **Objetivo** | Calcular preços/margens e gerenciar vendas em múltiplos canais |

---

## 2. Estrutura de Pastas

```text
src/
├─ components/
│  ├─ ui/            # shadcn/ui (NÃO MODIFICAR)
│  └─ forms/         # Formulários de negócio
├─ hooks/            # React Query hooks
├─ services/         # Supabase CRUD / RPC
├─ lib/              # Utilitários
├─ types/            # Tipos centralizados
├─ constants/        # Constantes de domínio
├─ utils/            # Helpers diversos
└─ pages/            # Rotas da aplicação
```

### Convenções

| Artefato  | Padrão                                           |
| --------- | ------------------------------------------------ |
| Arquivos  | `PascalCase` (componentes) · `camelCase` (utils) |
| Variáveis | `camelCase` em **pt‑BR** (`precoSugerido`)       |
| Tipos TS  | `PascalCase` + sufixo (`ProductType`)            |
| Hooks     | `use` + domínio (`usePricing`)                   |
| Services  | Nome plural (`products.ts`)                      |

---

## 3. Regras de Negócio

### Fórmulas‑chave

```ts
// Preço sugerido
precoSugerido =
  (custoTotal + valorFixo + frete) /
  (1 - (comissao + taxaCartao + provisaoDesconto + margemDesejada) / 100)

// Margem real
margemReal = ((precoVenda - custoTotal - taxas) / precoVenda) * 100
```

### Entidades‑core

`Products · Marketplaces · Categories · Commissions · FixedFeeRules · ShippingRules · Sales · SavedPricing`

### RPCs Supabase

`calcular_preco()` · `calcular_margem_real()`

---

## 4. Padrões de Desenvolvimento

- **TypeScript estrito** (`noImplicitAny`, `strictNullChecks`).
- Forms → **React Hook Form + Zod**.
- Estado remoto → **React Query**; nada de `fetch` direto.
- UI base → **shadcn/ui** (não editar `components/ui`).
- Camada de dados via `services/`.

#### Exemplo Service

```ts
export class ProductsService {
  static async getAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }
}
```

---

## 5. Interface & UX

- **Abas reordenáveis** com `@dnd-kit` (Dashboard → … → Precificação).
- **Responsivo** first – breakpoints `sm / md / lg / xl`.
- Tokens de cor/typografia via tema **Corporate** (`brand.*`).

---

## 6. Supabase

- **RLS** habilitado em tabelas sensíveis.
- Policies por operação.
- Migrations sempre comentadas, com `created_at/updated_at`.
- Edge Functions só para lógica pesada ou integrações externas.

---

## 7. Testes & Qualidade

| Camada         | Cobertura mínima |
| -------------- | ---------------- |
| services & lib | 90 %             |
| hooks          | 70 %             |
| components     | 50 %             |

Ferramentas: **ESLint · Prettier · Vitest · Testing Library**.

---

## 8. Seeds de Desenvolvimento

**Marketplaces**: Meli Clássico, Meli Premium, Shopee, Amazon, Magalu.\
**Categorias demo**: Eletrônicos, Casa & Decoração, Vestuário, Esportes, Livros.

---

## 9. Constraints

- **Performance:** cache, loading states, paginação/debounce.
- **Segurança:** nunca expor segredo; validar no backend; HTTPS.
- **Manutenibilidade:** SOLID, DRY, docs em código.

---

## 10. Roadmap

| Pri       | Itens (próximos)                                               |
| --------- | -------------------------------------------------------------- |
| **Alta**  | Service layer · Hooks otimizados · Centralizar tipos · Tests   |
| **Média** | Dashboard com gráficos · Notificações · Relatórios · Histórico |
| **Baixa** | APIs externas · Multi‑tenant · Automação preços · PWA          |

---

⚠️ **Qualquer erro nas fórmulas de precificação compromete a margem do usuário.** Verifique casos reais antes de deploy.

