# CI/CD Pipeline - Schedulizer

## Visão Geral

O Schedulizer utiliza GitHub Actions para automatizar processos de integração contínua (CI) e deploy contínuo (CD). Este documento descreve a configuração completa do pipeline, incluindo secrets necessários, variáveis de ambiente e instruções de configuração.

## Diferença entre CI e CD

### CI - Continuous Integration (`ci.yml`)
- **Quando executa**: Em todos os Pull Requests para qualquer branch
- **Objetivo**: Validar código antes do merge (lint, test, build)
- **Otimização**: Usa `nx affected` para processar apenas projetos alterados
- **Secrets necessários**: Nenhum (usa apenas código)

### CD - Continuous Deployment (`cd.yml`)
- **Quando executa**: Apenas no branch `main` após merge
- **Objetivo**: Build de produção e geração de artefatos para deploy
- **Scope**: Builda todos os apps com `nx run-many -t build --all`
- **Secrets necessários**: `VITE_API_URL` (obrigatório para build do frontend)

## Secrets e Variáveis de Ambiente

### Secrets do GitHub Actions

Os seguintes secrets devem ser configurados no repositório GitHub para que os workflows funcionem corretamente:

#### Secrets Obrigatórios

| Secret | Usado em | Propósito | Exemplo |
|--------|----------|-----------|---------|
| `VITE_API_URL` | CD (main branch) | URL da API para o frontend em produção. Injeta a URL da API no build do Vite para que o app React saiba onde fazer requests HTTP. | `https://api.schedulizer.com` |

#### Secrets Opcionais

| Secret | Usado em | Propósito | Exemplo |
|--------|----------|-----------|---------|
| `VITE_TURNSTILE_SITE_KEY` | CD (main branch) | Cloudflare Turnstile site key para captcha. Se não configurado, o sistema funciona sem captcha. | `0x4AAAAAAxxxx` |

### Variáveis de Ambiente do Projeto

As variáveis de ambiente do projeto são validadas usando Zod schemas. Abaixo está a lista completa baseada em `.env.example` e nos schemas de validação:

#### Variáveis do Cliente (Frontend)
Definidas em `/libs/shared/env/src/client.ts`. **Todas devem ter prefixo `VITE_`** para serem expostas ao browser.

| Variável | Obrigatória | Propósito | Validação |
|----------|-------------|-----------|-----------|
| `VITE_API_URL` | ✅ Sim | URL base da API backend | Deve ser URL válida |
| `VITE_TURNSTILE_SITE_KEY` | ❌ Não | Chave pública do Cloudflare Turnstile para captcha | String opcional |

#### Variáveis do Servidor (Backend)
Definidas em `/libs/shared/env/src/server.ts`. **Não devem ter prefixo `VITE_`**.

| Variável | Obrigatória | Propósito | Validação |
|----------|-------------|-----------|-----------|
| `DATABASE_URL` | ✅ Sim | Connection string PostgreSQL | String obrigatória |
| `SERVER_PORT` | ❌ Não | Porta do servidor Express | Número (default: 3000) |
| `BETTER_AUTH_SECRET` | ✅ Sim | Secret para assinatura de tokens | Mínimo 32 caracteres |
| `BETTER_AUTH_URL` | ✅ Sim | URL base da aplicação para auth | String obrigatória |
| `RESEND_API_KEY` | ✅ Sim | API key do Resend para envio de emails | String obrigatória |
| `TURNSTILE_SECRET_KEY` | ❌ Não | Chave secreta do Cloudflare Turnstile para captcha | String opcional |

## Configuração Passo a Passo

### 1. Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Para cada secret obrigatório:
   - **Name**: Nome exato do secret (ex: `VITE_API_URL`)
   - **Secret**: Valor do secret (ex: `https://api.schedulizer.com`)
   - Clique em **Add secret**

### 2. Configurar Environment Local

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Preencha todas as variáveis obrigatórias no arquivo `.env`:
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/schedulizer"

   # Server
   SERVER_PORT=3000

   # Authentication
   BETTER_AUTH_SECRET="your-32-character-minimum-secret-here"
   BETTER_AUTH_URL="http://localhost:5173"

   # Email
   RESEND_API_KEY="re_xxxxxxxxxxxxx"

   # Captcha (opcional)
   TURNSTILE_SECRET_KEY="0x4AAAA..."

   # Frontend
   VITE_API_URL="http://localhost:3000"
   VITE_TURNSTILE_SITE_KEY="0x4AAAA..."
   ```

3. **Importante**: Nunca commite o arquivo `.env` (já está no `.gitignore`)

### 3. Configurar Branch Protection Rules

As regras de proteção do branch `main` garantem que apenas código validado seja mergeado.

1. Acesse **Settings** → **Branches** → **Branch protection rules**
2. Clique em **Add rule**
3. Configure:
   - **Branch name pattern**: `main`
   - ✅ **Require status checks to pass before merging**
     - **Status checks that are required**:
       - `lint` (validação de código com Biome)
       - `test` (testes unitários)
       - `build` (validação de build)
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (força admins a seguir regras)
   - ✅ **Restrict who can dismiss pull request reviews** (proteção extra)
   - ❌ **Allow force pushes** (desabilitado por segurança)
   - ❌ **Allow deletions** (desabilitado por segurança)
4. Clique em **Create**

Referência completa: [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md)

## Estrutura dos Workflows

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: ['**']

jobs:
  lint:
    # Valida código com Biome (format, linting, import organization)
  test:
    # Executa testes unitários com Vitest
  build:
    # Valida build de todos os projetos afetados
```

