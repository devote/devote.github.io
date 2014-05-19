/**
 * Загрузчик файлов подсистем
 */
(function(xJavaScriptLoader) {
  var scripts = document.getElementsByTagName('script');
  var src = (scripts[scripts.length - 1] || {}).getAttribute('src') || '';
  var arg = src.indexOf('?') !== -1 ? src.split('?').pop() : 'root';
  var rootDir = src.split('js/init.js').shift();

  window.$BootStrap = {
    Loader: xJavaScriptLoader,
    vars: {
      base: arg,
      baseFolder: rootDir + arg + (arg ? '/' : ''),
      systemPath: rootDir + arg + (arg ? '/' : '') + '!_system/'
    }
  };

  if (arg) {
    xJavaScriptLoader('js/init.js');
  }
})(function(url, callback, onerror) {
  var xhr = new XMLHttpRequest;
  url = window.$BootStrap.vars.systemPath + url;
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      var result, status = (xhr.status === 1223) ? 204 : (xhr.status === 0 && (self.location || {}).protocol == 'file:') ? 200 : xhr.status;
      if (status >= 200 && status < 300 || status === 304) {
        if (url.indexOf('.json') != -1) {
          try {
            result = (new Function('', 'return ' + xhr.responseText + "\n////@ sourceURL=" + url))();
          } catch(_e_) {
            return onerror && onerror(status, url);
          }
        } else {
          try {
            result = (window.execScript || function(data) {
              return window["eval"].call(window, data);
            })(xhr.responseText + "\n////@ sourceURL=" + url);
          } catch(_e_) {
            return onerror && onerror(status, url);
          }
        }
        callback && callback(result);
      } else {
        onerror && onerror(status, url);
      }
    }
  }
  xhr.send(null);
});