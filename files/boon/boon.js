/**
 * boon v1.0.2 - Powerful and flexible generator objects with the possibility of meta-inheritance for JavaScript
 * Copyright 2011-2014 Dmitrii Pakhtinov (spb.piksel@gmail.com)
 * Released under the MIT license
 * Update: 06/19/2014
 */
(function(window, True, False, Null, undefined) {

    "use strict";

    var // for advanced mode compilation in GCC
        Array = window['Array'],
        Object = window['Object'],
        Boolean = window['Boolean'],
        toString = Object.prototype.toString,
        defineProperty = Object.defineProperty,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        isNeedProto = !(Object.getPrototypeOf || Object.prototype.__proto__),
        emptyFunction = (function(){return function(){}})(),
        proxyFunction = function(e){return function(){return e}},
        errorFunction = function(prop, type) {
            return function() {
                throw new Error("'" + prop + "' property is " + (type ? "read" : "write") + "-only");
            }
        };

    var libID = (new Date()).getTime(), // Identifier for library, it is will be necessary for the objects in VBScript
        hasDontEnumBug = !({toString: 1}).propertyIsEnumerable('toString'), // is enumerable properties?
        dontEnums = [
            // not enumerated properties in IE <9
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];

    /**
     * Object definition
     *
     * @param {*} [context] The context in which created a new constructor
     * @param {*} [cName] Name of the constructor can have a namespace dividing point
     * @param {*} [extend] One or a list of names/constructors from which inherit property
     * @param {*} [options] Object contains static properties and other options
     * @param {*} [structure] The structure of the object
     * @return {Function|Object} Returns constructor or an instance
     */
    function boon(context, cName, extend, options, structure) {
        var p1, p2, p3,
            VB = VBInc,
            firstPass = 1,
            argv = arguments,
            argn = argv.length - 1,
            constructorName = 'constructor',
            staticClass = Null,
            staticClassParts = [],
            staticClassNames = [],
            accessorsActive = 0,
            accessors = VBInc === Null ? 0 : {},
            element, parts, statics, compact, extendCount,
            returnInstance = this instanceof boon;

        // get a reference to the object structure
        structure = argv[argn--] || {};

        if (argv[argn] && typeof argv[argn] === 'object' && !(argv[argn] instanceof Array) &&
            argv[argn].constructor && argv[argn].constructor !== Object.prototype.constructor) {
            if (VBInc && defineProperty) {
                try {
                    defineProperty(argv[argn], 't' + libID, {configurable: 1, set: function(a){VB = a}});
                    argv[argn]['t' + libID] = 0;
                    delete argv[argn]['t' + libID];
                } catch (_e_) {}
            }
            element = VB ? Null : (compact = True, argv[argn--]);
        }

        // option can only be stored in the object or boolean(compact mode)
        options = !argv[argn] || argv[argn] instanceof Array || typeof argv[argn] !== 'object' ?
            typeof argv[argn] === 'boolean' || typeof argv[argn] === 'number' ?
                {"compact": argv[argn--]} : {} : argv[argn--];

        // inclusion of compact mode
        compact = compact || options['compact'];

        // Save references on the properties
        p1 = options['context'];
        p2 = options['extend'];
        p3 = options['mixins'];

        // static properties
        statics = options['statics'] || (p1 || p2 || p3 || "compact" in options ? {} : options);

        // construct an array of inherited objects
        extend = argv[argn] instanceof Array ? argv[argn--] : typeof argv[argn] === 'function' ? [argv[argn--]] :
            typeof argv[argn - 1] === 'string' && ('' + argv[argn--]).replace(/(^|\s)(extends|implements)(\s|$)/g, ',')
                .replace(/^[\s,]+|\s(?=\s)|[\s,]+$/g, '').replace(/\s*,\s*/g, ',').split(',') || [];

        // additional array of inherited objects
        parts = typeof argv[argn] === 'string' && argv[argn--].split(/extends|implements|,/g) || [];

        // get the context in which to add the constructor
        context = argv[argn--] || p1 || boon['boonScope'] || (boon['boonScope'] = window);

        // name of the new constructor
        cName = (parts.shift() || '').replace(/^\s+|\s+$/g, '');

        // lists of constructors from which inherit properties
        p1 = (parts = parts.join(',').replace(/^[\s,]+|[\s,]+$/g, '').replace(/\s*,\s*/g, ',')) ? parts.split(',') : [];
        p2 = (p2 = (p2 || [])) instanceof Array ? p2 : [p2];
        p3 = (p3 = (p3 || [])) instanceof Array ? p3 : [p3];

        // obtain a complete list of parent objects
        extend = p1.concat.apply(p1, extend.concat.apply(extend, p2.concat.apply(p2, p3)));

        // parent objects numbers
        if (!((extendCount = extend.length) || cName || compact !== undefined)) {
          compact = True;
        }

        if (typeof structure !== 'function') {
            // if the structure is not a function
            var originalStructure = structure;
            structure = function() {
                // make a copy of an object
                emptyFunction.prototype = originalStructure.constructor.prototype;
                parts = new emptyFunction;
                each(originalStructure, function(prop, val) {
                    parts[prop] = val
                });
                return parts;
            }
        }

        // this will be the constructor for the generated object
        var boonConstructor = function() {

            var isParent = this instanceof Boolean,
                args = arguments;

            if (!isParent && !(this instanceof boonConstructor)) {
                // if calling YourConstructor(instance)
                return getInstanceOf.call(boonConstructor, args[0]);
            }

            var index = extendCount,
                oParent = Null,
                obj = structure.apply({"isParent": isParent, "options": options}, isParent ? args[0] : args),
                proto = isParent && args[3] || Null,
                copy = element || proto || obj,
                owner = isParent ? args[1] : {o: obj},
                compactMode = !isParent || args[2] === undefined || compact !== undefined ? compact : args[2];

            // copy the static properties
            each(statics, function(prop, val) {
                if (!hasOwnProperty.call(obj, prop)) {
                    obj[prop] = val;
                }
            });

            for(; index--;) {
                if (typeof extend[index] !== 'function') {
                    if (typeof extend[index] === 'string') {
                        // get the constructor by its name
                        extend[index] = getBoonByName(extend[index], context);
                    } else {
                        extend[index] = proxyFunction(extend[index]);
                    }
                }
                emptyFunction.prototype = oParent = extend[index].call(new Boolean, args, owner, compactMode, proto);
                if (index > 0) {
                    // cannot auto execute constructor in implements
                    owner['i'] = Null;
                }
                copy = proto = new emptyFunction;
                if (!compactMode) {
                    copy['parent'] = oParent;
                    if (isNeedProto) {
                        copy['__proto__'] = oParent;
                    }
                }
            }

            if (extendCount || isParent || element) {
                // proxy method to wrap functions
                var bindMethod = function(value) {
                    return compactMode ? value : typeof value === 'function' ? function() {
                        var object = owner.o, _parent = object['parent'];
                        !compactMode && (object['parent'] = oParent);
                        var result = value.apply(this === copy || this == window ? object : this, arguments);
                        !compactMode && (object['parent'] = _parent);
                        return result;
                    } : value;
                };

                // wrap all the functions of a object in the proxy
                each(obj, function(prop, value) {
                    if (value && typeof value === 'object') {
                        if ('set' in value) {
                            value.set = bindMethod(value.set);
                        }
                        if ('get' in value) {
                            value.get = bindMethod(value.get);
                        }
                    }
                    copy[prop] = bindMethod(value);
                });

                owner.o = isParent ? owner.o : copy;
            }

            if (!compactMode) {
                // adds special statements
                copy['__boon__'] = boonConstructor;
            }

            // if supported accessors
            if (!isParent && accessors !== 0) {
                // first initialization of the object or if the browser supports accessors in ordinary objects
                if (!VB || firstPass) {
                    each(firstPass ? copy : accessors, function(prop) {
                        // search accessors
                        var value = copy[prop],
                            subName = prop,
                            type = !firstPass ? accessors[prop]
                                : value && typeof value === 'object' && prop !== 'parent' && prop !== '__proto__' && (value.set || value.get) ? 1
                                : prop.indexOf('get ') === 0 ? 2
                                : prop.indexOf('set ') === 0 ? 3
                                : VB && prop === 'toString' ? 4 : 0;

                        if (type) {
                            // if has found an accessors and not toString property
                            if (firstPass && (accessors[prop] = type) !== 4) {
                                accessorsActive++;
                            }

                            if (type === 1) {
                                emptyFunction.prototype = value;
                                value = new emptyFunction;
                            } else {
                                // trimmed prefix set/get
                                subName = prop.split(' ').pop();
                                if (type !== 3 && typeof value !== "function") {
                                    value = (function(value) {
                                      return function() {return value};
                                    })(value);
                                }
                            }

                            if (!VB) {
                                // for browsers supported accessors to ordinary objects
                                var descriptorSet = compactMode ? undefined : errorFunction(subName, 1),
                                    descriptorGet = compactMode ? undefined : errorFunction(subName, 0);
                                if (type === 1 ? value.set : type === 3 && value) {
                                    descriptorSet = function(val) {
                                        // proxy for setter
                                        (type === 1 ? value.set : value).call(this, val, value);
                                    }
                                }
                                if (type === 1 ? value.get : type === 2 && value) {
                                    descriptorGet = function(val) {
                                        // proxy for getter
                                        return (type === 1 ? value.get : value).call(this, value);
                                    }
                                }

                                if (hasOwnProperty.call(copy, prop)) {
                                    // remove original property
                                    delete copy[prop];
                                }

                                if (defineProperty) {
                                    // w3c standard
                                    var descr = Object.getOwnPropertyDescriptor(copy, subName);
                                    defineProperty(copy, subName, {
                                        enumerable: VBInc ? 0 : 1,
                                        configurable: 1,
                                        set: type === 2 && descr && descr.set || descriptorSet,
                                        get: type === 3 && descr && descr.get || descriptorGet
                                    });
                                } else {
                                    // Mozilla standard
                                    descriptorSet = type === 2 && copy.__lookupSetter__(subName) || descriptorSet;
                                    descriptorSet && copy.__defineSetter__(subName, descriptorSet);
                                    descriptorGet = type === 3 && copy.__lookupGetter__(subName) || descriptorGet;
                                    descriptorGet && copy.__defineGetter__(subName, descriptorGet);
                                }
                            } else {
                                // for Internet Explorer VisualBasic Script accessors
                                if (type !== 3) {
                                    // create getter in VB Class
                                    staticClassParts.push(
                                        'Public ' + (type === 4 ? 'Default ' : '' ) + 'Property Get [' + subName + ']',
                                        'Call VBCorrectVal(' + ( value && ( type !== 1 || value.get) ?
                                            '[(accessors)].[' + prop + ']' + (type === 1 ? '.get' : '') +
                                                '.call(me,[(accessors)].[' + prop + '])' : 'window.undefined' ) +
                                            ',[' + subName + '])', 'End Property'
                                    );
                                }
                                if (type !== 2) {
                                    // create setter in VB Class
                                    staticClassParts.push(
                                        'Public Property Let [' + subName + '](val)',
                                        type = (type === 4 ? 'Set [(accessors)].[' + prop + ']=val' :
                                            value && (type !== 1 || value.set) ?
                                                'Call [(accessors)].[' + prop + ']' + (type === 1 ? '.set' : '') +
                                                    '.call(me,val,[(accessors)].[' + prop + '])' : '') +
                                            '\nEnd Property', 'Public Property Set [' + subName + '](val)', type
                                    );
                                }
                            }
                        } else if (VB) {
                            // VBScript up to 60 multiple dimensions may be declared.
                            if (staticClassNames.length === 50) { // flush 50 items
                                staticClassParts.push('Public [' + staticClassNames.join('],[') + ']');
                                staticClassNames.length = 0;
                            }
                            staticClassNames[staticClassNames.length] = prop;
                        }
                    }, firstPass);
                }

                if (firstPass && !(firstPass = 0) && accessorsActive === 0) {
                    staticClassNames = staticClassParts = accessors = 0;
                } else if (VB) {
                    if (accessorsActive) {
                        // once initialize VB Class for later use
                        staticClass = 'StaticClass' + libID + VBInc++;
                        staticClassParts.unshift('Class ' + staticClass);
                        staticClassParts.push(
                            (staticClassNames.length
                                ? 'Public [' + staticClassNames.join('],[') + ']\n' : '') + 'Private [(accessors)]',
                            'Private Sub Class_Initialize()',
                            'Set [(accessors)]=' + staticClass + 'FactoryJS()',
                            'End Sub',
                            'End Class',
                            'Function ' + staticClass + 'Factory()',
                            'Set ' + staticClass + 'Factory=New ' + staticClass,
                            'End Function'
                        );
                        window[staticClass + 'FactoryJS'] = function() {
                            return staticClassParts;
                        };
                        window['execVBScript'](staticClassParts.join('\n'));
                        accessorsActive = staticClassNames = staticClassParts = Null;
                    }

                    staticClassParts = {};
                    owner.o = window[staticClass + "Factory"]();

                    // copy all values into new VB Class object
                    each(copy, function(prop, val) {
                        if (!accessors.hasOwnProperty(prop)) {
                            if ((!extendCount || compactMode) && typeof val === 'function' && prop !== '__boon__') {
                                owner.o[prop] = function() {
                                    return val.apply(this === copy || this == window ? owner.o : this, arguments);
                                }
                            } else {
                                owner.o[prop] = val;
                            }
                        } else {
                            if (accessors[prop] === 1) {
                                emptyFunction.prototype = copy[prop];
                                staticClassParts[prop] = new emptyFunction;
                            } else if (accessors[prop] !== 3 && typeof val !== "function") {
                                staticClassParts[prop] = function() {return val};
                            } else {
                                staticClassParts[prop] = copy[prop];
                            }
                        }
                    }, 1);
                    // new link to VB Class object
                    copy = owner.o;
                }
            }

            // keep a reference to the constructor
            if (hasOwnProperty.call(copy, constructorName)) {
                owner['i'] = copy[constructorName];
            } else if (hasOwnProperty.call(copy, 'constructor')) {
                owner['i'] = copy['constructor'];
            }

            // create object
            return new function() {
                if (!isParent && typeof owner['i'] === 'function') {
                    owner['i'].apply(copy, args);
                }
                return copy;
            };
        };

        boonConstructor.toString = function() {
            return "[object " + (cName || "Function") + "]";
        };

        boonConstructor['getInstanceOf'] = getInstanceOf;
        boonConstructor['baseContext'] = context;

        // copy the static properties
        each(statics, function(prop, val) {
            boonConstructor[prop] = val;
        });

        // if the name of the constructor is defined, put it into context
        if (boonConstructor.cName = cName) {

            var _context = context;

            // The name can be a namespace
            argv = (parts = cName.split('.')).shift();

            do {
                if (parts.length === 0) {
                    _context[constructorName = argv] = boonConstructor;
                } else {
                    if (!(argv in _context)) {
                        _context[argv] = {};
                    }
                    _context = _context[argv];
                }
            } while(argv = parts.shift());
        }

        // return an instance of Object if summoned by the operator new, otherwise return the constructor
        return returnInstance ? new boonConstructor : boonConstructor;
    };

    /**
     * Returns the function by name
     *
     * @param {String} name Name of the constructor that will search
     * @param {Object} context Context where it is necessary to find a constructor
     * @return {Function|null} Returns constructor
     */
    function findFunctionByName(name, context) {
        var result = Null, baseContext = context, subName, parts;
        if (typeof name === 'string') {
            parts = name.split('.');
            while((subName = parts.shift()) && (context = context[subName])) {
            }
            if (typeof context === 'function' && baseContext === context['baseContext']) {
                result = context;
            }
        }
        return result;
    };

    /**
     * Returns the constructor by name
     *
     * @param {String} name Name of the constructor that will search
     * @param {Object} context Context where it is necessary to find a constructor
     * @return {Function} Returns constructor
     */
    function getBoonByName(name, context) {
        var construct = findFunctionByName(name, context) || findFunctionByName(name, window) ||
            (typeof boon['autoload'] === 'function' && boon['autoload'](name, context)) || Null;
        if (!construct) {
            throw new Error("Parent constructor '" + name + "' not Initialized or Undefined");
        }
        return construct;
    };

    /**
     * Iterates through each property of the object by calling the callback
     * with the parameters of the property name and value
     *
     * @param {Object|Array} object The object or array to iterate properties
     * @param {Function} callback Function that will be called for each property
     * @param {Boolean|Number} [all] If true/1 will list all the properties of an object, including parent
     */
    function each(object, callback, all) {
        var index, length = dontEnums.length, value;
        for(index in object) {
            value = object[index];
            if (((all && value !== Object.prototype[index]) || hasOwnProperty.call(object, index)) &&
                callback.call(value, index, value) === False) {
                length = False;
                break;
            }
        }
        if (length && hasDontEnumBug) {
            for(index = 0; index < length; index++) {
                value = object[dontEnums[index]];
                if ((hasOwnProperty.call(object, dontEnums[index]) ||
                    (all && dontEnums[index] in object && value !== Object.prototype[dontEnums[index]])) &&
                    callback.call(value, dontEnums[index], value) === False) {
                    break;
                }
            }
        }
    };

    /**
     * Finds and returns an instance of the object
     *
     * @param {Object} object
     * @return {Object}
     */
    function getInstanceOf(object) {
        while(object && object['__boon__'] != Null) {
            if (object['__boon__'] === this) {
                return object;
            }
            object = Object.getPrototypeOf ? Object.getPrototypeOf(object) : object.__proto__;
        }
        return Null;
    };

    /**
     * Whether an object is an instance of constructor
     *
     * @param {Object} object
     * @param {Function} constructor
     * @return {Boolean}
     */
    boon['instanceOf'] = function(object, constructor) {
        return !!getInstanceOf.call(constructor, object);
    };

    /**
     * The function determines the capabilities of the browser. If your browser supports
     * accessors to ordinary objects, VBInc will be zero, otherwise returns 1
     */
    var VBInc = (function(object) {
        var setter = function(value) {
            object = value;
        };

        try {
            // test w3c standard
            defineProperty(object, 't', {set: setter});
        } catch(error) {
            try {
                // test Mozilla standard
                object.__defineSetter__('t', setter);
            } catch(error) {
            }
        }
        // test setter
        object['t'] = 0;

        // if setter not supports
        if (object) {

            object = 1; // Maybe VBScript classes supports???

            if (!('execVBscript' in window)) {
                // for IE only, if VisualBasic script compiler supports
                if ('execScript' in window) {
                    window['execScript'](
                        'Function execVBscript(code) '
                            + 'ExecuteGlobal(code) '
                            + 'End Function\n'
                            + 'Function VBCorrectVal(o,r) '
                            + 'If IsObject(o) Then '
                            + 'Set r=o Else r=o '
                            + 'End If '
                            + 'End Function',
                        'VBScript'
                    );
                } else {
                    // if not supported any accessors :(
                    object = Null;
                }
            }
        }

        return object;
    })({});

    // default namespace for the Constructors
    boon['boonScope'] = boon['boonScope'] || window;

    window['boon'] = boon;

})(window, true, false, null);
