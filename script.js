/* =========================================================
   CRISTY BIENES RAÍCES — script.js
   Lenis smooth scroll, GSAP/ScrollTrigger, canvas hero,
   scroll horizontal (desktop) / carrusel táctil (mobile)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth > 1024;

  gsap.registerPlugin(ScrollTrigger);

  /* -----------------------------------------------------
     1. LENIS SMOOTH SCROLL
     Menor "dampening" / duración en móvil para mantener
     60fps sin sobrecargar el procesador.
  ----------------------------------------------------- */
  let lenis;

  function initLenis(){
    if (lenis) lenis.destroy();

    lenis = new Lenis({
      duration: isDesktop() ? 1.1 : 0.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
      syncTouch: false,
      touchMultiplier: isDesktop() ? 1.5 : 1.8,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  if (!prefersReducedMotion){
    initLenis();
  }

  /* -----------------------------------------------------
     2. NAVBAR — estado scrolled + menú móvil
  ----------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  ScrollTrigger.create({
    start: 'top -60',
    end: 99999,
    toggleClass: { targets: navbar, className: 'is-scrolled' },
  });

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  navMenu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetEl = targetId && targetId.startsWith('#') ? document.querySelector(targetId) : null;

      // Cierra el menú móvil primero para que el scroll no compita con la
      // transición del panel.
      const wasOpen = navMenu.classList.contains('is-open');
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');

      if (targetEl){
        e.preventDefault();
        const doScroll = () => {
          if (lenis){
            lenis.scrollTo(targetEl, {
              offset: -84,
              duration: prefersReducedMotion ? 0 : 1.3,
              easing: (t) => 1 - Math.pow(1 - t, 4),
            });
          } else {
            targetEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          }
        };
        // Pequeño delay si el menú móvil estaba abierto, para que el panel
        // termine de cerrarse antes de desplazar la página.
        wasOpen ? setTimeout(doScroll, 320) : doScroll();
      }
    });
  });

  /* -----------------------------------------------------
     3. HERO — Kinetic typography (un único momento bold)
  ----------------------------------------------------- */
  function splitIntoWords(el){
    const crecerEl = el.querySelector('.word-crecer');
    if (crecerEl) {
      const spans = [];
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const words = node.textContent.trim().split(' ');
          words.forEach((w, i) => {
            if (!w) return;
            const s = document.createElement('span');
            s.textContent = w + '\u00A0';
            el.insertBefore(s, node);
            spans.push(s);
          });
          el.removeChild(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          spans.push(node);
        }
      });
      return spans;
    }
    const text = el.textContent.trim();
    el.textContent = '';
    const words = text.split(' ');
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.textContent = word + (i < words.length - 1 ? '\u00A0' : '');
      el.appendChild(span);
    });
    return el.querySelectorAll('span');
  }

  const titleLines = document.querySelectorAll('.hero__title-line');
  let allWordSpans = [];
  titleLines.forEach(line => {
    allWordSpans = allWordSpans.concat(Array.from(splitIntoWords(line)));
  });

  if (prefersReducedMotion){
    gsap.set(allWordSpans, { y: 0, opacity: 1 });
  } else {
    gsap.set(allWordSpans, { y: '110%', opacity: 0 });

    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl
      .to(allWordSpans, {
        y: '0%',
        opacity: 1,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.06,
      })
      .from('.hero__subtitle', {
        y: 16,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.5')
      .from('.hero__actions', {
        y: 16,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.55')
      .from('.hero__coords', {
        opacity: 0,
        duration: 0.6,
      }, '-=1.3');
  }

  /* -----------------------------------------------------
     3b. KINETIC FONT MORPHING — "crecer."
  ----------------------------------------------------- */
  const wordCrecer = document.getElementById('wordCrecer');
  if (wordCrecer) {
    const fonts = [
      "'Fraunces', Georgia, serif",
      "'Playfair Display', Georgia, serif",
      "'Syne', sans-serif",
      "'Space Grotesk', sans-serif",
      "'Caveat', cursive",
      "'Outfit', sans-serif"
    ];
    let fontIndex = 0;
    let morphInterval = null;
    let isHoveringCrecer = false;

    // Auto-morph sutil cada 2.2s
    setInterval(() => {
      if (!isHoveringCrecer) {
        fontIndex = (fontIndex + 1) % fonts.length;
        wordCrecer.style.fontFamily = fonts[fontIndex];
      }
    }, 1000);

    // Ráfaga kinetic al pasar el mouse (10 FPS font shuffle)
    wordCrecer.addEventListener('mouseenter', () => {
      isHoveringCrecer = true;
      let count = 0;
      clearInterval(morphInterval);
      morphInterval = setInterval(() => {
        fontIndex = (fontIndex + 1) % fonts.length;
        wordCrecer.style.fontFamily = fonts[fontIndex];
        count++;
        if (count > 20) {
          clearInterval(morphInterval);
        }
      }, 90);
    });

    wordCrecer.addEventListener('mouseleave', () => {
      isHoveringCrecer = false;
      clearInterval(morphInterval);
    });
  }

  /* -----------------------------------------------------
     4. HERO — Parallax sutil del terreno + canvas
  ----------------------------------------------------- */
  if (!prefersReducedMotion){
    gsap.to('.hero__video', {
      yPercent: 15,
      scale: 1.08,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.hero__content', {
      yPercent: 12,
      opacity: 0.4,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  /* -----------------------------------------------------
     5. HERO VIDEO — pausa el video si el usuario prefiere
     menos movimiento, para no forzar autoplay innecesario.
  ----------------------------------------------------- */
  const heroVideo = document.getElementById('heroVideo');
  if (prefersReducedMotion && heroVideo){
    heroVideo.pause();
  }

  /* -----------------------------------------------------
     6. PROYECTOS — reveal suave y confiable al hacer scroll
  ----------------------------------------------------- */
  gsap.utils.toArray('.proyecto').forEach(proyecto => {
    const infoItems = proyecto.querySelectorAll('.proyecto__info > *');
    const shape = proyecto.querySelector('.proyecto__shape');
    const img = proyecto.querySelector('.proyecto__img');

    if (infoItems.length > 0) {
      gsap.from(infoItems, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.08,
        overwrite: 'auto',
        scrollTrigger: {
          trigger: proyecto,
          start: 'top 75%',
          once: true, // Asegura que una vez revelado, el título NUNCA desaparezca al scrollear
        },
        onComplete: () => {
          gsap.set(infoItems, { clearProps: 'opacity,transform' });
        }
      });
    }

    if (img) {
      gsap.fromTo(img,
        { scale: 1.1 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: proyecto,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }
  });

  /* -----------------------------------------------------
     7. RECORRIDO — Horizontal scroll (desktop) /
        carrusel táctil nativo (mobile/tablet)
  ----------------------------------------------------- */
  let recorridoST;

  function setupRecorrido(){
    if (recorridoST){
      recorridoST.kill();
      recorridoST = null;
      gsap.set('#recorridoPanels', { clearProps: 'transform' });
    }

    const track = document.getElementById('recorridoTrack');
    const panels = document.getElementById('recorridoPanels');

    if (isDesktop() && !prefersReducedMotion){
      const scrollDistance = panels.scrollWidth - track.clientWidth;

      if (scrollDistance > 0){
        recorridoST = gsap.to(panels, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: '.recorrido',
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        }).scrollTrigger;
      }
    }
    // En mobile/tablet, .recorrido__panels usa overflow-x:auto nativo (CSS),
    // sin GSAP pin — scroll táctil fluido sin bloqueos.
  }

  setupRecorrido();

  /* -----------------------------------------------------
     8. CIFRAS — contadores animados
  ----------------------------------------------------- */
  document.querySelectorAll('.cifra__numero, .empresa__numero').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(counter.val).toLocaleString('es-PE');
          },
        });
      },
    });
  });

  /* -----------------------------------------------------
     9. TITULARES — revelado progresivo genérico
  ----------------------------------------------------- */
  gsap.utils.toArray('h2').forEach(heading => {
    if (heading.closest('.hero') || heading.closest('.proyecto')) return;
    gsap.from(heading, {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        once: true,
      },
      onComplete: () => {
        gsap.set(heading, { clearProps: 'opacity,transform' });
      }
    });
  });

  gsap.from('.reviews-ticker', {
    y: 24,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.reviews-ticker',
      start: 'top 85%',
      once: true,
    },
  });

  gsap.from('.confianza__legal', {
    y: 24,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.confianza__legal',
      start: 'top 88%',
      toggleActions: 'play none none reverse',
    },
  });

  /* -----------------------------------------------------
     10. FAQ — acordeón (una pregunta abierta a la vez)
  ----------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen){
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }

      // Recalcula ScrollTrigger porque la altura de la página cambia
      // al abrir/cerrar una respuesta.
      ScrollTrigger.refresh();
    });
  });

  /* -----------------------------------------------------
     11. FORMULARIO DE CONTACTO → redirige a WhatsApp
  ----------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const proyecto = document.getElementById('proyecto').value;

    const mensaje = `Hola, soy ${nombre}. Mi WhatsApp es ${telefono} y me interesa el proyecto: ${proyecto}.`;
    const url = `https://wa.me/51941454999?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener');
  });

  /* -----------------------------------------------------
     11b. FILTRO INTERACTIVO DE PROYECTOS (Huaral / Oxapampa)
  ----------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.cards-grid .p-card');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        projectCards.forEach(card => {
          if (cat === 'all' || card.dataset.category === cat) {
            card.classList.remove('is-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
        ScrollTrigger.refresh();
      });
    });
  }

  /* -----------------------------------------------------
     13. GALERÍA NARRATIVA — parallax de las fotos + entrada
         de las tarjetas glass ligada al scroll
  ----------------------------------------------------- */
  if (!prefersReducedMotion){
    const storyEl = document.querySelector('.story');

    if (storyEl){
      // Cada foto deriva a distinta velocidad mientras el marco está fijo
      gsap.utils.toArray('.story__photo').forEach((photo) => {
        const speed = parseFloat(photo.dataset.speed) || 10;
        gsap.fromTo(photo,
          { yPercent: -speed },
          {
            yPercent: speed,
            rotation: speed > 0 ? 2 : -2,   // se suma al rotate de CSS
            ease: 'none',
            scrollTrigger: {
              trigger: storyEl,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          }
        );
      });

      // Cada tarjeta aparece a medida que sube por la pantalla
      gsap.utils.toArray('.story__card').forEach((card) => {
        gsap.fromTo(card,
          { opacity: 0.15, y: 50 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              end: 'top 60%',
              scrub: true,
            },
          }
        );
      });
    }
  }

  /* -----------------------------------------------------
     14. MAPAS — un solo iframe, creado solo cuando la sección
         se acerca al viewport. Las pestañas cambian el src.
  ----------------------------------------------------- */
  const ubicFrame = document.getElementById('ubicFrame');
  const ubicOpen  = document.getElementById('ubicOpen');
  const ubicTabs  = document.querySelectorAll('.ubic__tab');

  if (ubicFrame && ubicTabs.length){
    // Reemplaza por las coordenadas EXACTAS de cada proyecto
    // (clic derecho en Google Maps → copiar coordenadas).
    const ZONES = {
      huaral:   { lat: -11.4956, lng: -77.2081, zoom: 14, label: 'Huaral' },
      oxapampa: { lat: -10.5747, lng: -75.3960, zoom: 14, label: 'Oxapampa' },
    };

    let currentZone = 'huaral';
    let mapIframe = null;

    const embedUrl = (z) =>
      `https://www.google.com/maps?q=${z.lat},${z.lng}&z=${z.zoom}&output=embed`;
    const openUrl = (z) =>
      `https://www.google.com/maps/search/?api=1&query=${z.lat},${z.lng}`;

    function renderMap(){
      const z = ZONES[currentZone];
      ubicOpen.href = openUrl(z);

      if (!mapIframe){
        mapIframe = document.createElement('iframe');
        mapIframe.loading = 'lazy';
        mapIframe.referrerPolicy = 'no-referrer-when-downgrade';
        mapIframe.setAttribute('allowfullscreen', '');
        ubicFrame.textContent = '';
        ubicFrame.appendChild(mapIframe);
        ubicFrame.dataset.loaded = 'true';
      }
      mapIframe.title = `Mapa de ${z.label}`;
      mapIframe.src = embedUrl(z);
    }

    // Carga diferida real: nada de Google Maps hasta estar cerca de la sección
    const mapObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)){
        renderMap();
        mapObserver.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    mapObserver.observe(ubicFrame);

    ubicTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        currentZone = tab.dataset.zone;
        ubicTabs.forEach(t => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        if (mapIframe) renderMap();
        else ubicOpen.href = openUrl(ZONES[currentZone]);
      });
    });

    ubicOpen.href = openUrl(ZONES[currentZone]);
  }

  /* -----------------------------------------------------
     15. SONIDO AMBIENTAL — nunca autoplay; el usuario decide.
         Fade in/out suave, volumen bajo, pausa al cambiar de pestaña.
  ----------------------------------------------------- */
  const ambientAudio = document.getElementById('ambientAudio');
  const soundToggle  = document.getElementById('soundToggle');
  const soundTip     = document.getElementById('soundTip');

  if (ambientAudio && soundToggle){
    const TARGET_VOLUME = 0.22;   // sutil (en iOS el volumen lo fija el sistema)
    const PREF_KEY = 'lv-sound';
    const HINT_KEY = 'lv-sound-hint';
    let fadeRaf = null;
    let isPlaying = false;
    let resumeOnVisible = false;

    const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
    const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

    function setUI(on){
      isPlaying = on;
      soundToggle.setAttribute('aria-pressed', String(on));
      soundToggle.setAttribute('aria-label', on ? 'Silenciar sonido ambiental' : 'Activar sonido ambiental');
    }

    function fadeTo(volume, ms, done){
      cancelAnimationFrame(fadeRaf);
      const from = ambientAudio.volume;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        ambientAudio.volume = Math.max(0, Math.min(1, from + (volume - from) * p));
        if (p < 1) fadeRaf = requestAnimationFrame(step);
        else if (done) done();
      };
      fadeRaf = requestAnimationFrame(step);
    }

    async function playAmbient(){
      try{
        ambientAudio.volume = 0;
        await ambientAudio.play();          // solo funciona tras un gesto del usuario
        fadeTo(TARGET_VOLUME, 1800);
        setUI(true);
        safeSet(PREF_KEY, 'on');
        hideTip();
      } catch (err){
        setUI(false);                       // el navegador lo bloqueó: sin drama
      }
    }

    function pauseAmbient(savePref = true){
      fadeTo(0, 600, () => ambientAudio.pause());
      setUI(false);
      if (savePref) safeSet(PREF_KEY, 'off');
    }

    soundToggle.addEventListener('click', () => {
      isPlaying ? pauseAmbient() : playAmbient();
    });

    // Si el usuario lo dejó activado antes, se reanuda con su primer gesto
    // (un scroll NO cuenta como gesto para el navegador; un toque o tecla sí).
    if (safeGet(PREF_KEY) === 'on'){
      const resume = () => {
        playAmbient();
        ['pointerdown', 'keydown'].forEach(ev => window.removeEventListener(ev, resume));
      };
      ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, resume, { once: true }));
    }

    // Cortesía: no sonar en pestañas en segundo plano
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isPlaying){
        resumeOnVisible = true;
        ambientAudio.pause();
      } else if (!document.hidden && resumeOnVisible){
        resumeOnVisible = false;
        ambientAudio.play().catch(() => setUI(false));
      }
    });

    // Aviso discreto (una sola vez)
    function hideTip(){ soundTip.classList.remove('is-visible'); }
    if (!safeGet(HINT_KEY) && !safeGet(PREF_KEY)){
      setTimeout(() => {
        if (!isPlaying){
          soundTip.classList.add('is-visible');
          safeSet(HINT_KEY, '1');
          setTimeout(hideTip, 5000);
        }
      }, 6000);
    }
  }

  /* -----------------------------------------------------
     12. RESIZE — recalcular recorrido y Lenis
  ----------------------------------------------------- */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupRecorrido();
      initLenis();
      ScrollTrigger.refresh();
    }, 250);
  });

  ScrollTrigger.refresh();
});