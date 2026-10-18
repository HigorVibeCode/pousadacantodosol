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
  document.querySelectorAll<HTMLElement>('main section:not([data-hero]) > :not(ul):not(ol):not(script)').forEach((el) => targets.push(el));
  document.querySelectorAll<HTMLElement>('main section:not([data-hero]) ul.grid, main section:not([data-hero]) ol.space-y-3').forEach((list) => {
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
