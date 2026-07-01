(function(){
  var FACES="https://facesconsent.com/bookings/purdi-hadley";
  var ov=document.createElement('div');
  ov.className='book-overlay';
  ov.innerHTML='<div class="book-modal"><button class="book-close" aria-label="Close booking">&times;</button><iframe title="Book with Cottage Aesthetics" src="about:blank"></iframe></div>';
  function ready(){
    document.body.appendChild(ov);
    var frame=ov.querySelector('iframe'), loaded=false;
    function open(){ if(!loaded){ frame.src=FACES; loaded=true; } ov.classList.add('open'); document.body.style.overflow='hidden'; }
    function close(){ ov.classList.remove('open'); document.body.style.overflow=''; }
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov.querySelector('.book-close').addEventListener('click',close);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
    document.addEventListener('click',function(e){ var t=e.target.closest('.js-book'); if(t){ e.preventDefault(); open(); } });
  }
  if(document.readyState!=='loading') ready(); else document.addEventListener('DOMContentLoaded',ready);
})();
