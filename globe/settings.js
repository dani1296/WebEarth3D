// Settings for the globe on the website.
//
// Look
//   theme           Which look to use: one of the theme names in themes.js
//                   ("midnight", "dotMatrix", "blueprint", "ember", "hologram").
//                   To compare them side by side, open tools/theme-picker.html.
//   size            Globe size as a fraction of the space it sits in (0.8 = 80%).
//
// Text over the globe (use "" to hide it)
//   title           Main heading. Write {count} where the number of countries goes.
//   description     Short text under the heading. {count} works here too.
//
// Movement
//   secondsPerTurn  Time for one full rotation. Bigger number = slower. 0 = still.
//   allowDragging   false = start spinning by itself.
//                   true  = start in drag mode: visitors spin it by hand and it
//                           doesn't turn on its own.
//   showControls    true = show buttons to switch between those two modes, plus a
//                   speed slider while it spins by itself.
//   labels          Wording of the controls (e.g. for a Spanish version of the site).

window.GLOBE_SETTINGS = {
  theme: "hologram",
  size: 0.8,

  title: "Projects built in {count} countries",
  description: "Placeholder: one or two sentences about the office and the structures it designs.",

  secondsPerTurn: 60,
  allowDragging: false,
  showControls: true,
  labels: { rotate: "Auto-rotate", drag: "Drag", speed: "Speed" },
};
