(function () {
  "use strict";

  var Lessons = window.Lessons;
  var screen = document.querySelector('[data-route="register-adventure"]');
  var form = document.getElementById("adventure-form");
  if (!screen || !form || !Lessons) return;

  var panels = Array.prototype.slice.call(screen.querySelectorAll("[data-panel]"));
  var progress = screen.querySelector('[role="progressbar"]');
  var back = screen.querySelector("[data-adventure-back]");
  var TOTAL = panels.length;
  var step = 1;
  var editingId = null; 

  function digits(value) {
    return value.replace(/\D/g, "");
  }

  function formatHeight(value) {
    var d = digits(value).slice(0, 3);
    return d.length > 1 ? d.charAt(0) + "," + d.slice(1) : d;
  }

  function formatPhone(value) {
    var d = digits(value).slice(0, 11);
    if (d.length > 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length > 6) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    if (d.length > 2) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    return d.length ? "(" + d : "";
  }

  function formatCpf(d) {
    return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  }

  function formatRg(d) {
    return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5, 8) + "-" + d.slice(8);
  }

  function sanitizeName(value) {
    return value.replace(/[^\p{L}-]/gu, "").replace(/^-+/, "").replace(/-{2,}/g, "-");
  }

  function formatWeight(value) {
    var v = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
    var comma = v.indexOf(",");
    if (comma > -1) {
      return v.slice(0, comma).slice(0, 3) + "," + v.slice(comma + 1).replace(/,/g, "").slice(0, 2);
    }
    var d = v.slice(0, 5);
    return d.length > 3 ? d.slice(0, -2) + "," + d.slice(-2) : d;
  }

  function isValidCpf(d) {
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t += 1) {
      var sum = 0;
      for (var i = 0; i < t; i += 1) sum += Number(d.charAt(i)) * (t + 1 - i);
      var check = ((sum * 10) % 11) % 10;
      if (check !== Number(d.charAt(t))) return false;
    }
    return true;
  }

  function keepCaret(input, next) {
    var old = input.value;
    var caret = input.selectionStart;
    if (next === old) return;
    input.value = next;
    var pos = Math.max(0, Math.min(next.length, caret - (old.length - next.length)));
    input.setSelectionRange(pos, pos);
  }

  function maskDigits(input, format) {
    input.addEventListener("input", function () {
      var raw = input.value;
      var before = digits(raw.slice(0, input.selectionStart)).length;
      var out = format(raw);
      if (out === raw) return;
      input.value = out;
      var pos = 0;
      var seen = 0;
      while (pos < out.length && seen < before) {
        if (/\d/.test(out.charAt(pos))) seen += 1;
        pos += 1;
      }
      input.setSelectionRange(pos, pos);
    });
  }

  function bindName(input) {
    input.addEventListener("beforeinput", function (event) {
      if (event.data && /\s/.test(event.data)) event.preventDefault(); 
    });
    input.addEventListener("paste", function (event) {
      var text = (event.clipboardData || window.clipboardData).getData("text");
      event.preventDefault();
      var word = sanitizeName(text.trim().split(/\s+/)[0] || "");
      input.setRangeText(word, input.selectionStart, input.selectionEnd, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    input.addEventListener("input", function () {
      keepCaret(input, sanitizeName(input.value));
    });
  }

  function formatDocument(input) {
    var d = digits(input.value);
    if (d.length === 11) input.value = formatCpf(d);
    else if (d.length === 9) input.value = formatRg(d);
  }

  function bindDocument(input) {
    input.addEventListener("input", function () {
      keepCaret(input, digits(input.value).slice(0, 11)); 
    });
    input.addEventListener("focus", function () {
      input.value = digits(input.value);
    });
    input.addEventListener("blur", function () {
      formatDocument(input);
      input.setCustomValidity(checks.document(input));
    });
  }

  Array.prototype.forEach.call(form.querySelectorAll("[data-mask]"), function (input) {
    var mask = input.getAttribute("data-mask");
    if (mask === "name") bindName(input);
    if (mask === "height") maskDigits(input, formatHeight);
    if (mask === "phone") maskDigits(input, formatPhone);
    if (mask === "weight") maskDigits(input, formatWeight);
    if (mask === "document") bindDocument(input);
    input.addEventListener("input", function () {
      input.setCustomValidity("");
    });
  });

  function checkName(input) {
    return /^\p{L}{2,}(?:-\p{L}+)*$/u.test(input.value) ? "" : "Informe apenas uma palavra (mínimo 2 letras).";
  }

  var checks = {
    firstName: checkName,
    lastName: checkName,
    height: function (input) {
      var d = digits(input.value);
      if (d.length !== 3) return "Informe a altura no formato 1,52.";
      var meters = Number(d) / 100;
      return meters < 0.3 || meters > 2.5 ? "Informe uma altura entre 0,30 e 2,50 m." : "";
    },
    weight: function (input) {
      var kg = parseFloat(input.value.replace(",", "."));
      return isFinite(kg) && kg >= 1 && kg <= 300 ? "" : "Informe um peso válido em kg.";
    },
    phone: function (input) {
      var d = digits(input.value);
      var ddd = Number(d.slice(0, 2));
      if (d.length < 10 || ddd < 11) return "Informe o telefone com DDD, no formato (00) 00000-0000.";
      return d.length === 11 && d.charAt(2) !== "9" ? "Celulares começam com 9 após o DDD." : "";
    },
    document: function (input) {
      var d = digits(input.value);
      if (d.length === 11) return isValidCpf(d) ? "" : "CPF inválido.";
      return d.length === 9 ? "" : "Informe um CPF (000.000.000-00) ou um RG (00.000.000-0).";
    },
    bloodType: function (input) {
      return input.value ? "" : "Selecione o tipo sanguíneo.";
    }
  };

  function validatePanel(index) {
    var controls = panels[index - 1].querySelectorAll("[name]");
    for (var i = 0; i < controls.length; i += 1) {
      var control = controls[i];
      control.setCustomValidity(checks[control.name](control));
      if (!control.checkValidity()) {
        control.focus();
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function setStep(next, focus) {
    step = next;
    screen.setAttribute("data-step", String(step));
    progress.setAttribute("aria-valuenow", String((step / TOTAL) * 100));
    panels.forEach(function (panel, index) {
      panel.inert = index + 1 !== step;
    });
    if (focus) {
      var first = panels[step - 1].querySelector("[name]");
      window.setTimeout(function () {
        first.focus({ preventScroll: true });
      }, 50);
    }
  }

  function finish() {
    var data = form.elements;
    formatDocument(data.document);
    var d = digits(data.document.value);
    var payload = {
      firstName: data.firstName.value,
      lastName: data.lastName.value,
      height: data.height.value,
      weight: data.weight.value,
      guardianPhone: data.phone.value,
      document: { type: d.length === 11 ? "CPF" : "RG", number: data.document.value },
      bloodType: data.bloodType.value
    };
    if (editingId) Lessons.adventurers.update(editingId, payload);
    else Lessons.adventurers.create(payload);
    form.reset();
    editingId = null;
    setStep(1, false);
    window.location.hash = "#/adventurer";
  }

  function fillForm(user) {
    var data = form.elements;
    data.firstName.value = user.firstName;
    data.lastName.value = user.lastName;
    data.height.value = user.height;
    data.weight.value = user.weight;
    data.phone.value = user.guardianPhone;
    data.document.value = user.document.number;
    data.bloodType.value = user.bloodType;
  }

  function advance() {
    if (!validatePanel(step)) return;
    if (step < TOTAL) setStep(step + 1, true);
    else finish();
  }

  Array.prototype.forEach.call(screen.querySelectorAll("[data-adventure-next]"), function (button) {
    button.addEventListener("click", advance);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    advance();
  });

  form.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.tagName === "INPUT") {
      event.preventDefault();
      advance();
    }
  });

  back.addEventListener("click", function (event) {
    if (step > 1) {
      event.preventDefault();
      setStep(step - 1, true);
    }
  });

  document.addEventListener("lessons:route", function (event) {
    var route = event.detail;
    if (route.name !== "register-adventure") return;

    form.reset();
    editingId = null;
    setStep(1, false);
    back.setAttribute("href", "#/" + (route.previous && route.previous !== "register-adventure" ? route.previous : "adventurer"));

    if (route.param) {
      var user = Lessons.adventurers.findById(route.param);
      if (user) {
        editingId = user.id;
        fillForm(user);
      } else {
        window.location.hash = "#/adventurer";
      }
    }
  });
})();
