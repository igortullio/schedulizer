import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

/**
 * Testes de validação da documentação CI/CD
 *
 * Verifica que a documentação está precisa e completa:
 * - Secrets documentados existem nos workflows
 * - Variáveis de ambiente documentadas existem nos schemas
 * - Arquivos referenciados existem
 * - Branch protection está corretamente documentada
 */

const rootDir = resolve(import.meta.dirname, '../../..');

// Lê arquivos uma vez
const ciWorkflow = readFileSync(resolve(rootDir, '.github/workflows/ci.yml'), 'utf-8');
const cdWorkflow = readFileSync(resolve(rootDir, '.github/workflows/cd.yml'), 'utf-8');
const cicdDocs = readFileSync(resolve(rootDir, '.github/CI_CD.md'), 'utf-8');
const clientEnvSchema = readFileSync(resolve(rootDir, 'libs/shared/env/src/client.ts'), 'utf-8');
const serverEnvSchema = readFileSync(resolve(rootDir, 'libs/shared/env/src/server.ts'), 'utf-8');
const claudeMd = readFileSync(resolve(rootDir, 'CLAUDE.md'), 'utf-8');

// Contador de testes
let testsRun = 0;
let testsPassed = 0;

// Helper para executar testes
function test(name, fn) {
	testsRun++;
	try {
		fn();
		testsPassed++;
		console.log(`✓ ${name}`);
	} catch (error) {
		console.error(`✗ ${name}`);
		console.error(`  ${error.message}`);
	}
}

console.log('\n🧪 CI/CD Documentation Validation Tests\n');

// Secrets Documentation Tests
test('should document VITE_API_URL as required secret for CD', () => {
	assert.match(cicdDocs, /VITE_API_URL/);
	assert.match(cicdDocs, /Obrigatórios/);
	assert.match(cdWorkflow, /secrets\.VITE_API_URL/);
});

test('should document VITE_TURNSTILE_SITE_KEY as optional secret', () => {
	assert.match(cicdDocs, /VITE_TURNSTILE_SITE_KEY/);
	assert.match(cicdDocs, /Opcionais/);
});

test('should document that CI workflow does not require secrets', () => {
	assert.match(cicdDocs, /Secrets necessários.*Nenhum/is);
	const secretsInCI = ciWorkflow.match(/secrets\./g) || [];
	assert.equal(secretsInCI.length, 0, 'CI workflow should not use custom secrets');
});

test('should explain the purpose of each secret', () => {
	// Verifica que tem tabela com coluna Propósito
	assert.match(cicdDocs, /\| Secret \| Usado em \| Propósito \| Exemplo \|/);
	assert.match(cicdDocs, /VITE_API_URL.*URL da API/is);
});

// Environment Variables Tests
test('should document all client environment variables from schema', () => {
	const clientVars = ['VITE_API_URL', 'VITE_TURNSTILE_SITE_KEY'];
	for (const varName of clientVars) {
		assert.match(cicdDocs, new RegExp(varName), `${varName} should be documented`);
		assert.match(clientEnvSchema, new RegExp(varName), `${varName} should exist in client schema`);
	}
});

test('should document all server environment variables from schema', () => {
	const serverVars = [
		'DATABASE_URL',
		'SERVER_PORT',
		'BETTER_AUTH_SECRET',
		'BETTER_AUTH_URL',
		'RESEND_API_KEY',
		'TURNSTILE_SECRET_KEY'
	];
	for (const varName of serverVars) {
		assert.match(cicdDocs, new RegExp(varName), `${varName} should be documented`);
		assert.match(serverEnvSchema, new RegExp(varName), `${varName} should exist in server schema`);
	}
});

