window.$BootStrap.Loader('js/history.js', function() {
  // перенаправляем при необходимости
  history.redirect(null, window.$BootStrap.vars.baseFolder);

  // вставляем стили на страницу
  var head = document.getElementsByTagName('head')[0];
  var link = document.createElement('link');
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = window.$BootStrap.vars.systemPath + 'css/main.css';
  head.insertBefore(link, head.firstChild);

  // базовый путь ссылок и прочего
  var base = document.createElement('base');
  base.href = window.$BootStrap.vars.baseFolder;
  head.insertBefore(base, head.firstChild);

  var eventInfo = window.addEventListener ? ['addEventListener', ''] : ['attachEvent', 'on'];

  function getCurrentModule() {
    return history.location.pathname.replace(new RegExp("^" + window.$BootStrap.vars.baseFolder, ""), '/').replace(/index\.html?/i, '');
  }

  var main = document.createElement('div');
  main.id = 'main';
  window.$BootStrap.Loader('js/structure.json', function(structure) {
    main.innerHTML = structure.body;
    document.body.appendChild(main);

    function loadContent() {
      var module = getCurrentModule() === '/' ? '/home/' : getCurrentModule();
      if (module in structure) {
        document.getElementById('dynamic_content').innerHTML = structure[module].html;
      } else {
        document.getElementById('dynamic_content').innerHTML = '';
      }
    }

    document[eventInfo[0]](eventInfo[1] + 'click', function(event) {
      event = event || window.event;
      var prevent = false;
      var target = event.target || event.srcElement;
      if (target && target.nodeName === 'A') {
        // looking for all the links with 'ajax' class found
        if ((' ' + target.className + ' ').indexOf('ajax') >= 0) {
          // keep the link in the browser history
          history.pushState(null, null, target.href);
          loadContent();
          prevent = true;
        } else if ((' ' + target.className + ' ').indexOf('external') >= 0) {
          window.open(target.href);
          prevent = true;
        }
        if (prevent) {
          // do not give a default action
          if (event.preventDefault) {
            event.preventDefault();
          } else {
            event.returnValue = false;
          }
        }
      }
    }, false);

    window[eventInfo[0]](eventInfo[1] + 'popstate', function(event) {
      loadContent();
    }, false);

    loadContent();
  });

  // наш фоновый плеер
  window.$BootStrap.Loader('js/audiojs/audio.min.js', function() {
    var div = document.createElement('div');
    div.className = 'player_box';
    div.innerHTML = '<audio preload="auto"><source id="default_preload" src="'+ window.$BootStrap.vars.systemPath +'mp3/title.mp3" type="audio/mpeg" /></audio>';
    document.body.appendChild(div);

    var player = audiojs.createAll({
      imageLocation: window.$BootStrap.vars.systemPath + "js/audiojs/player-graphics.gif",
      trackEnded: function(){
        player[0].play();
      }
    });
    player[0].play();
  });
});