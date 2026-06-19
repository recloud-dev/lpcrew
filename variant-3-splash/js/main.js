// SPLASH — counters + pop-in
function count(el){
  const t=parseFloat(el.dataset.n), dec=parseInt(el.dataset.dec||'0',10), dur=1300;
  let s=null;
  function f(ts){ if(!s)s=ts; const p=Math.min((ts-s)/dur,1); const e=1-Math.pow(1-p,3);
    const v=(t*e).toFixed(dec); el.textContent=dec?v.replace('.',','):Math.round(t*e);
    if(p<1)requestAnimationFrame(f); else el.textContent=dec?t.toFixed(dec).replace('.',','):t; }
  requestAnimationFrame(f);
}
document.querySelectorAll('.about,.do,.wins,.rev,.join,.stat,.tile,.masonry figure').forEach(el=>el.classList.add('pop'));
const io=new IntersectionObserver((es)=>{es.forEach(e=>{ if(!e.isIntersecting)return;
  e.target.classList.add('in');
  e.target.querySelectorAll?.('b[data-n]').forEach(b=>{if(!b.dataset.done){b.dataset.done=1;count(b);}});
  io.unobserve(e.target);
});},{threshold:.15});
document.querySelectorAll('.pop').forEach(el=>io.observe(el));
document.querySelectorAll('.stat b[data-n]').forEach(b=>io.observe(b.closest('.stat')));

const f=document.querySelector('.jform');
if(f)f.addEventListener('submit',()=>{const n=f.querySelector('.jnote');
  n.textContent='Ура! Заявка принята (демо) 🎉 На бою уйдёт в Telegram/CRM.';
  f.querySelectorAll('input').forEach(i=>i.value='');});
