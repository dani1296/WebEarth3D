// Settings for the globe on the website.
//
//   theme           Which look to use: one of the theme names in themes.js
//                   ("midnight", "dotMatrix", "blueprint", "ember", "hologram").
//                   To compare them side by side, open tools/theme-picker.html.
//   secondsPerTurn  Time for one full rotation. Bigger number = slower.
//   allowDragging   true = visitors can drag to spin the globe (it never zooms).
//   size            Globe size as a fraction of the space it sits in (0.8 = 80%).

window.GLOBE_SETTINGS = {
  theme: "blueprint",
  secondsPerTurn: 60,
  allowDragging: false,
  size: 0.8,
};
