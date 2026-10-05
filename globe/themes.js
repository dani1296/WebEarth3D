// Visual themes available for the project globe.
//
// The website uses the theme named in settings.js. To compare all of them
// side by side, open tools/theme-picker.html.
//
// Each theme is a set of colours and options. To try a new look, copy one
// of the themes below, give it a new key (e.g. "steel") and change values.
// It appears automatically as a button in the theme picker.
//
// Colours can be any CSS colour: "#22d3ee", "rgb(34, 211, 238)",
// "rgba(34, 211, 238, 0.5)" (the last number is transparency, 0 to 1).
//
// Options:
//   label                 Name shown on the preview page.
//   background            Colour behind the globe.
//   ocean                 Colour of the globe's sphere.
//   countryStyle          "solid" (filled shapes) or "dots" (a grid of dots).
//   dotDensity            Only for "dots": 2 (big, sparse) to 4 (small, dense). Default 3.
//   countryColor          Countries without projects. Use "transparent" to hide them.
//   borderColor           Borders of countries without projects ("solid" only).
//   highlightColor        Countries with projects.
//   highlightBorderColor  Borders of countries with projects ("solid" only).
//   highlightLift         How far highlighted countries rise off the globe. 0 = flat.
//   atmosphereColor       Glow around the globe. null = no glow.
//   atmosphereSize        Glow thickness, e.g. 0.1 (thin) to 0.3 (wide).
//   gridColor             Latitude/longitude lines. null = no lines.
//   markerColor           Pulsing markers on small countries. Defaults to highlightColor.
//   pulseAll              true = pulsing markers on every highlighted country.

window.GLOBE_THEMES = {
  midnight: {
    label: "Midnight",
    background: "#02050b",
    ocean: "#061224",
    countryStyle: "solid",
    countryColor: "rgba(70, 110, 160, 0.28)",
    borderColor: "rgba(110, 160, 220, 0.35)",
    highlightColor: "#22d3ee",
    highlightBorderColor: "#cffafe",
    highlightLift: 0.015,
    atmosphereColor: "#2563eb",
    atmosphereSize: 0.2,
    gridColor: null,
    pulseAll: false,
  },

  dotMatrix: {
    label: "Dot Matrix",
    background: "#03070a",
    ocean: "#050c14",
    countryStyle: "dots",
    dotDensity: 3,
    countryColor: "rgba(150, 175, 200, 0.35)",
    highlightColor: "#2dd4bf",
    highlightLift: 0.01,
    atmosphereColor: "#14b8a6",
    atmosphereSize: 0.15,
    gridColor: null,
    pulseAll: false,
  },

  blueprint: {
    label: "Blueprint",
    background: "#0a2246",
    ocean: "#0e2d5c",
    countryStyle: "solid",
    countryColor: "transparent",
    borderColor: "rgba(215, 232, 255, 0.55)",
    highlightColor: "rgba(255, 255, 255, 0.75)",
    highlightBorderColor: "#ffffff",
    highlightLift: 0,
    atmosphereColor: "#8fb8ff",
    atmosphereSize: 0.08,
    gridColor: "rgba(200, 225, 255, 0.14)",
    pulseAll: false,
  },

  ember: {
    label: "Ember",
    background: "#070608",
    ocean: "#0e0b0f",
    countryStyle: "dots",
    dotDensity: 3,
    countryColor: "rgba(150, 140, 135, 0.3)",
    highlightColor: "#f59e0b",
    highlightLift: 0.01,
    atmosphereColor: "#f97316",
    atmosphereSize: 0.12,
    gridColor: null,
    pulseAll: false,
  },

  hologram: {
    label: "Hologram",
    background: "#000000",
    ocean: "#00110d",
    countryStyle: "solid",
    countryColor: "transparent",
    borderColor: "rgba(0, 255, 170, 0.35)",
    highlightColor: "rgba(0, 255, 170, 0.3)",
    highlightBorderColor: "#5eead4",
    highlightLift: 0.008,
    atmosphereColor: "#00ffaa",
    atmosphereSize: 0.22,
    gridColor: "rgba(0, 255, 170, 0.08)",
    pulseAll: true,
  },
};
