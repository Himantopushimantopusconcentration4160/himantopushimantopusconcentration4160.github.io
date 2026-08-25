/* ==========================================================================
   CV download gate — asks for a name/email/company before handing over a CV.

   NOTE ON WHAT THIS IS: this is a courtesy gate, not access control. The PDFs
   live at public URLs on static hosting, so anyone who reads the page source
   can fetch them directly. It captures ordinary visitors, not determined ones.

   ---- CONFIGURE ME -------------------------------------------------------
   Set mode to 'formspree' or 'googleform' and fill in the matching block.
   While mode is 'none' the gate is fully disabled and CV links behave normally.
   ------------------------------------------------------------------------ */
var CV_GATE_CONFIG = {
  mode: 'none',

  // mode: 'formspree'  — paste the endpoint from your Formspree form
  formspreeEndpoint: 'https://formspree.io/f/XXXXXXXX',

  // mode: 'googleform' — the /formResponse URL plus each field's entry.N id
  googleForm: {
    actionUrl: 'https://docs.google.com/forms/d/e/XXXXXXXX/formResponse',
    fields: { name: 'entry.111', email: 'entry.222', company: 'entry.333', role: 'entry.444', cv: 'entry.555' }
  }
};

(function () {
  'use strict';

  var STORE = 'cv-gate-done';
  var modal, form, pending = null;

  function alreadyKnown() {
    try { return localStorage.getItem(STORE) === '1'; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(STORE, '1'); } catch (e) {}
  }

  function startDownload(url) {
    var a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function record(data) {
    var c = CV_GATE_CONFIG;

    if (c.mode === 'formspree') {
      return fetch(c.formspreeEndpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    if (c.mode === 'googleform') {
      // Google Forms rejects CORS reads, so fire-and-forget via no-cors.
      var body = new URLSearchParams();
      Object.keys(c.googleForm.fields).forEach(function (k) {
        if (data[k]) body.append(c.googleForm.fields[k], data[k]);
      });
      return fetch(c.googleForm.actionUrl, { method: 'POST', mode: 'no-cors', body: body });
    }

    console.warn('[cv-gate] mode is "none" — nothing recorded. Set CV_GATE_CONFIG.mode.');
    return Promise.resolve();
  }

  function open(url, label) {
    pending = url;
    modal.querySelector('[data-gate-cv]').textContent = label || 'CV';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.querySelector('#gate-name').focus(); }, 60);
  }

  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    pending = null;
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = false;
    btn.textContent = btn.dataset.label;
    form.querySelector('.gate__error').textContent = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    modal = document.getElementById('cv-gate');
    if (!modal) return;
    form = modal.querySelector('form');
    var submit = form.querySelector('button[type=submit]');
    submit.dataset.label = submit.textContent;

    // Not configured yet? Stay out of the way entirely rather than adding
    // friction that captures nothing.
    if (CV_GATE_CONFIG.mode === 'none') {
      console.info('[cv-gate] disabled (mode: none) — CV links behave normally.');
      return;
    }

    document.querySelectorAll('[data-cv]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var url = link.getAttribute('data-cv');
        if (alreadyKnown()) return;          // returning visitor: let it through
        e.preventDefault();
        open(url, link.getAttribute('data-cv-name'));
      });
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-gate-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('.gate__error');
      var data = {
        name: form.gateName.value.trim(),
        email: form.gateEmail.value.trim(),
        company: form.gateCompany.value.trim(),
        role: form.gateRole.value.trim(),
        cv: (pending || '').split('/').pop(),
        page: location.href
      };
      if (!data.name || !data.email) { err.textContent = 'Name and email, please.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { err.textContent = "That email doesn't look right."; return; }

      err.textContent = '';
      submit.disabled = true;
      submit.textContent = 'One moment…';

      var url = pending;
      record(data)
        .catch(function () { /* never block the download on a logging failure */ })
        .then(function () {
          remember();
          startDownload(url);
          close();
        });
    });
  });
})();
