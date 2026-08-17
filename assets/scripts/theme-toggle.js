(() => {
  const toggle = document.querySelector('.theme-switcher__toggle');
  const panel = document.getElementById('theme-switcher-panel');

  if (!toggle || !panel) {
    return;
  }

  const inputs = [...panel.querySelectorAll('input[name="theme"]')];

  /* Mirrors the 768px breakpoint of 03-theme.css. Spelled max-width rather than the
     project's `width <= 768px` range syntax: matchMedia gets none of the css.Build
     transpilation, and the range syntax needs Safari 16.4, above the browserslist floor. */
  const mobile = window.matchMedia('(max-width: 768px)');

  /* Opening moves focus straight onto the current choice rather than onto the group, so the
     radios are operable without an intermediate Tab (DSFR/RGAA select pattern). */
  const { isOpen, setOpen } = window.createDisclosure({
    toggle,
    panel,
    onOpen: () => {
      const checked = inputs.find((input) => input.checked);
      (checked || inputs[0])?.focus();
    },
  });

  document.addEventListener('click', (event) => {
    if (
      isOpen()
      && !panel.contains(event.target)
      && !toggle.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  /* Focus leaving the widget dismisses it, so Tab cannot strand the user in the page with
     an open popover floating above it. No focus is moved here: it has already gone where
     the user asked it to go. */
  document.addEventListener('focusin', (event) => {
    if (
      isOpen()
      && !panel.contains(event.target)
      && !toggle.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  /* Below the breakpoint the panel is permanently visible and the trigger is hidden, so a
     leftover aria-expanded="true" would describe a control the user can no longer reach. */
  mobile.addEventListener('change', (event) => {
    if (event.matches && isOpen()) {
      setOpen(false);
    }
  });
})();
