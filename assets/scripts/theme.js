(() => {
  const themeInputs = [...document.querySelectorAll('input[name="theme"]')];
  const selectedTheme = localStorage.getItem('theme');

  themeInputs.forEach((input) => {
    if (input.value === selectedTheme) {
      input.checked = true;
    }

    input.addEventListener('change', () => {
      if (input.value === 'system') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
        return;
      }

      localStorage.setItem('theme', input.value);
      document.documentElement.setAttribute('data-theme', input.value);
    });
  });
})();
