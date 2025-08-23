# AGENTS

## Convenções de commit
- Utilize [Conventional Commits](https://www.conventionalcommits.org) com os tipos:
  - `feat` para novas funcionalidades
  - `fix` para correções de bugs
  - `docs` para alterações na documentação
  - `refactor` para refatorações
  - `test` para testes
  - `chore` para tarefas de manutenção
- As mensagens devem ser escritas em inglês no formato `<type>: short description`.

## Padrão de nomenclatura
- Todos os nomes de arquivos, diretórios, variáveis, funções e branches devem estar em inglês.
- Use `kebab-case` para arquivos e diretórios e `camelCase` ou `PascalCase` para o código, seguindo as convenções do projeto.

## Formatação de Markdown
- Utilize títulos com `#` seguidos por uma linha em branco.
- Limite cada linha a, no máximo, 120 caracteres.
- Prefira listas não ordenadas com `-` e numeradas com `1.`.
- Finalize cada arquivo com uma única linha em branco.
- Use blocos de código cercados por crases com o identificador de linguagem.

## Testes
- Qualquer alteração de código deve atualizar ou criar testes correspondentes.
- Sempre execute `npm test` antes de commitar para garantir que todos os testes passam.

## Atualização de documentação e revisão
1. Atualize os arquivos de documentação relevantes (`README.md`, diretório `docs/`, etc.).
2. Execute `npm test` e confirme que os testes continuam passando.
3. Commite usando o tipo `docs:` e abra um Pull Request.
4. Solicite revisão de pelo menos um mantenedor.
5. Revisores são responsáveis por verificar se documentação e testes estão atualizados e se estas diretrizes foram seguidas.

