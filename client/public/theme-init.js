// Applies the saved (or system) theme before React loads to avoid a flash.
// Kept as a file rather than an inline script so the CSP can forbid inline scripts.
(function () {
  var theme
  try {
    theme = localStorage.getItem('theme')
  } catch (e) {
    // Storage can be blocked (private mode); fall back to the system theme
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.dataset.theme = theme
})()
