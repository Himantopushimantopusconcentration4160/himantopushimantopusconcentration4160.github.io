/* ==========================================================================
   Google Analytics 4

   ---- CONFIGURE ME -------------------------------------------------------
   MEASUREMENT_ID: your GA4 ID, looks like 'G-XXXXXXXXXX'.
   While it is empty, nothing loads and no requests are made.

   COOKIELESS: true  -> no cookies, no persistent visitor ID. No consent
                        banner needed anywhere. Pageviews, sources and
                        per-page engagement all still work; returning
                        visitors just count as new each session.
               false -> standard GA4 with cookies. More accurate, but in the
                        UK/EU this legally requires a consent banner.
   ------------------------------------------------------------------------ */
var GA_MEASUREMENT_ID = '';
var GA_COOKIELESS = true;

(function () {
  'use strict';

  if (!GA_MEASUREMENT_ID) {
    console.info('[analytics] no measurement ID set — GA not loaded.');
    return;
  }

  // Respect an explicit Do Not Track signal.
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    console.info('[analytics] Do Not Track is on — GA not loaded.');
    return;
  }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());

  var config = { anonymize_ip: true };
  if (GA_COOKIELESS) {
    config.client_storage = 'none';   // no cookies written
    config.ads_data_redaction = true;
  }
  gtag('config', GA_MEASUREMENT_ID, config);

  /* ---- Custom events worth having on a job-hunt site ------------------ */

  // Which CV, and did the gate get completed?
  document.addEventListener('DOMContentLoaded', function () {
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

    // Outbound clicks — which repos people actually open.
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.hostname === location.hostname) return;
      a.addEventListener('click', function () {
        gtag('event', 'outbound_click', {
          link_domain: a.hostname,
          link_url: a.href
        });
      });
    });
  });

  // Did they actually read the case study, or bounce off the top?
  var fired = {};
  function depth() {
    var h = document.body.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.round((window.scrollY / h) * 100);
    [25, 50, 75, 90].forEach(function (mark) {
      if (pct >= mark && !fired[mark]) {
        fired[mark] = true;
        gtag('event', 'scroll_depth', { percent: mark, page_path: location.pathname });
      }
    });
  }
  window.addEventListener('scroll', function () {
    clearTimeout(window.__gaScrollT);
    window.__gaScrollT = setTimeout(depth, 200);
  }, { passive: true });
})();
