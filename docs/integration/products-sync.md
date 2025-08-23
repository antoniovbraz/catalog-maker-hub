# Sincronização de Produtos

A sincronização permite gerenciar anúncios do Mercado Livre diretamente no Catalog Maker Hub.

## Mapeamento de Dados

| Campo no Catalog Maker Hub | Atributo no Mercado Livre |
| -------------------------- | ------------------------ |
| `Título do Produto` | `title` |
| `Descrição` | `description` |
| `Preço de Venda` | `price` |
| `Categoria` | `category_id` |
| `Imagens` | `pictures` |
| `Atributos Personalizados` | `attributes` |
| `Condição` | `condition` |
| `Tipo de Anúncio` | `listing_type_id` |
| `Estoque Disponível` | `available_quantity` |

## Fluxo de Criação e Atualização

1. **Criação**: um novo anúncio é criado no Mercado Livre e o `ml_item_id` é armazenado.
2. **Atualização**: alterações no Catalog Maker Hub são refletidas no anúncio correspondente.
3. **Vinculação**: anúncios existentes podem ser associados a produtos pelo SKU ou identificadores únicos.

