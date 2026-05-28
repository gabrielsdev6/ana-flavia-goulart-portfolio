/* ============ NAV scroll ============ */
const nav = document.getElementById('nav');
const onScroll = () => {
  if(window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============ Cursor ============ */
const dot  = document.getElementById('cursorDot');
const star = document.getElementById('cursorStar');
let mx = -50, my = -50, sx = -50, sy = -50;
window.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
});
function animateStar(){
  sx += (mx - sx) * 0.16;
  sy += (my - sy) * 0.16;
  star.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`;
  requestAnimationFrame(animateStar);
}
animateStar();

document.querySelectorAll('a, button, input, textarea, select, .shot, .svc, .t-card').forEach(el => {
  el.addEventListener('mouseenter', () => { star.classList.add('hover'); dot.classList.add('hover'); });
  el.addEventListener('mouseleave', () => { star.classList.remove('hover'); dot.classList.remove('hover'); });
});

window.addEventListener('mouseleave', () => { dot.style.opacity = star.style.opacity = '0'; });
window.addEventListener('mouseenter', () => { dot.style.opacity = star.style.opacity = '1'; });

/* ============ Reveal on scroll ============ */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============ Lightbox ============ */
const shots   = Array.from(document.querySelectorAll('.shot'));
const lb      = document.getElementById('lightbox');
const lbInner = document.getElementById('lbInner');
const lbCat   = document.getElementById('lbCat');
const lbName  = document.getElementById('lbName');
let lbIndex   = 0;
let lbAngle   = 0;

function getAngles(shotEl) {
  const raw = shotEl.dataset.angles || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function renderVisual(shotEl, angle) {
  const bg    = shotEl.dataset.bg || 'bg-noiva-1';
  const angles = getAngles(shotEl);
  const orig  = shotEl.querySelector('.shot__img');

  let visual = lbInner.querySelector('.lb-visual');
  if (visual) visual.remove();

  visual = document.createElement('div');
  visual.className = 'lb-visual';
  visual.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';

  if (angle === 0 || !angles[angle - 1]) {
    visual.classList.add(bg);
    visual.innerHTML = orig.innerHTML;
    visual.querySelectorAll('svg').forEach(svg => svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'));
    const noise = document.createElement('div');
    noise.style.cssText = `position:absolute;inset:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/></svg>");mix-blend-mode:overlay;opacity:0.4;`;
    visual.appendChild(noise);
  } else {
    const img = document.createElement('img');
    img.src = angles[angle - 1];
    img.alt = shotEl.dataset.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    visual.appendChild(img);
  }

  lbInner.insertBefore(visual, lbInner.firstChild);
  lbInner.querySelectorAll('.lb-dot').forEach((d, i) => d.classList.toggle('active', i === angle));
}

function buildAngleNav(shotEl) {
  const existing = lbInner.querySelector('.lb-angles');
  if (existing) existing.remove();

  const angles = getAngles(shotEl);
  const total  = angles.length + 1;
  if (total < 2) return;

  const anav = document.createElement('div');
  anav.className = 'lb-angles';
  anav.style.zIndex = '20';
  anav.innerHTML = `
    <button class="lb-angle-btn" id="lbAnglePrev" aria-label="Ângulo anterior">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6" stroke-linecap="round"/></svg>
    </button>
    <div class="lb-dots">${Array.from({length: total}, (_, i) => `<span class="lb-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>
    <button class="lb-angle-btn" id="lbAngleNext" aria-label="Próximo ângulo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6l6 6-6 6" stroke-linecap="round"/></svg>
    </button>
  `;
  lbInner.appendChild(anav);

  anav.querySelector('#lbAnglePrev').addEventListener('click', (e) => { e.stopPropagation(); changeAngle(-1); });
  anav.querySelector('#lbAngleNext').addEventListener('click', (e) => { e.stopPropagation(); changeAngle(1); });
}

function openLB(i) {
  lbIndex = i;
  lbAngle = 0;
  const s = shots[i];

  if (window.innerWidth <= 768) {
    lbInner.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;max-width:none;border-radius:0;';
  } else {
    lbInner.style.cssText = '';
  }

  buildAngleNav(s);
  renderVisual(s, 0);
  lbCat.textContent  = s.dataset.cat  || '';
  lbName.textContent = s.dataset.name || '';
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function changeAngle(d) {
  const s     = shots[lbIndex];
  const total = getAngles(s).length + 1;
  lbAngle     = (lbAngle + d + total) % total;
  renderVisual(s, lbAngle);
}

function closeLB() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function nextLB(d) {
  openLB((lbIndex + d + shots.length) % shots.length);
}

shots.forEach((s, i) => s.addEventListener('click', (e) => { e.preventDefault(); openLB(i); }));
document.getElementById('lbClose').addEventListener('click', closeLB);
document.getElementById('lbPrev').addEventListener('click', () => nextLB(-1));
document.getElementById('lbNext').addEventListener('click', () => nextLB(1));
lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLB();
  if (e.key === 'ArrowLeft')  nextLB(-1);
  if (e.key === 'ArrowRight') nextLB(1);
});

/* ============ Máscara de WhatsApp ============ */
const fTel = document.getElementById('fTel');
fTel.addEventListener('keydown', (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
});
fTel.addEventListener('input', () => {
  let v = fTel.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 7)      v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
  else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
  else if (v.length > 0) v = '(' + v;
  fTel.value = v;
});

/* ============ Máscara de data ============ */
const fData = document.getElementById('fData');
fData.addEventListener('keydown', (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
});
fData.addEventListener('input', () => {
  let v = fData.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 4)      v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
  fData.value = v;
});

/* ============ Formulário → WhatsApp ============ */
const WA_NUMBER = '5537998122843';

document.getElementById('bookingForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome    = document.getElementById('fNome').value.trim();
  const tel     = document.getElementById('fTel').value.trim();
  const data    = document.getElementById('fData').value.trim();
  const ocasiao = document.getElementById('fOcasiao').value;
  const msg     = document.getElementById('fMsg').value.trim();

  const linhas = [
    '✦ *Pedido de Agendamento — Ana Flavia Goulart*',
    '',
    `👤 *Nome:* ${nome}`,
    `📱 *WhatsApp:* ${tel}`,
    `💄 *Ocasião:* ${ocasiao}`,
    data ? `📅 *Data do evento:* ${data}` : null,
    msg  ? `📝 *Mensagem:* ${msg}`        : null,
  ].filter(Boolean).join('\n');

  const btn = document.getElementById('bookingBtn');
  btn.innerHTML = 'Abrindo WhatsApp ✦';
  btn.disabled  = true;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(linhas)}`, '_blank');

  setTimeout(() => {
    btn.disabled  = false;
    btn.innerHTML = 'Enviar pedido de agenda <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    e.target.reset();
  }, 3000);
});
