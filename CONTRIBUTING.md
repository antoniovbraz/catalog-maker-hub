# Guia de Contribuição para o Catalog Maker Hub

Primeiramente, obrigado por considerar contribuir para o Catalog Maker Hub! É com a ajuda de pessoas como você que podemos construir uma ferramenta cada vez melhor.

Este documento fornece um conjunto de diretrizes para contribuir com o projeto, seja reportando um bug, propondo melhorias, ou enviando um pull request.

## Código de Conduta

Este projeto e todos que participam dele são regidos pelo nosso [Código de Conduta](./CODE_OF_CONDUCT.md). Ao participar, você concorda em seguir seus termos.

## Como Posso Contribuir?

### Reportando Bugs

Se você encontrar um bug, por favor, certifique-se de que ele ainda não foi reportado criando uma [Issue](https://github.com/antoniovbraz/catalog-maker-hub/issues) no GitHub. Ao criar a issue, inclua o máximo de detalhes possível:

*   **Uma descrição clara e concisa** do que é o bug.
*   **Passos para reproduzir** o comportamento.
*   **O que você esperava que acontecesse**.
*   **O que realmente aconteceu** (incluindo screenshots, se aplicável).
*   **Sua configuração**: versão do Node.js, navegador, sistema operacional.

### Sugerindo Melhorias

Se você tem uma ideia para uma nova funcionalidade ou uma melhoria para uma existente, crie uma [Issue](https://github.com/antoniovbraz/catalog-maker-hub/issues) com o template de "Feature Request". Descreva sua sugestão em detalhes, explicando o problema que ela resolve e como ela beneficiaria os usuários.

### Enviando um Pull Request

Estamos sempre abertos a pull requests! Para contribuições de código, por favor, siga estes passos:

1.  **Faça um Fork** do repositório e clone-o localmente.
2.  **Crie uma nova branch** para sua feature ou correção de bug:
    ```bash
    git checkout -b feature/nova-feature-incrivel
    ```
    ou
    ```bash
    git checkout -b fix/correcao-de-bug
    ```
3.  **Faça suas alterações** no código. Certifique-se de seguir as convenções de estilo do projeto.
4.  **Adicione testes** para suas alterações, se aplicável.
5.  **Faça o commit** das suas alterações com uma mensagem clara e descritiva:
    ```bash
    git commit -m "feat: add amazing new feature"
    ```
    Nós seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/). As mensagens de commit devem estar em inglês; a documentação deve ser escrita em português.
    Durante o commit, o [Husky](https://typicode.github.io/husky) executará o `lint-staged` para rodar o ESLint apenas nos arquivos que estiverem **staged**.
6.  **Faça o push** para a sua branch:
    ```bash
    git push origin feature/nova-feature-incrivel
    ```
7.  **Abra um Pull Request** para a branch `main` do repositório original. Preencha o template do PR com os detalhes da sua contribuição.

### Documentação e Variáveis de Ambiente

- Mantenha a documentação alinhada com a hierarquia descrita em [docs/README.md](./docs/README.md).
- Utilize sempre `https://peepers-hub.lovable.app` para URLs de produção.
- Documente novas variáveis de ambiente no arquivo `.env.example` e na documentação relevante.
- Execute `npm test` mesmo para alterações que afetem apenas a documentação.

## Guia de Estilo de Código

*   **TypeScript**: Siga as melhores práticas do TypeScript. Use tipos sempre que possível.
*   **React**: Use hooks e componentes funcionais.
*   **Tailwind CSS**: Siga as convenções do Tailwind.
*   **Prettier**: O projeto está configurado com o Prettier para formatação automática de código. Certifique-se de executá-lo antes de fazer o commit.

Obrigado mais uma vez pelo seu interesse em contribuir!


