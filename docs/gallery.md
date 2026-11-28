# Galeria oficial

## Acesso

- Público: `/galeria` (Cloudflare Pages), arquivo `/galeria.html`.
- Administração: **Administrativo → Gerenciar galeria**, disponível apenas ao administrador principal. O mesmo atalho aparece na visão geral administrativa.
- O menu Galeria e o atalho do rodapé apontam para o novo módulo. Os demais serviços do portal mantêm seus fluxos.

## Organização

O gerenciador permite criar álbuns, adicionar até 20 arquivos por envio, importar imagens de publicações já públicas, editar título/descrição/legenda/crédito/data, mover imagens entre álbuns, definir capas e escolher a imagem principal.

Em **Todas as imagens**, arrastar ou usar subir/descer define a ordem do mosaico público de fotos. Ao selecionar um álbum, os mesmos controles reorganizam suas imagens. Na aba **Álbuns**, os controles definem a ordem do modo público de álbuns. Formatos padrão, largo e alto permitem compor o mosaico. Enquadramentos de computador e celular são independentes; “Mostrar a imagem inteira” preserva todo o conteúdo no mosaico e o visualizador sempre mostra o original completo.

As alterações ficam em rascunho local, associado ao usuário, antes de **Publicar galeria**. O rascunho é guardado automaticamente neste navegador quando válido e pode ser salvo pelo botão. Versões anteriores publicadas neste navegador podem ser carregadas como rascunho. Remover uma imagem da galeria não apaga o arquivo original.

## Dados e autorização

Reutiliza `public.portal_layout_overrides`, chave `page_key='global'`, `element_key='!manari-gallery-v1'`, `content_type='text'`, `active=true`. Não cria tabelas nem altera permissões. Usa a mesma autenticação e as políticas administrativas do editor do portal. O editor antigo ignora a chave reservada.

Os arquivos usam o bucket existente `portal-layout`, tipos PNG/JPEG/WebP/GIF e máximo de 10 MB por arquivo. O navegador verifica a decodificação antes do envio. O servidor continua aplicando suas próprias políticas. Arquivos e metadados publicados são públicos; ocultar um item na interface não equivale a privacidade.

A publicação revalida a identidade e o perfil de administrador, consulta a versão atual e compara `id`, `updated_at` e `value`. Atualizações condicionais impedem sobrescritas concorrentes. O sucesso é informado somente após a releitura e comparação da versão salva.

O contrato valida referências, identificadores únicos, datas, URLs, limites de texto e posições. Aceita até 300 álbuns e 2.000 imagens por galeria, com limite de 2 MB para os metadados. Não inclui dados binários no JSON. As fotos são carregadas sob demanda e o mosaico é paginado.

Sem configuração própria publicada, exibe o registro oficial da Conferência Regional de Educação já existente no projeto e imagens de até 100 publicações atualmente públicas do feed, sem duplicar URLs. Artes do feed permanecem integrais. Não usa imagens conceituais geradas para representar fotografias reais de Manari. Publicar pela primeira vez fixa a seleção; novas publicações podem ser importadas no gerenciador.

## Verificação

```bash
node --test tests/gallery.test.cjs tests/sector-feed.test.mjs tests/visual-layout.test.cjs tests/visual-layout-dom.test.cjs
```

As integrações DOM exigem `jsdom@26.1.0`; sem a dependência os testes correspondentes são explicitamente ignorados. Durante a implementação, todos foram executados com jsdom, sem ignorados. Os testes usam banco e upload simulados, sem alterar produção. Cobrem autorização, negação a outros perfis, ordem, capas, enquadramento independente, URLs, XSS, datas, rascunho, publicação com releitura e conflitos.

QA no navegador: página pública com dados atuais, pesquisa sem acentos, álbuns, ampliação, fechamento/retorno de foco, telas de 344/390/768/1024/1280 px; gerenciador em computador e viewport de celular 390×844, criação de álbum, ordem, prévia e publicação simulada. O primeiro envio e a publicação pela conta real continuam exigindo a sessão administrativa do usuário.
