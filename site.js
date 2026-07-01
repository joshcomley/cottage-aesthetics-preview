(function () {
  var page = document.body.getAttribute('data-page') || '';
  var NAV = [
    ['about.html', 'about', 'About'],
    ['treatments.html', 'treatments', 'Treatments'],
    ['gallery.html', 'gallery', 'Before &amp; After'],
    ['reviews.html', 'reviews', 'Reviews'],
    ['contact.html', 'contact', 'Contact']
  ];
  function links() {
    return NAV.map(function (n) {
      return '<a class="lnk' + (n[1] === page ? ' active' : '') + '" href="' + n[0] + '">' + n[2] + '</a>';
    }).join('');
  }
  var header =
    '<header id="hd">' +
      '<div class="wrap nav">' +
        '<a href="index.html" class="brand"><span class="b1">Cottage</span><span class="b2">Aesthetics</span></a>' +
        '<nav class="nav-links">' + links() + '<a class="btn btn-primary js-book" href="#">Book Now</a></nav>' +
        '<button class="menu-toggle" aria-label="Open menu">&#9776;</button>' +
      '</div>' +
      '<div class="mobile-menu">' + links() + '<a class="btn btn-primary js-book" href="#">Book Now</a></div>' +
    '</header>';
  var footer =
    '<footer class="site-footer">' +
      '<div class="wrap foot">' +
        '<div><div class="script">Cottage Aesthetics</div><p>Nurse-led medical aesthetics<br>Hartlebury, Worcestershire</p></div>' +
        '<div><h4>Explore</h4><a href="about.html">About</a><a href="treatments.html">Treatments</a><a href="gallery.html">Before &amp; After</a><a href="reviews.html">Reviews</a></div>' +
        '<div><h4>Visit</h4><a href="contact.html">Contact</a><a href="faq.html">FAQ</a><a href="aftercare.html">Aftercare</a><a href="policies.html">Clinic Policies</a></div>' +
        '<div><h4>Get in touch</h4><a href="tel:07401562462">07401 562 462</a><a href="mailto:cottageaestheticshartlebury@gmail.com">Email us</a><a href="#" class="js-book">Book online</a></div>' +
      '</div>' +
      '<div class="foot-base">&copy; Cottage Aesthetics &middot; Hartlebury, Worcestershire &middot; Registered nurse-led clinic</div>' +
    '</footer>';
  var modal =
    '<div class="book-overlay"><div class="book-modal">' +
      '<button class="book-close" aria-label="Close booking">&times;</button>' +
      '<iframe title="Book with Cottage Aesthetics" src="about:blank"></iframe>' +
    '</div></div>';

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer + modal);

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
    if (!loaded) { frame.src = 'https://facesconsent.com/bookings/purdi-hadley'; loaded = true; }
    ov.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function closeBook() { ov.classList.remove('open'); document.body.style.overflow = ''; }
  ov.addEventListener('click', function (e) { if (e.target === ov) closeBook(); });
  ov.querySelector('.book-close').addEventListener('click', closeBook);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBook(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-book')) { e.preventDefault(); openBook(); }
  });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
