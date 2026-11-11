# Finalização técnica e publicação — 11/11/2026

## Entrega

- Consulta pública independente em `/transparencia/`, também compatível com GitHub Pages em `/www/transparencia/`.
- 79 módulos de publicação com campos específicos, filtros de assunto, exercício, período, setor e situação; paginação; links individuais; exportação CSV/JSON de todos os resultados filtrados; dicionário e instruções para acesso automatizado.
- Matriz de 96 critérios do Executivo, incluindo os 12 essenciais. Fonte: planilha 2026 indicada pelo TCE-PE em https://www.tcepe.tc.br/internet/index.php/levantamento-nacional-transparencia-publica-lntp-cidadao . Cópia normalizada das linhas em `scripts/pntp-2026-executivo.json`. Não se aplica a matriz inteira de outros Poderes.
- Administração mantém autenticação e permissões setoriais. Novos módulos foram acrescidos apenas aos respectivos setores; nenhuma pessoa foi promovida a administrador.
- Cadastro manual, rascunhos, importação CSV com conferência (até 200 linhas por lote), validação dos campos obrigatórios no navegador e no banco, documentos completos ou link público direto quando exigido, declaração de não ocorrência somente com período/autoridade/justificativa/data e nos módulos previstos.
- Painel interno de conferência por critério, evidência e justificativa; exportação do acompanhamento. Marcar como conferido NÃO gera aprovação do Tribunal nem nota PNTP.
- Publicações do CMS passam a ser consultadas pelo cidadão na mesma fonte (`portal_records`). Não confundir com as tabelas especializadas antigas sem alimentação ou com os contracheques privados.
- Pesquisa voluntária de satisfação com resultados agregados públicos e JSON, sem nome/CPF/contato. Uma avaliação por token de navegador, serviço e mês; não constitui amostra probabilística nem mecanismo antifraude.
- Barra visível de Transparência/e-SIC/Ouvidoria e busca; acessibilidade com alto contraste, tamanho do texto, atalhos de conteúdo, foco e caminho de navegação.
- Service worker isola Transparência e Gestão de Demandas, além de e-SIC/Ouvidoria/RH/Protocolo, evitando reescrita de páginas e contaminação do cache inicial.

## Banco

Aplicar em ordem: `database/transparency-catalog.sql`, `database/transparency-validation.sql`, `database/transparency-criteria.sql`, `database/portal-satisfaction.sql`. São operações idempotentes e não publicam registros administrativos fictícios.

`portal_pntp_criteria` é público; `portal_pntp_reviews` é privado, com RLS, autorização por módulo/departamento e conferência ampliada para Controle Interno. Publicação de registros incompletos é rejeitada no banco. Datas, números, links e documentos são verificados; rascunhos podem ser incompletos. Arquivos selecionados no CMS só são enviados durante publicação; a tela identifica o caráter público do documento.

Testes de banco usam transação com ROLLBACK. O teste legado `esic-fluxo-rls.sql` agora contém sua própria transação para impedir persistência acidental de fixtures. A execução anterior sem transação deixou quatro contas fictícias e um protocolo; os registros identificados exclusivamente pelos IDs/e-mails `example.invalid` foram removidos, os revisores fictícios foram retirados e a configuração inicial de uma instância foi reposta (responsável não configurado). Nenhuma autoridade real foi definida automaticamente.

## Validação

- Testes Node existentes e de Transparência: `node --test tests/*.test.mjs tests/*.test.cjs`.
- Retorno de e-mail: `node tests/email-redirect.cjs`.
- Testes transacionais: `tests/transparency-rls.sql`, e-SIC (fluxo, outros e painel), Ouvidoria e RH.
- Os resultados e limites da inspeção visual/deploy devem constar no registro de conclusão, sem equiparar testes estáticos a testes com contas reais.

## O que exige a Prefeitura para lançamento oficial

1. Alimentar registros oficiais e histórico: receitas/despesas, contratos/licitações, pessoal, obras, planejamento, contas, saúde, educação e conselhos.
2. Validar contatos e competências; publicar normas locais, cartas de serviços, política de privacidade e designação do encarregado. Não foram inventadas normas, responsáveis nem declarações de inexistência.
3. Definir responsável e autoridades recursais do e-SIC. A consulta de 11/11 confirmou responsável e revisores não configurados, e ausência de chave SMTP para os avisos. Configurar o envio e conferir entrega real do SMTP e permitir as URLs definitivas de retorno de autenticação no painel Supabase. O conector não oferece alteração dessas configurações Auth.
4. Recuperar acesso ao DNS institucional e vincular o endereço autorizado. O subdomínio `novo.manari.pe.gov.br` não foi criado por falta desse acesso.
5. Controle Interno revisa cada evidência com a matriz do ciclo vigente. Disponibilidade, atualidade, histórico, exportação e filtros variam conforme o critério. Presença de módulo ou de um registro não comprova atendimento integral.
6. Definir responsáveis por backups, monitoramento e periodicidade de alimentação. Exportações públicas são dados abertos e não substituem backup administrativo/restauração do Supabase.

## Limites

Não há garantia de selo nem alteração retroativa da nota já divulgada. A publicação técnica não constitui a oficialização institucional. Dados existentes em serviços externos não foram copiados automaticamente sem validação de conteúdo, período e procedência. Contracheques individuais não são publicados na Transparência.
