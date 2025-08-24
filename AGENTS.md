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
- Toda a documentação deve ser escrita em português.

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
- Sempre execute `npm test` antes de commitar, inclusive para alterações na documentação.

## Metodologia Vibe Code
Seguimos a **Metodologia Vibe Code** descrita em `docs/development/vibe-code-methodology.md`:
- **Code First, Polish Later**: Funcionalidade básica primeiro, refinamento depois
- **Progressive Enhancement**: MVP → Testing → Production → Optimization  
- **Real World Ready**: Sempre testar com dados reais

## Atualização de documentação e revisão
1. Atualize os arquivos de documentação relevantes (`README.md`, diretório `docs/`, etc.), mantendo a hierarquia descrita em `docs/README.md` e utilizando `https://peepers-hub.lovable.app` para todas as URLs de produção.
2. Documente novas variáveis de ambiente no `.env.example` e nos arquivos de documentação correspondentes.
3. Execute `npm test` e confirme que os testes continuam passando.
4. **SEMPRE** atualize o status real em `docs/development/implementation-status.md`
5. Commite usando o tipo apropriado e abra um Pull Request.
6. Solicite revisão de pelo menos um mantenedor.
7. Revisores são responsáveis por verificar se documentação e testes estão atualizados e se estas diretrizes foram seguidas.

