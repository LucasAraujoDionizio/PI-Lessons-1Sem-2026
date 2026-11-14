(function () {
  "use strict";

  var Lessons = window.Lessons; 
  var screen = document.querySelector('[data-route="register-groups"]');
  var template = document.getElementById("participant-template");
  if (!screen || !template || !Lessons || !Lessons.groups) return;

  var form = screen.querySelector("#group-register-form");
  var nameInput = form.elements.name;
  var scroller = screen.querySelector("[data-scroll]"); 
  var list = screen.querySelector("[data-list]"); 
  var AVATARS = ["assets/icon-group-pink.svg", "assets/icon-group-blue.svg"];
  var selected = {}; 
  var editingId = null; 
  var submitButton = form.querySelector('[type="submit"]'); 

  function createRow(user, index) {
    var item = template.content.firstElementChild.cloneNode(true);
    var check = item.querySelector("[data-check]");
    item.querySelector("[data-avatar]").setAttribute("src", AVATARS[index % AVATARS.length]);
    item.querySelector("[data-name]").textContent = Lessons.adventurers.fullName(user);
    item.querySelector("[data-username]").textContent = user.username;
    check.value = user.id;
    check.checked = !!selected[user.id]; 
    check.setAttribute("aria-label", "Adicionar " + Lessons.adventurers.fullName(user) + " ao grupo");
    return item;
  }

  var participants = Lessons.infiniteList({
    scroller: scroller,
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

  nameInput.addEventListener("input", function () {
    nameInput.setCustomValidity("");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = nameInput.value.trim();
    var message = ""; 
    if (!name) message = "Informe o nome do grupo.";
    else if (Lessons.groups.nameExists(name, editingId)) message = "Já existe um grupo com esse nome.";
    nameInput.setCustomValidity(message); 
    if (message) {
      nameInput.focus();
      nameInput.reportValidity(); 
      return;
    }

    var data = { name: name, memberIds: Object.keys(selected) };
    var group = editingId ? Lessons.groups.update(editingId, data) : Lessons.groups.create(data);
    if (!group) { 
      nameInput.setCustomValidity("Já existe um grupo com esse nome.");
      nameInput.reportValidity();
      return;
    }
    form.reset();
    editingId = null;
    window.location.hash = "#/groups"; 
  });

  document.addEventListener("lessons:route", function (event) {
    if (event.detail.name !== "register-groups") return;
    var group = event.detail.param ? Lessons.groups.findById(event.detail.param) : null;
    if (event.detail.param && !group) {
      window.location.replace("#/groups");
      return;
    }
    form.reset();
    nameInput.setCustomValidity("");
    editingId = group ? group.id : null;
    submitButton.textContent = group ? "Salvar" : "Criar";
    selected = {};
    if (group) {
      nameInput.value = group.name;
      (group.memberIds || []).forEach(function (id) {
        selected[id] = true;
      });
    }
    scroller.scrollTop = 0;
    participants.show(Lessons.adventurers.all()); 
  });
})();
