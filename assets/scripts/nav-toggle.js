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

  // Mirrors the 768px breakpoint of 06-nav.css.
  const mobile = window.matchMedia('(max-width: 768px)');

  // Below the breakpoint the open panel covers the page, so Tab would walk out of it into a
  // `<main>` the user cannot see. Above it nothing is obscured, hence `mobile.matches`.
  // See docs/components.md#navhtml.
  const outside = [document.querySelector('main'), document.querySelector('.site-footer')];

  const setInert = (open) => {
    outside.forEach((element) => {
      element?.toggleAttribute('inert', open && mobile.matches);
    });
  };

  const { isOpen, setOpen } = window.createDisclosure({
    toggle,
    panel: nav,
    onChange: setInert,
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  // Above the breakpoint a leftover `aria-expanded="true"` would describe a hidden control,
  // and closing is what releases `inert`. Same reset as theme-toggle.js.
  mobile.addEventListener('change', () => {
    if (isOpen()) {
      setOpen(false);
    }
  });
})();
