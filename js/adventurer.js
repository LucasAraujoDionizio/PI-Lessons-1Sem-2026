
(function () {
  "use strict";

  var Lessons = window.Lessons;
  var template = document.getElementById("adventurer-card-template");
  if (!template || !Lessons || !Lessons.swipeList) return;

  // Moedas definidas pra serem numericamente 01, 02 ao inves de 1, 2, 3...
  function formatCoins(value) {
    return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  }

  Lessons.swipeList({
    route: "adventurer",
    label: Lessons.adventurers.fullName,
    load: Lessons.adventurers.all,
    createItem: function (user) {
      var item = template.content.firstElementChild.cloneNode(true);
      item.querySelector("[data-name]").textContent = Lessons.adventurers.fullName(user);
      item.querySelector("[data-username]").textContent = user.username;
      item.querySelector("[data-coins]").textContent = formatCoins(user.coins);
      return item;
    },
    // Edit 
    onEdit: function (id) {
      window.location.hash = "#/register-adventure/" + encodeURIComponent(id);
    },
    // Delete 
    onRemove: function (id) {
      Lessons.adventurers.remove(id);
    }
  });
})();
