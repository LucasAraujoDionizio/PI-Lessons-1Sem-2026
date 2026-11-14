(function () {
  "use strict";

  var Lessons = window.Lessons;
  var screen = document.querySelector('[data-route="tasks-list"]');
  var template = document.getElementById("task-card-template");
  if (!screen || !template || !Lessons || !Lessons.swipeList || !Lessons.tasks) return;

  var filled = screen.querySelector("[data-filled]");
  var list = screen.querySelector("[data-list]");
  var bar = screen.querySelector("[data-progress]");
  var fill = screen.querySelector("[data-progress-fill]");
  var star = screen.querySelector("[data-star]");

  var AVATARS = ["assets/icon-group-pink.svg", "assets/icon-group-blue.svg"];
  var STAR_TODO = "assets/star-incomplete.svg";
  var STAR_DONE = "assets/star-complete.svg";

  var entering = false;

  function stepFor(done, total) {
    if (!total || !done) return 0;
    if (done === total) return 100;
    return Math.min(90, Math.max(10, Math.round((done / total) * 10) * 10));
  }


  function paint(tasks) {
    var total = tasks.length;

    var done = tasks.filter(function (task) {
      return task.completed;
    }).length;
    var allDone = total > 0 && done === total;

    if (entering) {
      entering = false;
      fill.setAttribute("data-step", "0");
      void fill.offsetWidth;
    }
    fill.setAttribute("data-step", String(stepFor(done, total)));
    bar.setAttribute("aria-valuenow", String(total ? Math.round((done / total) * 100) : 0));
    star.setAttribute("src", allDone ? STAR_DONE : STAR_TODO);
    star.setAttribute("height", allDone ? "50" : "36");
  }

  function currentTasks() {
    return Lessons.tasks.all(Lessons.route.param);
  }

  document.addEventListener("lessons:route", function (event) {
    if (event.detail.name === "tasks-list") entering = true;
  });

  Lessons.swipeList({
    route: "tasks-list",
    label: function (task) {
      return task.name;
    },
    load: function () {
      return currentTasks().sort(function (a, b) {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) || a.createdAt.localeCompare(b.createdAt);
      });
    },
    onData: function (tasks) {
      filled.hidden = tasks.length === 0;
      paint(tasks);
    },
    createItem: function (task, index) {
      var item = template.content.firstElementChild.cloneNode(true); 
      var check = item.querySelector("[data-check]");
      item.setAttribute("data-done", String(!!task.completed)); 
      item.querySelector("[data-avatar]").setAttribute("src", AVATARS[index % AVATARS.length]);
      item.querySelector("[data-name]").textContent = task.name;
      item.querySelector("[data-coins]").textContent = Lessons.formatCoins(task.coins);
      check.checked = !!task.completed; 
      check.setAttribute("aria-label", "Concluir a tarefa " + task.name);
      return item;
    },
    onEdit: function (id) {
      var groupId = encodeURIComponent(Lessons.route.param);
      window.location.hash = "#/register-task/" + groupId + "/" + encodeURIComponent(id);
    },
    onRemove: function (id) {
      Lessons.tasks.remove(id);
    }
  });

  list.addEventListener("change", function (event) {
    var check = event.target.closest("[data-check]");
    var item = check && check.closest("[data-item]");
    if (!item) return;
    Lessons.tasks.setCompleted(item.getAttribute("data-id"), check.checked);
    item.setAttribute("data-done", String(check.checked));
    paint(currentTasks());
  });
})();
