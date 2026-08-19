(() => {
  /* Only an explicit choice is stored. No key at all means "follow the system", which is
     why the absence of a value is a state of its own and not a third string. */
  const THEMES = ['light', 'dark'];

  const readTheme = () => {
    try {
      const stored = localStorage.getItem('theme');

      return THEMES.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  };

  const writeTheme = (theme) => {
    try {
      if (theme === null) {
        localStorage.removeItem('theme');
        return;
      }

      localStorage.setItem('theme', theme);
    } catch {
      /* Storage unavailable (blocked cookies, private mode): the choice still applies to
         this page view, it just does not survive a reload. Never let this abort the script,
         or no listener below gets attached and the switcher goes silently dead. */
    }
  };

  const inputs = [...document.querySelectorAll('input[name="theme"]')];
  const currentValue = document.querySelector('.theme-switcher__value');

  const applyTheme = (theme) => {
    if (theme === null) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    const target = inputs.find((input) => input.value === (theme ?? 'system'));

    if (target) {
      target.checked = true;
    }

    /* Keeps the trigger's accessible name in step with the choice: collapsed, it is the
       only thing announcing which theme is active. */
    if (currentValue && target) {
      currentValue.textContent = target.closest('label').textContent.trim();
    }
    const ICONS = {light: '#icon-sun', dark: '#icon-moon'};
    for (const use of document.querySelectorAll('.theme-switcher__icon use')) {
      use.setAttribute('href', ICONS[theme] ?? '#icon-theme-system');
    }
  };

  applyTheme(readTheme());

  const updateSwitchIcon = (theme) => {
    const use = document.querySelector('.theme-switcher .icon use');
    const values = {
      light: '#icon-sun',
      dark: '#icon-moon',
    }
    use.href.baseVal = theme ? values[theme] : '#icon-theme-system'
  }

  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      const theme = input.value === 'system' ? null : input.value;

      writeTheme(theme);
      applyTheme(theme);
      updateSwitchIcon(theme);
    });
  });

  /* Fired in the other tabs of the same origin, never in the one that wrote the value. */
  window.addEventListener('storage', (event) => {
    if (event.key !== 'theme') {
      return;
    }

    applyTheme(THEMES.includes(event.newValue) ? event.newValue : null);
  });
})();
