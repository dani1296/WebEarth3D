// Settings for the globe on the website.
//
// Look
//   theme           Which look to use: one of the theme names in themes.js
//                   ("midnight", "dotMatrix", "blueprint", "ember", "hologram", "paper").
//                   To compare them side by side, open tools/theme-picker.html.
//   size            Globe size as a fraction of the space it sits in (0.8 = 80%).
//
// Text over the globe (use "" to hide it)
//   title           Main heading. {projects} and {countries} are replaced by the
//                   totals from project-countries.js.
//   description     Short text under the heading. The same placeholders work here.
//
// Movement
//   secondsPerTurn  Time for one full rotation. Bigger number = slower. 0 = still.
//   allowDragging   false = start spinning by itself.
//                   true  = start in drag mode: visitors spin it by hand and it
//                           doesn't turn on its own.
//   showControls    true = show buttons to switch between those two modes, plus a
//                   speed slider while it spins by itself.
//   labels          Wording of the controls.

window.GLOBE_SETTINGS = {
  theme: "dotMatrix",
  size: 0.8,

  title: "{projects} proyectos en {countries} países",
  description: "Texto provisional: una o dos frases sobre la oficina y las estructuras que diseña.",

  secondsPerTurn: 60,
  allowDragging: false,
  showControls: true,
  labels: { rotate: "Automático", drag: "Arrastrar", speed: "Velocidad" },
};
