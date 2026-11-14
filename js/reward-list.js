(function () {
  "use strict";

  var Lessons = window.Lessons;
  var template = document.getElementById("reward-card-template");
  if (!template || !Lessons || !Lessons.swipeList || !Lessons.rewards) return;
  var AVATARS = ["assets/icon-group-pink.svg", "assets/icon-group-blue.svg"];
  var TONES = ["pink", "blue"];

  function currentGroupId() {
    return encodeURIComponent(Lessons.route.param);
  }

  Lessons.swipeList({
    route: "reward-list",
    label: function (reward) {
      return reward.name;
    },
    load: function () {
      return Lessons.rewards.all(Lessons.route.param);
    },
    createItem: function (reward, index) {
      var item = template.content.firstElementChild.cloneNode(true);
      item.setAttribute("data-tone", TONES[index % TONES.length]);
      item.querySelector("[data-redeem]").setAttribute("aria-label", "Resgatar " + reward.name);
      item.querySelector("[data-avatar]").setAttribute("src", AVATARS[index % AVATARS.length]);
      item.querySelector("[data-name]").textContent = reward.name;
      item.querySelector("[data-coins]").textContent = Lessons.formatCoins(reward.coins);
      return item;
    },
    onEdit: function (id) {
      window.location.hash = "#/create-reward/" + currentGroupId() + "/" + encodeURIComponent(id);
    },
    onRemove: function (id) {
      Lessons.rewards.remove(id);
    },
    onOpen: function (id) {
      window.location.hash = "#/redeem-reward/" + currentGroupId() + "/" + encodeURIComponent(id);
    }
  });
})();
