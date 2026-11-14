(function () {
  "use strict";
  var Lessons = window.Lessons; 
  var template = document.getElementById("group-card-template"); 
  if (!template || !Lessons || !Lessons.swipeList || !Lessons.groups) return;

  var TONES = [
    { tone: "blue", avatar: "assets/icon-group-blue.svg" },
    { tone: "pink", avatar: "assets/icon-group-pink.svg" }
  ];

  function membersLabel(count) {
    var total = Math.max(0, Number(count) || 0);
    return total + (total === 1 ? " membro" : " membros");
  }

  Lessons.swipeList({
    route: "groups",

    label: function (group) {
      return group.name;
    },

    load: function () {
      return Lessons.groups.all().sort(function (a, b) {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) || a.createdAt.localeCompare(b.createdAt);
      });
    },
  
    createItem: function (group, index) {
      var item = template.content.firstElementChild.cloneNode(true); 
      var look = TONES[index % TONES.length]; 
      item.setAttribute("data-tone", look.tone); 
      item.querySelector("[data-avatar]").setAttribute("src", look.avatar);
      item.querySelector("[data-name]").textContent = group.name;
      item.querySelector("[data-members]").textContent = membersLabel(group.membersCount);
      return item;
    },

    onEdit: function (id) {
      window.location.hash = "#/register-groups/" + encodeURIComponent(id);
    },

    onRemove: function (id) {
      Lessons.groups.remove(id);
    },

    onOpen: function (id) {
      window.location.hash = "#/tasks-list/" + encodeURIComponent(id);
    }
  });
})();
