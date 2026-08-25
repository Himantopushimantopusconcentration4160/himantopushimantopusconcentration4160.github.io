/* ==========================================================================
   Google Analytics 4 with Consent Mode v2 + a consent banner.

   Behaviour:
     - Consent defaults to DENIED. GA loads but writes no cookies until the
       visitor accepts, which is what UK/EU rules require.
     - Accept  -> analytics_storage granted, cookies set, full GA4.
     - Decline -> stays denied. GA still reports cookieless pings, so you get
       rough pageview counts without a persistent visitor ID.
     - The choice is remembered; the banner is shown once.
     - An explicit Do Not Track signal skips GA entirely.

   ---- CONFIGURE ME -------------------------------------------------------
   GA_MEASUREMENT_ID: your GA4 ID, looks like 'G-XXXXXXXXXX'.
   While it is empty nothing loads, no banner shows, and no requests are made.
   ------------------------------------------------------------------------ */
var GA_MEASUREMENT_ID = '';

(function () {
  'use strict';

  var STORE = 'ga-consent';           // 'granted' | 'denied'
  var banner;

  function stored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function remember(v) {
    try { localStorage.setItem(STORE, v); } catch (e) {}
  }

  if (!GA_MEASUREMENT_ID) {
    console.info('[analytics] no measurement ID set — GA not loaded.');
    return;
  }
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    console.info('[analytics] Do Not Track is on — GA not loaded.');
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // Consent Mode v2 — deny by default, before anything else runs.
  var prior = stored();
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: prior === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

  function grant() {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    remember('granted');
    hide();
  }
  function decline() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    remember('denied');
    hide();
  }
  function hide() {
    if (banner) { banner.classList.remove('is-visible'); }
  }

  /* ---- Custom events worth having on a job-hunt site ------------------ */
  function bindEvents() {
    document.querySelectorAll('[data-cv]').forEach(function (link) {
      link.addEventListener('click', function () {
        gtag('event', 'cv_download_intent', {
          cv_name: link.getAttribute('data-cv-name') || 'unknown'
        });
      });
    });

    var gateForm = document.querySelector('#cv-gate form');
    if (gateForm) {
      gateForm.addEventListener('submit', function () {
        gtag('event', 'cv_gate_completed');
      });
    }

    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.hostname === location.hostname) return;
      a.addEventListener('click', function () {
        gtag('event', 'outbound_click', { link_domain: a.hostname, link_url: a.href });
      });
    });
  }

  // Did they read the case study, or bounce off the top?
  var fired = {};
  window.addEventListener('scroll', function () {
    clearTimeout(window.__gaScrollT);
    window.__gaScrollT = setTimeout(function () {
      var h = document.body.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var pct = Math.round((window.scrollY / h) * 100);
      [25, 50, 75, 90].forEach(function (mark) {
        if (pct >= mark && !fired[mark]) {
          fired[mark] = true;
          gtag('event', 'scroll_depth', { percent: mark, page_path: location.pathname });
        }
      });
    }, 200);
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    banner = document.getElementById('consent-banner');
    if (!banner) return;

    if (prior) return;                      // already chose — stay quiet

    banner.querySelector('[data-consent-accept]').addEventListener('click', grant);
    banner.querySelector('[data-consent-decline]').addEventListener('click', decline);
    setTimeout(function () { banner.classList.add('is-visible'); }, 700);
  });
})();
