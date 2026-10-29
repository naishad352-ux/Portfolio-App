/* ===== Settings (change these if needed) ===== */
const EMAIL = 'naishad352@gmail.com';
const WEB3FORMS_KEY = '416a8ca8-3a6b-435c-8f2a-28a2d7096c27'; // free key from web3forms.com

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);

/* ===== Small message at the bottom (toast) ===== */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ===== Copy text (used when a new tab is blocked) ===== */
function copyText(text) {
  return new Promise((resolve) => {
    const legacy = () => {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      t.remove(); resolve(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => resolve(true), legacy);
    } else { legacy(); }
  });
}

/* Open GitHub / LinkedIn in a new tab. If the browser blocks it, copy the link instead. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="http"]');
  if (!a) return;
  e.preventDefault();
  const w = window.open(a.href, '_blank');
  if (w) { w.opener = null; } else { copyText(a.href).then(() => toast('Link copied. Paste it in a new tab.')); }
});

/* ===== Dark / Light mode (remembers your choice) ===== */
(function () {
  const root = document.documentElement, btn = $('#theme'), ic = $('#theme-ic');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) { /* ignore */ }
  const systemDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  function apply(t) {
    root.setAttribute('data-theme', t);
    ic.setAttribute('href', t === 'dark' ? '#sun' : '#moon');
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  }
  apply(saved || (systemDark ? 'dark' : 'light'));
  btn.addEventListener('click', () => apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

/* ===== Header: shadow after scroll + highlight the section you are on ===== */
(function () {
  const nav = $('#nav'), box = $('#links'), links = $$('#links a');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function setActive(id) {
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    const a = $('#links a.active');
    if (a) box.scrollTo({ left: a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  }
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section').forEach((s) => io.observe(s));
})();

/* ===== Floating bubbles (small, decoration only) ===== */
(function () {
  const wrap = $('#bubbles');
  let h = window.innerHeight, w = window.innerWidth;
  wrap.style.setProperty('--h', h + 'px');
  // Ignore small height changes (phone address bar) so bubbles stay smooth
  window.addEventListener('resize', () => {
    if (window.innerWidth !== w || Math.abs(window.innerHeight - h) > 150) {
      w = window.innerWidth; h = window.innerHeight; wrap.style.setProperty('--h', h + 'px');
    }
  });
  for (let i = 0; i < 24; i++) {
    const b = document.createElement('i'), s = rand(14, 36);
    b.style.cssText = `width:${s}px;height:${s}px;left:${rand(0, 97)}%;--y:${rand(5, 90)}%;--d:${rand(16, 32)}s;--delay:-${rand(0, 30)}s;--sway:${rand(-50, 50)}px;--o:${rand(0.4, 0.8).toFixed(2)}`;
    wrap.appendChild(b);
  }
})();

/* ===== Fade-up animation when sections come into view ===== */
(function () {
  const els = $$('.head, .card, .hero-text, .hero .photo');
  if (!('IntersectionObserver' in window)) return;
  els.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
})();

/* ===== Photo fallback (shows NP if the photo is missing) ===== */
$('#photo').addEventListener('error', function () {
  const d = document.createElement('div');
  d.className = 'photo avatar'; d.textContent = 'NP';
  this.replaceWith(d);
});

/* ===== Footer year ===== */
$('#year').textContent = new Date().getFullYear();

/* ===== Contact form: sends the message when you click the button ===== */
async function sendMessage({ name, email, message }) {
  const subject = 'New message from your portfolio';
  try {
    if (WEB3FORMS_KEY) {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, name, email, message, subject, from_name: 'Portfolio' }),
      });
      const d = await r.json().catch(() => ({}));
      return { ok: r.ok && d.success === true };
    }
    const r = await fetch('https://formsubmit.co/ajax/' + EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, email, message, _subject: subject, _template: 'table', _captcha: 'false' }),
    });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok && String(d.success) === 'true', activation: /activat/i.test(d.message || '') };
  } catch (err) {
    console.error('Form error:', err && err.message ? err.message : err);
    return { ok: false, offline: true };
  }
}

(function () {
  const form = $('#form'), status = $('#status'), btn = $('#send');
  function show(text, error) {
    status.textContent = text; status.hidden = false;
    status.classList.toggle('err', !!error);
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (d._honey) return;
    btn.disabled = true; btn.textContent = 'Sending...'; status.hidden = true;
    const res = await sendMessage(d);
    if (res.ok) {
      show('Thank you! Your message was sent.', false);
      form.reset();
    } else if (res.activation) {
      show('One-time setup: an activation email was sent to ' + EMAIL + '. Click Activate in it, then press Send again.', true);
    } else if (res.offline) {
      show(navigator.onLine
        ? 'The form service is blocked here. Open the live site in a normal browser tab (not a preview), turn off ad blocker, and press Send again.'
        : 'You are offline. Please check your internet and press Send again.', true);
    } else {
      show('The message could not be sent. Please press Send again, or email ' + EMAIL + '.', true);
    }
    btn.disabled = false; btn.textContent = 'Send Message';
  });
})();