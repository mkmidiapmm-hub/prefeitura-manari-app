# Serviços compactos e feed por secretaria — 18/11/2026

- Mantidos cabeçalho, menu lateral, identidade visual, campanha Novembro Azul e imagens existentes.
- Atalhos setoriais compactos com ícones: duas colunas no smartphone, três no dobrável aberto/tablet e seis quando a área de conteúdo comporta a grade no desktop. A decisão usa a largura disponível do conteúdo.
- Feed abaixo dos serviços/informações de cada secretaria, usando a mesma tabela e a gestão de publicações existentes. Apenas registros ativos, publicados e cuja data de publicação já chegou; ordenação por publicação decrescente e paginação de dez itens. Infraestrutura reconhece os códigos legados `infraestrutura` e `obras`.
- Estado vazio real, carregamento, repetição após erro, comentários/moderação e compartilhamento. Nenhuma notícia ou indicador fictício foi publicado.
- Atalhos de manutenção de Infraestrutura abrem a Ouvidoria existente com setor, serviço e tipo identificados. O catálogo oficial resolve `infraestrutura` para `obras` quando necessário. Os campos de localização e tipo de problema são anexados ao relato enviado ao RPC existente; não há uma segunda gravação nem protocolo gerado no cliente. Os demais serviços preservam seus destinos existentes.
- A localização é a do problema. IPTU não é exigido. Sem número próximo, exige-se ponto de referência. A seleção da secretaria e do tipo pode ser corrigida pelo cidadão.
- A Guarda mantém os contatos e o emblema originais; RH preserva o módulo próprio integrado.
- Versão do cache atualizada para 6.31.

## Verificação

77 testes Node aprovados, incluindo a integração dos atalhos com o RPC, preservação de parâmetros pelo roteador legado, paginação do feed e descarte de respostas atrasadas ao trocar secretaria. Verificação de retorno de autenticação aprovada. Conferência no navegador em larguras de 390, 768, 1024 e 1366 pixels (2/3/3/6 colunas). Formulário real consultado sem envio; envio completo conferido com fixture local fictícia, sem acessar o banco real.

## Limites desta entrega

Esta alteração aplica o layout aprovado e conecta os atalhos de manutenção à Ouvidoria existente. Não ativa gov.br, envio automático de e-mail, notificações push, novos painéis gerenciais, novas permissões por setor ou anexos de manutenção. Não altera banco, usuários ou credenciais. A Ouvidoria conserva sua identificação de homologação. Nenhum atendimento de teste foi criado em produção. A habilitação institucional desses fluxos exige a conclusão de suas respectivas configurações.
