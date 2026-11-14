(function () {
  "use strict";

  var Lessons = window.Lessons; 

  Lessons.coinForm({
    route: "create-reward",
    store: Lessons.rewards,
    backRoute: "reward-list", 
    texts: {
      empty: "Informe o nome da recompensa.",
      taken: "Já existe uma recompensa com esse nome neste grupo.",
      failed: "Não foi possível salvar a recompensa. Tente de novo."
    }
  });
})();
