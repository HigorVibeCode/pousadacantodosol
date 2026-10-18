/**
 * Movimento da página: revelar ao rolar, paralaxe do herói, cabeçalho compacto e fotos que surgem.
 * Tudo é desligado quando o visitante prefere menos movimento, e nada esconde conteúdo sem JavaScript.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion() {
  const html = document.documentElement;
  if (reduced) return;
  html.classList.add('js-motion');

  // 1. Revelar ao rolar: blocos de seção e itens de grade (escalonados)
  const targets: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('main section:not([data-hero]):not([data-no-reveal]) > :not(ul):not(ol):not(script), [data-no-reveal] [data-reveal]').forEach((el) => targets.push(el));
  document.querySelectorAll<HTMLElement>('main section:not([data-hero]):not([data-no-reveal]) ul.grid, main section:not([data-hero]):not([data-no-reveal]) ol.space-y-3').forEach((list) => {
    Array.from(list.children).forEach((li, i) => { (li as HTMLElement).style.setProperty('--i', String(Math.min(i, 8))); targets.push(li as HTMLElement); });
  });
  document.querySelectorAll<HTMLElement>('.horizonte').forEach((el) => targets.push(el));
  targets.forEach((el) => el.setAttribute('data-reveal', ''));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
  targets.forEach((el) => io.observe(el));
  // no fim da página, revela o que sobrou (blocos encostados na borda inferior)
  const revealRest = () => { if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 60) targets.forEach((el) => el.classList.add('in')); };
  window.addEventListener('scroll', revealRest, { passive: true });

  // Abertura: o sol do logo nasce uma vez por visita (não a cada página)
  try {
    if (!sessionStorage.getItem('orla-sol')) { document.querySelector('.logo-sol')?.classList.add('nascer'); sessionStorage.setItem('orla-sol', '1'); }
  } catch { /* armazenamento bloqueado: sem animação */ }
  // Entrada do herói: ao terminar, remove a animação para não criar contexto de empilhamento
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach((el) => el.addEventListener('animationend', () => el.removeAttribute('data-enter'), { once: true }));

  // Cenas de Prado: entram com .in e recebem o progresso de rolagem em --p (0 = entrando, 1 = saindo)
  const cenas = Array.from(document.querySelectorAll<HTMLElement>('[data-cena]'));
  if (cenas.length) {
    const ioCena = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); ioCena.unobserve(e.target); } }, { threshold: 0.35 });
    cenas.forEach((c) => ioCena.observe(c));
  }
  const updateCenas = () => {
    const vh = window.innerHeight;
    for (const c of cenas) {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      c.style.setProperty('--p', p.toFixed(3));
    }
  };

  // 2. Paralaxe do fundo do herói e progresso do cabeçalho
  const para = document.querySelector<HTMLElement>('[data-parallax]');
  const factor = para ? parseFloat(para.dataset.parallax || '0.3') : 0;
  const header = document.querySelector<HTMLElement>('[data-header]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (para && y < window.innerHeight * 1.2) para.style.transform = `translate3d(0, ${Math.round(y * factor)}px, 0)`;
      if (header) {
        header.classList.toggle('is-scrolled', y > 24);
        header.style.setProperty('--p', String(Math.min(1, y / 600)));
      }
      updateCenas();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 3. Fotos surgem quando carregam
  document.querySelectorAll<HTMLImageElement>('.foto-placeholder img').forEach((img) => {
    img.classList.add('foto-fade');
    const done = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', () => img.remove(), { once: true }); }
  });
}
