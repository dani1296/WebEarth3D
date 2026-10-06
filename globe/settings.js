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
//   startExploring  false = start spinning by itself ("Automático"). Clicking the
//                           globe switches to "Explorar".
//                   true  = start in "Explorar": the globe doesn't turn on its own,
//                           visitors spin it by hand and click countries to open
//                           their page.
//   showControls    true = show buttons to switch between those two modes, plus a
//                   speed slider while it spins by itself.
//   labels          Wording of the controls.
//
// Country pages
//   pagesUrl        Goes in front of each country's page address from
//                   project-countries.js: "https://www.luisbozzo.com/" + "mexico".
//                   Each language has its own (see below). "" = countries can't be clicked.
//
// Other languages (see "languages" at the bottom)
//   The globe's address chooses the language: ...WebEarth3D/?lang=en shows the
//   "en" texts. In Wix, each language version of the page uses its own address.
//   A language can change any of the settings above (usually the texts and
//   pagesUrl); anything it doesn't set uses the Spanish value.

window.GLOBE_SETTINGS = {
  theme: "website",
  layout: "split",
  size: 0.85,

  title: "{projects} proyectos en {countries} países",
  description: "",
  projectsTotal: "+2,000",
  countriesTotal: "+15",

  secondsPerTurn: 10,
  startExploring: false,
  showControls: true,
  labels: { rotate: "Automático", explore: "Explorar", speed: "Velocidad" },

  pagesUrl: "https://www.luisbozzo.com/",

  languages: {
    // Català: ...WebEarth3D/?lang=ca
    ca: {
      title: "{projects} projectes en {countries} països",
      labels: { rotate: "Automàtic", explore: "Explorar", speed: "Velocitat" },
      pagesUrl: "https://www.luisbozzo.com/ca/",
    },

    // English: ...WebEarth3D/?lang=en
    en: {
      title: "{projects} projects in {countries} countries",
      labels: { rotate: "Auto-rotate", explore: "Explore", speed: "Speed" },
      pagesUrl: "https://www.luisbozzo.com/en/",
    },

    // 日本語: ...WebEarth3D/?lang=ja
    // Japanese reads more naturally as "15 or more countries" (15か国以上) than
    // with a "+", so it has its own totals. Update them too when the totals change.
    ja: {
      title: "{countries}か国以上で{projects}件以上のプロジェクト",
      projectsTotal: "2,000",
      countriesTotal: "15",
      labels: { rotate: "自動回転", explore: "探索", speed: "速度" },
      pagesUrl: "https://www.luisbozzo.com/ja/",
    },
  },
};
