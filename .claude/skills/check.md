# Code Quality Check Skill

Roda Biome para verificação de lint e formatação.

## Comandos

1. Verificar sem modificar:
```bash
npx biome check .
```

2. Verificar e corrigir automaticamente:
```bash
npx biome check . --write
```

3. Apenas lint (sem formatação):
```bash
npx biome lint .
```

4. Apenas formatação:
```bash
npx biome format .
```

## Configuração

O Biome está configurado em `biome.json` com:
- Indentação: 2 espaços
- Largura máxima: 120 caracteres
- Aspas simples
- Sem ponto e vírgula no final
- Parênteses em arrow functions apenas quando necessário
