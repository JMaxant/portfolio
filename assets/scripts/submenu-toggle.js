// Wires every `.submenu-toggle` created by menu-items.html to its `.submenu` panel through
// the shared disclosure primitive — same aria-expanded/.is-open contract as the burger menu
// and the theme switcher. See docs/components.md#menu-itemshtml.
const siblings = [];

document.querySelectorAll('.submenu-toggle').forEach((toggle) => {
  const panel = document.getElementById(toggle.getAttribute('aria-controls'));

  if (!panel) {
    return;
  }

  const { isOpen, setOpen } = window.createDisclosure({
    toggle,
    panel,
    // Only one submenu open at a time: opening this one closes any other still expanded.
    onChange: (open) => {
      if (open) {
        siblings.forEach((sibling) => {
          if (sibling.toggle !== toggle) {
            sibling.setOpen(false);
          }
        });
      }
    },
  });

  siblings.push({ toggle, setOpen });
  window.dismissOnOutside({ toggle, panel, isOpen, setOpen });
});
