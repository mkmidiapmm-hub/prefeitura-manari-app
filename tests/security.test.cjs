const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const security = require('../www/security-portal.js');

test('contatos da Guarda preservam todos os dígitos do documento oficial', () => {
  const {contact} = security;
  assert.equal(contact.phone, '(87) 9161-7993');
  assert.equal(contact.whatsapp, 'https://wa.me/558791617993');
  assert.equal(contact.phoneUrl, 'tel:+558791617993');
  assert.equal(contact.director, 'Leandro Salvador Gomes');
  assert.equal(contact.email, 'diretoriageral.gcmanari@manari.pe.gov.br');
});

test('links da Guarda não são desviados pelo roteamento legado de serviços', () => {
  let handler;
  const redirected = [];
  const window = {document: {}, location: {href: 'https://portal.example/www/index.html#seguranca', assign: u => redirected.push(u)}, addEventListener: (name, fn) => {handler = fn;}};
  vm.runInNewContext(fs.readFileSync('www/portal-service-directory.js', 'utf8'), {window, URL});
  for (const href of [security.contact.whatsapp, security.contact.phoneUrl, 'mailto:' + security.contact.email]) {
    const link = {getAttribute: k => k === 'href' ? href : null, querySelector: () => null, textContent: '(87) 9161-7993', hasAttribute: () => false, matches: () => false};
    let intercepted = false;
    handler({target: {closest: () => link}, preventDefault: () => {intercepted = true;}, stopImmediatePropagation: () => {intercepted = true;}});
    assert.equal(intercepted, false, href);
  }
  assert.deepEqual(redirected, []);
});

test('emblema e módulo da Guarda carregam antes da aplicação e estão no cache', () => {
  const html = fs.readFileSync('www/index.html', 'utf8');
  const sw = fs.readFileSync('www/service-worker.js', 'utf8');
  assert(html.indexOf('src="security-portal.js') < html.indexOf('src="app.js'));
  for (const file of ['security-portal.js', 'security-portal.css', security.contact.emblem]) {
    assert(fs.existsSync('www/' + file));
    assert(sw.includes("'" + file + "'"));
  }
});
