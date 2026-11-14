(function () {
  "use strict";

  var Lessons = (window.Lessons = window.Lessons || {});
  Lessons.formatCoins = function (value) {
    return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  };

  var OPEN_X = -119;
  Lessons.swipeList = function (options) {
    var screen = document.querySelector('[data-route="' + options.route + '"]');
    var actions = document.getElementById("swipe-actions-template");
    if (!screen || !actions) return null; 
    var list = screen.querySelector("[data-list]");
    var empty = screen.querySelector("[data-empty]");

    function createItem(entry, index) {
      var item = options.createItem(entry, index); 
      var label = options.label(entry);
      item.setAttribute("data-id", entry.id); 
      item.prepend(actions.content.firstElementChild.cloneNode(true)); 
      item.querySelector('[data-action="edit"]').setAttribute("aria-label", "Editar " + label);
      item.querySelector('[data-action="delete"]').setAttribute("aria-label", "Excluir " + label);
      return item;
    }

    var cards = Lessons.infiniteList({
      scroller: screen.querySelector("[data-scroll]"),
      list: list,
      sentinel: screen.querySelector("[data-sentinel]"),
      createItem: createItem
    });

    function refresh(keepLoaded) {
      var entries = options.load(); 
      if (options.onData) options.onData(entries); 
      empty.hidden = entries.length > 0; 
      cards.show(entries, keepLoaded ? cards.loadedCount() : 0);
    }

    var drag = null;
    var suppressClick = false;

    function setOpen(item, open) {
      item.setAttribute("data-open", String(open));
      item.querySelector("[data-card]").style.setProperty("--card-x", open ? OPEN_X + "px" : "0px");
    }

    function closeAll(except) {
      Array.prototype.forEach.call(list.querySelectorAll('[data-open="true"]'), function (item) {
        if (item !== except) setOpen(item, false);
      });
    }

    list.addEventListener("pointerdown", function (event) {
      var card = event.target.closest("[data-card]");
      if (!card || (event.pointerType === "mouse" && event.button !== 0)) return;
      var item = card.parentElement;
      closeAll(item);
      drag = {
        item: item,
        card: card,
        startX: event.clientX,
        startY: event.clientY, 
        base: item.getAttribute("data-open") === "true" ? OPEN_X : 0, 
        x: null,
        active: false 
      };
    });

    list.addEventListener("pointermove", function (event) {
      if (!drag) return;
      var dx = event.clientX - drag.startX; 
      var dy = event.clientY - drag.startY; 

      if (!drag.active) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
          drag = null; 
          return;
        }
        if (Math.abs(dx) < 6) return;
        drag.active = true;
        drag.item.setAttribute("data-dragging", "true"); 
        drag.card.setPointerCapture(event.pointerId); 
      }
      drag.x = Math.max(OPEN_X - 16, Math.min(0, drag.base + dx));
      drag.card.style.setProperty("--card-x", drag.x + "px");
    });

    function endDrag() {
      if (!drag) return;
      var finished = drag;
      drag = null;
      if (!finished.active) return; 
      suppressClick = true;
      window.setTimeout(function () {
        suppressClick = false;
      }, 0);
      finished.item.removeAttribute("data-dragging");
      setOpen(finished.item, finished.x < OPEN_X / 2);
    }

    list.addEventListener("pointerup", endDrag);
    list.addEventListener("pointercancel", endDrag);

    list.addEventListener("click", function (event) {
      var button = event.target.closest("[data-action]"); 
      var item = event.target.closest("[data-item]"); 
      if (!item) return;
      var id = item.getAttribute("data-id");

      if (button) {
        if (button.getAttribute("data-action") === "edit") {
          options.onEdit(id);
        } else {
          options.onRemove(id); 
          refresh(true);
        }
        return;
      }

      if (suppressClick) return;
      if (item.getAttribute("data-open") === "true") setOpen(item, false);
      else if (options.onOpen) options.onOpen(id);
    });

    list.addEventListener("keydown", function (event) {
      var card = event.target.closest("[data-card]");
      if (!card) return;
      var item = card.parentElement;
      var isOpen = item.getAttribute("data-open") === "true";
      if (event.key === "Enter" && event.target === card && !isOpen && options.onOpen) {
        options.onOpen(item.getAttribute("data-id"));
      }
      if (event.key === "ArrowLeft") setOpen(item, true);
      if (event.key === "ArrowRight" || event.key === "Escape") setOpen(item, false);
    });

    // Pressing anywhere outside the cards closes any open card.
    document.addEventListener("pointerdown", function (event) {
      if (!event.target.closest("[data-item]")) closeAll(null);
    });

    document.addEventListener("lessons:route", function (event) {
      if (event.detail.name === options.route) refresh(false);
    });

    return { refresh: refresh };
  };
})();
