// Project globe: a rotating 3D globe that highlights the countries where we
// have built projects. Plain JavaScript, no build step, works in any website.
//
// Load these first (see index.html):
//   project-globe.css        styles for the title and controls
//   lib/globe.gl.min.js      3D globe library (globe.gl, MIT licence)
//   lib/world-countries.js   country borders (Natural Earth)
//   project-countries.js     the highlighted countries
//   themes.js                the available themes
//   settings.js              which theme to use, text, speed, etc.
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
    countries: null,        // { country: projects }; defaults to PROJECT_COUNTRIES
    title: "",              // heading over the globe; {projects} and {countries} become numbers
    description: "",        // text under the heading; the same placeholders work here
    secondsPerTurn: 60,     // time for one full rotation; 0 = still
    allowDragging: false,   // true = start in drag mode (spin by hand, no auto-rotation)
    showControls: false,    // true = show the mode buttons and speed slider
    labels: { rotate: "Automático", drag: "Arrastrar", speed: "Velocidad" },
    size: 0.8,              // globe diameter as a fraction of the container's shorter side
    view: { lat: 22, lng: 0 }, // starting point: lat = tilt towards north, lng = start longitude
    smallCountryKm2: 20000, // highlighted countries smaller than this get a marker
    onSpeedChange: null,    // function (secondsPerTurn) called when the slider moves
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
    textColor: null,   // default: near white on dark backgrounds, near black on light ones
    accentColor: null, // default: highlightColor
  };

  var BASE_ALTITUDE = 0.006; // keeps countries just above the sphere surface
  var GRID_STEP_DEG = 15;
  var MAX_DEGREES_PER_SECOND = 36; // fastest slider position: one turn every 10 s

  function create(container, userOptions) {
    if (!window.Globe) throw new Error("ProjectGlobe: globe.gl.min.js is not loaded.");
    if (!window.WORLD_COUNTRIES) throw new Error("ProjectGlobe: world-countries.js is not loaded.");

    var options = Object.assign({}, DEFAULT_OPTIONS, window.GLOBE_SETTINGS, userOptions);
    options.labels = Object.assign({}, DEFAULT_OPTIONS.labels, options.labels);
    var countries = findCountries(options.countries || window.PROJECT_COUNTRIES || []);
    var shapes = buildShapes(countries.highlightedIds);
    var currentTheme = null;

    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.classList.add("project-globe");

    // The globe lives in its own layer so we don't change the host element's layout.
    var layer = document.createElement("div");
    layer.style.cssText = "position:absolute;inset:0;overflow:hidden;";
    container.appendChild(layer);

    var overlay = buildOverlay(options, {
      projects: countries.projectCount,
      countries: countries.matched.length,
    });
    container.appendChild(overlay.element);

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
    controls.enableZoom = false;
    controls.enablePan = false;

    // --- Movement: auto-rotate mode (spins by itself) or drag mode (spin by hand).

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var degreesPerSecond = reduceMotion ? 0 : speedFromSeconds(options.secondsPerTurn);
    var dragMode = false;

    function updateMovement() {
      controls.autoRotate = !dragMode && degreesPerSecond > 0;
      controls.autoRotateSpeed = degreesPerSecond / 6; // three.js unit: 1 = one turn per 60 s
    }

    function setDragMode(on) {
      dragMode = Boolean(on);
      controls.enableRotate = dragMode;
      // Outside drag mode, clicks and scrolling pass straight through the globe.
      layer.style.pointerEvents = dragMode ? "auto" : "none";
      layer.style.cursor = dragMode ? "grab" : "";
      // In drag mode, horizontal drags spin the globe; vertical swipes still scroll the page on phones.
      controls.domElement.style.touchAction = dragMode ? "pan-y" : "";
      updateMovement();
      if (overlay.rotateButton) {
        overlay.rotateButton.setAttribute("aria-pressed", String(!dragMode));
        overlay.dragButton.setAttribute("aria-pressed", String(dragMode));
        overlay.speed.hidden = dragMode;
      }
    }

    function setSpeed(secondsPerTurn) {
      degreesPerSecond = speedFromSeconds(secondsPerTurn);
      if (overlay.slider) overlay.slider.value = sliderFromSpeed(degreesPerSecond);
      updateMovement();
    }

    if (overlay.slider) {
      overlay.slider.value = sliderFromSpeed(degreesPerSecond);
      overlay.slider.addEventListener("input", function () {
        degreesPerSecond = speedFromSlider(Number(overlay.slider.value));
        updateMovement();
        if (options.onSpeedChange) options.onSpeedChange(secondsFromSpeed(degreesPerSecond));
      });
      overlay.rotateButton.addEventListener("click", function () { setDragMode(false); });
      overlay.dragButton.addEventListener("click", function () { setDragMode(true); });
    }

    setDragMode(options.allowDragging);

    // --- Housekeeping

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
      // Colours for the title and controls (used in project-globe.css).
      var light = isLight(currentTheme.background);
      container.classList.toggle("project-globe--light", light);
      container.style.setProperty("--project-globe-text", currentTheme.textColor || (light ? "#1d1b19" : "#e8eef6"));
      container.style.setProperty(
        "--project-globe-accent",
        toRgbString(currentTheme.accentColor || currentTheme.highlightColor)
      );
    }

    setTheme(options.theme);

    return {
      setTheme: setTheme,
      getTheme: function () { return currentTheme; },
      setDragMode: setDragMode,
      setSpeed: setSpeed,
      // Totals shown in the title, and countries from the list that were not recognised.
      projectCount: countries.projectCount,
      countryCount: countries.matched.length,
      unknownCountries: countries.unknown,
      // The underlying globe.gl instance, for advanced tweaks.
      globe: globe,
      destroy: function () {
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        globe._destructor();
        layer.remove();
        overlay.element.remove();
        container.classList.remove("project-globe");
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
  // Speed. The slider is quadratic so the slow end, where most choices are, is finer.

  function speedFromSeconds(secondsPerTurn) {
    return secondsPerTurn > 0 ? 360 / secondsPerTurn : 0;
  }

  function secondsFromSpeed(degreesPerSecond) {
    return degreesPerSecond > 0 ? Math.round(360 / degreesPerSecond) : 0;
  }

  function speedFromSlider(value) {
    var t = value / 100;
    return MAX_DEGREES_PER_SECOND * t * t;
  }

  function sliderFromSpeed(degreesPerSecond) {
    var t = Math.sqrt(Math.min(degreesPerSecond, MAX_DEGREES_PER_SECOND) / MAX_DEGREES_PER_SECOND);
    return Math.round(t * 100);
  }

  // ---------------------------------------------------------------------------
  // Title, description and controls over the globe

  function buildOverlay(options, numbers) {
    var ui = { element: element("div", "project-globe-overlay") };

    if (options.title || options.description) {
      var text = element("div", "project-globe-text");
      if (options.title) {
        var title = element("h1", "project-globe-title");
        fillText(title, options.title, numbers, true);
        text.appendChild(title);
      }
      if (options.description) {
        var description = element("p", "project-globe-description");
        fillText(description, options.description, numbers, false);
        text.appendChild(description);
      }
      ui.element.appendChild(text);
    }

    if (options.showControls) {
      var bar = element("div", "project-globe-controls");

      var modes = element("div", "project-globe-mode");
      modes.setAttribute("role", "group");
      ui.rotateButton = element("button");
      ui.rotateButton.type = "button";
      ui.rotateButton.textContent = options.labels.rotate;
      ui.dragButton = element("button");
      ui.dragButton.type = "button";
      ui.dragButton.textContent = options.labels.drag;
      modes.appendChild(ui.rotateButton);
      modes.appendChild(ui.dragButton);

      ui.speed = element("label", "project-globe-speed");
      var speedText = element("span");
      speedText.textContent = options.labels.speed;
      ui.slider = element("input");
      ui.slider.type = "range";
      ui.slider.min = "0";
      ui.slider.max = "100";
      ui.slider.setAttribute("aria-label", options.labels.speed); // the visible word is hidden on small phones
      ui.speed.appendChild(speedText);
      ui.speed.appendChild(ui.slider);

      bar.appendChild(modes);
      bar.appendChild(ui.speed);
      ui.element.appendChild(bar);
    }

    return ui;
  }

  // Writes `template` into `target`, replacing {projects} and {countries} with
  // the numbers. With `highlight`, the numbers get the accent colour.
  function fillText(target, template, numbers, highlight) {
    template.split(/(\{projects\}|\{countries\})/).forEach(function (part) {
      var key = part === "{projects}" ? "projects" : part === "{countries}" ? "countries" : null;
      if (key && highlight) {
        var number = element("span", "project-globe-count");
        number.textContent = numbers[key];
        target.appendChild(number);
      } else {
        target.appendChild(document.createTextNode(key ? String(numbers[key]) : part));
      }
    });
  }

  function element(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  // ---------------------------------------------------------------------------
  // Countries

  // Accent-, case- and punctuation-insensitive key: "España" -> "espana".
  function normalize(text) {
    return String(text)
      .normalize("NFD")
      .replace(/\p{M}/gu, "") // remove accents
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

  // Accepts { "Spain": 9, ... } (country -> number of projects) or a plain list of names.
  function findCountries(input) {
    var entries = Array.isArray(input)
      ? input.map(function (name) { return [name, 0]; })
      : Object.keys(input).map(function (name) { return [name, Number(input[name]) || 0]; });
    var map = getLookup();
    var matched = [];
    var unknown = [];
    var projectCount = 0;
    entries.forEach(function (entry) {
      var country = map.get(normalize(entry[0]));
      if (country) {
        if (matched.indexOf(country) === -1) matched.push(country);
      } else {
        unknown.push(entry[0]);
      }
      // Projects count even if the country name has a typo: the total stays right.
      projectCount += entry[1];
    });
    if (unknown.length) {
      console.warn(
        "ProjectGlobe: estos países no se han reconocido y no se muestran en el globo: " +
          unknown.map(function (name) { return '"' + name + '"'; }).join(", ") +
          ". Revisa cómo están escritos o usa el código ISO de 3 letras."
      );
    }
    return {
      matched: matched,
      unknown: unknown,
      projectCount: projectCount,
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
        console.warn('ProjectGlobe: el tema "' + themeOrName + '" no existe en themes.js; se usan colores por defecto.');
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

  function isLight(color) {
    var rgb = toRgb(color);
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 > 0.6;
  }

  window.ProjectGlobe = { create: create };
})();
