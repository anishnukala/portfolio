const sections = Array.from(document.querySelectorAll('main section, header#top'));
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const scrollLine = document.getElementById('scroll-line');
const scrollCue = document.querySelector('.scroll-cue');
const navResume = document.querySelector('.nav .resume-btn');
const nameText = document.querySelector('.name-text');
const heroSection = document.getElementById('top');
const projectSlideshows = Array.from(document.querySelectorAll('.project-slideshow'));
const navToggle = document.querySelector('.nav-toggle');
let scrollCueTimer = null;
let scrollCueDismissed = false;

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

function updateNavResume() {
  if (!navResume || !heroSection) return;

  const onHome = window.scrollY < Math.max(0, heroSection.offsetHeight - 96);
  navResume.classList.toggle('is-home-hidden', onHome);
}

function updateProjectSlideshows() {
  if (!projectSlideshows.length) return;

  let activeSlideshow = null;
  let bestDistance = Infinity;
  const viewportCenter = window.innerHeight / 2;

  projectSlideshows.forEach(slideshow => {
    const project = slideshow.closest('.featured') || slideshow;
    const rect = project.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const isVisible = visibleHeight >= Math.min(rect.height * 0.28, window.innerHeight * 0.38);

    if (isVisible) {
      const projectCenter = rect.top + rect.height / 2;
      const distance = Math.abs(projectCenter - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        activeSlideshow = slideshow;
      }
    }
  });

  projectSlideshows.forEach(slideshow => {
    slideshow.classList.toggle('is-sliding', slideshow === activeSlideshow);
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    highlightSection();
    updateScrollLine();
    updateScrollCue();
    updateNavResume();
    updateProjectSlideshows();
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

const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('_in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const linkedinPostCards = Array.from(document.querySelectorAll('.linkedin-post-card'));

function deactivateLinkedInPosts() {
  linkedinPostCards.forEach(card => card.classList.remove('is-active'));
}

linkedinPostCards.forEach(card => {
  card.addEventListener('click', (event) => {
    event.stopPropagation();
    deactivateLinkedInPosts();
    card.classList.add('is-active');
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      deactivateLinkedInPosts();
      card.classList.add('is-active');
    }
  });
});

document.addEventListener('click', deactivateLinkedInPosts);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') deactivateLinkedInPosts();
});

const otherProjectsCard = document.querySelector('.other-projects-card');
const viewProjectsBtn = document.getElementById('view-projects-btn');

if (otherProjectsCard && viewProjectsBtn) {
  const buttonLabel = viewProjectsBtn.querySelector('span');
  otherProjectsCard.classList.add('projects-toggle-ready');

  viewProjectsBtn.addEventListener('click', () => {
    const expanded = otherProjectsCard.classList.toggle('is-expanded');
    viewProjectsBtn.setAttribute('aria-expanded', String(expanded));
    if (buttonLabel) {
      buttonLabel.textContent = expanded ? 'Show Less' : 'View More Projects';
    }
  });
}

document.querySelectorAll('#projects .featured .proj-card').forEach((card, index) => {
  const paragraphs = Array.from(card.children).filter((child) => child.matches('p'));
  if (paragraphs.length < 2) return;

  const button = document.createElement('button');
  const detailsId = `project-details-${index + 1}`;
  button.type = 'button';
  button.className = 'project-details-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', detailsId);
  button.textContent = 'View More';

  card.classList.add('project-details-ready');
  paragraphs[1].id = detailsId;
  card.appendChild(button);

  button.addEventListener('click', () => {
    const expanded = card.classList.toggle('mobile-details-open');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'View Less' : 'View More';
  });
});

document.querySelectorAll('.leadership-flip-card').forEach((card) => {
  const setFlipped = (flipped) => {
    card.classList.toggle('is-flipped', flipped);
    card.setAttribute('aria-pressed', String(flipped));
  };

  card.addEventListener('click', () => {
    setFlipped(!card.classList.contains('is-flipped'));
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFlipped(!card.classList.contains('is-flipped'));
    } else if (event.key === 'Escape') {
      setFlipped(false);
    }
  });
});
