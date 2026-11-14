// Básicamente o projeto é um SPA 
(function () {
  "use strict";
  var Lessons = (window.Lessons = window.Lessons || {});
  var DEFAULT_ROUTE = "login";
  var PROTECTED = [
    "groups",
    "adventurer",
    "register-adventure",
    "register-groups",
    "tasks-list",
    "reward-list",
    "create-reward",
    "redeem-reward",
    "register-task"
  ];
  var GROUP_ROUTES = ["tasks-list", "reward-list", "create-reward", "redeem-reward", "register-task"];
  var ROUTE_PATTERN = /^#\/?([^/?#]+)(?:\/([^?#]+))?/;
  var views = Array.from(document.querySelectorAll("[data-route]"));
  var navbar = document.querySelector("[data-navbar]");
  var navLinks = document.querySelectorAll("[data-nav-link]");

  Lessons.route = { name: null, param: null, itemId: null, previous: null };
  // Rota por hash pra não dar problema com github pages (assim espero)
  function parseHash() {
    var match = ROUTE_PATTERN.exec(window.location.hash);
    var name = match ? match[1] : DEFAULT_ROUTE; 
    var known = views.some(function (view) {
      return view.getAttribute("data-route") === name;
    });
    return known
      ? { name: name, param: match && match[2] ? decodeURIComponent(match[2]) : null }
      : { name: DEFAULT_ROUTE, param: null };
  }

  function render() {
    var next = parseHash();
    if (PROTECTED.indexOf(next.name) !== -1 && !Lessons.session.current()) {
      window.location.replace("#/login");
      return;
    }

    var isGroupRoute = GROUP_ROUTES.indexOf(next.name) !== -1;
    var parts = isGroupRoute && next.param ? next.param.split("/") : [];
    var groupId = isGroupRoute ? parts[0] || null : null;
    var itemId = isGroupRoute ? parts[1] || null : null;
    if (isGroupRoute && !(groupId && Lessons.groups.findById(groupId))) {
      window.location.replace("#/groups"); 
      return;
    }

    if (next.name === "login" || next.name === "register") Lessons.session.end();
    if (next.name !== Lessons.route.name) {
      Lessons.route.previous = Lessons.route.name;
    }
    Lessons.route.name = next.name;
    Lessons.route.param = isGroupRoute ? groupId : next.param;
    Lessons.route.itemId = itemId;

    var active = null;
    views.forEach(function (view) {
      var isActive = view.getAttribute("data-route") === next.name;
      view.hidden = !isActive;
      if (isActive) active = view;
    });

    var navSet = active ? active.getAttribute("data-nav") : null;
    navbar.hidden = !navSet;

    if (isGroupRoute) {
      document.querySelectorAll("[data-group-link]").forEach(function (link) {
        link.setAttribute("href", "#/" + link.getAttribute("data-group-link") + "/" + encodeURIComponent(groupId));
      });
    }

    navLinks.forEach(function (link) {
      link.hidden = link.getAttribute("data-nav-set") !== navSet;
      var isCurrent = link.getAttribute("data-nav-link") === next.name;
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      link.setAttribute("data-marked", String(!isCurrent)); 
    });
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("lessons:route", { detail: Lessons.route }));
  }

  document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
    var input = document.getElementById(button.getAttribute("aria-controls"));
    var icon = button.querySelector(".material-symbols-outlined");
    button.addEventListener("click", function () {
      var show = input.type === "password"; 
      input.type = show ? "text" : "password";
      button.setAttribute("aria-pressed", String(show)); 
      button.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha"); 
      icon.textContent = show ? "visibility" : "visibility_off"; 
      input.focus(); 
    });
  });
  window.addEventListener("hashchange", render);
  render();
})();