test('should mark required variables correctly', () => {
	const requiredVars = ['VITE_API_URL', 'DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'RESEND_API_KEY'];
	for (const varName of requiredVars) {
		// Busca pela linha que contém a variável e ✅ Sim
		const regex = new RegExp(`\\|[^|]*${varName}[^|]*\\|[^|]*✅ Sim[^|]*\\|`, 's');
		assert.match(cicdDocs, regex, `${varName} should be marked as required with ✅ Sim`);
	}
});

test('should mark optional variables correctly', () => {
	const optionalVars = ['VITE_TURNSTILE_SITE_KEY', 'SERVER_PORT', 'TURNSTILE_SECRET_KEY'];
	for (const varName of optionalVars) {
		// Busca pela linha que contém a variável e ❌ Não
		const regex = new RegExp(`\\|[^|]*${varName}[^|]*\\|[^|]*❌ Não[^|]*\\|`, 's');
		assert.match(cicdDocs, regex, `${varName} should be marked as optional with ❌ Não`);
	}
});

test('should document VITE_ prefix requirement for client variables', () => {
	assert.match(cicdDocs, /prefixo `VITE_`/i);
	assert.match(cicdDocs, /expostas ao browser/i);
});

test('should document validation rules for special variables', () => {
	assert.match(cicdDocs, /VITE_API_URL.*URL válida/is);
	assert.match(cicdDocs, /BETTER_AUTH_SECRET.*32 caracteres/is);
});

// Setup Instructions Tests
test('should provide step-by-step GitHub secrets configuration', () => {
	assert.match(cicdDocs, /Configuração Passo a Passo/);
	assert.match(cicdDocs, /Settings.*Secrets and variables.*Actions/is);
	assert.match(cicdDocs, /New repository secret/);
});

test('should provide local environment setup instructions', () => {
	assert.match(cicdDocs, /Configurar Environment Local/);
	assert.match(cicdDocs, /cp \.env\.example \.env/);
});

test('should provide branch protection configuration instructions', () => {
	assert.match(cicdDocs, /Configurar Branch Protection Rules/);
	assert.match(cicdDocs, /Branch protection rules/);
	assert.match(cicdDocs, /lint/);
	assert.match(cicdDocs, /test/);
	assert.match(cicdDocs, /build/);
});

// Workflow Differences Tests
test('should explain CI workflow purpose and triggers', () => {
	assert.match(cicdDocs, /CI.*Continuous Integration/is);
	assert.match(cicdDocs, /Pull Requests/);
	assert.match(cicdDocs, /nx affected/);
});

test('should explain CD workflow purpose and triggers', () => {
	assert.match(cicdDocs, /CD.*Continuous Deployment/is);
	assert.match(cicdDocs, /branch.*main/is);
	assert.match(cicdDocs, /nx run-many.*build.*all/is);
});

test('should document that CI uses nx affected and CD builds all', () => {
	assert.match(ciWorkflow, /nx affected/);
	assert.match(cdWorkflow, /nx run-many.*--all/);
	assert.match(cicdDocs, /nx affected.*apenas projetos alterados/is);
	assert.match(cicdDocs, /nx run-many.*todos os apps/is);
});

// Troubleshooting Guide Tests
test('should provide troubleshooting for missing VITE_API_URL', () => {
	assert.match(cicdDocs, /VITE_API_URL is not defined/i);
	assert.match(cicdDocs, /Secret.*VITE_API_URL.*não configurado/is);
});

test('should provide troubleshooting for BETTER_AUTH_SECRET length', () => {
	assert.match(cicdDocs, /BETTER_AUTH_SECRET must be at least 32 characters/i);
});

test('should provide troubleshooting for build failures', () => {
	assert.match(cicdDocs, /Build Falha/i);
	assert.match(cicdDocs, /affected projects failed/i);
});

test('should provide troubleshooting for test failures', () => {
	assert.match(cicdDocs, /Tests Falhando/i);
	assert.match(cicdDocs, /Cannot find module/i);
});

test('should provide troubleshooting for cache issues', () => {
	assert.match(cicdDocs, /Cache Issues/i);
	assert.match(cicdDocs, /Build Lento/i);
});

test('should provide troubleshooting for affected detection', () => {
	assert.match(cicdDocs, /Affected Detection/i);
	assert.match(cicdDocs, /nx affected.*não detecta/is);
});

test('should provide troubleshooting for artifact upload', () => {
	assert.match(cicdDocs, /Artifact Upload Falha/i);
});

// Referenced Files Tests
test('should reference existing files correctly', () => {
	const referencedFiles = [
		'.github/workflows/ci.yml',
		'.github/workflows/cd.yml',
		'.env.example',
		'libs/shared/env/src/client.ts',
		'libs/shared/env/src/server.ts',
		'.github/BRANCH_PROTECTION.md',
		'.github/workflows/tests/CD_VALIDATION_CHECKLIST.md'
	];
	for (const file of referencedFiles) {
		const fullPath = resolve(rootDir, file);
		assert.ok(existsSync(fullPath), `Referenced file ${file} should exist`);
	}
});

test('should have CLAUDE.md reference to CI/CD docs', () => {
	assert.match(claudeMd, /CI\/CD/);
	assert.match(claudeMd, /\.github\/CI_CD\.md/);
});

// Branch Protection Tests
test('should document required status checks', () => {
	const requiredChecks = ['lint', 'test', 'build'];
	for (const check of requiredChecks) {
		assert.match(cicdDocs, new RegExp(check), `${check} should be documented as required check`);
		// Verifica se existe job com esse nome no CI workflow (formato YAML: "lint:" ou "- lint")
		assert.match(ciWorkflow, new RegExp(`(^|\\s)${check}:`, 'm'), `${check} job should exist in CI workflow`);
	}
});

test('should document enforcement settings', () => {
	assert.match(cicdDocs, /Do not allow bypassing/i);
	assert.match(cicdDocs, /Allow force pushes.*desabilitado/is);
	assert.match(cicdDocs, /Allow deletions.*desabilitado/is);
});

// Maintenance Section Tests
test('should provide guidance for adding new secrets', () => {
	assert.match(cicdDocs, /Adicionar Novos Secrets/i);
	assert.match(cicdDocs, /libs\/shared\/env/);
});

test('should provide guidance for updating workflows', () => {
	assert.match(cicdDocs, /Atualizar Workflows/i);
	assert.match(cicdDocs, /test:workflows/);
});

// Documentation Completeness Tests
test('should have all required sections', () => {
	const requiredSections = [
		'Visão Geral',
		'Diferença entre CI e CD',
		'Secrets e Variáveis de Ambiente',
		'Configuração Passo a Passo',
		'Estrutura dos Workflows',
		'Guia de Troubleshooting',
		'Manutenção'
	];
	for (const section of requiredSections) {
		assert.match(cicdDocs, new RegExp(`##.*${section}`), `Documentation should have ${section} section`);
	}
});

test('should provide external resource links', () => {
	assert.match(cicdDocs, /docs\.github\.com/);
	assert.match(cicdDocs, /nx\.dev/);
});

// Sumário final
console.log(`\n✅ ${testsPassed}/${testsRun} tests passed`);

if (testsPassed !== testsRun) {
	process.exit(1);
}
