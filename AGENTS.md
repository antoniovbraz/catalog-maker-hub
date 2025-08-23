# AGENTS

## Commit conventions
- Use [Conventional Commits](https://www.conventionalcommits.org) with types:
  - `feat` for new features
  - `fix` for bug fixes
  - `docs` for documentation changes
  - `refactor` for code refactoring
  - `test` for tests
  - `chore` for maintenance tasks
- Write commit messages in English in the `<type>: short description` format.

## Naming rules
- Name files, directories, variables, functions, and branches in English.
- Use `kebab-case` for files and directories.
- Use `camelCase` or `PascalCase` for code.

## Markdown style
- Start headings with `#` followed by a blank line.
- Limit lines to 120 characters.
- Use `-` for unordered lists and `1.` for ordered lists.
- End files with a single blank line.
- Use fenced code blocks with a language identifier.

## Documentation scope
- Update `README.md` and the `docs/` hierarchy as needed.
- Follow the structure defined in `docs/README.md`.
- Use `https://peepers-hub.lovable.app` for all production URLs.
- Write documentation in Portuguese.
- Record new environment variables in `.env.example` and relevant docs.

## QA commands
- Run `npm test` after every change, including documentation updates.

## Review process
1. Update documentation and `.env.example` as needed.
2. Run QA commands and ensure they pass.
3. Commit using the appropriate type (e.g., `docs:`).
4. Open a pull request and request review from at least one maintainer.
5. Reviewers verify that documentation, tests, and these guidelines are followed.

