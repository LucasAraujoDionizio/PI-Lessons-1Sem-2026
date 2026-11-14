(function () {
  "use strict";

  var Lessons = (window.Lessons = window.Lessons || {});
  var NAME_MIN_LETTERS = 2;

  Lessons.coinForm = function (options) {
    var screen = document.querySelector('[data-route="' + options.route + '"]');
    if (!screen) return;

    var form = screen.querySelector("form");
    var nameInput = form.elements.name;
    var coinsInput = form.elements.coins;
    var groupId = null; 
    var editingId = null; 

    function letterCount(text) {
      return (text.match(/\p{L}/gu) || []).length;
    }

    coinsInput.addEventListener("input", function () {
      coinsInput.value = coinsInput.value.replace(/\D/g, "").slice(0, 3);
      coinsInput.setCustomValidity("");
    });

    nameInput.addEventListener("input", function () {
      nameInput.setCustomValidity("");
    });

    function showError(input, message) {
      input.setCustomValidity(message); 
      input.focus(); 
      input.reportValidity(); 
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault(); 
      var name = nameInput.value.replace(/\s+/g, " ").trim();

      if (!name) {
        showError(nameInput, options.texts.empty);
        return;
      }
      if (letterCount(name) < NAME_MIN_LETTERS) {
        showError(nameInput, "O nome precisa ter ao menos 2 letras.");
        return;
      }
      if (options.store.nameExists(groupId, name, editingId)) {
        showError(nameInput, options.texts.taken);
        return;
      }
      if (!/^\d{1,3}$/.test(coinsInput.value) || Number(coinsInput.value) < 1) {
        showError(coinsInput, "Informe o valor em moedas (de 1 a 999).");
        return;
      }

      var data = { name: name, coins: coinsInput.value };
      var saved = editingId ? options.store.update(editingId, data) : options.store.create(groupId, data);
      if (!saved) {
        showError(nameInput, options.texts.failed);
        return;
      }

      form.reset();
      editingId = null;
      window.location.hash = "#/" + options.backRoute + "/" + encodeURIComponent(groupId);
    });

    document.addEventListener("lessons:route", function (event) {
      if (event.detail.name !== options.route) return;

      groupId = event.detail.param;
      var item = event.detail.itemId ? options.store.findById(groupId, event.detail.itemId) : null;
      if (event.detail.itemId && !item) {
        window.location.replace("#/" + options.backRoute + "/" + encodeURIComponent(groupId));
        return;
      }

      form.reset();
      nameInput.setCustomValidity("");
      coinsInput.setCustomValidity("");
      editingId = item ? item.id : null;
      if (item) {
        nameInput.value = item.name;
        coinsInput.value = String(item.coins);
      }
    });
  };
})();
