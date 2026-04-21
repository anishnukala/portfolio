// ===== Scroll progress + active link =====
const sections = Array.from(document.querySelectorAll('main section, header#top'));
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const scrollLine = document.getElementById('scroll-line');
const scrollCue = document.querySelector('.scroll-cue');
const mobileHeroResume = document.querySelector('.mobile-hero-resume');
const nameText = document.querySelector('.name-text');
const heroSection = document.getElementById('top');
const navToggle = document.querySelector('.nav-toggle');
let scrollCueTimer = null;
let scrollCueDismissed = false;
let mobileResumeTimer = null;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

function closeMenu() {
  document.body.classList.remove('menu-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  }
}

function toggleMenu() {
  const open = document.body.classList.toggle('menu-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
}

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

function updateScrollCue() {
  if (!scrollCue || scrollCueDismissed) return;
  if (window.scrollY > 10) {
    scrollCue.classList.remove('is-visible');
    scrollCue.classList.add('is-hidden');
    scrollCueDismissed = true;
    if (scrollCueTimer) clearTimeout(scrollCueTimer);
  }
}

function updateMobileHeroResume() {
  if (!mobileHeroResume || !heroSection) return;

  const isMobile = window.innerWidth <= 860;
  const heroRect = heroSection.getBoundingClientRect();
  const inHero = isMobile && heroRect.bottom > 140 && heroRect.top < window.innerHeight * 0.4;

  mobileHeroResume.classList.toggle('is-visible', inHero);
  mobileHeroResume.classList.toggle('is-hidden', !inHero);
}

// rAF scroll handler for better perf
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    highlightSection();
    updateScrollLine();
    updateScrollCue();
    updateMobileHeroResume();
    ticking = false;
  });
}
['scroll', 'resize', 'load'].forEach(ev => window.addEventListener(ev, onScroll, { passive: true }));
onScroll();

if (navToggle) {
  navToggle.addEventListener('click', toggleMenu);
}
navLinks.forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 860) closeMenu();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

if (nameText) {
  const finalText = nameText.dataset.finalText || nameText.textContent || '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/|[]{}-=+_*';
  const totalFrames = 28;
  let frame = 0;
  const prefixMatch = finalText.match(/^(\s*[<\[\(\{\/\\|_-]+[\s<\[\(\{\/\\|_-]*)/);
  const suffixMatch = finalText.match(/([\s>\]\)\}\/\\|_-]*[>\]\)\}\/\\|_-]+\s*)$/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const suffix = suffixMatch ? suffixMatch[0] : '';
  const coreText = finalText.slice(prefix.length, finalText.length - suffix.length);

  const scrambleTimer = window.setInterval(() => {
    const progress = frame / totalFrames;
    const revealed = Math.floor(progress * coreText.length);

    const nextCore = coreText
      .split('')
      .map((char, index) => {
        if (char === ' ') return ' ';
        if (index < revealed) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');

    nameText.textContent = `${prefix}${nextCore}${suffix}`;
    frame += 1;

    if (frame > totalFrames) {
      nameText.textContent = finalText;
      window.clearInterval(scrambleTimer);
    }
  }, 65);
}

if (scrollCue) {
  scrollCue.classList.add('is-hidden');
  scrollCueTimer = window.setTimeout(() => {
    if (window.scrollY <= 10 && !scrollCueDismissed) {
      scrollCue.classList.remove('is-hidden');
      scrollCue.classList.add('is-visible');
    }
  }, 3000);
}

if (mobileHeroResume) {
  mobileHeroResume.classList.add('is-hidden');
  mobileResumeTimer = window.setTimeout(() => {
    updateMobileHeroResume();
  }, 450);
}

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
      `mailto:arnukala@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyRaw)}`;

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
