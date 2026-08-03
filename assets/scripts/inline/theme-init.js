(() => {
  const theme = localStorage.getItem('theme');

  if (!theme) {
    return;
  }
  document.documentElement.dataset.theme = theme;
})();
