(function () {
  'use strict';
  var STORAGE_KEY = 'ownstream-site-lang';
  var html = document.documentElement;

  function resolveLang() {
    var query = new URLSearchParams(window.location.search).get('lang');
    if (query === 'en' || query === 'ko') return query;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ko') return stored;
    } catch (e) { /* Storage can be disabled; URL and browser language still work. */ }
    return /^ko/i.test(navigator.language || '') ? 'ko' : 'en';
  }

  function applyMetadata(lang) {
    html.lang = lang;
    html.classList.add('lang-ready');
    html.classList.toggle('lang-en', lang === 'en');
    html.classList.toggle('lang-ko', lang === 'ko');
    var title = html.getAttribute('data-title-' + lang);
    var description = html.getAttribute('data-description-' + lang);
    if (title) document.title = title;
    [ ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
      ['meta[property="og:locale"]', lang === 'ko' ? 'ko_KR' : 'en_US'],
      ['meta[property="og:locale:alternate"]', lang === 'ko' ? 'en_US' : 'ko_KR']
    ].forEach(function (entry) {
      var meta = document.querySelector(entry[0]);
      if (meta && entry[1]) meta.content = entry[1];
    });
  }

  function setLang(lang, updateUrl) {
    applyMetadata(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.querySelectorAll('[data-src-en]').forEach(function (img) {
      var src = img.getAttribute('data-src-' + lang);
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.alt = img.getAttribute('data-alt-' + lang) || '';
    });
    document.querySelectorAll('[data-label-en]').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (a) {
      var active = a.getAttribute('data-lang') === lang;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
      var url = new URL(window.location.href);
      url.searchParams.set('lang', a.getAttribute('data-lang'));
      a.href = url.pathname + url.search + url.hash;
    });
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (a.closest('.lang-switch') || !href || href[0] === '#') return;
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !/^(https?|file):$/.test(url.protocol)) return;
      url.searchParams.set('lang', lang);
      // Preserve the current deployment path; works at a GitHub Pages project root.
      a.href = url.pathname + url.search + url.hash;
    });
    if (updateUrl) {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      try { window.history.replaceState(null, '', url); } catch (e) {}
    }
  }

  // Resolve before the body is parsed to avoid a flash of the wrong language.
  var initial = resolveLang();
  applyMetadata(initial);
  function init() {
    setLang(initial, true);
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (a) {
      a.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        setLang(a.getAttribute('data-lang'), true);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('popstate', function () { setLang(resolveLang(), false); });
})();
