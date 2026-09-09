(() => {
  const root = document.querySelector('.about-laptop');
  if (!root) return;
  const get = id => root.querySelector('#laptop-os-' + id);
  const laptop = get('laptop');
  const wrapper = get('laptopWrapper');
  const screen = get('screen');
  const lid = root.querySelector('.laptop-os-screen-frame');
  const lidBack = root.querySelector('.laptop-os-lid-back');
  const desktop = get('desktop');
  const poweredOff = get('poweredOff');
  const powerButton = get('powerButton');
  const terminalInput = get('terminalInput');
  const terminalOutput = get('terminalOutput');
  const icons = root.querySelector('.laptop-os-desktop-icons');
  const windows = [...root.querySelectorAll('.laptop-os-app-window')];
  const appButtons = [...root.querySelectorAll('[data-window]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const mobileLayout = matchMedia('(max-width:720px)');
  const tourWindows = ['about', 'skills', 'experience', 'projects', 'education', 'contact', 'resume'].map(name => `laptop-os-${name}Window`);
  const windowEffects = new Map();
  let tourTimer = null;
  let tourIndex = 0;
  let tourPaused = false;
  let tourVisible = false;
  let tourStarted = false;
  let poweredOn = true;
  let launcher = null;
  let lidState = 'open';
  let lidObserver = null;
  let lidAnimation = null;
  let displayAnimation = null;
  let lidBackAnimation = null;
  let contentFitFrame = null;

  function fitWindowContent(app) {
    if (!app?.classList.contains('active')) return;
    const content = app.querySelector('.laptop-os-window-content, .laptop-os-terminal');
    const header = app.querySelector('.laptop-os-window-header');
    if (!content || !header) return;
    content.style.zoom = '1';
    const availableHeight = app.clientHeight - header.offsetHeight;
    const contentHeight = content.scrollHeight;
    if (availableHeight <= 0 || contentHeight <= availableHeight) return;

    let lower = 0.1;
    let upper = 1;
    for (let step = 0; step < 10; step++) {
      const scale = (lower + upper) / 2;
      if (contentHeight * scale <= availableHeight + 0.5) lower = scale;
      else upper = scale;
    }
    content.style.zoom = String(Math.floor(lower * 1000) / 1000);
  }

  function scheduleContentFit() {
    cancelAnimationFrame(contentFitFrame);
    contentFitFrame = requestAnimationFrame(() => {
      fitWindowContent(root.querySelector('.laptop-os-app-window.active'));
    });
  }

  function syncDesktopScale() {
    if (!mobileLayout.matches) {
      desktop.style.removeProperty('--laptop-os-desktop-scale');
      return;
    }
    desktop.style.setProperty('--laptop-os-desktop-scale', String(screen.clientWidth / 560));
  }

  function stopTourTimer() {
    clearTimeout(tourTimer);
    tourTimer = null;
  }

  function setTourPaused(paused) {
    tourPaused = paused;
    stopTourTimer();
    if (!paused) startTour();
  }

  function startTour() {
    stopTourTimer();
    if (tourPaused || !tourVisible || document.hidden || !poweredOn || lidState !== 'open') return;
    if (!tourStarted || !windows.some(app => app.classList.contains('active') && tourWindows.includes(app.id))) {
      tourStarted = true;
      openWindow(tourWindows[tourIndex], null, true);
    }
    tourTimer = setTimeout(() => {
      tourIndex = (tourIndex + 1) % tourWindows.length;
      openWindow(tourWindows[tourIndex], null, true);
      startTour();
    }, 5000);
  }

  function finishOpeningLid() {
    lidState = 'open';
    lidObserver?.disconnect();
    lidAnimation?.cancel();
    displayAnimation?.cancel();
    lidBackAnimation?.cancel();
    lidAnimation = null;
    displayAnimation = null;
    lidBackAnimation = null;
    root.classList.remove('is-lid-closed', 'is-lid-opening');
    wrapper.removeAttribute('tabindex');
    desktop.inert = !poweredOn;
    startTour();
  }

  function openLid(immediate = false) {
    if (lidState === 'open') return;
    if (immediate || reducedMotion.matches) {
      finishOpeningLid();
      return;
    }
    if (lidState === 'opening') return;
    lidState = 'opening';
    lidObserver?.disconnect();
    root.classList.replace('is-lid-closed', 'is-lid-opening');
    lidAnimation = lid.animate([
      { transform:'rotateX(-88deg)', offset:0 },
      { transform:'rotateX(3deg)', offset:0.82 },
      { transform:'rotateX(0deg)', offset:1 }
    ], { duration:1800, easing:'cubic-bezier(.22,.68,.22,1)', fill:'both' });
    displayAnimation = screen.animate([
      { filter:'brightness(0)', offset:0 },
      { filter:'brightness(0)', offset:0.3 },
      { filter:'brightness(1)', offset:1 }
    ], { duration:1800, easing:'ease-out', fill:'both' });
    lidBackAnimation = lidBack.animate([
      { opacity:1, offset:0 },
      { opacity:1, offset:0.15 },
      { opacity:0, offset:1 }
    ], { duration:650, easing:'ease-out', fill:'both' });
    lidAnimation.finished.then(finishOpeningLid).catch(() => {});
  }

  function updateClock() {
    get('clock').textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  }
  updateClock();
  setInterval(updateClock, 1000);

  wrapper.addEventListener('pointermove', event => {
    if (lidState !== 'open' || reducedMotion.matches || !finePointer.matches || root.contains(document.activeElement)) return;
    if (event.target.closest('.laptop-os-screen, button, input, a')) return;
    const bounds = wrapper.getBoundingClientRect();
    const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
    const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
    laptop.style.setProperty("--tilt-x", `${-y * 3}deg`);
    laptop.style.setProperty("--tilt-y", `${x * 4}deg`);
  });
  wrapper.addEventListener('pointerleave', () => { laptop.style.removeProperty('--tilt-x'); laptop.style.removeProperty('--tilt-y'); });
  wrapper.addEventListener('focusin', () => {
    openLid(true);
    setTourPaused(true);
    laptop.style.removeProperty('--tilt-x');
    laptop.style.removeProperty('--tilt-y');
  });

  function cancelWindowEffect(app) {
    windowEffects.get(app)?.cancel();
    windowEffects.delete(app);
    app.classList.remove('is-closing');
  }

  function animateWindow(app, closing = false) {
    cancelWindowEffect(app);
    if (reducedMotion.matches || typeof app.animate !== 'function') return;
    if (closing) app.classList.add('is-closing');
    const frames = closing ? [
      { opacity:1, transform:'translateY(0) scale(1)' },
      { opacity:0, transform:'translateY(24px) scale(.82)' }
    ] : [
      { opacity:0, transform:'translateY(16px) scale(.88)' },
      { opacity:1, transform:'translateY(0) scale(1)' }
    ];
    const effect = app.animate(frames, {
      duration:closing ? 240 : 360,
      easing:closing ? 'ease-in' : 'cubic-bezier(.16,1,.3,1)',
      fill:'both'
    });
    windowEffects.set(app, effect);
    effect.finished.then(() => {
      if (windowEffects.get(app) !== effect) return;
      windowEffects.delete(app);
      app.classList.remove('is-closing');
      effect.cancel();
    }).catch(() => {});
  }

  function closeWindows(restoreFocus = false, immediate = false) {
    windows.forEach(app => {
      const wasActive = app.classList.contains('active');
      app.classList.remove('active');
      app.inert = true;
      if (immediate) cancelWindowEffect(app);
      else if (wasActive) animateWindow(app, true);
    });
    icons.inert = false;
    icons.style.visibility = '';
    appButtons.forEach(button => button.setAttribute('aria-expanded','false'));
    if (restoreFocus && launcher) launcher.focus({preventScroll:true});
  }

  function openWindow(id, button, automatic = false) {
    if (!poweredOn) return;
    const selected = windows.find(app => app.id === id);
    if (!selected) return;
    if (!automatic) {
      openLid(true);
      setTourPaused(true);
    }
    closeWindows();
    launcher = button || root.querySelector(`.laptop-os-dock [data-window="${id}"]`);
    cancelWindowEffect(selected);
    selected.classList.add('active');
    selected.inert = false;
    fitWindowContent(selected);
    animateWindow(selected);
    icons.inert = true;
    icons.style.visibility = 'hidden';
    appButtons.forEach(item => item.setAttribute('aria-expanded',String(item.dataset.window === id)));
    const index = tourWindows.indexOf(id);
    if (index !== -1) tourIndex = index;
    if (!automatic) {
      const focusTarget = selected.id === 'laptop-os-terminalWindow' ? terminalInput : selected.querySelector('button');
      focusTarget.focus({preventScroll:true});
    }
  }

  appButtons.forEach(button => {
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click', () => openWindow(button.dataset.window, button));
  });
  windows.forEach(app => {
    app.querySelector('.laptop-os-close').addEventListener('click', () => { setTourPaused(true); closeWindows(true); });
    app.querySelector('.laptop-os-minimize').addEventListener('click', () => { setTourPaused(true); closeWindows(true); });
    const maximize = app.querySelector('.laptop-os-maximize');
    maximize.setAttribute('aria-pressed','false');
    maximize.addEventListener('click', () => {
      setTourPaused(true);
      const expanded = app.classList.toggle('maximized');
      fitWindowContent(app);
      maximize.setAttribute('aria-pressed',String(expanded));
      maximize.setAttribute('aria-label',expanded ? 'Restore window size' : 'Maximize window');
    });
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && windows.some(app => app.classList.contains('active'))) {
      setTourPaused(true);
      closeWindows(true);
    }
  });

  powerButton.addEventListener('click', () => {
    openLid(true);
    poweredOn = !poweredOn;
    stopTourTimer();
    closeWindows(false, true);
    desktop.inert = !poweredOn;
    poweredOff.classList.toggle('active',!poweredOn);
    poweredOff.setAttribute('aria-hidden',String(poweredOn));
    powerButton.setAttribute('aria-pressed',String(poweredOn));
    powerButton.setAttribute('aria-label',poweredOn ? 'Turn laptop off' : 'Turn laptop on');
    if (poweredOn) setTourPaused(false);
    if (poweredOn && !reducedMotion.matches) {
      screen.animate([{filter:'brightness(0)'},{filter:'brightness(1.3)'},{filter:'brightness(1)'}],{duration:700,easing:'ease-out'});
    }
  });
const commands = {

    help: `
Available commands:
about
skills
experience
projects
contact
clear
`,

    about: `
Anish Reddy Nukala
Computer Science @ Iowa State University
Backend + Full-Stack Developer
`,

    skills: `
Languages:
Java, Python, JavaScript, SQL, C, C++

Frameworks:
Spring Boot, React, Node.js, Apache Camel

Tools:
Git, GitLab, Maven, OpenShift, JUnit, Mockito
`,

    experience: `
Corpay — Data Management Intern

Built Java/Spring Boot enterprise
data processing systems and
Oracle-based pipelines.

Processed ~30,000 records
with 25,000+ database updates.
`,

    projects: `
1. Fuel Transaction Processing System
2. Cy Collectibles
3. Explore Ames
4. AI Satisfaction Predictor
`,

    contact: `
GitHub   github.com/anishnukala
LinkedIn linkedin.com/in/anishnukala
Email    anishnukala@gmail.com
`

};

  terminalInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    const command = terminalInput.value.trim().toLowerCase();
    terminalInput.value = '';
    if (!command) return;
    terminalOutput.replaceChildren();
    if (command === 'clear') return;
    const commandLine = document.createElement('div');
    commandLine.className = 'laptop-os-green';
    commandLine.textContent = `anish@portfolio:~ $ ${command}`;
    const response = document.createElement('pre');
    response.textContent = Object.hasOwn(commands,command) ? commands[command].trim() : `command not found: ${command}`;
    terminalOutput.append(commandLine,response);
  });

  screen.addEventListener('dblclick', event => {
    if (event.target.closest('.laptop-os-app-window, .laptop-os-desktop-icon, .laptop-os-dock')) return;
    openWindow('laptop-os-aboutWindow');
  });

  if (!reducedMotion.matches && 'IntersectionObserver' in window && typeof lid.animate === 'function') {
    lidState = 'closed';
    root.classList.add('is-lid-closed');
    desktop.inert = true;
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', 'Interactive portfolio laptop');
    lidObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) openLid();
    }, { threshold:0.2 });
    lidObserver.observe(wrapper);
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      openLid(true);
      windowEffects.forEach(effect => effect.finish());
    }
  });

  syncDesktopScale();
  mobileLayout.addEventListener('change', syncDesktopScale);
  if ('ResizeObserver' in window) {
    const screenObserver = new ResizeObserver(() => {
      syncDesktopScale();
      scheduleContentFit();
    });
    screenObserver.observe(screen);
    const sizeObserver = new ResizeObserver(scheduleContentFit);
    windows.forEach(app => sizeObserver.observe(app));
  } else {
    window.addEventListener('resize', () => {
      syncDesktopScale();
      scheduleContentFit();
    });
  }
  const contentObserver = new MutationObserver(scheduleContentFit);
  windows.forEach(app => contentObserver.observe(app, { childList:true, characterData:true, subtree:true }));
  document.fonts?.ready.then(scheduleContentFit);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTourTimer();
    else startTour();
  });
  if ('IntersectionObserver' in window) {
    const tourObserver = new IntersectionObserver(entries => {
      tourVisible = entries.some(entry => entry.isIntersecting);
      if (tourVisible) startTour();
      else stopTourTimer();
    }, { threshold:0.2 });
    tourObserver.observe(wrapper);
  } else {
    tourVisible = true;
    startTour();
  }
})();
