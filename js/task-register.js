(function () {
  "use strict";

  var Lessons = window.Lessons; 

  Lessons.coinForm({
    route: "register-task",
    store: Lessons.tasks,
    backRoute: "tasks-list", 
    texts: {
      empty: "Informe o nome da tarefa.",
      taken: "Já existe uma tarefa com esse nome neste grupo.",
      failed: "Não foi possível salvar a tarefa. Tente de novo."
    }
  });
})();
