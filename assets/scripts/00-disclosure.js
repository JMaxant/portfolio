/* Shared behaviour for the two collapsible widgets in the header: the burger menu
   (nav-toggle.js) and the theme popover (theme-toggle.js). Both keep their state in the
   trigger's `aria-expanded` and mirror it as an `.is-open` class on the panel, because the
   two elements are not siblings and no CSS combinator can link them.

   The `00-` prefix is load-bearing, not decoration: baseof.html bundles
   `resources.Match "scripts/*.js"`, which sorts by path, so this file has to concatenate
   before its consumers. It publishes on `window` for the same reason — after concatenation
   every script is still its own IIFE, so a top-level binding here would not be visible
   there. */
window.createDisclosure = ({ toggle, panel, onOpen }) => {
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);

    if (open && onOpen) {
      onOpen();
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  return { isOpen, setOpen };
};
