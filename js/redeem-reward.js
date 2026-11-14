(function () {
  "use strict";

  var Lessons = window.Lessons;
  var screen = document.querySelector('[data-route="redeem-reward"]');
  var template = document.getElementById("participant-template"); 
  var dialog = document.getElementById("alert-dialog"); 
  if (!screen || !template || !dialog || !Lessons || !Lessons.rewards) return;

  var form = screen.querySelector("form");
  var list = screen.querySelector("[data-list]");
  var AVATARS = ["assets/icon-group-blue.svg", "assets/icon-group-pink.svg"];
  var reward = null; 
  var groupId = null;
  var selected = {}; 

  function createRow(user, index) {
    var row = template.content.firstElementChild.cloneNode(true);
    var check = row.querySelector("[data-check]");
    row.querySelector("[data-avatar]").setAttribute("src", AVATARS[index % AVATARS.length]);
    row.querySelector("[data-name]").textContent = Lessons.adventurers.fullName(user);
    row.querySelector("[data-username]").textContent = user.username;
    check.value = user.id;
    check.checked = !!selected[user.id]; 
    check.setAttribute("aria-label", "Entregar a recompensa para " + Lessons.adventurers.fullName(user));
    return row;
  }

  var members = Lessons.infiniteList({
    scroller: screen.querySelector("[data-scroll]"),
    list: list,
    sentinel: screen.querySelector("[data-sentinel]"),
    createItem: createRow
  });

  list.addEventListener("change", function (event) {
    var check = event.target;
    if (!check.matches("[data-check]")) return;
    if (check.checked) selected[check.value] = true;
    else delete selected[check.value];
  });

  function showPopup(title, lines) {
    dialog.querySelector("[data-dialog-title]").textContent = title;
    var lineList = dialog.querySelector("[data-dialog-lines]");
    lineList.textContent = ""; // remove the lines of the last time the pop-up was shown
    lines.forEach(function (text) {
      var item = document.createElement("li");
      item.textContent = text;
      lineList.appendChild(item);
    });
    dialog.showModal();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); 

    var ids = Object.keys(selected); 
    if (!ids.length) {
      showPopup("Ninguém selecionado", ["Escolha quem vai receber a recompensa."]);
      return;
    }

    var result = Lessons.rewards.redeem(groupId, reward.id, ids);
    if (!result) {
      window.location.replace("#/reward-list/" + encodeURIComponent(groupId));
      return;
    }

    if (!result.redeemed) {
      var lines = result.short.map(function (user) {
        return Lessons.adventurers.fullName(user) + " tem " + user.coins + " moedas (precisa de " + reward.coins + ").";
      });
      showPopup("Moedas insuficientes", lines);
      return;
    }

    window.location.hash = "#/reward-list/" + encodeURIComponent(groupId);
  });

  document.addEventListener("lessons:route", function (event) {
    if (event.detail.name !== "redeem-reward") return;

    groupId = event.detail.param;
    reward = Lessons.rewards.findById(groupId, event.detail.itemId);
    if (!reward) {

      window.location.replace("#/reward-list/" + encodeURIComponent(groupId));
      return;
    }

    var memberIds = Lessons.groups.findById(groupId).memberIds || [];
    var groupMembers = Lessons.adventurers.all().filter(function (user) {
      return memberIds.indexOf(user.id) !== -1;
    });

    selected = {}; 
    screen.querySelector("[data-scroll]").scrollTop = 0;
    members.show(groupMembers);
  });
})();
