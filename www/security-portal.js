// Guarda Civil Municipal de Manari — dados fornecidos pela Diretoria-Geral.
(function (root) {
  'use strict';
  const contact = Object.freeze({
    organization: 'Guarda Civil Municipal de Manari — GCMM',
    director: 'Leandro Salvador Gomes',
    phone: '(87) 9161-7993',
    phoneUrl: 'tel:+558791617993',
    whatsapp: 'https://wa.me/558791617993',
    email: 'diretoriageral.gcmanari@manari.pe.gov.br',
    address: 'Manari/PE · CEP 56565-000',
    emblem: 'assets/gcmm-emblema-original.jpg'
  });
  const department = {
    id: 'seguranca', name: 'Segurança e Proteção',
    icon: contact.emblem, hero: contact.emblem,
    headline: 'Segurança e proteção para nossa gente.',
    intro: 'Canais de atendimento e denúncias da Guarda Civil Municipal de Manari.',
    values: [['♧', 'Denúncias'], ['●', 'Atendimento'], ['✦', 'Orientações'], ['ⓘ', 'Informações']]
  };
  const paths = {
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.9-5.5A9.5 9.5 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0Z"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  const whatsappLink = (label, className = 'service-link') => '<a class="' + className + '" href="' + contact.whatsapp + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
  function template(parts) {
    return `<div class="page-wrap security-page" data-swipe-route="seguranca" data-breadcrumb="Segurança e Proteção">
      <section class="hero security-hero">
        <div class="hero-copy">
          <span class="kicker"><img src="${contact.emblem}" alt=""> ${contact.organization}</span>
          <h1>Segurança e <span class="green">proteção para nossa gente.</span></h1>
          <p>${department.intro}</p>
          ${whatsappLink('Fazer denúncia pelo WhatsApp ›', 'primary-btn security-whatsapp')}
          ${parts.values}
        </div>
        <div class="hero-visual security-emblem"><img src="${contact.emblem}" alt="Emblema original da Guarda Civil Municipal de Manari" width="1120" height="1536"></div>
      </section>
      ${parts.strip}
      <section class="section dept-services" id="servicos" aria-labelledby="securityContactsTitle">
        <div class="section-head"><div><h2 id="securityContactsTitle">Atendimento e informações</h2></div></div>
        <div class="service-grid security-contacts">
          <article class="service-card">
            <div class="service-icon">${icon('chat')}</div>
            <div><h3>Fazer denúncia</h3><p>Entre em contato pelo WhatsApp institucional.</p><a class="security-contact" href="${contact.whatsapp}" target="_blank" rel="noopener noreferrer">${contact.phone}</a>${whatsappLink('Abrir WhatsApp')}</div>
          </article>
          <article class="service-card">
            <div class="service-icon">${icon('person')}</div>
            <div><h3>Diretor-Geral</h3><strong class="security-contact">${contact.director}</strong><p>Fale com o Diretor-Geral.</p><a class="security-contact" href="${contact.phoneUrl}">${contact.phone}</a><a class="service-link" href="${contact.phoneUrl}">Ligar para o Diretor-Geral</a></div>
          </article>
          <article class="service-card security-info">
            <div class="service-icon">${icon('mail')}</div>
            <div><h3>E-mail institucional</h3><a class="security-contact security-email" href="mailto:${contact.email}">${contact.email}</a><div class="security-location">${icon('pin')}<span>${contact.address}</span></div></div>
          </article>
        </div>
      </section>
      ${parts.news || ''}
    </div>`;
  }
  function shortcut() {
    return `<article class="service-card security-shortcut"><img src="${contact.emblem}" width="48" height="66" alt=""><div><h3>Segurança e Proteção</h3><p>Atendimento e denúncias da Guarda Civil Municipal de Manari.</p><button type="button" class="service-link" data-dept="seguranca">Acessar a Guarda Civil</button></div></article>`;
  }
  const api = {contact, department, template, shortcut};
  root.ManariSecurity = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
