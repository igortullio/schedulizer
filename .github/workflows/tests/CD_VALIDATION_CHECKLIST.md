# CD Workflow Validation Checklist

Este documento lista os testes de integração que devem ser validados através da execução real do workflow CD no GitHub Actions. Conforme documentado no TechSpec (seção "Testing Approach"), workflows GitHub Actions são validados através de execução na plataforma, não através de testes unitários locais.

## Validação Estática (Testes Locais)

✅ Estes testes são executados localmente via `npm run test:workflows`:

- [x] Workflow possui nome correto ("CD")
- [x] Workflow trigger configurado para push na branch main
- [x] Build job definido e executa em ubuntu-latest
- [x] Checkout do código com fetch-depth: 0
- [x] Setup Node.js 20 com cache npm
- [x] Cache do .nx/cache configurado corretamente
- [x] Instalação de dependências via npm ci
- [x] Build command correto: npx nx run-many -t build --all
- [x] VITE_API_URL configurado a partir de secrets
- [x] Upload de artifacts para dist-web configurado
- [x] Upload de artifacts para dist-api configurado
- [x] Retenção de artifacts por 90 dias
- [x] Ordem correta dos steps no workflow

## Validação de Integração (GitHub Actions)

🔄 Estes testes são validados através da execução do workflow no GitHub Actions:

### Trigger e Execução
- [ ] CD workflow triggers automaticamente em push para main branch
- [ ] Workflow NÃO triggers em push para feature branches
- [ ] Workflow aparece na UI do GitHub Actions com status claro

### Instalação e Build
- [ ] `npm ci` instala todas dependências com sucesso
- [ ] `npx nx run-many -t build --all` executa sem erros
- [ ] Build completa em menos de 10 minutos

### Secrets e Variáveis de Ambiente
- [ ] VITE_API_URL secret está configurado no repositório
- [ ] Secret é injetado corretamente durante o build do web app
- [ ] Workflow falha apropriadamente se secrets requeridos estão faltando

### Artifacts
- [ ] Artifact dist-web é gerado e uploaded com sucesso
- [ ] Artifact dist-api é gerado e uploaded com sucesso
- [ ] Web artifact contém arquivos de produção esperados (index.html, assets/, etc.)
- [ ] API artifact contém arquivos de produção esperados (index.js ou main.js, package.json, etc.)
- [ ] Artifacts são downloadable pela UI do GitHub Actions
- [ ] Artifacts têm retenção de 90 dias configurada

### Logs e Debugging
- [ ] Logs do workflow são claros e informativos
- [ ] Não há erros ou warnings inesperados nos logs
- [ ] Tempo de execução de cada step é razoável

## Como Validar

### 1. Validação Estática (Local)

```bash
npm run test:workflows
```

### 2. Validação de Integração (GitHub Actions)

1. Push para a branch main (ou merge de um PR)
2. Acessar GitHub Actions UI: https://github.com/{org}/{repo}/actions
3. Localizar a execução mais recente do workflow "CD"
4. Verificar que:
   - Workflow completou com sucesso (check verde)
   - Todos os steps passaram
   - Artifacts foram gerados
5. Download e inspeção dos artifacts:
   - Clicar na execução do workflow
   - Na seção "Artifacts", download dist-web e dist-api
   - Verificar que os arquivos de build estão presentes e corretos

### 3. Validação de Secrets

Antes de executar o workflow pela primeira vez, verificar que o secret está configurado:

1. Acessar: Settings > Secrets and variables > Actions
2. Verificar que `VITE_API_URL` está listado como repository secret
3. Se não estiver, adicionar o secret com o valor correto da URL da API

## Notas

- **Cobertura de Testes**: A combinação de validação estática (13 testes locais) + validação de integração (19 cenários no GitHub Actions) fornece 100% de cobertura dos requisitos do workflow
- **Primeira Execução**: A primeira execução do workflow no GitHub Actions é o teste de integração definitivo
- **Monitoramento Contínuo**: Executar esta checklist após mudanças significativas no workflow
- **Documentação de Referência**: TechSpec seção "Testing Approach" (linhas 149-159) define esta estratégia de validação
