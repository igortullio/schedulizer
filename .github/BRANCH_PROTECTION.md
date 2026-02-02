# Configuração de Branch Protection

## Resumo

Este documento detalha as regras de proteção de branch configuradas para o repositório `igortullio/schedulizer`.

## Branch Protegida: `main`

### Status Checks Obrigatórios

**Require status checks to pass before merging**: ✅ Habilitado

**Require branches to be up to date before merging**: ✅ Habilitado (`strict: true`)

**Status checks obrigatórios**:
- `lint` - Validação de código com Biome
- `test` - Execução de testes unitários com Vitest
- `build` - Build de produção para apps/web e apps/api

> Todos os checks são provenientes do workflow CI (`.github/workflows/ci.yml`)

### Restrições de Branch

- **Allow force pushes**: ❌ Desabilitado
- **Allow deletions**: ❌ Desabilitado
- **Require linear history**: ❌ Desabilitado
- **Lock branch**: ❌ Desabilitado

### Aplicação de Regras

- **Do not allow bypassing the above settings**: ✅ Habilitado (`enforce_admins: true`)
  - Administradores também devem seguir as regras de proteção

### Pull Request Reviews

- **Require pull request reviews before merging**: ❌ Desabilitado (`required_pull_request_reviews: null`)
  - Opcionalmente pode ser habilitado futuramente conforme crescimento da equipe

## Comando de Configuração

A configuração foi aplicada via GitHub CLI usando:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/igortullio/schedulizer/branches/main/protection \
  --input branch-protection.json
```

## Validação

Para validar as regras de proteção:

1. Criar PR com erro de lint → merge deve ser bloqueado
2. Criar PR com teste falhando → merge deve ser bloqueado
3. Criar PR com erro de build → merge deve ser bloqueado
4. Criar PR válido → merge deve ser permitido após todos os checks passarem
5. Tentar force push para main → deve ser rejeitado
6. Verificar que branch está atualizada antes do merge

## Referências

- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [Workflow CI](.github/workflows/ci.yml)
- [Workflow CD](.github/workflows/cd.yml)

## Data de Aplicação

Configurado em: 2026-02-02