**Características**:
- Executa em paralelo (lint, test, build simultâneos)
- Usa `nx affected` para processar apenas código alterado
- Requer `fetch-depth: 0` e `nrwl/nx-set-shas@v4` para detecção de mudanças
- Cache de `node_modules` para builds mais rápidos
- Não requer secrets (não faz build de produção)

### CD Workflow (`.github/workflows/cd.yml`)

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  build:
    # Build de produção de todos os apps
    # Upload de artefatos (retenção: 90 dias)
```

**Características**:
- Executa apenas no branch `main`
- Builda **todos** os projetos (não usa `affected`)
- Injeta `VITE_API_URL` no build do frontend
- Gera artefatos:
  - `dist-web`: Frontend React buildado
  - `dist-api`: Backend Express buildado
- Artefatos retidos por 90 dias

## Guia de Troubleshooting

### 1. Erro: "VITE_API_URL is not defined"

**Sintoma**: Build do CD falha com erro sobre variável de ambiente não definida.

**Causa**: Secret `VITE_API_URL` não configurado no GitHub.

**Solução**:
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione secret `VITE_API_URL` com a URL da API de produção
3. Re-execute o workflow

### 2. Erro: "BETTER_AUTH_SECRET must be at least 32 characters"

**Sintoma**: Validação de ambiente falha no servidor.

**Causa**: Secret `BETTER_AUTH_SECRET` muito curto (requisito de segurança).

**Solução**:
```bash
# Gere um secret seguro com 32+ caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copie o resultado para seu `.env` ou secret do GitHub.

### 3. Build Falha: "Some affected projects failed"

**Sintoma**: CI falha na etapa de build com erro de compilação TypeScript.

**Causa**: Erros de tipo não detectados localmente ou configuração `tsconfig.json` incorreta.

**Solução**:
1. Execute localmente: `npx nx affected -t build`
2. Verifique erros de TypeScript
3. Se necessário, limpe cache: `npx nx reset`
4. Reconstrua: `npx nx affected -t build --skip-nx-cache`

### 4. Tests Falhando: "Cannot find module"

**Sintoma**: CI falha na etapa de test com erro de módulo não encontrado.

**Causa**: Dependência não instalada ou cache corrompido.

**Solução**:
1. Verifique se `package.json` está correto
2. Execute localmente: `npm ci && npx nx affected -t test`
3. Se funcionar localmente, o problema pode ser cache do GitHub Actions
4. Force reinstall no CI: adicione `- run: npm ci --force` no workflow

### 5. Affected Detection Não Funciona

**Sintoma**: `nx affected` não detecta projetos alterados ou detecta todos os projetos.

**Causa**: Git history incompleto ou `nrwl/nx-set-shas` não configurado.

**Solução**:
- Verifique se workflow tem `fetch-depth: 0` no `actions/checkout`
- Verifique se `nrwl/nx-set-shas@v4` está presente antes de usar `affected`
- Execute localmente: `npx nx affected:apps` para debug

### 6. Cache Issues: Build Lento

**Sintoma**: Builds no CI levando muito tempo apesar de cache configurado.

**Causa**: Cache do npm ou Nx não está funcionando corretamente.

**Solução**:
- Verifique se `actions/cache@v4` está configurado com path correto: `~/.npm`
- Nx cache é gerenciado automaticamente, mas pode ser resetado: `npx nx reset`
- Se problema persistir, investigue se `package-lock.json` está sendo commitado

### 7. Artifact Upload Falha

**Sintoma**: CD completa build mas falha ao fazer upload de artefatos.

**Causa**: Caminho do artefato incorreto ou permissões insuficientes.

**Solução**:
- Verifique se path no workflow aponta para `./dist/apps/web` e `./dist/apps/api`
- Certifique-se que build gerou os arquivos: adicione `- run: ls -la dist/apps/` antes do upload
- Verifique permissões do workflow: pode precisar de `permissions: contents: read`

## Manutenção

### Adicionar Novos Secrets

1. Adicione a variável em `/libs/shared/env/src/client.ts` (frontend) ou `/libs/shared/env/src/server.ts` (backend)
2. Adicione validação Zod apropriada
3. Adicione ao `.env.example` com valor de exemplo
4. Se necessário no CI/CD, adicione ao workflow com `secrets.NOME_DO_SECRET`
5. Atualize esta documentação na seção "Secrets e Variáveis de Ambiente"

### Atualizar Workflows

1. Modifique os arquivos `.github/workflows/*.yml`
2. Valide sintaxe: `npx yaml-lint .github/workflows/`
3. Execute testes de validação: `npm run test:workflows`
4. Teste localmente com [act](https://github.com/nektos/act) se possível
5. Commite e observe execução no GitHub Actions

### Monitoramento

- Acesse **Actions** tab no GitHub para ver histórico de execuções
- Configure notificações em **Settings** → **Notifications** → **GitHub Actions**
- Monitore tempo de build e considere otimizações se ultrapassar 10 minutos

## Recursos Adicionais

- [Documentação GitHub Actions](https://docs.github.com/en/actions)
- [Documentação Nx CI](https://nx.dev/ci/intro/ci-with-nx)
- [Branch Protection Rules](.github/BRANCH_PROTECTION.md)
- [CD Validation Checklist](.github/workflows/tests/CD_VALIDATION_CHECKLIST.md)
- [Convenções do Projeto](../CLAUDE.md)

## Contato e Suporte

Para dúvidas sobre o pipeline CI/CD:
1. Consulte este documento primeiro
2. Verifique o [troubleshooting](#guia-de-troubleshooting)
3. Abra uma issue no repositório com label `ci/cd`
