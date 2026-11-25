# Editor de aparência do portal

Acesso: Administrativo → conta com perfil `admin` → **Editar aparência e campanhas**.

O editor mantém o portal original como base. Figurinhas decorativas podem ser ancoradas no cabeçalho, campanha, apresentação, atalhos, avisos, serviços, publicações, contatos e rodapé. Imagens, textos e botões também podem formar blocos antes/depois dessas áreas. As opções indisponíveis na página ficam desabilitadas.

## Responsividade e publicação

- Computador: acima de 1024 px; tablet: 601–1024 px; celular: até 600 px. A prévia de dobrável usa 344 px e compartilha a configuração de celular.
- Posição, largura, rotação, opacidade, visibilidade e ordem são independentes por faixa.
- Arraste ou setas do teclado movem figurinhas; o canto inferior redimensiona. Controles numéricos permitem ajustes sem arrastar.
- A estrutura permite reordenar os blocos de conteúdo e os ícones das secretarias. Cabeçalho, campanha e canais de atendimento permanecem nas posições institucionais.
- Datas de campanha usam UTC−03:00 (Pernambuco). A versão pública verifica a vigência ao carregar e a cada minuto. A prévia permite editar elementos fora da vigência.
- Rascunhos e as últimas dez versões anteriores ficam neste navegador, vinculados ao ID da conta. Uma publicação é compartilhada com os visitantes e com outros dispositivos. Os arquivos enviados ao bucket público têm URL pública antes mesmo da publicação do layout.
- Desfazer/refazer preservam até 30 estados durante a edição. Restaurar versão anterior carrega um rascunho; exige publicação para alterar o portal.

## Integração e autorização

`visual-layout-model.js` valida uma configuração declarativa, sem HTML, CSS ou seletores arbitrários. `visual-layout-runtime.js` aplica a versão pública e mantém as decorações sem capturar cliques. `visual-layout-editor.js` usa o cliente autenticado do editor existente.

A configuração publicada usa uma única linha de `public.portal_layout_overrides`, com `page_key = 'global'`, `element_key = '!manari-visual-layout-v1'`, `content_type = 'text'` e `value` JSON. O editor antigo ignora essa chave reservada. Não há mudanças de schema, RLS, perfis ou permissões.

A tabela existente tem RLS ativada, leitura pública de linhas ativas e escrita restrita por `is_portal_admin()`. O cliente revalida o usuário e `current_portal_staff_profile` antes de abrir, enviar arquivos ou publicar. A atualização exige o ID, `updated_at` e valor previamente lidos; alterações concorrentes são rejeitadas. A publicação é lida novamente do servidor antes de confirmar sucesso.

Imagens usam o bucket existente `portal-layout`, limitado a PNG, JPEG, WebP e GIF de até 10 MB. Não são apagadas automaticamente, pois podem pertencer a uma versão publicada ou restaurável.

A prévia usa um iframe da mesma origem, com mensagens validadas pela origem e janela remetente. Ela não recebe credenciais nem concede autorização de escrita. O pop-up de matrículas é suprimido somente dentro dessa prévia. Os demais recursos do portal são preservados.

## Verificação

`node --test tests/visual-layout.test.cjs` cobre validação, URLs, faixas de tela, programação e ordenação. Também foram verificados em ambiente DOM isolado: autorização, rascunho separado da publicação, leitura de confirmação, conflito de edição, falhas de escrita, renderização, ausência de áreas e restauração.

Para reproduzir a integração DOM: instale `jsdom@26.1.0` em uma pasta de ferramentas e execute `NODE_PATH=/caminho/node_modules node --test tests/visual-layout-dom.test.cjs`. Sem essa dependência opcional, esse teste informa explicitamente que foi pulado.
