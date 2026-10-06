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
// Language: the page's address picks it, e.g. index.html?lang=en uses the
// "en" texts from settings.js. Without ?lang= the main (Spanish) texts are used.
//
// The element you pass in must have a size (e.g. height: 100vh in CSS);
// the globe fills it and follows it when it resizes.

(function () {
  "use strict";

  // Used when settings.js doesn't set a value.
  var DEFAULT_OPTIONS = {
    theme: "midnight",      // theme key from themes.js, or a theme object
    countries: null,        // list of countries, or country -> page address; defaults to PROJECT_COUNTRIES
    layout: "full",         // "full": text over the globe's bottom left; "split": caption centred under it
    title: "",              // heading; {projects} and {countries} are replaced by the totals
    description: "",        // text under the heading; the same placeholders work here
    projectsTotal: "",      // text for {projects}, e.g. "+2,000"
    countriesTotal: "auto", // text for {countries}; "auto" = number of highlighted countries
    secondsPerTurn: 10,     // time for one full rotation; 0 = still
    startExploring: false,  // true = start in explore mode (spin by hand and click countries, no auto-rotation)
    showControls: false,    // true = show the mode buttons and speed slider
    labels: { rotate: "Automático", explore: "Explorar", speed: "Velocidad" },
    pagesUrl: "",           // put before a country's page address to open it; "" = countries can't be clicked
    size: 0.8,              // globe diameter as a fraction of the container's shorter side
    view: { lat: 22, lng: 0 }, // starting point: lat = tilt towards north, lng = start longitude
    smallCountryKm2: 20000, // highlighted countries smaller than this are drawn as a dot...
    smallCountryDotSize: 1.4, // ...of this radius, in degrees (~155 km), so they stay visible
    onSpeedChange: null,    // function (secondsPerTurn) called when the slider moves
  };

  var THEME_DEFAULTS = {
    background: "#000000",
    ocean: "#0a0a0a",
    shading: 1,        // 1 = full 3D lighting on the sphere, 0 = flat colour
    countryStyle: "solid",
    dotDensity: 3,
    countryColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    highlightColor: "#22d3ee",
    highlightBorderColor: null,
    highlightLift: 0.01,
    highlightSideOpacity: 0.35,
    atmosphereColor: null,
    atmosphereSize: 0.15,
    gridColor: null,
    markerColor: null,
    pulseAll: false,
    textColor: null,   // default: near white on dark backgrounds, near black on light ones
    accentColor: null, // default: highlightColor
    hoverColor: null,  // default: accentColor if set, else textColor
  };

  var DEFAULT_LANGUAGE = "es"; // the language of the main texts in settings.js
  var BASE_ALTITUDE = 0.006; // keeps countries just above the sphere surface
  var GRID_STEP_DEG = 15;
  var MAX_DEGREES_PER_SECOND = 216; // fastest slider position: one turn every ~1.7 s
  var CLICK_MAX_MOVE_PX = 6; // a press that moves further than this is a drag, not a click
  var HIT_MARGIN_PX = 8;     // a click this close to a country with a page still opens it

  function create(container, userOptions) {
    if (!window.Globe) throw new Error("ProjectGlobe: globe.gl.min.js is not loaded.");
    if (!window.WORLD_COUNTRIES) throw new Error("ProjectGlobe: world-countries.js is not loaded.");

    userOptions = userOptions || {};
    var settings = window.GLOBE_SETTINGS || {};
    var language = pickLanguage(userOptions.language, settings.languages);
    var translation = language === DEFAULT_LANGUAGE ? {} : settings.languages[language];
    var options = Object.assign({}, DEFAULT_OPTIONS, settings, translation, userOptions);
    options.labels = Object.assign({}, DEFAULT_OPTIONS.labels, settings.labels, translation.labels, userOptions.labels);
    var countries = findCountries(options.countries || window.PROJECT_COUNTRIES || []);
    var shapes = buildShapes(countries, options);
    var currentTheme = null;

    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    var layoutClass = "project-globe--" + (options.layout === "split" ? "split" : "full");
    container.classList.add("project-globe", layoutClass);
    container.setAttribute("lang", language); // so screen readers pronounce the text correctly

    // The globe lives in its own layer so we don't change the host element's layout.
    var layer = document.createElement("div");
    layer.style.cssText = "position:absolute;inset:0;overflow:hidden;";
    container.appendChild(layer);

    var overlay = buildOverlay(options, {
      projects: options.projectsTotal,
      countries: options.countriesTotal === "auto" ? countries.matched.length : options.countriesTotal,
    });
    container.appendChild(overlay.element);

    var globe = new window.Globe(layer, { animateIn: true })
      .width(container.clientWidth)
      .height(container.clientHeight)
      .enablePointerInteraction(false) // no hover tooltips; saves work every frame
      .polygonGeoJsonGeometry("shape")
      .hexPolygonGeoJsonGeometry("shape")
      // Countries start at their final height: rising out of the sphere, solid ones flicker through it.
      .polygonsTransitionDuration(0)
      .pathTransitionDuration(0)
      .ringLat("lat")
      .ringLng("lng");

    var pixelsPerDegree = 1; // along the globe's surface, at its centre

    function fitToContainer() {
      var width = container.clientWidth;
      var height = container.clientHeight;
      if (!width || !height) return;
      // In the split layout the caption sits under the globe, so the globe
      // uses the space above it and is moved up by half the caption's height.
      var reserved = options.layout === "split" ? overlay.element.offsetHeight : 0;
      var globeHeight = Math.max(height - reserved, 1);
      var diameter = options.size * Math.min(width, globeHeight);
      pixelsPerDegree = (diameter / 2) * (Math.PI / 180);
      globe.width(width).height(height).globeOffset([0, -reserved / 2]);
      globe.pointOfView({ altitude: fitAltitude(globe.camera().fov, height, diameter) }, 0);
    }

    globe.pointOfView({ lat: options.view.lat, lng: options.view.lng }, 0);
    fitToContainer();

    var controls = globe.controls();
    controls.enableZoom = false;
    controls.enablePan = false;

    // --- Modes. Automático: the globe spins by itself and scrolling passes
    // straight through it; clicking the globe switches to Explorar. Explorar:
    // visitors spin it by hand, and clicking a highlighted country that has a
    // page opens that page.

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var degreesPerSecond = reduceMotion ? 0 : speedFromSeconds(options.secondsPerTurn);
    var exploreMode = false;

    function updateMovement() {
      controls.autoRotate = !exploreMode && degreesPerSecond > 0;
      controls.autoRotateSpeed = degreesPerSecond / 6; // three.js unit: 1 = one turn per 60 s
    }

    function setExploreMode(on) {
      exploreMode = Boolean(on);
      controls.enableRotate = exploreMode;
      // In Automático the globe ignores the mouse, so scrolling passes straight through.
      layer.style.pointerEvents = exploreMode ? "auto" : "none";
      // In Explorar, horizontal drags spin the globe; vertical swipes still scroll the page on phones.
      controls.domElement.style.touchAction = exploreMode ? "pan-y" : "";
      updateMovement();
      updatePointer();
      if (overlay.rotateButton) {
        overlay.rotateButton.setAttribute("aria-pressed", String(!exploreMode));
        overlay.exploreButton.setAttribute("aria-pressed", String(exploreMode));
        overlay.speed.hidden = exploreMode;
      }
    }

    // --- Mouse and touch on the globe

    var highlightedShapes = shapes.filter(function (d) { return d.highlighted; });
    var shapesWithPage = shapes.filter(function (d) { return d.url; });
    var hovered = null;   // the country with a page under the mouse (Explorar only)
    var mouse = null;     // the mouse's last position over the globe, or null
    var press = null;     // where the last press (mouse or finger) started
    var pressing = false; // a button or finger is down
    var listeners = [];

    function listen(type, handler, capture) {
      container.addEventListener(type, handler, capture);
      listeners.push([type, handler, capture]);
    }

    // Shows what a click would do: in Automático, a hand over the globe; in
    // Explorar, the hover colour on a country with a page.
    function updatePointer() {
      var dragging = pressing && mouse && press &&
        Math.hypot(mouse.clientX - press.x, mouse.clientY - press.y) > CLICK_MAX_MOVE_PX;
      var point = mouse ? globePointAt(mouse) : null;
      var target = exploreMode && point && !dragging ? countryAt(point) : null;
      setHovered(target && target.url ? target : null);
      if (!mouse) container.style.cursor = "";
      else if (!exploreMode) container.style.cursor = point ? "pointer" : "";
      else container.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";
    }

    function setHovered(target) {
      if (target === hovered) return;
      if (hovered) hovered.hovered = false;
      if (target) target.hovered = true;
      hovered = target;
      if (currentTheme) paintCountries(globe, currentTheme);
    }

    // The lat/lng on the globe under a mouse or touch position, or null if it's
    // off the globe. Like globe.toGlobeCoords(), but it only tests the sphere,
    // which is over 1000 times faster than testing every country shape.
    function globePointAt(position) {
      var rect = layer.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      var camera = globe.camera();
      var Vector3 = camera.position.constructor; // three.js isn't exposed, but its classes are
      var origin = camera.position;
      var direction = new Vector3(
        ((position.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((position.clientY - rect.top) / rect.height) * 2,
        0.5
      ).unproject(camera).sub(origin).normalize();
      var radius = globe.getGlobeRadius();
      var b = origin.dot(direction);
      var discriminant = b * b - origin.lengthSq() + radius * radius;
      if (discriminant < 0) return null;
      return globe.toGeoCoords(direction.multiplyScalar(-b - Math.sqrt(discriminant)).add(origin));
    }

    // The highlighted country at a point. Off them, the nearest country with a
    // page a few pixels away, so small ones like Panama are easy to hit.
    function countryAt(point) {
      for (var i = 0; i < highlightedShapes.length; i++) {
        if (shapeContains(highlightedShapes[i].shape, point)) return highlightedShapes[i];
      }
      var margin = HIT_MARGIN_PX / pixelsPerDegree;
      var nearest = null;
      shapesWithPage.forEach(function (d) {
        var distance = distanceToShape(d.shape, point);
        if (distance < margin) {
          nearest = d;
          margin = distance;
        }
      });
      return nearest;
    }

    function openPage(target) {
      setHovered(target); // shows which country is opening, also on phones
      // The website shows the globe in a frame: open the page in the whole tab,
      // or in a new tab if the website ever stops allowing that.
      if (!window.open(target.url, "_top")) window.open(target.url, "_blank");
    }

    // The caption lets clicks through, so this only catches the buttons and slider.
    function isOnControls(event) {
      return overlay.element.contains(event.target);
    }

    listen("pointermove", function (event) {
      if (event.pointerType !== "mouse") return; // fingers don't hover
      mouse = isOnControls(event) ? null : { clientX: event.clientX, clientY: event.clientY };
      if (!event.buttons) pressing = false; // released outside the globe
      updatePointer();
    });
    listen("pointerleave", function () {
      mouse = null;
      updatePointer();
    });
    // Capture phase: the globe's drag controls get these events first otherwise.
    listen("pointerdown", function (event) {
      press = { x: event.clientX, y: event.clientY };
      pressing = true;
    }, true);
    listen("pointerup", function () {
      pressing = false;
      updatePointer();
    }, true);
    listen("pointercancel", function () { pressing = false; }, true); // e.g. a finger started scrolling the page
    listen("click", function (event) {
      if (isOnControls(event)) return;
      var point = globePointAt(event);
      if (!point) return;
      if (!exploreMode) {
        setExploreMode(true); // only stops the globe: the country under the click was moving
        return;
      }
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > CLICK_MAX_MOVE_PX) return; // a drag
      var target = countryAt(point);
      if (target && target.url) openPage(target);
    });
    // Keeps the hover colour right if the globe keeps turning after a drag.
    controls.addEventListener("change", function () {
      if (exploreMode && mouse && !pressing) updatePointer();
    });

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
      overlay.rotateButton.addEventListener("click", function () { setExploreMode(false); });
      overlay.exploreButton.addEventListener("click", function () { setExploreMode(true); });
    }

    setExploreMode(options.startExploring);

    // --- Housekeeping

    // Follow the container's size.
    var resizeObserver = new ResizeObserver(fitToContainer);
    resizeObserver.observe(container);
    resizeObserver.observe(overlay.element); // e.g. when the web font loads and the caption changes height

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
      container.style.setProperty("--project-globe-text", textColorOf(currentTheme));
      container.style.setProperty(
        "--project-globe-accent",
        toRgbString(currentTheme.accentColor || currentTheme.highlightColor)
      );
    }

    setTheme(options.theme);

    return {
      setTheme: setTheme,
      getTheme: function () { return currentTheme; },
      setExploreMode: setExploreMode,
      setSpeed: setSpeed,
      // Language of the texts ("es", "en"...).
      language: language,
      // Number of countries highlighted, and the ones from the list that were not recognised.
      countryCount: countries.matched.length,
      unknownCountries: countries.unknown,
      // The underlying globe.gl instance, for advanced tweaks.
      globe: globe,
      destroy: function () {
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        listeners.forEach(function (l) { container.removeEventListener(l[0], l[1], l[2]); });
        globe._destructor();
        layer.remove();
        overlay.element.remove();
        container.classList.remove("project-globe", layoutClass);
        container.style.cursor = "";
      },
    };
  }

  // The language to use: the one passed in, else ?lang= in the page address
  // (e.g. "?lang=en", set per language in Wix), else Spanish. A language
  // without texts in settings.js falls back to Spanish.
  function pickLanguage(requested, languages) {
    var code = requested || new URLSearchParams(window.location.search).get("lang") || DEFAULT_LANGUAGE;
    code = String(code).toLowerCase().split("-")[0]; // "en-US" -> "en"
    if (code === DEFAULT_LANGUAGE || (languages && languages[code])) return code;
    console.warn('ProjectGlobe: no hay textos para el idioma "' + code + '" en settings.js; se usa español.');
    return DEFAULT_LANGUAGE;
  }

  // Camera distance (in globe radii above the surface) at which the globe
  // appears `diameter` pixels wide in a view `viewHeight` pixels tall.
  function fitAltitude(fovDeg, viewHeight, diameter) {
    var halfFov = (fovDeg / 2) * (Math.PI / 180); // camera fov is vertical
    var screenRadius = (diameter / viewHeight) * Math.tan(halfFov);
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
      ui.exploreButton = element("button");
      ui.exploreButton.type = "button";
      ui.exploreButton.textContent = options.labels.explore;
      modes.appendChild(ui.rotateButton);
      modes.appendChild(ui.exploreButton);

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

  // Accepts a list of names, or an object of name -> page address ("" = no page).
  function findCountries(input) {
    var names = Array.isArray(input) ? input : Object.keys(input);
    var map = getLookup();
    var matched = [];
    var unknown = [];
    var pages = new Map(); // country id -> page address
    names.forEach(function (name) {
      var country = map.get(normalize(name));
      if (country) {
        if (matched.indexOf(country) === -1) matched.push(country);
        var page = Array.isArray(input) ? "" : String(input[name] || "").trim();
        if (page) pages.set(country.id, page);
      } else {
        unknown.push(name);
      }
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
      highlightedIds: new Set(matched.map(function (c) { return c.id; })),
      pages: pages,
    };
  }

  // One object per country shape, flagged if it is highlighted, with the full
  // address of its page if it has one. Highlighted countries too small to see
  // (Bahrain, Singapore...) are drawn as a round "country" instead, larger than
  // real life but styled like the others.
  function buildShapes(countries, options) {
    var dotIds = new Set(
      countries.matched
        .filter(function (country) { return !country.shape || country.areaKm2 < options.smallCountryKm2; })
        .map(function (country) { return country.id; })
    );
    function pageUrl(country) {
      var page = countries.pages.get(country.id);
      return page && options.pagesUrl ? options.pagesUrl + page : null;
    }
    var shapes = window.WORLD_COUNTRIES
      .filter(function (country) { return country.shape; })
      .map(function (country) {
        var highlighted = countries.highlightedIds.has(country.id) && !dotIds.has(country.id);
        return { shape: country.shape, highlighted: highlighted, url: highlighted ? pageUrl(country) : null };
      });
    countries.matched.forEach(function (country) {
      if (!dotIds.has(country.id)) return;
      var dot = circle(country.label[1], country.label[0], options.smallCountryDotSize);
      shapes.push({ shape: dot, highlighted: true, dot: true, url: pageUrl(country) });
    });
    return shapes;
  }

  function polygonsOf(geometry) {
    return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  }

  // Whether a GeoJSON shape contains a {lat, lng} point: inside an odd number
  // of its rings (inside the outline and not inside a hole).
  function shapeContains(geometry, point) {
    return polygonsOf(geometry).some(function (rings) {
      return rings.filter(function (ring) { return ringContains(ring, point); }).length % 2 === 1;
    });
  }

  function ringContains(ring, point) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var a = ring[i];
      var b = ring[j];
      if ((a[1] > point.lat) !== (b[1] > point.lat) &&
          point.lng < a[0] + ((point.lat - a[1]) / (b[1] - a[1])) * (b[0] - a[0])) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Distance in degrees from a {lat, lng} point to the nearest edge of a shape.
  // Longitudes are shrunk away from the equator so both directions compare.
  function distanceToShape(geometry, point) {
    var lngScale = Math.cos((point.lat * Math.PI) / 180);
    var nearest = Infinity;
    polygonsOf(geometry).forEach(function (rings) {
      rings.forEach(function (ring) {
        // Corners relative to the point, so the point is at (0, 0).
        var corners = ring.map(function (p) {
          return [(((p[0] - point.lng + 540) % 360) - 180) * lngScale, p[1] - point.lat];
        });
        for (var i = 1; i < corners.length; i++) {
          nearest = Math.min(nearest, distanceFromOrigin(corners[i - 1], corners[i]));
        }
      });
    });
    return nearest;
  }

  // Distance from (0, 0) to the segment a-b.
  function distanceFromOrigin(a, b) {
    var dx = b[0] - a[0];
    var dy = b[1] - a[1];
    var lengthSq = dx * dx + dy * dy;
    var t = lengthSq ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / lengthSq)) : 0;
    return Math.hypot(a[0] + t * dx, a[1] + t * dy);
  }

  // A round GeoJSON polygon around lat/lng with the given radius in degrees.
  function circle(lat, lng, radius) {
    var ring = [];
    var steps = 32;
    var lngScale = 1 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
    for (var i = 0; i <= steps; i++) { // north, east, south, west: clockwise, like the Natural Earth outlines
      var angle = (i / steps) * 2 * Math.PI;
      ring.push([lng + radius * Math.sin(angle) * lngScale, lat + radius * Math.cos(angle)]);
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  // Where to put pulsing rings (only for themes with pulseAll).
  function ringPoints(countries) {
    return countries.matched.map(function (country) {
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
    var resolved = Object.assign({}, THEME_DEFAULTS, theme);
    resolved.hoverColor = resolved.hoverColor || resolved.accentColor || textColorOf(resolved);
    return resolved;
  }

  function textColorOf(theme) {
    return theme.textColor || (isLight(theme.background) ? "#1d1b19" : "#e8eef6");
  }

  function applyTheme(globe, theme, shapes, countries, options) {
    var ringRgb = toRgb(theme.markerColor || theme.highlightColor);
    var useDots = theme.countryStyle === "dots";
    // Dots for small countries sit a hair above the others so they never flicker against them.
    function altitude(d) {
      if (!d.highlighted) return BASE_ALTITUDE;
      return BASE_ALTITUDE + theme.highlightLift + (d.dot ? 0.001 : 0);
    }

    globe.backgroundColor(theme.background);
    // Less shading = part of the ocean colour is "self-lit" and ignores the lights.
    var material = globe.globeMaterial();
    var shading = Math.min(Math.max(theme.shading, 0), 1);
    material.color.set(toRgbString(theme.ocean)).multiplyScalar(shading);
    material.emissive.set(toRgbString(theme.ocean)).multiplyScalar(1 - shading);

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
        .hexPolygonAltitude(altitude);
    } else {
      globe
        .hexPolygonsData([])
        .polygonsData(shapes)
        .polygonAltitude(altitude);
    }
    paintCountries(globe, theme);

    globe
      .pathsData(theme.gridColor ? gridLines() : [])
      .pathColor(function () { return theme.gridColor; });

    globe
      .ringsData(theme.pulseAll ? ringPoints(countries) : [])
      .ringColor(function () {
        return function (t) { return "rgba(" + ringRgb.join(",") + "," + (1 - t) + ")"; };
      })
      .ringMaxRadius(4)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1600);
  }

  // Country colours. Runs again whenever the country under the mouse changes;
  // that only recolours the shapes, it doesn't rebuild them.
  function paintCountries(globe, theme) {
    function fill(d) {
      if (d.hovered) return theme.hoverColor;
      return d.highlighted ? theme.highlightColor : theme.countryColor;
    }
    if (theme.countryStyle === "dots") {
      globe.hexPolygonColor(fill);
      return;
    }
    var highlightBorder = theme.highlightBorderColor || theme.highlightColor;
    globe
      .polygonCapColor(fill)
      .polygonSideColor(function (d) {
        return d.highlighted ? withAlpha(fill(d), theme.highlightSideOpacity) : "rgba(0,0,0,0)";
      })
      .polygonStrokeColor(function (d) { return d.highlighted ? highlightBorder : theme.borderColor; });
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
