(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const header = document.querySelector('.site-header');

  if (!toggle || !nav) {
    return;
  }

  const setHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  };

  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);

  const { setOpen } = window.createDisclosure({ toggle, panel: nav });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
})();
