(() => {
  /* Marks the document as script-driven before the first paint, so CSS can hide the
     controls that only JavaScript can operate (the theme trigger, see 03-theme.css).
     Outside the try on purpose: it has to happen even when storage access throws. */
  document.documentElement.classList.add('js');

  try {
    const theme = localStorage.getItem('theme');

    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  } catch {
    /* Storage unavailable: fall back to prefers-color-scheme. */
  }
})();
