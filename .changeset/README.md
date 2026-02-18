# Changesets

Este diretório contém arquivos de changeset gerados automaticamente pelo workflow `auto-changeset.yml`.

## Como funciona

1. Ao abrir um PR com título no formato conventional commits (ex: `feat: add new feature`), o workflow `auto-changeset.yml` gera automaticamente um arquivo de changeset neste diretório
2. Quando o PR é merged na main, o workflow `release.yml` detecta os changesets pendentes e cria um PR de versão
3. O PR de versão é automaticamente merged quando o CI passa (via auto-merge)
4. Após o merge do PR de versão, o workflow `release.yml` cria uma GitHub Release com o changelog

## Tipos de changeset

- `feat` → minor bump (0.x.0 → 0.(x+1).0)
- `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`, `build` → patch bump (0.x.y → 0.x.(y+1))

## Versionamento

Todos os packages do monorepo compartilham uma única versão (fixed versioning via `fixed: [["*"]]` no `.changeset/config.json`).
