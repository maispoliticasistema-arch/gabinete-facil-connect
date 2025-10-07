# Sistema Completo de Auditoria e Logs

Este documento descreve o sistema de auditoria implementado no Gabinete Fácil.

## 📊 Visão Geral

O sistema de auditoria captura **todas** as ações realizadas no sistema, incluindo:

### 1. **Tentativas de Autenticação** 
Todas as tentativas de login são registradas na tabela `auth_attempts`:
- ✅ Logins bem-sucedidos
- ❌ Logins falhados (senha incorreta, usuário não encontrado, etc.)
- 📧 Email utilizado
- 🕐 Data e hora da tentativa
- 💻 User agent (navegador/dispositivo)
- 🌐 IP address (quando disponível)
- ⚠️ Mensagem de erro (para tentativas falhadas)

### 2. **Ações de Usuários** (audit_logs)

Todas as ações importantes são logadas:

#### Eleitores
- `create` - Cadastro de novo eleitor
- `update` - Atualização de dados do eleitor
- `delete` - Exclusão de eleitor (soft delete)
- `import_data` - Importação de planilha de eleitores
- `export_report` - Exportação de dados

#### Demandas
- `create` - Nova demanda criada
- `update` - Atualização de demanda
- `delete` - Demanda removida
- Status changes são registrados

#### Agenda
- `create` - Novo evento agendado
- `update` - Alteração de evento
- `delete` - Evento cancelado

#### Roteiros
- `create` - Novo roteiro criado
- `update` - Roteiro atualizado
- `delete` - Roteiro removido

#### Usuários e Permissões
- `user_created` - Novo usuário adicionado
- `user_disabled` - Usuário desativado
- `user_deleted` - Usuário removido
- `user_invited` - Usuário convidado via código
- `user_approved` - Solicitação de acesso aprovada
- `user_rejected` - Solicitação de acesso rejeitada
- `permission_change` - Mudança de permissões
- `access_denied` - Tentativa de acesso negado

#### Configurações
- `settings_changed` - Alteração nas configurações do gabinete
- Mudanças no portal público
- Alterações em níveis de envolvimento
- Modificações em tags

### 3. **Erros do Sistema** (system_errors)

Todos os erros são capturados:
- 🔴 **Critical** - Erros críticos que impedem funcionalidade
- ⚠️ **Warning** - Avisos que não impedem uso mas requerem atenção
- ℹ️ **Error** - Erros gerais

Para cada erro é registrado:
- Mensagem de erro
- Stack trace completo
- Contexto (página, ação sendo executada)
- Usuário afetado
- Gabinete afetado
- URL da página
- User agent
- Data e hora

## 🎯 Como Visualizar os Logs

### Painel de Controle (/painel)

Acesse o painel de controle (apenas para superowners) e navegue pelas abas:

1. **Visão Geral** - Dashboard com métricas principais
2. **Monitoramento** - Métricas em tempo real do sistema
3. **Erros** - Lista de todos os erros ocorridos
4. **Autenticação** - Histórico de tentativas de login
   - Filtre por sucesso/falha
   - Busque por email específico
   - Veja últimas 100 tentativas
5. **Auditoria Global** - Todos os logs de audit_logs
   - Filtros por ação, data, usuário, gabinete
   - Busca detalhada
6. **Gabinetes** - Gerenciamento de gabinetes
7. **Usuários** - Gestão de usuários
8. **Desempenho** - Métricas de performance

## 🔍 Informações Capturadas

Para cada log, são salvos:

### audit_logs
- `id` - Identificador único
- `gabinete_id` - Gabinete relacionado
- `user_id` - Usuário que executou a ação
- `action` - Tipo de ação realizada
- `entity_type` - Tipo de entidade afetada
- `entity_id` - ID da entidade afetada
- `details` - JSON com detalhes adicionais
- `ip_address` - IP do usuário
- `user_agent` - Navegador/dispositivo
- `http_method` - Método HTTP (GET, POST, etc.)
- `request_body` - Corpo da requisição (quando aplicável)
- `response_status` - Status da resposta HTTP
- `created_at` - Data e hora da ação

### auth_attempts
- `id` - Identificador único
- `email` - Email usado na tentativa
- `success` - Se foi bem-sucedido ou não
- `error_message` - Mensagem de erro (se falhou)
- `user_id` - ID do usuário (se sucesso)
- `ip_address` - IP da tentativa
- `user_agent` - Navegador/dispositivo
- `created_at` - Data e hora da tentativa

### system_errors
- `id` - Identificador único
- `error_message` - Mensagem do erro
- `error_code` - Código do erro (se disponível)
- `severity` - Gravidade (critical/warning/error)
- `stack_trace` - Stack trace completo
- `context` - JSON com contexto adicional
- `user_id` - Usuário afetado (se aplicável)
- `gabinete_id` - Gabinete afetado (se aplicável)
- `page_url` - URL onde ocorreu o erro
- `user_agent` - Navegador/dispositivo
- `resolved` - Se o erro foi resolvido
- `resolved_by` - Quem resolveu
- `resolved_at` - Quando foi resolvido
- `created_at` - Data e hora do erro

## 🛡️ Segurança e Privacidade

- **RLS (Row Level Security)** está habilitado em todas as tabelas
- Apenas **superowners** podem visualizar logs globais
- Cada gabinete só vê seus próprios audit_logs
- Tentativas de autenticação só são visíveis para superowners
- Dados sensíveis são protegidos
- IPs e user agents são armazenados para segurança, não para tracking

## 🧹 Limpeza Automática

O sistema possui rotinas de limpeza automática:

- **auth_attempts**: Mantém apenas 90 dias de histórico
- **audit_logs**: Pode ser configurado para arquivamento automático
- **system_errors**: Erros resolvidos são automaticamente removidos após 90 dias

Para executar limpeza manual:
```sql
SELECT cleanup_old_auth_attempts();
SELECT cleanup_old_errors();
```

## 📈 Métricas e Relatórios

O sistema também coleta métricas agregadas:
- Número de logins por hora/dia
- Taxa de erro
- Usuários ativos
- Gabinetes ativos
- Queries lentas
- Performance geral

Todas essas métricas estão disponíveis no painel de monitoramento.

## 🔔 Notificações

O sistema pode gerar notificações automáticas:
- Múltiplas tentativas de login falhadas do mesmo IP
- Erros críticos no sistema
- Ações suspeitas
- Mudanças importantes de permissões

## 💡 Dicas de Uso

1. **Monitore regularmente** as tentativas de autenticação para detectar ataques
2. **Revise os erros** periodicamente para identificar problemas recorrentes
3. **Analise os audit logs** quando houver discrepâncias nos dados
4. **Configure alertas** para ações críticas
5. **Exporte relatórios** para análise externa quando necessário

## 🚀 Próximos Passos

Possíveis melhorias futuras:
- [ ] Alertas automáticos por email/SMS
- [ ] Dashboard personalizado por gabinete
- [ ] Exportação de relatórios em PDF
- [ ] Análise de padrões com IA
- [ ] Integração com ferramentas externas de monitoramento
