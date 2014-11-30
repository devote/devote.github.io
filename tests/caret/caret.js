/**
 * Shim for caretPositionFromPoint v0.0.1
 * Copyright 2014 Dmitrii Pakhtinov (spb.piksel@gmail.com)
 * Released under the MIT license
 * Update: 11/29/2014
 */
document.caretPositionFromPoint = new function() {
  "use strict";
  // temporary variables
  var isControl, tempElement = null;
  // extra padding, a bug in Safari
  var extraPadding = 0;
  // link to the document
  var document = window.document;
  // HEAD element
  var head = document.getElementsByTagName('head')[0];
  // link to native method caretPositionFromPoint
  var caretPositionFromPoint = document.caretPositionFromPoint;
  // link to native method caretRangeFromPoint
  var caretRangeFromPoint = document.caretRangeFromPoint;
  // testing flag
  var hasTestedNative = typeof caretPositionFromPoint !== 'function';
  // is not correct working native method
  var needFixNative = true;
  // Fix bug in Chrome
  tempElement = document.createElement('style');
  // set type
  tempElement.type = "text/css";
  // Chrome's default fonts in text fields do not look like an as text on element
  tempElement.textContent = 'input,textarea{font-size:initial}';
  // add styles with low priority
  head[head.children.length ? 'insertBefore' : 'appendChild'](tempElement, head.children[0]);
  // clean variable
  tempElement = null;
  // returns a shim function
  return function(x, y) {
    // context
    var self = this;
    // link to the body element
    var body = document.body;
    // by default zero position
    var offset = 0;
    // other variables
    var style = "", css, index, value, range, node;
    /**
     * Inside conditions produce test the correctness of the
     * built-in method caretPositionFromPoint. For example,
     * in Firefox native method does not work correctly
     */
    if (!hasTestedNative && body) {
      // needed for the test element TEXTAREA, with
      // which we will verify the proper operation
      tempElement = document.createElement('textarea');
      // style for an element
      tempElement.style.cssText = [
        'top:0','left:0','width:100px','height:100px','z-index:1000',
        'position:fixed','border:10px solid #000','font:normal 5px serif',
      ''].join('!important;');
      // value of the element is equal to five characters
      tempElement.value = 'OlOlO';
      // insert temporary element to document
      body.appendChild(tempElement);
      // gets the position of the carriage directly on the curb element
      range = caretPositionFromPoint.call(document, 115, 115);
      // if it works correctly returns the value 5, or returns an other incorrect value
      needFixNative = range.offsetNode && range.offsetNode.nodeName === 'TEXTAREA' && range.offset !== 5;
      // remove temporary element from document
      body.removeChild(tempElement);
      // set flag informs that the test is passed
      hasTestedNative = true;
      // clean variable
      tempElement = null;
    }
    // does not require fix or failed to pass the test
    if (!needFixNative || !hasTestedNative) {
      // use the native method
      return caretPositionFromPoint.apply(self, arguments);
    }
    // find out which element of this position
    if (body && (node = document.elementFromPoint(x, y))) {
      // is control element text input
      isControl = node.nodeName && (node.nodeName === 'TEXTAREA' || node.nodeName === 'INPUT' && node.type === 'text');
      // condition for Internet Explorer all versions
      if (body.createTextRange) {
        // ...
        // ...
        // ... come up with a code for all versions of IE
        // ...
        // ...
      } else {
        // w3c standard solution
        if (caretPositionFromPoint) {
          // FireFox is able to determine the position of the
          // carriage in the input fields of the text, but it
          // has a problem. When trying to get the position of
          // the carriage within the text field, but at the same
          // time on the border of an element, it does not
          // return the correct coordinates.
          if (isControl) {
            // ...
            // ...
            // ... come up with a code for Firefox
            // ...
            // ...
          }
          // get the coordinates of the carriage
          range = caretPositionFromPoint.call(self, x, y);
        } else if (caretRangeFromPoint) {
          // Conditions for webkit browsers, the problem arises in
          // determining the position of the carriage in the input
          // fields of the text, such as TEXTAREA and INPUT. For the
          // other elements is no problem.
          if (isControl) {
            // condition for which performed initialization
            if (!tempElement) {
              // here we solve the problem of padding in Safari
              tempElement = document.createElement('input');
              // create INPUT element of one pixel wide
              tempElement.style.cssText = [
                'position:fixed','border:0','padding:0','margin:0','width:1px',''
              ].join('!important;');
              // insert temporary element to document
              body.appendChild(tempElement);
              // in normal browsers, the width of scroll will be
              // equal to the width of the content in Safari extra pixel
              extraPadding = tempElement.scrollWidth - tempElement.clientWidth;
              // remove temporary element from document
              body.removeChild(tempElement);
              // create the clone element
              tempElement = document.createElement('temporary-text-field');
              // make editable element
              tempElement.contentEditable = true;
            }
            // insert the element after the original
            if (node.nextSibling) {
              // if there is something after the original, put in front of him
              node.parentNode.insertBefore(tempElement, node.nextSibling);
            } else {
              // add an element owner
              node.parentNode.appendChild(tempElement);
            }
            // get the value of the element
            value = node.value;
            // get a list of CSS properties of the element
            css = window.getComputedStyle(node, null);
            // cssText not always filled, it is better to iterate over all properties
            for(index = 0; index < css.length; index++) {
              style += css[index] + ':' + css.getPropertyValue(css[index]) + '!important;';
            }
            // fix the problems associated with scaling page
            index = node.style.zoom;
            // reset scale of element
            node.style.zoom = 'reset';
            // Chrome in the input fields, when scaling increases the font size, but the clone is not an input field
            style += 'font-size:' + css.getPropertyValue('font-size') + '!important;';
            // restore the value of the property
            node.style.zoom = index;
            // webkit-add property to allow, edit the content of element
            style += '-webkit-user-modify:read-write!important;overflow:hidden;resize:none!important;margin:0!important;';
            // if the position of the element is not fixed, you must specify the absolute
            if (css.getPropertyValue('position') !== 'fixed') {
              style += 'position:absolute!important;';
            }
            // for INPUT element, must specify the hidden content and disable text wrapping
            if (node.nodeName === 'INPUT') {
              style += 'white-space:nowrap!important;line-height:' + node.clientHeight + 'px!important;';
              // add extra padding that adds Safari in the INPUT
              if (extraPadding) {
                // add to the already pre-defined value
                style += 'padding-left:' + ((parseInt(css.getPropertyValue('padding-left')) || 0) + extraPadding) + 'px!important;';
              }
            }
            // set the contents of the clone
            tempElement.textContent = value + (value.charCodeAt(value.length - 1) === 10 ? "\n" : "");
            // Sets the coordinates for the clone and set copied style
            tempElement.style.cssText = style + 'left:' + node.offsetLeft + 'px!important;top:' + node.offsetTop + 'px!important;';
            // not always the elements on styles of identical size
            if (node.offsetWidth !== tempElement.offsetWidth) {
              // specify the width specified in the node properties
              tempElement.style.width = node.offsetWidth + 'px';
              // calculating the remaining difference and subtract it
              tempElement.style.width = (node.offsetWidth - (tempElement.offsetWidth - node.offsetWidth)) + "px";
            }
            // The same is done with height
            if (node.offsetHeight !== tempElement.offsetHeight) {
              // specify the height specified in the node properties
              tempElement.style.height = node.offsetHeight + 'px';
              // calculating the remaining difference and subtract it
              tempElement.style.height = (node.offsetHeight - (tempElement.offsetHeight - node.offsetHeight)) + "px";
            }
            // Here we check the availability of scrollbars, sometimes in clone scrollbar does not appear
            if (node.offsetWidth === tempElement.offsetWidth && node.clientWidth < tempElement.clientWidth) {
              tempElement.style.overflowY = 'scroll';
            }
            // horizontal scrollbar
            if (node.offsetHeight === tempElement.offsetHeight && node.clientHeight < tempElement.clientHeight) {
              tempElement.style.overflowX = 'scroll';
            }
            // translate scrolling to the desired position
            tempElement.scrollLeft = node.scrollLeft;
            tempElement.scrollTop = node.scrollTop;
          }
          // get the coordinates of the carriage
          range = caretRangeFromPoint.apply(self, arguments);
        }
        // range can be null if it is determined outside the document
        if (range) {
          // transfer position in the offset variable
          offset = "offset" in range ? range.offset : range.startOffset;
        }
        // If a clone was inserted
        if (tempElement && tempElement.parentNode) {
          // remove it from the DOM
          tempElement.parentNode.removeChild(tempElement);
        }
      }
    }
    // returns a reference to the node and the selected position.
    return {
      offsetNode: node || body || document.documentElement,
      offset: offset
    }
  }
};
