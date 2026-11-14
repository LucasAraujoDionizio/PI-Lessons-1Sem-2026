(function () {
  "use strict";

  var Lessons = (window.Lessons = window.Lessons || {});
  var BATCH = 10; 
  Lessons.infiniteList = function (options) {
    var entries = []; 
    var rendered = 0; 
    function renderNext() {
      var end = Math.min(rendered + BATCH, entries.length);
      var fragment = document.createDocumentFragment();
      
      for (; rendered < end; rendered += 1) {
        fragment.appendChild(options.createItem(entries[rendered], rendered));
      }
      options.list.appendChild(fragment);
    }

    function sentinelNearView() {
      var box = options.scroller.getBoundingClientRect();
      return options.sentinel.getBoundingClientRect().top < box.bottom + 200;
    }

    function fill() {
      while (rendered < entries.length && sentinelNearView()) renderNext();
    }

    new IntersectionObserver(
      function (found) {
        if (found[0].isIntersecting) fill();
      },
      { root: options.scroller, rootMargin: "0px 0px 200px 0px" }
    ).observe(options.sentinel);

    return {
      show: function (newEntries, minimum) {
        entries = newEntries;
        options.list.textContent = ""; 
        rendered = 0;
        while (rendered < Math.min(minimum || BATCH, entries.length)) renderNext();
        fill();
      },
      loadedCount: function () {
        return rendered;
      }
    };
  };
})();
