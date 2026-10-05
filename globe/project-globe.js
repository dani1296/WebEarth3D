// Project globe: a rotating 3D globe that highlights the countries where we
// have built projects. Plain JavaScript, no build step, works in any website.
//
// Load these scripts first, in this order (see index.html):
//   lib/globe.gl.min.js      3D globe library (globe.gl, MIT licence)
//   lib/world-countries.js   country borders (Natural Earth)
//   project-countries.js     the highlighted countries
//   themes.js                the available themes
//   settings.js              which theme to use, speed, etc.
//
// Then:
//   ProjectGlobe.create(document.getElementById("hero-globe"));
//
// Anything in settings.js can be overridden for one globe, e.g.
//   ProjectGlobe.create(element, { theme: "blueprint" });
//
// The element you pass in must have a size (e.g. height: 100vh in CSS);
// the globe fills it and follows it when it resizes.

(function () {
  "use strict";

  // Used when settings.js doesn't set a value.
  var DEFAULT_OPTIONS = {
    theme: "midnight",      // theme key from themes.js, or a theme object
    countries: null,        // list of countries; defaults to PROJECT_COUNTRIES
    secondsPerTurn: 60,     // time for one full rotation
    allowDragging: false,   // true = visitors can drag to spin the globe (never zoom)
    size: 0.8,              // globe diameter as a fraction of the container's shorter side
    view: { lat: 22, lng: 0 }, // starting point: lat = tilt towards north, lng = start longitude
    smallCountryKm2: 20000, // highlighted countries smaller than this get a marker
  };

  var THEME_DEFAULTS = {
    background: "#000000",
    ocean: "#0a0a0a",
    countryStyle: "solid",
    dotDensity: 3,
    countryColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    highlightColor: "#22d3ee",
    highlightBorderColor: null,
    highlightLift: 0.01,
    atmosphereColor: null,
    atmosphereSize: 0.15,
    gridColor: null,
    markerColor: null,
    pulseAll: false,
  };

  var BASE_ALTITUDE = 0.006; // keeps countries just above the sphere surface
  var GRID_STEP_DEG = 15;

  function create(container, userOptions) {
    if (!window.Globe) throw new Error("ProjectGlobe: globe.gl.min.js is not loaded.");
    if (!window.WORLD_COUNTRIES) throw new Error("ProjectGlobe: world-countries.js is not loaded.");

    var options = Object.assign({}, DEFAULT_OPTIONS, window.GLOBE_SETTINGS, userOptions);
    var countries = findCountries(options.countries || window.PROJECT_COUNTRIES || []);
    var shapes = buildShapes(countries.highlightedIds);
    var currentTheme = null;

    // The globe lives in its own layer so we don't change the host element's layout.
    var layer = document.createElement("div");
    layer.style.cssText = "position:absolute;inset:0;overflow:hidden;";
    if (!options.allowDragging) layer.style.pointerEvents = "none"; // let clicks and scrolling pass through
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(layer);

    var globe = new window.Globe(layer, { animateIn: true })
      .width(container.clientWidth)
      .height(container.clientHeight)
      .enablePointerInteraction(false) // no hover tooltips; saves work every frame
      .polygonGeoJsonGeometry("shape")
      .hexPolygonGeoJsonGeometry("shape")
      .pathTransitionDuration(0)
      .ringLat("lat")
      .ringLng("lng")
      .pointLat("lat")
      .pointLng("lng")
      .pointRadius(0.7)
      .pointAltitude(0.008);

    function fitToContainer() {
      var width = container.clientWidth;
      var height = container.clientHeight;
      if (!width || !height) return;
      globe.width(width).height(height);
      globe.pointOfView({ altitude: fitAltitude(globe.camera().fov, width, height, options.size) }, 0);
    }

    globe.pointOfView({ lat: options.view.lat, lng: options.view.lng }, 0);
    fitToContainer();

    var controls = globe.controls();
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 60 / options.secondsPerTurn;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = options.allowDragging;
    if (options.allowDragging) {
      // Horizontal drags spin the globe; vertical swipes still scroll the page on phones.
      controls.domElement.style.touchAction = "pan-y";
    }

    // Follow the container's size.
    var resizeObserver = new ResizeObserver(fitToContainer);
    resizeObserver.observe(container);

    // Stop drawing while the globe is scrolled out of view.
    var visibilityObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) globe.resumeAnimation();
      else globe.pauseAnimation();
    });
    visibilityObserver.observe(container);

    function setTheme(themeOrName) {
      currentTheme = resolveTheme(themeOrName);
      applyTheme(globe, currentTheme, shapes, countries, options);
      container.style.backgroundColor = currentTheme.background;
    }

    setTheme(options.theme);

    return {
      setTheme: setTheme,
      getTheme: function () { return currentTheme; },
      // Countries from the list that were not recognised.
      unknownCountries: countries.unknown,
      // The underlying globe.gl instance, for advanced tweaks.
      globe: globe,
      destroy: function () {
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        globe._destructor();
        layer.remove();
      },
    };
  }

  // Camera distance (in globe radii above the surface) at which the globe's
  // diameter fills `size` of the container's shorter side.
  function fitAltitude(fovDeg, width, height, size) {
    var halfFov = (fovDeg / 2) * (Math.PI / 180); // camera fov is vertical
    var screenRadius = size * Math.min(1, width / height) * Math.tan(halfFov);
    return 1 / Math.sin(Math.atan(screenRadius)) - 1;
  }

  // ---------------------------------------------------------------------------
  // Countries

  // Accent-, case- and punctuation-insensitive key: "España" -> "espana".
  function normalize(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  var lookup = null;

  function getLookup() {
    if (lookup) return lookup;
    lookup = new Map();
    var all = window.WORLD_COUNTRIES;
    // Names first, then codes, so a name always wins over a code that looks the same.
    all.forEach(function (country) {
      country.names.forEach(function (name) {
        var key = normalize(name);
        if (!lookup.has(key)) lookup.set(key, country);
      });
    });
    all.forEach(function (country) {
      country.codes.forEach(function (code) {
        var key = normalize(code);
        if (!lookup.has(key)) lookup.set(key, country);
      });
    });
    return lookup;
  }

  function findCountries(list) {
    var map = getLookup();
    var matched = [];
    var unknown = [];
    list.forEach(function (entry) {
      var country = map.get(normalize(entry));
      if (country) {
        if (matched.indexOf(country) === -1) matched.push(country);
      } else {
        unknown.push(entry);
      }
    });
    if (unknown.length) {
      console.warn(
        "ProjectGlobe: these countries were not recognised and are not shown: " +
          unknown.map(function (name) { return '"' + name + '"'; }).join(", ") +
          ". Check the spelling or use the 3-letter ISO code."
      );
    }
    return {
      matched: matched,
      unknown: unknown,
      highlightedIds: new Set(matched.map(function (c) { return c.id; })),
    };
  }

  // One object per country shape, flagged if it is highlighted.
  function buildShapes(highlightedIds) {
    return window.WORLD_COUNTRIES
      .filter(function (country) { return country.shape; })
      .map(function (country) {
        return { shape: country.shape, highlighted: highlightedIds.has(country.id) };
      });
  }

  function markerCountries(countries, theme, options) {
    return countries.matched
      .filter(function (country) {
        return theme.pulseAll || !country.shape || country.areaKm2 < options.smallCountryKm2;
      })
      .map(function (country) {
        return { lat: country.label[1], lng: country.label[0] };
      });
  }

  // ---------------------------------------------------------------------------
  // Themes

  function resolveTheme(themeOrName) {
    var theme = themeOrName;
    if (typeof themeOrName === "string") {
      theme = (window.GLOBE_THEMES || {})[themeOrName];
      if (!theme) {
        console.warn('ProjectGlobe: theme "' + themeOrName + '" not found in themes.js, using defaults.');
        theme = {};
      }
    }
    return Object.assign({}, THEME_DEFAULTS, theme);
  }

  function applyTheme(globe, theme, shapes, countries, options) {
    var highlightBorder = theme.highlightBorderColor || theme.highlightColor;
    var markerRgb = toRgb(theme.markerColor || theme.highlightColor);
    var useDots = theme.countryStyle === "dots";

    globe.backgroundColor(theme.background);
    globe.globeMaterial().color.set(toRgbString(theme.ocean));

    globe
      .showAtmosphere(Boolean(theme.atmosphereColor))
      .atmosphereColor(theme.atmosphereColor || "#000000")
      .atmosphereAltitude(theme.atmosphereSize);

    if (useDots) {
      globe
        .polygonsData([])
        .hexPolygonsData(shapes)
        .hexPolygonUseDots(true)
        .hexPolygonResolution(theme.dotDensity)
        .hexPolygonMargin(0.35)
        .hexPolygonColor(function (d) { return d.highlighted ? theme.highlightColor : theme.countryColor; })
        .hexPolygonAltitude(function (d) {
          return d.highlighted ? BASE_ALTITUDE + theme.highlightLift : BASE_ALTITUDE;
        });
    } else {
      globe
        .hexPolygonsData([])
        .polygonsData(shapes)
        .polygonCapColor(function (d) { return d.highlighted ? theme.highlightColor : theme.countryColor; })
        .polygonSideColor(function (d) { return d.highlighted ? withAlpha(theme.highlightColor, 0.35) : "rgba(0,0,0,0)"; })
        .polygonStrokeColor(function (d) { return d.highlighted ? highlightBorder : theme.borderColor; })
        .polygonAltitude(function (d) {
          return d.highlighted ? BASE_ALTITUDE + theme.highlightLift : BASE_ALTITUDE;
        });
    }

    globe
      .pathsData(theme.gridColor ? gridLines() : [])
      .pathColor(function () { return theme.gridColor; });

    // Markers are always drawn fully opaque so they stay visible on any theme.
    var markers = markerCountries(countries, theme, options);
    globe
      .pointsData(markers)
      .pointColor(function () { return "rgb(" + markerRgb.join(",") + ")"; })
      .ringsData(markers)
      .ringColor(function () {
        return function (t) { return "rgba(" + markerRgb.join(",") + "," + (1 - t) + ")"; };
      })
      .ringMaxRadius(4)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1600);
  }

  // Latitude and longitude lines as [lat, lng] point lists.
  function gridLines() {
    var lines = [];
    var lat, lng, line;
    for (lng = -180; lng < 180; lng += GRID_STEP_DEG) {
      line = [];
      for (lat = -90; lat <= 90; lat += 2) line.push([lat, lng]);
      lines.push(line);
    }
    for (lat = -90 + GRID_STEP_DEG; lat < 90; lat += GRID_STEP_DEG) {
      line = [];
      for (lng = -180; lng <= 180; lng += 2) line.push([lat, lng]);
      lines.push(line);
    }
    return lines;
  }

  // ---------------------------------------------------------------------------
  // Colour helpers (accept any CSS colour)

  var colorContext = null;

  function toRgb(color) {
    if (!colorContext) colorContext = document.createElement("canvas").getContext("2d");
    colorContext.fillStyle = "#000000";
    colorContext.fillStyle = color;
    var value = colorContext.fillStyle; // "#rrggbb" or "rgba(r, g, b, a)"
    if (value.charAt(0) === "#") {
      return [1, 3, 5].map(function (i) { return parseInt(value.substr(i, 2), 16); });
    }
    return value.match(/[\d.]+/g).slice(0, 3).map(Number);
  }

  function toRgbString(color) {
    return "rgb(" + toRgb(color).join(",") + ")";
  }

  function withAlpha(color, alpha) {
    return "rgba(" + toRgb(color).join(",") + "," + alpha + ")";
  }

  window.ProjectGlobe = { create: create };
})();
