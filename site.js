document.addEventListener('DOMContentLoaded', function () {
  // partials/{footer,booking-modal}.html are injected server-side after this
  // script tag's position in every page — deferring to DOMContentLoaded (rather
  // than depending on exact tag placement) guarantees the whole document,
  // including content positioned after this script, has been parsed first.
  var hd = document.getElementById('hd');
  var onScroll = function () { hd.classList.toggle('scrolled', window.scrollY > 60); };
  window.addEventListener('scroll', onScroll); onScroll();

  var mt = hd.querySelector('.menu-toggle');
  mt.addEventListener('click', function () { hd.classList.toggle('menu-open'); });
  hd.querySelector('.mobile-menu').addEventListener('click', function (e) {
    if (e.target.closest('a')) hd.classList.remove('menu-open');
  });

  var ov = document.querySelector('.book-overlay'), frame = ov.querySelector('iframe'), loaded = false;
  function openBook() {
    if (!loaded) { frame.src = document.body.getAttribute('data-booking-url'); loaded = true; }
    ov.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function closeBook() { ov.classList.remove('open'); document.body.style.overflow = ''; }
  ov.addEventListener('click', function (e) { if (e.target === ov) closeBook(); });
  ov.querySelector('.book-close').addEventListener('click', closeBook);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBook(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-book')) { e.preventDefault(); openBook(); }
  });

  // .reveal elements are visible by default (site.css) -- only an element confirmed
  // below the fold right now gets hidden-then-animated-in; everything already on
  // screen at load (the homepage hero/H1 included) is simply never touched, so a
  // disabled/erroring/absent observer can never leave real content invisible.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) {
      var r = el.getBoundingClientRect();
      var alreadyVisible = r.top < window.innerHeight && r.bottom > 0;
      if (!alreadyVisible) {
        el.classList.add('reveal-pending');
        io.observe(el);
      }
    });
  }
});
