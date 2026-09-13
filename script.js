/* =========================================================
   LIVERMONT — script.js
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
    }, 2200);

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