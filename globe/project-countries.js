// Countries where we have built projects. These are highlighted on the globe.
// (The totals shown in the text, like "+2,000 proyectos", are set in settings.js.)
//
// How to edit:
//   - One country per line: its name in quotes, a colon, the address of its
//     page in quotes, and a comma.
//   - Name: the English or Spanish name ("Spain", "España") or the ISO code
//     ("ESP" or "ES"). Capital letters and accents don't matter.
//   - Page address: the part after "luisbozzo.com/" in the address of the
//     country's page, e.g. "mexico" for https://www.luisbozzo.com/mexico.
//     Visitors in other languages get that language's version of the page
//     (/en/mexico...). Leave it empty ("") if the country has no page yet:
//     it's still highlighted, but clicking it does nothing.
//   - If a name isn't recognised, the browser console shows a warning
//     (right-click the page > Inspect > Console).
//
// Very small countries (Bahrain, Singapore, Malta...) are drawn as a round
// dot in the same colour as the other highlighted countries, larger than
// their real size so they can be seen.
//
// Some territories are separate from their country on the globe:
//   - "Francia" is mainland France and Corsica. Add "Guayana Francesa" to
//     highlight French Guiana too.
//   - "Marruecos" stops at its border with Western Sahara. Add
//     "Sahara Occidental" to highlight Western Sahara too.

// The countries with a page are the ones in the "Proyectos" menu on the website.
window.PROJECT_COUNTRIES = {
  "México":     "mexico",
  "España":     "espana",
  "Perú":       "peru",
  "Bahréin":    "bahrein",
  "Bulgaria":   "bulgaria",
  "Chile":      "chile",
  "Filipinas":  "filipinas",
  "Panamá":     "panama",
  "Ghana":      "",
  "Ecuador":    "",
  "Colombia":   "",
  "Francia":    "",
  "Bolivia":    "",
  "Guatemala":  "",
  "Marruecos":  "",
  "Venezuela":  "",
};
