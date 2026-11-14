(function () {
  "use strict";

  var Lessons = window.Lessons; 
  var loginForm = document.getElementById("login-form");
  var registerForm = document.getElementById("register-form");

  if (!Lessons || !Lessons.admins || !Lessons.session) return;

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate(form, checks) {
    var controls = form.elements; 
    for (var i = 0; i < checks.length; i += 1) {
      var control = controls[checks[i].name]; 
      var message = checks[i].test(control);
      control.setCustomValidity(message);
      if (message) {
        control.focus();
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function clearOnInput(form) {
    ["input", "change"].forEach(function (eventName) {
      form.addEventListener(eventName, function (event) {
        if (event.target.setCustomValidity) event.target.setCustomValidity("");
      });
    });
  }

  if (loginForm) {
    clearOnInput(loginForm);
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault(); 
      var admin = null;
      var ok = validate(loginForm, [
        {
          name: "email",
          test: function (input) {
            return input.value.trim() ? "" : "Informe o email.";
          }
        },
        {
          name: "password",
          test: function (input) {
            if (!input.value) return "Informe a senha.";
            admin = Lessons.admins.authenticate(loginForm.elements.email.value, input.value);
            return admin ? "" : "Email ou senha incorretos.";
          }
        }
      ]);
      if (!ok) return;
      Lessons.session.start(admin); //lembrar quem é o admin user logado
      loginForm.reset();
      window.location.hash = "#/groups"; 
    });
  }

  if (registerForm) {
    clearOnInput(registerForm);
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = validate(registerForm, [
        {
          name: "name",
          test: function (input) {
            var letters = input.value.match(/\p{L}/gu) || [];
            return letters.length > 1 ? "" : "O nome deve ter mais de 1 letra.";
          }
        },
        {
          name: "email",
          test: function (input) {
            if (!EMAIL_PATTERN.test(input.value.trim())) return "Informe um email válido.";
            return Lessons.admins.emailExists(input.value) ? "Este email já está cadastrado." : "";
          }
        },
        {
          name: "password",
          test: function (input) {
            var value = input.value;
            if (value.length !== 6) return "A senha deve ter exatamente 6 caracteres.";
            if (!/\p{Lu}/u.test(value)) return "A senha deve ter pelo menos 1 letra maiúscula.";
            if (!/\d/.test(value)) return "A senha deve ter pelo menos 1 número.";
            return /[^\p{L}\p{N}\s]/u.test(value) ? "" : "A senha deve ter pelo menos 1 caractere especial.";
          }
        },
        {
          name: "confirm",
          test: function (input) {
            return input.value === registerForm.elements.password.value ? "" : "As senhas não coincidem.";
          }
        },
        {
          name: "category",
          test: function (input) {
            return input.value ? "" : "Selecione a categoria da conta.";
          }
        }
      ]);
      if (!ok) return;
      var data = registerForm.elements;
      var admin = Lessons.admins.create({
        name: data.name.value,
        email: data.email.value,
        password: data.password.value,
        category: data.category.value
      });
      if (!admin) {
        data.email.setCustomValidity("Este email já está cadastrado.");
        data.email.focus();
        data.email.reportValidity();
        return;
      }
      Lessons.session.start(admin);
      registerForm.reset();
      window.location.hash = "#/groups";
    });
  }

  document.addEventListener("lessons:route", function (event) {
    if (event.detail.name === "login" && loginForm) loginForm.reset();
    if (event.detail.name === "register" && registerForm) registerForm.reset();
  });
})();
