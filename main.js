// ===== Scroll progress + active link =====
const sections = Array.from(document.querySelectorAll('main section, header#top'));
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const scrollLine = document.getElementById('scroll-line');

function highlightSection() {
  // pick the section whose top is above the viewport middle and closest to it
  const mid = window.innerHeight / 2;
  let current = sections[0];
  let bestTop = -Infinity;

  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= mid && rect.top > bestTop) {
      bestTop = rect.top;
      current = sec;
    }
  });

  // if we're at the absolute bottom, force the LAST section active
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  if (atBottom) current = sections[sections.length - 1];

  const id = current.id ? `#${current.id}` : '#top';
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === id));
}

function updateScrollLine() {
  if (!scrollLine) return;
  const scrollTop = window.scrollY;
  const docHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const pct = docHeight ? (scrollTop / docHeight) * 100 : 0;
  scrollLine.style.width = pct + '%';
}

// rAF scroll handler for better perf
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    highlightSection();
    updateScrollLine();
    ticking = false;
  });
}
['scroll', 'resize', 'load'].forEach(ev => window.addEventListener(ev, onScroll, { passive: true }));
onScroll();

// ===== Year =====
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

// ===== Reveal-on-scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('_in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== Cursor spotlight position =====
const setSpot = (x, y) => {
  document.body.style.setProperty('--mx', x + 'px');
  document.body.style.setProperty('--my', y + 'px');
};
window.addEventListener('mousemove', (e) => setSpot(e.clientX, e.clientY), { passive: true });
window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (t) setSpot(t.clientX, t.clientY);
}, { passive: true });

// Dim/brighten spotlight on idle
let spotTimer = null;
const dim = () => document.body.style.setProperty('--spot-alpha', '0.04');
const brighten = () => document.body.style.setProperty('--spot-alpha', '0.10');
const poke = () => { brighten(); clearTimeout(spotTimer); spotTimer = setTimeout(dim, 1600); };
['mousemove', 'touchstart', 'touchmove'].forEach(ev => window.addEventListener(ev, poke, { passive: true }));
dim();

// ===== Contact form =====
const form = document.getElementById('contactForm');
const resetBtn = document.getElementById('formReset');
const mCount = document.getElementById('mCount');

if (form) {
  const msg = form.querySelector('textarea[name="message"]');
  if (msg && mCount) {
    const upd = () => (mCount.textContent = `${msg.value.length}/500`);
    msg.addEventListener('input', upd, { passive: true });
    upd();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const reason = (fd.get('reason') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    const subject = reason ? `${reason} — Portfolio` : 'Message from Portfolio';
    const bodyRaw =
      `Name: ${name}\r\nEmail: ${email}\r\nReason: ${reason || '—'}\r\n\r\n${message}`;
    const mailto =
      `mailto:arnukala@iastate.edu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyRaw)}`;

    window.location.href = mailto;
    showToast('Opening your email app...');
  });

  if (resetBtn && mCount) {
    resetBtn.addEventListener('click', () => { form.reset(); mCount.textContent = '0/500'; });
  }
}

// ===== Copy buttons & toast =====
function copyText(text) {
  if (!navigator.clipboard) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied!'); }
    finally { document.body.removeChild(ta); }
    return;
  }
  navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
}
document.querySelectorAll('.chip[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => copyText(btn.getAttribute('data-copy') || ''));
});

let toastEl = null;
function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    Object.assign(toastEl.style, {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      transform: 'translateX(-50%)',
      padding: '10px 14px',
      background: '#111',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '10px',
      boxShadow: '0 6px 16px rgba(0,0,0,.35)',
      opacity: '0',
      transition: 'opacity .18s ease',
      zIndex: '9999',
      pointerEvents: 'none'
    });
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toastEl.style.opacity = '0'), 1000);
}