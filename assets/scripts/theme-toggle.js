(() => {
  const toggle = document.querySelector('.theme-switcher__toggle');
  const panel = document.getElementById('theme-switcher-panel');
  const inputs = panel ? [...panel.querySelectorAll('input[name="theme"]')] : [];

  if (!toggle || !panel) {
    return;
  }

  const setOpen = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    panel.classList.toggle('is-open', isOpen);

    if (isOpen) {
      const checked = inputs.find((input) => input.checked);
      (checked || inputs[0])?.focus();
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (
      toggle.getAttribute('aria-expanded') === 'true'
      && !panel.contains(event.target)
      && !toggle.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  });
})();
