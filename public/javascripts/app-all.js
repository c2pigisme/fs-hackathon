/*
Copyright(c) 2012 F-Secure Corporation
*/
Ext.define("Ext.data.JsonP", {
    singleton: true,
    statics: {
        requestCount: 0,
        requests: {}
    },
    timeout: 30000,
    disableCaching: true,
    disableCachingParam: "_dc",
    callbackKey: "callback",
    request: function (m) {
        m = Ext.apply({}, m);
        var i = this,
            d = Ext.isDefined(m.disableCaching) ? m.disableCaching : i.disableCaching,
            g = m.disableCachingParam || i.disableCachingParam,
            c = ++i.statics().requestCount,
            k = m.callbackName || "callback" + c,
            h = m.callbackKey || i.callbackKey,
            l = Ext.isDefined(m.timeout) ? m.timeout : i.timeout,
            e = Ext.apply({}, m.params),
            b = m.url,
            a = Ext.isSandboxed ? Ext.getUniqueGlobalNamespace() : "Ext",
            f, j;
        e[h] = a + ".data.JsonP." + k;
        if (d) {
            e[g] = new Date().getTime()
        }
        j = i.createScript(b, e);
        i.statics().requests[c] = f = {
            url: b,
            params: e,
            script: j,
            id: c,
            scope: m.scope,
            success: m.success,
            failure: m.failure,
            callback: m.callback,
            callbackName: k
        };
        if (l > 0) {
            f.timeout = setTimeout(Ext.bind(i.handleTimeout, i, [f]), l)
        }
        i.setupErrorHandling(f);
        i[k] = Ext.bind(i.handleResponse, i, [f], true);
        Ext.getHead().appendChild(j);
        return f
    },
    abort: function (b) {
        var c = this.statics().requests,
            a;
        if (b) {
            if (!b.id) {
                b = c[b]
            }
            this.abort(b)
        } else {
            for (a in c) {
                if (c.hasOwnProperty(a)) {
                    this.abort(c[a])
                }
            }
        }
    },
    setupErrorHandling: function (a) {
        a.script.onerror = Ext.bind(this.handleError, this, [a])
    },
    handleAbort: function (a) {
        a.errorType = "abort";
        this.handleResponse(null, a)
    },
    handleError: function (a) {
        a.errorType = "error";
        this.handleResponse(null, a)
    },
    cleanupErrorHandling: function (a) {
        a.script.onerror = null
    },
    handleTimeout: function (a) {
        a.errorType = "timeout";
        this.handleResponse(null, a)
    },
    handleResponse: function (a, b) {
        var c = true;
        if (b.timeout) {
            clearTimeout(b.timeout)
        }
        delete this[b.callbackName];
        delete this.statics()[b.id];
        this.cleanupErrorHandling(b);
        Ext.fly(b.script).remove();
        if (b.errorType) {
            c = false;
            Ext.callback(b.failure, b.scope, [b.errorType])
        } else {
            Ext.callback(b.success, b.scope, [a])
        }
        Ext.callback(b.callback, b.scope, [c, a, b.errorType])
    },
    createScript: function (b, c) {
        var a = document.createElement("script");
        a.setAttribute("src", Ext.urlAppend(b, Ext.Object.toQueryString(c)));
        a.setAttribute("async", true);
        a.setAttribute("type", "text/javascript");
        return a
    }
});
Ext.define("Ext.Template", {
    requires: ["Ext.DomHelper", "Ext.util.Format"],
    inheritableStatics: {
        from: function (b, a) {
            b = Ext.getDom(b);
            return new this(b.value || b.innerHTML, a || "")
        }
    },
    constructor: function (d) {
        var f = this,
            b = arguments,
            a = [],
            c = 0,
            e = b.length,
            g;
        f.initialConfig = {};
        if (e > 1) {
            for (; c < e; c++) {
                g = b[c];
                if (typeof g == "object") {
                    Ext.apply(f.initialConfig, g);
                    Ext.apply(f, g)
                } else {
                    a.push(g)
                }
            }
            d = a.join("")
        } else {
            if (Ext.isArray(d)) {
                a.push(d.join(""))
            } else {
                a.push(d)
            }
        }
        f.html = a.join("");
        if (f.compiled) {
            f.compile()
        }
    },
    isTemplate: true,
    disableFormats: false,
    re: /\{([\w\-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,
    applyTemplate: function (a) {
        var f = this,
            c = f.disableFormats !== true,
            e = Ext.util.Format,
            b = f;
        if (f.compiled) {
            return f.compiled(a)
        }
        function d(g, i, j, h) {
            if (j && c) {
                if (h) {
                    h = [a[i]].concat(Ext.functionFactory("return [" + h + "];")())
                } else {
                    h = [a[i]]
                } if (j.substr(0, 5) == "this.") {
                    return b[j.substr(5)].apply(b, h)
                } else {
                    return e[j].apply(e, h)
                }
            } else {
                return a[i] !== undefined ? a[i] : ""
            }
        }
        return f.html.replace(f.re, d)
    },
    set: function (a, c) {
        var b = this;
        b.html = a;
        b.compiled = null;
        return c ? b.compile() : b
    },
    compileARe: /\\/g,
    compileBRe: /(\r\n|\n)/g,
    compileCRe: /'/g,
    compile: function () {
        var me = this,
            fm = Ext.util.Format,
            useFormat = me.disableFormats !== true,
            body, bodyReturn;

        function fn(m, name, format, args) {
            if (format && useFormat) {
                args = args ? "," + args : "";
                if (format.substr(0, 5) != "this.") {
                    format = "fm." + format + "("
                } else {
                    format = "this." + format.substr(5) + "("
                }
            } else {
                args = "";
                format = "(values['" + name + "'] == undefined ? '' : "
            }
            return "'," + format + "values['" + name + "']" + args + ") ,'"
        }
        bodyReturn = me.html.replace(me.compileARe, "\\\\").replace(me.compileBRe, "\\n").replace(me.compileCRe, "\\'").replace(me.re, fn);
        body = "this.compiled = function(values){ return ['" + bodyReturn + "'].join('');};";
        eval(body);
        return me
    },
    insertFirst: function (b, a, c) {
        return this.doInsert("afterBegin", b, a, c)
    },
    insertBefore: function (b, a, c) {
        return this.doInsert("beforeBegin", b, a, c)
    },
    insertAfter: function (b, a, c) {
        return this.doInsert("afterEnd", b, a, c)
    },
    append: function (b, a, c) {
        return this.doInsert("beforeEnd", b, a, c)
    },
    doInsert: function (c, e, b, a) {
        e = Ext.getDom(e);
        var d = Ext.DomHelper.insertHtml(c, e, this.applyTemplate(b));
        return a ? Ext.get(d, true) : d
    },
    overwrite: function (b, a, c) {
        b = Ext.getDom(b);
        b.innerHTML = this.applyTemplate(a);
        return c ? Ext.get(b.firstChild, true) : b.firstChild
    }
}, function () {
    this.createAlias("apply", "applyTemplate")
});
Ext.define("Ext.util.Observable", {
    requires: ["Ext.util.Event"],
    statics: {
        releaseCapture: function (a) {
            a.fireEvent = this.prototype.fireEvent
        },
        capture: function (c, b, a) {
            c.fireEvent = Ext.Function.createInterceptor(c.fireEvent, b, a)
        },
        observe: function (a, b) {
            if (a) {
                if (!a.isObservable) {
                    Ext.applyIf(a, new this());
                    this.capture(a.prototype, a.fireEvent, a)
                }
                if (Ext.isObject(b)) {
                    a.on(b)
                }
                return a
            }
        }
    },
    isObservable: true,
    constructor: function (a) {
        var b = this;
        Ext.apply(b, a);
        if (b.listeners) {
            b.on(b.listeners);
            delete b.listeners
        }
        b.events = b.events || {};
        if (b.bubbleEvents) {
            b.enableBubble(b.bubbleEvents)
        }
    },
    eventOptionsRe: /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate|element|vertical|horizontal|freezeEvent)$/,
    addManagedListener: function (h, d, f, e, c) {
        var g = this,
            a = g.managedListeners = g.managedListeners || [],
            b;
        if (typeof d !== "string") {
            c = d;
            for (d in c) {
                if (c.hasOwnProperty(d)) {
                    b = c[d];
                    if (!g.eventOptionsRe.test(d)) {
                        g.addManagedListener(h, d, b.fn || b, b.scope || c.scope, b.fn ? b : c)
                    }
                }
            }
        } else {
            a.push({
                item: h,
                ename: d,
                fn: f,
                scope: e,
                options: c
            });
            h.on(d, f, e, c)
        }
    },
    removeManagedListener: function (h, c, f, j) {
        var e = this,
            k, b, g, a, d;
        if (typeof c !== "string") {
            k = c;
            for (c in k) {
                if (k.hasOwnProperty(c)) {
                    b = k[c];
                    if (!e.eventOptionsRe.test(c)) {
                        e.removeManagedListener(h, c, b.fn || b, b.scope || k.scope)
                    }
                }
            }
        }
        g = e.managedListeners ? e.managedListeners.slice() : [];
        for (d = 0, a = g.length; d < a; d++) {
            e.removeManagedListenerItem(false, g[d], h, c, f, j)
        }
    },
    fireEvent: function (b) {
        var c = b.toLowerCase(),
            d = this.events,
            e = d && d[c],
            a = e && e.bubble;
        return this.continueFireEvent(c, Ext.Array.slice(arguments, 1), a)
    },
    continueFireEvent: function (c, e, b) {
        var g = this,
            a, f, d = true;
        do {
            if (g.eventsSuspended === true) {
                if ((a = g.eventQueue)) {
                    a.push([c, e, b])
                }
                return d
            } else {
                f = g.events[c];
                if (f && f != true) {
                    if ((d = f.fire.apply(f, e)) === false) {
                        break
                    }
                }
            }
        } while (b && (g = g.getBubbleParent()));
        return d
    },
    getBubbleParent: function () {
        var b = this,
            a = b.getBubbleTarget && b.getBubbleTarget();
        if (a && a.isObservable) {
            return a
        }
        return null
    },
    addListener: function (c, e, d, b) {
        var g = this,
            a, f;
        if (typeof c !== "string") {
            b = c;
            for (c in b) {
                if (b.hasOwnProperty(c)) {
                    a = b[c];
                    if (!g.eventOptionsRe.test(c)) {
                        g.addListener(c, a.fn || a, a.scope || b.scope, a.fn ? a : b)
                    }
                }
            }
        } else {
            c = c.toLowerCase();
            g.events[c] = g.events[c] || true;
            f = g.events[c] || true;
            if (Ext.isBoolean(f)) {
                g.events[c] = f = new Ext.util.Event(g, c)
            }
            f.addListener(e, d, Ext.isObject(b) ? b : {})
        }
    },
    removeListener: function (c, e, d) {
        var g = this,
            b, f, a;
        if (typeof c !== "string") {
            a = c;
            for (c in a) {
                if (a.hasOwnProperty(c)) {
                    b = a[c];
                    if (!g.eventOptionsRe.test(c)) {
                        g.removeListener(c, b.fn || b, b.scope || a.scope)
                    }
                }
            }
        } else {
            c = c.toLowerCase();
            f = g.events[c];
            if (f && f.isEvent) {
                f.removeListener(e, d)
            }
        }
    },
    clearListeners: function () {
        var b = this.events,
            c, a;
        for (a in b) {
            if (b.hasOwnProperty(a)) {
                c = b[a];
                if (c.isEvent) {
                    c.clearListeners()
                }
            }
        }
        this.clearManagedListeners()
    },
    clearManagedListeners: function () {
        var b = this.managedListeners || [],
            c = 0,
            a = b.length;
        for (; c < a; c++) {
            this.removeManagedListenerItem(true, b[c])
        }
        this.managedListeners = []
    },
    removeManagedListenerItem: function (b, a, f, c, e, d) {
        if (b || (a.item === f && a.ename === c && (!e || a.fn === e) && (!d || a.scope === d))) {
            a.item.un(a.ename, a.fn, a.scope);
            if (!b) {
                Ext.Array.remove(this.managedListeners, a)
            }
        }
    },
    addEvents: function (e) {
        var d = this,
            b, a, c;
        d.events = d.events || {};
        if (Ext.isString(e)) {
            b = arguments;
            c = b.length;
            while (c--) {
                d.events[b[c]] = d.events[b[c]] || true
            }
        } else {
            Ext.applyIf(d.events, e)
        }
    },
    hasListener: function (a) {
        var b = this.events[a.toLowerCase()];
        return b && b.isEvent === true && b.listeners.length > 0
    },
    suspendEvents: function (a) {
        this.eventsSuspended = true;
        if (a && !this.eventQueue) {
            this.eventQueue = []
        }
    },
    resumeEvents: function () {
        var a = this,
            b = a.eventQueue;
        a.eventsSuspended = false;
        delete a.eventQueue;
        if (b) {
            Ext.each(b, function (c) {
                a.continueFireEvent.apply(a, c)
            })
        }
    },
    relayEvents: function (c, e, h) {
        h = h || "";
        var g = this,
            a = e.length,
            d = 0,
            f, b;
        for (; d < a; d++) {
            f = e[d].substr(h.length);
            b = h + f;
            g.events[b] = g.events[b] || true;
            c.on(f, g.createRelayer(b))
        }
    },
    createRelayer: function (a) {
        var b = this;
        return function () {
            return b.fireEvent.apply(b, [a].concat(Array.prototype.slice.call(arguments, 0, -1)))
        }
    },
    enableBubble: function (a) {
        var b = this;
        if (!Ext.isEmpty(a)) {
            a = Ext.isArray(a) ? a : Ext.Array.toArray(arguments);
            Ext.each(a, function (c) {
                c = c.toLowerCase();
                var d = b.events[c] || true;
                if (Ext.isBoolean(d)) {
                    d = new Ext.util.Event(b, c);
                    b.events[c] = d
                }
                d.bubble = true
            })
        }
    }
}, function () {
    this.createAlias({
        on: "addListener",
        un: "removeListener",
        mon: "addManagedListener",
        mun: "removeManagedListener"
    });
    this.observeClass = this.observe;
    Ext.apply(Ext.util.Observable.prototype, function () {
        function a(i) {
            var h = (this.methodEvents = this.methodEvents || {})[i],
                d, c, f, g = this;
            if (!h) {
                this.methodEvents[i] = h = {};
                h.originalFn = this[i];
                h.methodName = i;
                h.before = [];
                h.after = [];
                var b = function (k, j, e) {
                    if ((c = k.apply(j || g, e)) !== undefined) {
                        if (typeof c == "object") {
                            if (c.returnValue !== undefined) {
                                d = c.returnValue
                            } else {
                                d = c
                            }
                            f = !! c.cancel
                        } else {
                            if (c === false) {
                                f = true
                            } else {
                                d = c
                            }
                        }
                    }
                };
                this[i] = function () {
                    var k = Array.prototype.slice.call(arguments, 0),
                        j, l, e;
                    d = c = undefined;
                    f = false;
                    for (l = 0, e = h.before.length; l < e; l++) {
                        j = h.before[l];
                        b(j.fn, j.scope, k);
                        if (f) {
                            return d
                        }
                    }
                    if ((c = h.originalFn.apply(g, k)) !== undefined) {
                        d = c
                    }
                    for (l = 0, e = h.after.length; l < e; l++) {
                        j = h.after[l];
                        b(j.fn, j.scope, k);
                        if (f) {
                            return d
                        }
                    }
                    return d
                }
            }
            return h
        }
        return {
            beforeMethod: function (d, c, b) {
                a.call(this, d).before.push({
                    fn: c,
                    scope: b
                })
            },
            afterMethod: function (d, c, b) {
                a.call(this, d).after.push({
                    fn: c,
                    scope: b
                })
            },
            removeMethodListener: function (h, f, d) {
                var g = this.getMethodEvent(h),
                    c, b;
                for (c = 0, b = g.before.length; c < b; c++) {
                    if (g.before[c].fn == f && g.before[c].scope == d) {
                        Ext.Array.erase(g.before, c, 1);
                        return
                    }
                }
                for (c = 0, b = g.after.length; c < b; c++) {
                    if (g.after[c].fn == f && g.after[c].scope == d) {
                        Ext.Array.erase(g.after, c, 1);
                        return
                    }
                }
            },
            toggleEventLogging: function (b) {
                Ext.util.Observable[b ? "capture" : "releaseCapture"](this, function (c) {
                    if (Ext.isDefined(Ext.global.console)) {
                        Ext.global.console.log(c, arguments)
                    }
                })
            }
        }
    }())
});
Ext.define("Ext.data.Connection", {
    mixins: {
        observable: "Ext.util.Observable"
    },
    statics: {
        requestId: 0
    },
    url: null,
    async: true,
    method: null,
    username: "",
    password: "",
    disableCaching: true,
    withCredentials: false,
    cors: false,
    disableCachingParam: "_dc",
    timeout: 30000,
    useDefaultHeader: true,
    defaultPostHeader: "application/x-www-form-urlencoded; charset=UTF-8",
    useDefaultXhrHeader: true,
    defaultXhrHeader: "XMLHttpRequest",
    constructor: function (a) {
        a = a || {};
        Ext.apply(this, a);
        this.addEvents("beforerequest", "requestcomplete", "requestexception");
        this.requests = {};
        this.mixins.observable.constructor.call(this)
    },
    request: function (j) {
        j = j || {};
        var f = this,
            i = j.scope || window,
            e = j.username || f.username,
            g = j.password || f.password || "",
            b, c, d, a, h;
        if (f.fireEvent("beforerequest", f, j) !== false) {
            c = f.setOptions(j, i);
            if (this.isFormUpload(j) === true) {
                this.upload(j.form, c.url, c.data, j);
                return null
            }
            if (j.autoAbort === true || f.autoAbort) {
                f.abort()
            }
            if ((j.cors === true || f.cors === true) && Ext.isIe && Ext.ieVersion >= 8) {
                h = new XDomainRequest()
            } else {
                h = this.getXhrInstance()
            }
            b = j.async !== false ? (j.async || f.async) : false;
            if (e) {
                h.open(c.method, c.url, b, e, g)
            } else {
                h.open(c.method, c.url, b)
            } if (j.withCredentials === true || f.withCredentials === true) {
                h.withCredentials = true
            }
            a = f.setupHeaders(h, j, c.data, c.params);
            d = {
                id: ++Ext.data.Connection.requestId,
                xhr: h,
                headers: a,
                options: j,
                async: b,
                timeout: setTimeout(function () {
                    d.timedout = true;
                    f.abort(d)
                }, j.timeout || f.timeout)
            };
            f.requests[d.id] = d;
            f.latestId = d.id;
            if (b) {
                h.onreadystatechange = Ext.Function.bind(f.onStateChange, f, [d])
            }
            h.send(c.data);
            if (!b) {
                return this.onComplete(d)
            }
            return d
        } else {
            Ext.callback(j.callback, j.scope, [j, undefined, undefined]);
            return null
        }
    },
    upload: function (d, b, h, j) {
        d = Ext.getDom(d);
        j = j || {};
        var c = Ext.id(),
            f = document.createElement("iframe"),
            i = [],
            g = "multipart/form-data",
            e = {
                target: d.target,
                method: d.method,
                encoding: d.encoding,
                enctype: d.enctype,
                action: d.action
            }, a;
        Ext.fly(f).set({
            id: c,
            name: c,
            cls: Ext.baseCSSPrefix + "hide-display",
            src: Ext.SSL_SECURE_URL
        });
        document.body.appendChild(f);
        if (document.frames) {
            document.frames[c].name = c
        }
        Ext.fly(d).set({
            target: c,
            method: "POST",
            enctype: g,
            encoding: g,
            action: b || e.action
        });
        if (h) {
            Ext.iterate(Ext.Object.fromQueryString(h), function (k, l) {
                a = document.createElement("input");
                Ext.fly(a).set({
                    type: "hidden",
                    value: l,
                    name: k
                });
                d.appendChild(a);
                i.push(a)
            })
        }
        Ext.fly(f).on("load", Ext.Function.bind(this.onUploadComplete, this, [f, j]), null, {
            single: true
        });
        d.submit();
        Ext.fly(d).set(e);
        Ext.each(i, function (k) {
            Ext.removeNode(k)
        })
    },
    onUploadComplete: function (h, b) {
        var c = this,
            a = {
                responseText: "",
                responseXML: null
            }, g, f;
        try {
            g = h.contentWindow.document || h.contentDocument || window.frames[h.id].document;
            if (g) {
                if (g.body) {
                    if (/textarea/i.test((f = g.body.firstChild || {}).tagName)) {
                        a.responseText = f.value
                    } else {
                        a.responseText = g.body.innerHTML
                    }
                }
                a.responseXML = g.XMLDocument || g
            }
        } catch (d) {}
        c.fireEvent("requestcomplete", c, a, b);
        Ext.callback(b.success, b.scope, [a, b]);
        Ext.callback(b.callback, b.scope, [b, true, a]);
        setTimeout(function () {
            Ext.removeNode(h)
        }, 100)
    },
    isFormUpload: function (a) {
        var b = this.getForm(a);
        if (b) {
            return (a.isUpload || (/multipart\/form-data/i).test(b.getAttribute("enctype")))
        }
        return false
    },
    getForm: function (a) {
        return Ext.getDom(a.form) || null
    },
    setOptions: function (k, j) {
        var h = this,
            e = k.params || {}, g = h.extraParams,
            d = k.urlParams,
            c = k.url || h.url,
            i = k.jsonData,
            b, a, f;
        if (Ext.isFunction(e)) {
            e = e.call(j, k)
        }
        if (Ext.isFunction(c)) {
            c = c.call(j, k)
        }
        c = this.setupUrl(k, c);
        f = k.rawData || k.xmlData || i || null;
        if (i && !Ext.isPrimitive(i)) {
            f = Ext.encode(f)
        }
        if (Ext.isObject(e)) {
            e = Ext.Object.toQueryString(e)
        }
        if (Ext.isObject(g)) {
            g = Ext.Object.toQueryString(g)
        }
        e = e + ((g) ? ((e) ? "&" : "") + g : "");
        d = Ext.isObject(d) ? Ext.Object.toQueryString(d) : d;
        e = this.setupParams(k, e);
        b = (k.method || h.method || ((e || f) ? "POST" : "GET")).toUpperCase();
        this.setupMethod(k, b);
        a = k.disableCaching !== false ? (k.disableCaching || h.disableCaching) : false;
        if (b === "GET" && a) {
            c = Ext.urlAppend(c, (k.disableCachingParam || h.disableCachingParam) + "=" + (new Date().getTime()))
        }
        if ((b == "GET" || f) && e) {
            c = Ext.urlAppend(c, e);
            e = null
        }
        if (d) {
            c = Ext.urlAppend(c, d)
        }
        return {
            url: c,
            method: b,
            data: f || e || null
        }
    },
    setupUrl: function (b, a) {
        var c = this.getForm(b);
        if (c) {
            a = a || c.action
        }
        return a
    },
    setupParams: function (a, d) {
        var c = this.getForm(a),
            b;
        if (c && !this.isFormUpload(a)) {
            b = Ext.Element.serializeForm(c);
            d = d ? (d + "&" + b) : b
        }
        return d
    },
    setupMethod: function (a, b) {
        if (this.isFormUpload(a)) {
            return "POST"
        }
        return b
    },
    setupHeaders: function (l, m, d, c) {
        var h = this,
            b = Ext.apply({}, m.headers || {}, h.defaultHeaders || {}),
            k = h.defaultPostHeader,
            i = m.jsonData,
            a = m.xmlData,
            j, f;
        if (!b["Content-Type"] && (d || c)) {
            if (d) {
                if (m.rawData) {
                    k = "text/plain"
                } else {
                    if (a && Ext.isDefined(a)) {
                        k = "text/xml"
                    } else {
                        if (i && Ext.isDefined(i)) {
                            k = "application/json"
                        }
                    }
                }
            }
            b["Content-Type"] = k
        }
        if (h.useDefaultXhrHeader && !b["X-Requested-With"]) {
            b["X-Requested-With"] = h.defaultXhrHeader
        }
        try {
            for (j in b) {
                if (b.hasOwnProperty(j)) {
                    f = b[j];
                    l.setRequestHeader(j, f)
                }
            }
        } catch (g) {
            h.fireEvent("exception", j, f)
        }
        return b
    },
    getXhrInstance: (function () {
        var b = [function () {
                return new XMLHttpRequest()
            }, function () {
                return new ActiveXObject("MSXML2.XMLHTTP.3.0")
            }, function () {
                return new ActiveXObject("MSXML2.XMLHTTP")
            }, function () {
                return new ActiveXObject("Microsoft.XMLHTTP")
            }
        ],
            c = 0,
            a = b.length,
            f;
        for (; c < a; ++c) {
            try {
                f = b[c];
                f();
                break
            } catch (d) {}
        }
        return f
    })(),
    isLoading: function (a) {
        if (!a) {
            a = this.getLatest()
        }
        if (!(a && a.xhr)) {
            return false
        }
        var b = a.xhr.readyState;
        return !(b === 0 || b == 4)
    },
    abort: function (b) {
        var a = this;
        if (!b) {
            b = a.getLatest()
        }
        if (b && a.isLoading(b)) {
            b.xhr.onreadystatechange = null;
            b.xhr.abort();
            a.clearTimeout(b);
            if (!b.timedout) {
                b.aborted = true
            }
            a.onComplete(b);
            a.cleanup(b)
        }
    },
    abortAll: function () {
        var b = this.requests,
            a;
        for (a in b) {
            if (b.hasOwnProperty(a)) {
                this.abort(b[a])
            }
        }
    },
    getLatest: function () {
        var b = this.latestId,
            a;
        if (b) {
            a = this.requests[b]
        }
        return a || null
    },
    onStateChange: function (a) {
        if (a.xhr.readyState == 4) {
            this.clearTimeout(a);
            this.onComplete(a);
            this.cleanup(a)
        }
    },
    clearTimeout: function (a) {
        clearTimeout(a.timeout);
        delete a.timeout
    },
    cleanup: function (a) {
        a.xhr = null;
        delete a.xhr
    },
    onComplete: function (f) {
        var d = this,
            c = f.options,
            a, h, b;
        try {
            a = d.parseStatus(f.xhr.status)
        } catch (g) {
            a = {
                success: false,
                isException: false
            }
        }
        h = a.success;
        if (h) {
            b = d.createResponse(f);
            d.fireEvent("requestcomplete", d, b, c);
            Ext.callback(c.success, c.scope, [b, c])
        } else {
            if (a.isException || f.aborted || f.timedout) {
                b = d.createException(f)
            } else {
                b = d.createResponse(f)
            }
            d.fireEvent("requestexception", d, b, c);
            Ext.callback(c.failure, c.scope, [b, c])
        }
        Ext.callback(c.callback, c.scope, [c, h, b]);
        delete d.requests[f.id];
        return b
    },
    parseStatus: function (a) {
        a = a == 1223 ? 204 : a;
        var c = (a >= 200 && a < 300) || a == 304,
            b = false;
        if (!c) {
            switch (a) {
            case 12002:
            case 12029:
            case 12030:
            case 12031:
            case 12152:
            case 13030:
                b = true;
                break
            }
        }
        return {
            success: c,
            isException: b
        }
    },
    createResponse: function (c) {
        var h = c.xhr,
            a = {}, i = h.getAllResponseHeaders().replace(/\r\n/g, "\n").split("\n"),
            d = i.length,
            j, e, g, f, b;
        while (d--) {
            j = i[d];
            e = j.indexOf(":");
            if (e >= 0) {
                g = j.substr(0, e).toLowerCase();
                if (j.charAt(e + 1) == " ") {
                    ++e
                }
                a[g] = j.substr(e + 1)
            }
        }
        c.xhr = null;
        delete c.xhr;
        b = {
            request: c,
            requestId: c.id,
            status: h.status,
            statusText: h.statusText,
            getResponseHeader: function (k) {
                return a[k.toLowerCase()]
            },
            getAllResponseHeaders: function () {
                return a
            },
            responseText: h.responseText,
            responseXML: h.responseXML
        };
        h = null;
        return b
    },
    createException: function (a) {
        return {
            request: a,
            requestId: a.id,
            status: a.aborted ? -1 : 0,
            statusText: a.aborted ? "transaction aborted" : "communication failure",
            aborted: a.aborted,
            timedout: a.timedout
        }
    }
});
Ext.define("Ext.Ajax", {
    extend: "Ext.data.Connection",
    singleton: true,
    autoAbort: false
});
Ext.define("Ext.util.Offset", {
    statics: {
        fromObject: function (a) {
            return new this(a.x, a.y)
        }
    },
    constructor: function (a, b) {
        this.x = (a != null && !isNaN(a)) ? a : 0;
        this.y = (b != null && !isNaN(b)) ? b : 0;
        return this
    },
    copy: function () {
        return new Ext.util.Offset(this.x, this.y)
    },
    copyFrom: function (a) {
        this.x = a.x;
        this.y = a.y
    },
    toString: function () {
        return "Offset[" + this.x + "," + this.y + "]"
    },
    equals: function (a) {
        return (this.x == a.x && this.y == a.y)
    },
    round: function (b) {
        if (!isNaN(b)) {
            var a = Math.pow(10, b);
            this.x = Math.round(this.x * a) / a;
            this.y = Math.round(this.y * a) / a
        } else {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y)
        }
    },
    isZero: function () {
        return this.x == 0 && this.y == 0
    }
});
Ext.define("Ext.util.Region", {
    requires: ["Ext.util.Offset"],
    statics: {
        getRegion: function (a) {
            return Ext.fly(a).getPageBox(true)
        },
        from: function (a) {
            return new this(a.top, a.right, a.bottom, a.left)
        }
    },
    constructor: function (d, f, a, c) {
        var e = this;
        e.y = e.top = e[1] = d;
        e.right = f;
        e.bottom = a;
        e.x = e.left = e[0] = c
    },
    contains: function (b) {
        var a = this;
        return (b.x >= a.x && b.right <= a.right && b.y >= a.y && b.bottom <= a.bottom)
    },
    intersect: function (g) {
        var f = this,
            d = Math.max(f.y, g.y),
            e = Math.min(f.right, g.right),
            a = Math.min(f.bottom, g.bottom),
            c = Math.max(f.x, g.x);
        if (a > d && e > c) {
            return new this.self(d, e, a, c)
        } else {
            return false
        }
    },
    union: function (g) {
        var f = this,
            d = Math.min(f.y, g.y),
            e = Math.max(f.right, g.right),
            a = Math.max(f.bottom, g.bottom),
            c = Math.min(f.x, g.x);
        return new this.self(d, e, a, c)
    },
    constrainTo: function (b) {
        var a = this,
            c = Ext.Number.constrain;
        a.top = a.y = c(a.top, b.y, b.bottom);
        a.bottom = c(a.bottom, b.y, b.bottom);
        a.left = a.x = c(a.left, b.x, b.right);
        a.right = c(a.right, b.x, b.right);
        return a
    },
    adjust: function (d, f, a, c) {
        var e = this;
        e.top = e.y += d;
        e.left = e.x += c;
        e.right += f;
        e.bottom += a;
        return e
    },
    getOutOfBoundOffset: function (a, b) {
        if (!Ext.isObject(a)) {
            if (a == "x") {
                return this.getOutOfBoundOffsetX(b)
            } else {
                return this.getOutOfBoundOffsetY(b)
            }
        } else {
            b = a;
            var c = Ext.create("Ext.util.Offset");
            c.x = this.getOutOfBoundOffsetX(b.x);
            c.y = this.getOutOfBoundOffsetY(b.y);
            return c
        }
    },
    getOutOfBoundOffsetX: function (a) {
        if (a <= this.x) {
            return this.x - a
        } else {
            if (a >= this.right) {
                return this.right - a
            }
        }
        return 0
    },
    getOutOfBoundOffsetY: function (a) {
        if (a <= this.y) {
            return this.y - a
        } else {
            if (a >= this.bottom) {
                return this.bottom - a
            }
        }
        return 0
    },
    isOutOfBound: function (a, b) {
        if (!Ext.isObject(a)) {
            if (a == "x") {
                return this.isOutOfBoundX(b)
            } else {
                return this.isOutOfBoundY(b)
            }
        } else {
            b = a;
            return (this.isOutOfBoundX(b.x) || this.isOutOfBoundY(b.y))
        }
    },
    isOutOfBoundX: function (a) {
        return (a < this.x || a > this.right)
    },
    isOutOfBoundY: function (a) {
        return (a < this.y || a > this.bottom)
    },
    restrict: function (b, d, a) {
        if (Ext.isObject(b)) {
            var c;
            a = d;
            d = b;
            if (d.copy) {
                c = d.copy()
            } else {
                c = {
                    x: d.x,
                    y: d.y
                }
            }
            c.x = this.restrictX(d.x, a);
            c.y = this.restrictY(d.y, a);
            return c
        } else {
            if (b == "x") {
                return this.restrictX(d, a)
            } else {
                return this.restrictY(d, a)
            }
        }
    },
    restrictX: function (b, a) {
        if (!a) {
            a = 1
        }
        if (b <= this.x) {
            b -= (b - this.x) * a
        } else {
            if (b >= this.right) {
                b -= (b - this.right) * a
            }
        }
        return b
    },
    restrictY: function (b, a) {
        if (!a) {
            a = 1
        }
        if (b <= this.y) {
            b -= (b - this.y) * a
        } else {
            if (b >= this.bottom) {
                b -= (b - this.bottom) * a
            }
        }
        return b
    },
    getSize: function () {
        return {
            width: this.right - this.x,
            height: this.bottom - this.y
        }
    },
    copy: function () {
        return new this.self(this.y, this.right, this.bottom, this.x)
    },
    copyFrom: function (b) {
        var a = this;
        a.top = a.y = a[1] = b.y;
        a.right = b.right;
        a.bottom = b.bottom;
        a.left = a.x = a[0] = b.x;
        return this
    },
    toString: function () {
        return "Region[" + this.top + "," + this.right + "," + this.bottom + "," + this.left + "]"
    },
    translateBy: function (a, c) {
        if (arguments.length == 1) {
            c = a.y;
            a = a.x
        }
        var b = this;
        b.top = b.y += c;
        b.right += a;
        b.bottom += c;
        b.left = b.x += a;
        return b
    },
    round: function () {
        var a = this;
        a.top = a.y = Math.round(a.y);
        a.right = Math.round(a.right);
        a.bottom = Math.round(a.bottom);
        a.left = a.x = Math.round(a.x);
        return a
    },
    equals: function (a) {
        return (this.top == a.top && this.right == a.right && this.bottom == a.bottom && this.left == a.left)
    }
});
Ext.define("Ext.util.Point", {
    extend: "Ext.util.Region",
    statics: {
        fromEvent: function (a) {
            a = (a.changedTouches && a.changedTouches.length > 0) ? a.changedTouches[0] : a;
            return new this(a.pageX, a.pageY)
        }
    },
    constructor: function (a, b) {
        this.callParent([b, a, b, a])
    },
    toString: function () {
        return "Point[" + this.x + "," + this.y + "]"
    },
    equals: function (a) {
        return (this.x == a.x && this.y == a.y)
    },
    isWithin: function (b, a) {
        if (!Ext.isObject(a)) {
            a = {
                x: a,
                y: a
            }
        }
        return (this.x <= b.x + a.x && this.x >= b.x - a.x && this.y <= b.y + a.y && this.y >= b.y - a.y)
    },
    roundedEquals: function (a) {
        return (Math.round(this.x) == Math.round(a.x) && Math.round(this.y) == Math.round(a.y))
    }
}, function () {
    this.prototype.translate = Ext.util.Region.prototype.translateBy
});
(function () {
    var f, r, l, n, t, q, c, b, i, s, e, u, j, k, o, h, a, m, d, p;
    Ext.require("Ext.Ajax");
    Ext.require("Ext.data.JsonP");
    Ext.require("Ext.Template");
    q = {
        testMode: false,
        requestMode: "ajax",
        initializeServicesUrl: "/api/start",
        virusmapOffsetX: 0,
        virusmapOffsetY: 70,
        virusmapContainerOffsetX: 0,
        virusmapContainerOffsetY: 100,
        virusmapScale: null,
        maxVirusmapWidth: null,
        maxVirusmapHeight: null,
        marker2dCtx: null,
        maxDetectionsInStreamList: 8,
        markerStartRadius: 1,
        markerTargetRadius: 12,
        markerGrowTime: 400,
        maxMarkerAge: 32000,
        hourFormat: 24,
        zoomOn: false,
        currentDate: null,
        streamUpdateInterval: 60,
        currentDetections: [],
        areDetectionsRendering: false,
        advanceToInterval: 10
    };
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function () {
            return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (x) {
                var w, v;
                v = 1000;
                w = 60;
                return window.setTimeout(x, v / w)
            }
        })()
    }
    function g(v) {
        setTimeout(function () {
            throw new Error(v)
        }, 0)
    }
    o = function (v) {
        u();
        if ((v.histogram_24h_url != null)) {
            a(v.histogram_24h_url)
        }
        if ((v.top10_24h_url != null)) {
            p(v.top10_24h_url)
        }
        if ((v.stream_url != null)) {
            return d(v.stream_url)
        }
    };
    d = function (v) {
        return m(v, d, (function (y) {
            var D, C, B, A, x, F, w, E, z;
            C = y.detections;
            F = q.currentDetections;
            B = (q.currentDetections != null) & q.currentDetections.length > 0;
            if (B) {
                z = q.currentDetections;
                for (A = 0, E = z.length; A < E; A++) {
                    D = z[A];
                    if (!D.anim_finished) {
                        break
                    }
                }
                F = q.currentDetections.slice(A);
                w = F[F.length - 1].unix_time
            } else {
                w = +new Date()
            }
            x = c(C, w);
            if (B) {
                x = F.concat(x)
            }
            q.currentDetections = x;
            return i()
        }), function () {
            if ((q.currentDetections != null) & q.currentDetections.length > 0) {
                q.currentDetections = c(q.currentDetections);
                i()
            }
            if (q.streamUpdateInterval) {
                return setTimeout(function () {
                    return d(v)
                }, q.streamUpdateInterval * 1000)
            }
        })
    };
    a = function (v) {
        return m(v, a, (function (w) {
            var x;
            x = w.histogram;
            return s(x)
        }))
    };
    p = function (v) {
        return m(v, p, (function (x) {
            var w;
            w = x.detections;
            return e(x.detections)
        }))
    };
    m = function (w, C, z, A) {
        var B, y, x, v;
        v = function (D) {
            return (D.detections != null) && (D.detections[0] != null) && (D.detections[0].lat != null)
        };
        B = function (G, D) {
            var F, H, E;
            if (!G) {
                if ((A != null)) {
                    A()
                }
                return
            }
            H = w;
            F = (E = D.polling_interval) != null ? E : null;
            if (v(D)) {
                q.streamUpdateInterval = F;
                F -= q.advanceToInterval
            }
            z(D);
            if (H && F) {
                return setTimeout(function () {
                    return C(H)
                }, F * 1000)
            }
        };
        x = w + Ext.Date.format(new Date(), "/YmdHisu");
        y = q.requestMode;
        if ("ajax" === y) {
            return Ext.Ajax.request({
                url: x,
                disableCaching: false,
                callback: function (F, G, E) {
                    var D;
                    D = null;
                    if (G) {
                        D = Ext.decode(E.responseText)
                    }
                    return B(G, D)
                }
            })
        } else {
            if ("jsonp" === y) {
                return Ext.data.JsonP.request({
                    url: x,
                    disableCaching: false,
                    callback: B
                })
            }
        }
    };
    h = function () {
        var w, v, x;
        x = q.testMode;
        if (x) {
            return j()
        }
        w = q.initializeServicesUrl;
        v = q.requestMode;
        if ("ajax" === v) {
            return Ext.Ajax.request({
                url: w,
                disableCaching: false,
                success: function (y) {
                    return o(Ext.decode(y.responseText))
                }
            })
        } else {
            if ("jsonp" === v) {
                return Ext.data.JsonP.request({
                    url: w,
                    disableCaching: false,
                    success: o
                })
            }
        }
    };
    Ext.onReady(function () {
        var v;
        h();
        q.marker2dCtx = Ext.DomQuery.selectNode("#markers").getContext("2d");
        v = Ext.fly(Ext.DomQuery.selectNode("#virusmap > img:first"));
        q.maxVirusmapWidth = v.getWidth();
        q.maxVirusmapHeight = v.getHeight();
        r();
        b();
        Ext.EventManager.onWindowResize(function () {
            return b()
        });
        return Ext.get("virusmap-container").on("click", k)
    });
    r = function () {
        var w, y, v, z, A, x;
        v = function (C) {
            var B;
            B = C.replace(/[\<\>]/gi, "");
            return B
        };
        x = function (B, C) {
            if (!B || !C) {
                return
            }
            if ((C.top != null)) {
                B.setStyle({
                    top: +C.top + "px",
                    bottom: "auto"
                })
            } else {
                if ((C.bottom != null)) {
                    B.setStyle({
                        bottom: +C.bottom + "px",
                        top: "auto"
                    })
                }
            } if ((C.left != null)) {
                return B.setStyle({
                    left: +C.left + "px",
                    right: "auto"
                })
            } else {
                if ((C.right != null)) {
                    return B.setStyle({
                        right: +C.right + "px",
                        left: "auto"
                    })
                }
            }
        };
        w = Ext.Object.fromQueryString(window.location.search, true);
        if ((w.clock != null)) {
            if ((w.clock.hourFormat != null)) {
                q.hourFormat = +w.clock.hourFormat
            }
            if ((w.clock.display != null) && "none" === w.clock.display) {
                Ext.fly("clock").setStyle({
                    display: "none"
                })
            }
            if ((w.clock.position != null)) {
                x(Ext.fly("clock"), w.clock.position)
            }
        }
        if ((w.histogram != null)) {
            if ((w.histogram.display != null) && "none" === w.histogram.display) {
                Ext.fly("histogram").setStyle({
                    display: "none"
                })
            }
            if ((w.histogram.position != null)) {
                x(Ext.fly("histogram"), w.histogram.position)
            }
        }
        if ((w.streamList != null)) {
            if ((w.streamList.display != null) && "none" === w.streamList.display) {
                Ext.fly("virus-streamlist").setStyle({
                    display: "none"
                })
            }
            if ((w.streamList.position != null)) {
                x(Ext.fly("virus-streamlist"), w.streamList.position)
            }
        }
        if ((w.top10 != null)) {
            if ((w.top10.display != null) && "none" === w.top10.display) {
                Ext.fly("top10last24h").setStyle({
                    display: "none"
                })
            }
            if ((w.top10.position != null)) {
                x(Ext.fly("top10last24h"), w.top10.position)
            }
        }
        if ((w.logo != null)) {
            if ((w.logo.display != null) && "none" === w.logo.display) {
                Ext.fly("logo").setStyle({
                    display: "none"
                })
            }
            if ((w.logo.position != null)) {
                x(Ext.fly("logo"), w.logo.position)
            }
        }
        if ((w.slogan != null)) {
            if ((w.slogan.display != null) && "none" === w.slogan.display) {
                Ext.fly("slogan").setStyle({
                    display: "none"
                })
            }
            if ((((z = w.slogan) != null ? z.position : void 0) != null)) {
                x(Ext.fly("slogan?"), (A = w.slogan) != null ? A.position : void 0)
            }
        }
        if ((w.texts != null)) {
            if ((w.texts.streamListTitle != null)) {
                y = Ext.fly(Ext.DomQuery.selectNode("#virus-streamlist-table > thead > tr > th:first"));
                y.dom.innerHTML = v(w.texts.streamListTitle)
            }
            if ((w.texts.top10Title != null)) {
                y = Ext.fly(Ext.DomQuery.selectNode("#top10last24h-table > thead > tr > th:first"));
                y.dom.innerHTML = v(w.texts.top10Title)
            }
            if ((w.texts.histogramPresent != null)) {
                y = Ext.fly("histogram-text-minus-present");
                return y.dom.innerHTML = v(w.texts.histogramPresent)
            }
        }
    };
    b = function (v, A) {
        var F, z, G, C, E, B, H, y, x, D, w;
        if (v == null) {
            v = null
        }
        if (A == null) {
            A = null
        }
        G = q.maxVirusmapWidth;
        w = q.zoomOn;
        F = Ext.get("app-container");
        E = v ? v : F.getWidth();
        C = A ? A : F.getHeight();
        H = Ext.get("virusmap-container");
        H.setHeight(C);
        q.virusmapScale = D = E / G;
        B = Ext.get("virusmap");
        z = Ext.get("markers");
        if (!w) {
            y = q.virusmapContainerOffsetX;
            x = q.virusmapContainerOffsetY;
            B.setStyle({
                top: 0,
                left: 0
            });
            z.setStyle({
                top: 0,
                left: 0
            });
            H.setStyle({
                top: x + "px",
                left: y + "px"
            })
        }
        B.setStyle({
            "-webkit-transform": "scale(" + D + ")",
            "-moz-transform": "scale(" + D + ")",
            "-ms-transform": "scale(" + D + ")",
            "-o-transform": "scale(" + D + ")"
        });
        z.setWidth(E);
        z.setHeight(C);
        z.dom.width = E;
        return z.dom.height = C
    };
    k = function (v) {
        var H, E, A, x, I, D, G, F, z, y, C, w, B;
        v.preventDefault();
        if (q.zoomOn) {
            q.zoomOn = false;
            b();
            return
        } else {
            q.zoomOn = true
        }
        I = q.maxVirusmapWidth;
        x = q.maxVirusmapHeight;
        z = q.virusmapContainerOffsetX;
        y = q.virusmapContainerOffsetY;
        H = Ext.get("app-container");
        G = H.getWidth();
        D = H.getHeight();
        C = I / G;
        E = x / D;
        w = v.getX() - z;
        A = w - (G / C / 2);
        A *= C;
        A = (~~A) * -1;
        B = v.getY() - y;
        F = B - (D / E / 2);
        F *= E;
        F = (~~F) * -1;
        Ext.get("virusmap").setStyle({
            top: F + "px",
            left: A + "px"
        });
        Ext.get("markers").setStyle({
            top: F + "px",
            left: A + "px"
        });
        Ext.get("virusmap-container").setStyle({
            top: 0,
            left: 0
        });
        return b(I)
    };
    l = function (B, A) {
        var z, w, v, C;
        z = q.virusmapOffsetX;
        w = q.virusmapOffsetY;
        B = parseFloat(B);
        A = parseFloat(A);
        v = (A + 180) * 10;
        v += z;
        C = ((B * -1) + 90) * 10;
        C += w;
        return {
            x: v,
            y: C
        }
    };
    c = function (A, w) {
        var z, B, E, J, C, F, y, x, H, G, I, v, D;
        J = [];
        I = q.streamUpdateInterval;
        C = A.length;
        v = Math.floor((I / C) * 1000);
        if (!w) {
            w = +new Date()
        }
        z = w;
        for (y = 0, D = A.length; y < D; y++) {
            B = A[y];
            J[y] = B;
            H = l(B.lat, B["long"]);
            J[y].x = H.x;
            J[y].y = H.y;
            z += v;
            J[y].unix_time = z;
            E = new Date(z);
            F = E.getHours();
            x = E.getMinutes();
            x = x < 10 ? "0" + x : x;
            G = E.getSeconds();
            G = G < 10 ? "0" + G : G;
            J[y].simple_time = F + ":" + x + ":" + G;
            J[y].age = 0;
            J[y].anim_started = false;
            J[y].anim_finished = false
        }
        return J
    };
    i = function () {
        var A, x, v, y;
        A = function (D, G, C) {
            var F, E;
            F = q.marker2dCtx;
            E = q.virusmapScale;
            D = ~~ (D * E);
            G = ~~ (G * E);
            F.beginPath();
            F.clearRect(D - C, G - C, C * 2, C * 2);
            return F.closePath()
        };
        easeOutCubic = function (F, E, D, C) {
            if (D == null) {
                D = 0
            }
            if (C == null) {
                C = 1
            }
            progress = 1 - F / E;
            ret = C * progress * progress + D;
            return ret
        };
        v = function (F, E, D, C) {
            if (D == null) {
                D = 0
            }
            if (C == null) {
                C = 1
            }
            F /= E;
            return C * F * F * F + D
        };

        function z(F, H, E, G, C) {
            var I = G - E;
            var D = E + (Math.pow(((1 / H) * F), C) * I);
            return D
        }
        function w(G, I, F, H, E) {
            var J = H - F;
            var C = 1 - G / I;
            var D = 1 - Math.pow(C, E);
            return D
        }
        function B(E, N, P, O, G, C, J, L) {
            var F = O - E;
            var D = G - N;
            var K = C - P;
            var H = Math.round(F * L) + E;
            var I = Math.round(D * L) + N;
            var Q = Math.round(K * L) + P;
            var M = "rgba(" + H + ", " + I + ", " + Q + ", " + J + ")";
            return M
        }
        x = function (L, J, F, C, M, G) {
            var H, N, E, K, D, I;
            N = q.marker2dCtx;
            I = q.virusmapScale;
            markerGrowTime = q.markerGrowTime;
            L = ~~ (L * I);
            J = ~~ (J * I);
            N.save();
            N.beginPath();
            if (F < markerGrowTime) {
                E = M + ((F / markerGrowTime) * (G - M))
            } else {
                E = G
            }
            E = Math.round(E * 100) / 100;
            H = 1 - v(F, C, 0, 1);
            H = Math.round(H * 100) / 100;
            K = N.createRadialGradient(L, J, M, L, J, E);
            shift = w(F, C, 0, 1, 10);
            K.addColorStop(0, "rgba(255, 255, 255, " + H + ")");
            K.addColorStop(0.2, B(255, 26, 16, 255, 163, 39, H, shift));
            K.addColorStop(1, "rgba(77, 0, 109, 0)");
            N.fillStyle = K;
            N.arc(L, J, E, 0, Math.PI * 2, false);
            N.fill();
            N.closePath();
            return N.restore()
        };
        y = function () {
            var D, K, M, F, N, E, I, H, L, C, J, G;
            N = q.areDetectionsRendering;
            if (!N) {
                return
            }
            F = q.maxMarkerAge;
            E = q.markerTargetRadius;
            startRadius = q.markerStartRadius;
            D = +new Date();
            J = q.currentDetections;
            for (I = 0, L = J.length; I < L; I++) {
                K = J[I];
                if (!K.unix_time) {
                    continue
                }
                if (K.unix_time > D) {
                    break
                }
                if (K.anim_finished || !K.anim_started) {
                    continue
                }
                if (K.age >= F) {
                    K.age = F;
                    K.anim_finished = true
                }
                A(K.x, K.y, E * 1.25)
            }
            M = false;
            G = q.currentDetections;
            for (H = 0, C = G.length; H < C; H++) {
                K = G[H];
                if (!K.unix_time) {
                    continue
                }
                if (K.unix_time > D) {
                    M = true;
                    break
                }
                if (K.anim_finished) {
                    continue
                }
                M = true;
                if (!K.anim_started) {
                    K.anim_started = true;
                    f(K.simple_time, K.city, K.country, K.name);
                    if ((D - 1000) > K.unix_time) {
                        K.anim_finished = true;
                        continue
                    }
                    K.anim_started_user_time = +new Date()
                }
                K.age = +new Date() - K.anim_started_user_time;
                x(K.x, K.y, K.age, F, startRadius, E)
            }
            if (!M) {
                q.currentDetections = [];
                N = false;
                q.areDetectionsRendering = N;
                return
            }
            return requestAnimationFrame(y)
        };
        if (!q.areDetectionsRendering) {
            q.areDetectionsRendering = true;
            return requestAnimationFrame(y)
        }
    };
    f = function (y, z, w, v) {
        var A, C, x, D, B;
        x = q.maxDetectionsInStreamList;
        C = "";
        if ((z != null) && z !== "") {
            C += z;
            if ((w != null) && w !== "") {
                C += ", "
            }
        }
        C += w;
        D = Ext.get(Ext.DomQuery.selectNode("#virus-streamlist-table > tbody"));
        A = "<tr><td class='time-cell'><div>{time}</div></td><td class='location-cell'><div>{location}</div></td><td class='name-cell'><div>{name}</div></td></tr>";
        B = new Ext.DomHelper.createTemplate(A);
        B.compile();
        B.insertFirst(D, {
            time: y,
            location: C,
            name: v
        });
        return Ext.each(Ext.query("#virus-streamlist-table > tbody > tr"), function (F, E) {
            if (E >= x) {
                return Ext.fly(F).remove()
            }
        })
    };
    e = function (y) {
        var B, A, v, z, C, x, w;
        v = Ext.get(Ext.DomQuery.selectNode("#top10last24h-table > tbody"));
        v.dom.innerHTML = "";
        A = "<tr><td class='name-cell'><div>{name}</div></td><td class='count-cell'><div>{count}</div></td></tr>";
        z = new Ext.DomHelper.createTemplate(A);
        z.compile();
        w = [];
        for (C = 0, x = y.length; C < x; C++) {
            B = y[C];
            w.push(z.append(v, {
                name: B.name,
                count: B.count
            }))
        }
        return w
    };
    s = function (C) {
        var z, x, B, w, y, A, v;
        B = Ext.get(Ext.DomQuery.selectNode("#histogram-bars > ul"));
        x = "<li id='histogram-bar-stretcher'></li>";
        for (A = 0, v = C.length; A < v; A++) {
            z = C[A];
            y = z;
            w = ~~ (y * 100);
            if (w > 100) {
                w = 100
            }
            x += "<li style='height:" + w + "%;'></li>"
        }
        return B.dom.innerHTML = x
    };
    u = function () {
        var w, v, x;
        v = new Date();
        q.currentDate = v;
        w = 1000;
        x = function () {
            var E, H, B, F, z, A, G, y, D, C;
            B = q.hourFormat;
            v = new Date();
            q.currentDate = v;
            H = v.getDate();
            H = H < 10 ? "0" + H : H;
            A = v.getMonth() + 1;
            A = A < 10 ? "0" + A : A;
            D = v.getFullYear();
            C = "";
            F = v.getHours();
            if (12 === B) {
                if (F >= 12) {
                    if (F > 12) {
                        F -= 12
                    }
                    C = "PM"
                } else {
                    if (0 === F) {
                        F = 12
                    }
                    C = "AM"
                }
            }
            z = v.getMinutes();
            z = z < 10 ? "0" + z : z;
            G = v.getSeconds();
            G = G < 10 ? "0" + G : G;
            E = H + "." + A + "." + D;
            y = F + ":" + z + ":" + G;
            Ext.get("clock-date").dom.innerHTML = E;
            Ext.get("clock-time").dom.innerHTML = y;
            return Ext.get("clock-12-hour-period").dom.innerHTML = C
        };
        return setInterval(x, w)
    };
    j = function () {
        var x, w, v;
        u();
        x = function () {
            var y;
            y = t();
            s(y);
            return setTimeout(x, 900 * 1000)
        };
        w = function () {
            var y;
            y = n(120, 60);
            i(y);
            return setTimeout(w, 60 * 1000)
        };
        v = function () {
            var A, z, C, y, B;
            C = [];
            B = n(10);
            for (z = 0, y = B.length; z < y; z++) {
                A = B[z];
                A.count = 10000 - (z * 1000);
                C[z] = A
            }
            e(C);
            return setTimeout(v, 86400 * 1000)
        };
        x();
        w();
        return v()
    };
    t = function () {
        var w, v;
        w = [];
        for (v = 0; v <= 95; v++) {
            w[v] = {
                time: "",
                ratio: Math.random()
            }
        }
        return w
    };
    n = function (F, E) {
        var y, w, v, A, x, K, J, z, C, M, G, I, L, D, B, H;
        if (F == null) {
            F = 10
        }
        if (E == null) {
            E = 60
        }
        F--;
        x = [];
        w = ~~ ((E / F) * 1000);
        A = +q.currentDate;
        for (J = 0; 0 <= F ? J <= F : J >= F; 0 <= F ? J++ : J--) {
            C = 1 === Math.round(Math.random()) ? 1 : -1;
            if (1 === C) {
                z = Math.random() * 65
            } else {
                z = Math.random() * 15
            }
            z *= C;
            G = 1 === Math.round(Math.random()) ? 1 : -1;
            M = Math.random() * 115;
            M *= G;
            A += w;
            v = new Date(A);
            H = v.getUTCFullYear();
            L = v.getUTCMonth() + 1;
            L = L < 10 ? "0" + L : L;
            y = v.getUTCDate();
            y = y < 10 ? "0" + y : y;
            K = v.getUTCHours();
            K = K < 10 ? "0" + K : K;
            I = v.getUTCMinutes();
            I = I < 10 ? "0" + I : I;
            D = v.getUTCSeconds();
            D = D < 10 ? "0" + D : D;
            B = H + "-" + L + "-" + y + " " + K + ":" + I + ":" + D + "Z";
            x[J] = {
                lat: z,
                "long": M,
                name: "Detection " + J,
                city: "Long city name " + 1,
                country: "FI",
                time: B
            }
        }
        return x
    }
}).call(this);