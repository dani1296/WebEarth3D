// Settings for the globe on the website.
//
// Look
//   theme           Which look to use: one of the theme names in themes.js
//                   ("website", "midnight", "dotMatrix", "blueprint", "ember",
//                   "hologram", "paper"). To compare them, open tools/theme-picker.html.
//   layout          "split" = caption and controls centred under the globe, for a hero
//                             where the page's own headline sits beside the globe.
//                   "full"  = text over the bottom-left of the globe, for a globe that
//                             fills a whole full-width hero.
//   size            Globe size as a fraction of the space it has (0.8 = 80%).
//
// Text (use "" to hide)
//   title           Main line. {projects} and {countries} are replaced by the totals below.
//   description     Short text under it. The same placeholders work here.
//   projectsTotal   What {projects} shows, written exactly as it should appear.
//   countriesTotal  What {countries} shows. "auto" = count the countries in
//                   project-countries.js; or write it yourself, e.g. "+10".
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
  theme: "website",
  layout: "split",
  size: 0.85,

  title: "{projects} proyectos en {countries} países",
  description: "",
  projectsTotal: "+2,000",
  countriesTotal: "+10",

  secondsPerTurn: 60,
  allowDragging: false,
  showControls: true,
  labels: { rotate: "Automático", drag: "Arrastrar", speed: "Velocidad" },
};
