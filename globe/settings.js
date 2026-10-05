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
// Text, in Spanish (use "" to hide)
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
//
// Other languages (see "languages" at the bottom)
//   The globe's address chooses the language: ...WebEarth3D/?lang=en shows the
//   "en" texts. In Wix, each language version of the page uses its own address.
//   A language can change any of the text settings above; anything it doesn't
//   set uses the Spanish value.

window.GLOBE_SETTINGS = {
  theme: "website",
  layout: "split",
  size: 0.85,

  title: "{projects} proyectos en {countries} países",
  description: "",
  projectsTotal: "+2,000",
  countriesTotal: "+15",

  secondsPerTurn: 60,
  allowDragging: false,
  showControls: true,
  labels: { rotate: "Automático", drag: "Arrastrar", speed: "Velocidad" },

  languages: {
    // Català: ...WebEarth3D/?lang=ca
    ca: {
      title: "{projects} projectes en {countries} països",
      labels: { rotate: "Automàtic", drag: "Arrossegar", speed: "Velocitat" },
    },

    // English: ...WebEarth3D/?lang=en
    en: {
      title: "{projects} projects in {countries} countries",
      labels: { rotate: "Auto-rotate", drag: "Drag", speed: "Speed" },
    },

    // 日本語: ...WebEarth3D/?lang=ja
    // Japanese reads more naturally as "15 or more countries" (15か国以上) than
    // with a "+", so it has its own totals. Update them too when the totals change.
    ja: {
      title: "{countries}か国以上で{projects}件以上のプロジェクト",
      projectsTotal: "2,000",
      countriesTotal: "15",
      labels: { rotate: "自動回転", drag: "ドラッグ", speed: "速度" },
    },
  },
};
