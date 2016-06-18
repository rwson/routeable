/**
 * RouteAble前端路由
 */

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], function () {
            return factory(window);
        });
    } else {
        root.RouteAble = factory(window);
    }

}(window, function (root, undefined) {

    var _class2 = {};                                       //  Object.prototype
    var _array2 = [];                                       //  Array.prototype
    var _isSupportPushState = !!history.pushState;          //  当前浏览器支持pushState
    var paramRoute = /(\/\:\w+)+/g;                         //  带url参数REST风格的路由
    var replaceParam = /(\/\:\w+)/g;                        //  替换掉url中参数的表示
    var urlQueryStr = /\?[\S=\S]+/g;                        //  url中带有queryString

    var eventFnDirecives = /event[-\S+]{1}/;                //  事件(回调)类型的指令
    var eventModelDirectives = /event[-\S+]{1}-model{1}/;   //  事件(模型)类型的指令
    var attrDirectives = /attr-[-\S+]/;                     //  attr-xxx绑定元素属性

    var elementMap = {};                                    //  元素的map对象,只更新部分对象

    var needAddAttrs = ["class", "style"];                  //  在attr-xxx中,有些属性是可以叠加的,现在指定class和type
    var needConcatReg =                                     //  拼接成正则表达式
        new RegExp(needAddAttrs.join("|"), "g");

    var _Tool = {};                                         //  工具类(类型操作,方法,字符串等)
    var _DOMTool = {};                                      //  DOM操作类
    var _Event = {};                                        //  事件系统

    //  支持的一些指令
    var directives = {
        "event-click": function (ele) {
            var callback = ele.getAttribute("event-click");
            _Tool.executeCallback(callback);
        },
        "event-change-model": function (ele) {
        },
        "attr-value": function (ele, attrName) {
            var data = RouteAble.getData();
            ele.setAttribute("value", data[attrName]);
        },
        "attr-style": function (ele) {
            return ele.style.cssText;
        },
        "attr-class": function (ele) {
            var finalClass = new Function();
        }
    };

    var RouteAble = {

        //  默认配置
        "cfg": {
            "path": [],             //  Array当path的值,每项由一个Object构成,Object包含三个属性(path,tplPath,controller)
            //  "path": {},         //  Object,由path("/","/list"...)做key,value对应一个Object,包含tplPath,controller两个属性
            "pushState": true,      //  是否支持HTML5的pushState,传入false,即采用hash解决方案
            "default": "/"          //  首页
        },

        //  页面结构数据
        "obverseer": null,

        //  最后的配置参数
        "finalCfg": {},

        //  url中所带参数,包含queryString和path
        "pageParams": {},

        //  modal上对应的事件回调对象
        "events": {},

        //  模板显示区域
        "container": document.getElementById("route-app"),

        //  模板字符串,方便后面双向绑定数据
        "tplStr": "",

        /**
         * 设置页面数据
         * @param data          需要对象或者属性
         * @param attribute     是否为属性
         */
        "setData": function (data, attribute) {
            //  设置数据
            if (attribute) {
                this.obverseer.data = data;
            } else {
                this.obverseer.data = _Tool.merge(this.obverseer.data || {}, data, true);
            }

            //  数据设置完成,调用模板选,更新视图
            this.container.innerHTML = _compileTemplate(this.tplStr, this.obverseer.data);
        },

        /**
         * 获取数据
         * @returns {*}
         */
        "getData": function () {
            return this.obverseer.data;
        },

        /**
         * 给当前页面模型定义modal事件
         * @param evtsMap
         */
        "assignEvents": function (evtsMap) {
            var evs = this.events;
            this.events = _Tool.merge(evs, evtsMap, true);
        },

        /**
         * 配置方法
         * @param opt   配置对象,结构和cfg类似
         */
        "config": function (opt) {
            if (!_Tool.isType(opt, "Object")) {
                throw "config exception!the config method expect an argument which is an Object!";
            }
            var finalCfg = _Tool.merge(this.cfg, opt, true),         //  合并传入的参数和原来的默认配置                                           //
                cfgArr = [],                                        //  用来缓存Object方式配置路由的数据
                toMerge = {},                                       //  原来的正则表达式对象和新的属性合并
                cPath,                                              //  Object方式配置路由,会遍历每一项,cPath表示当前一项
                res,                                                //  路由带参数时匹配结果
                regex;                                              //  正则表达式对象
            //  处理div#route-app不存在的情况
            if (!this.container) {
                var body = document.getElementsByTagName("body")[0];
                var first = body.getElementsByTagName("*")[0];
                this.container = document.createElement("div");
                this.container.id = "route-app";
                body.insertBefore(this.container, first);
            }

            if (_Tool.isType(finalCfg.path, "Array")) {
                //  Array形式的配置
                finalCfg.path.map(function (item) {
                    res = item.path.match(paramRoute);
                    if (res) {
                        regex = new RegExp(item.path.replace(replaceParam, "\\/\\w+"), "g");
                        item = _Tool.merge(item, {
                            "config": item.path,
                            "path": regex,
                            "regex": regex
                        }, true);
                    }
                    return item;
                });
            } else if (_Tool.isType(finalCfg.path, "Object")) {
                //  Object形式的配置
                Object.keys(finalCfg.path).forEach(function (item) {
                    cPath = finalCfg.path[item];
                    res = ("" + item).match(paramRoute);
                    regex = new RegExp(("" + item).replace(replaceParam, "\\/\\w+"), "g");
                    toMerge = {
                        "path": item
                    };
                    if (res) {
                        toMerge = {
                            "config": item,
                            "path": regex,
                            "regex": regex
                        };
                    }
                    cfgArr.push(_Tool.merge(cPath, toMerge, true));
                });
                finalCfg.path = cfgArr;
            }
            this.finalCfg = finalCfg;
        },

        /**
         * 获取当前path在配置中的相关参数
         * @param path  当前页面的path
         * @returns {*}
         */
        "getCurrent": function (path) {
            //  置成一个空对象,防止后一条url中不含参数的情况下,受到前一条url含参数的影响
            this.pageParams = {};
            var route = this.finalCfg.path;
            var fPath = path;
            var tPath;
            var output;
            //  url中存在查询字符串,将url转换成"?"前面的内容,再进行比对
            if (fPath.match(urlQueryStr)) {
                this.pageParams.queryString = _Tool.getQueryStrng(fPath);
                fPath = fPath.split("?")[0];
            }
            if (_Tool.isType(route, "Object")) {
                Object.keys(route).forEach(function (item) {
                    tPath = route[item]["path"];
                    if (_Tool.isType(tPath, "String")) {
                        output = route[item];
                    } else if (_Tool.isType(tPath, "Regexp") && tPath.test(fPath)) {
                        output = _Tool.merge(route[item], {
                            "path": fPath
                        }, true);
                    }
                });
                output = route[path];
            } else if (_Tool.isType(route, "Array")) {
                route.forEach(function (item) {
                    tPath = item["path"];
                    if (_Tool.isType(tPath, "String") && tPath === fPath) {
                        output = item;
                    } else if (_Tool.isType(tPath, "RegExp") && tPath.test(fPath)) {
                        output = _Tool.merge(item, {
                            "path": fPath
                        }, true);
                    }
                });
            }
            //  url中带参数配置项
            if (output.regex) {
                var urlSplits = fPath.split("/");
                var cfgSplits = output.config.split("/");
                var _this = this;
                cfgSplits.forEach(function (item, index) {
                    if (("" + item).indexOf(":") > -1) {
                        if (!_this.pageParams.path) {
                            _this.pageParams.path = {};
                        }
                        _this.pageParams.path[("" + item).replace(":", "")] = urlSplits[index];
                    }
                });
            }
            return output;
        },

        /**
         * 跳转到某个页面
         * @param path      路径
         * @param callback  回调
         */
        "navigate": function (path, callback) {
            var _this = this;
            var cfg = this.finalCfg;
            var target = this.getCurrent(path);
            //  该路由没有配置或者上一条路由等于要跳转的,就不用pushState来新增
            if (!target || !target.path) {
                return;
            }
            var finalCallback = function () {
                target.controller.call(this);
                _Tool.executeCallback(callback);
            };
            _Tool.getRequest({
                "url": target.tplPath,
                "context": _this,
                "success": function (context, xhr) {
                    context.tplStr = xhr.responseText;
                    //  解除之前页面的监听
                    if (context.obverseer instanceof _Observer) {
                        context.obverseer.unsubscribe(this.setData);
                        context.obverseer = null;
                    }
                    context.events = {};
                    context.obverseer = new _Observer();
                    context.obverseer.subscribe(context.setData);
                    context.container.innerHTML = context.tplStr;
                    _Tool.pushStateOrHash(cfg.pushState && _isSupportPushState, path);
                    _Tool.executeCallback(finalCallback);
                    context.bindDirectives();
                },
                "fail": function (xhr) {
                    _Tool.exception(xhr.responseText);
                }
            });
        },

        /**
         * 跳转到某个页面
         * @param path      路径
         * @param callback  回调
         */
        "prevOrBack": function (path, callback) {
            var _this = this;
            var target = this.getCurrent(path);
            var tpl;
            //  该路由没有配置或者上一条路由等于要跳转的,就不用pushState来新增
            if (!target || !target.path) {
                return;
            }
            var finalCallback = function () {
                target.controller.call(this);
                _Tool.executeCallback(callback);
            };
            _Tool.getRequest({
                "url": target.tplPath,
                "context": _this,
                "success": function (context, xhr) {
                    context.tplStr = xhr.responseText;
                    //  解除之前页面的监听
                    if (context.obverseer instanceof _Observer) {
                        context.obverseer.unsubscribe(this.setData);
                        context.obverseer = null;
                    }
                    context.events = {};
                    context.obverseer = new _Observer();
                    context.obverseer.subscribe(context.setData);
                    context.container.innerHTML = context.tplStr;
                    _Tool.pushStateOrHash(cfg.pushState && _isSupportPushState, path);
                    _Tool.executeCallback(finalCallback);
                    context.bindDirectives();
                },
                "fail": function (xhr) {
                    _Tool.exception(xhr.responseText);
                }
            });

        },

        /**
         * 初始化事件(有效a标签的click事件,浏览器的前进后退)
         */
        "initEvents": function () {
            var cfg = this.finalCfg;
            var _this = this;
            var path;

            //  document代理a标签的点击事件
            _Event.delegatEvent("click", function (ev) {
                ev = ev || event;
                var target = ev.target;
                path = target.getAttribute("href");
                return target.tagName.toLowerCase() === "a" && path;
            }, function () {
                _this.navigate(path);
            });

            //  浏览器前进后退
            _Event.delegatEvent("popstate", true, function (ev) {
                var res = _Tool.getHashOrState(cfg.default || "/");
                var path = res.path;
                if (!cfg.pushState) {
                    path = res.hash;
                }
                _this.prevOrBack(path);
            });
        },

        /**
         * 绑定一些简单的指令
         */
        "bindDirectives": function () {
            var nodes = this.container.getElementsByTagName("*");
            var modelEvents = this.events;
            var modelData = this.getData();
            var _this = this;
            var rid;
            nodes = Array.prototype.slice.call(nodes);
            nodes.forEach(function (item) {
                //  如果该元素在之前已经指定过rid属性,说明之前已经绑定过属性或计算过表达式了,就不再
                if (item.getAttribute("rid")) {
                    return;
                }
                Object.keys(directives).forEach(function (itemD) {
                    var attrVal = item.getAttribute(itemD);                 //  标签上的取得属性值
                    var isEvent = itemD.match(eventFnDirecives);            //  判断是否为事件回调指令
                    var isAttribute = itemD.match(attrDirectives);          //  判断是否为标签属性

                    if (attrVal) {
                        //  当前是event事件回调指令
                        if (isEvent) {
                            var evName = itemD.replace("event-", "");
                            var curEvent = modelEvents[attrVal];
                            _Event.removeEvent(item, evName);
                            _Event.addEvent(item, evName, curEvent);
                        } else if (isAttribute) {
                            //  元素属性指令
                            var attrnName = itemD.replace("attr-", "");
                            var fnStr = "with(this) { return (" + attrVal + ")}";
                            var fnCal = new Function(fnStr);
                            var execVal = fnCal.call(modelData);
                            switch (attrnName) {
                                case "class":
                                    _DOMTool.addClass(item, execVal);
                                    break;
                                case "style":
                                    var arr = execVal.split(";");
                                    var styles = {};
                                    arr.forEach(function (item) {
                                        var _tmp = item.split(":");
                                        if (_tmp) {
                                            styles[_tmp[0]] = _tmp[1];
                                        }
                                    });
                                    _DOMTool.setStyle(item, styles);
                                    break;
                                default :
                                    break;
                            }
                        }
                    }

                    rid = _Tool.randomStr();
                    item.setAttribute("rid", rid);
                });
            });
        },

        /**
         * 运行事件
         * @param callback  回调函数
         */
        "run": function (callback) {
            var cfg = this.finalCfg;
            var path = cfg.default;
            var cPath = _Tool.getHashOrState(cfg.default || "/").path;
            if (cPath) {
                path = cPath;
            }
            this.navigate(path);
            this.initEvents();
        }

    };

    /**
     * 观察者构造器
     * @constructor
     * @private
     */
    function _Observer() {
        /**
         * 当前页面实例的监听列表
         * @type {Array}
         * @private
         */
        var _fns = [];

        //  数据
        this.obverseer = {};

        /**
         * 设置监听函数列表
         * @param fnList
         */
        this.setFnList = function (fnList) {
            if (_Tool.isType(fnList, "Array")) {
                _fns = fnList;
            }
        };

        /**
         * 取得当前监听的对象列表
         * @returns {Array}
         */
        this.getFnList = function () {
            return _fns;
        };
    }

    /**
     * 观察者原型对象
     * @type {{constructor: _Observer, subscribe: Function, unsubscribe: Function, update: Function}}
     */
    _Observer.prototype = {

        "constructor": _Observer,

        /**
         * 订阅相关事件
         * @param fn    事件
         */
        "subscribe": function (fn) {
            var fns = this.getFnList();
            fns.push(fns);
            this.setFnList(fns);
        },

        /**
         * 取消订阅某个事件
         * @param fn
         */
        "unsubscribe": function (fn) {
            var fns = this.getFnList();
            fns = fns.filter(function (el) {
                if (el !== fn) {
                    return el;
                }
            });
            this.setFnList(fns);
        },

        /**
         * 对象发生变化,开始更新
         * @param o         回调参数
         * @param thisObj   context上下文
         */
        "update": function (o, thisObj) {
            var scope = thisObj || window;
            var fns = this.getFnList();
            fns.forEach(function (el) {
                el.call(scope, o);
            });
        }
    };

    /**
     * 加入前端模板
     * @param html      HTML字符串
     * @param options   数据
     * @private
     */
    function _compileTemplate(html, options) {
        var control = ["if", "for", "else", "switch", "case", "break"], //  流程控制语句相关关键字
            re = /<-([^%>]+)?->/g,                                      //  以"<-"开头并且以"->"结尾
            code = "var r=[];\n",                                       //  最后要执行的js代码
            cursor = 0,                                                 //  字符串开始截取位置
            reExp,                                                      //  匹配流程控制语句的正则表达式
            match;                                                      //  匹配结果

        //  组织正则表达式
        reExp = new RegExp("(^( )?(" + control.join("|") + "|{|}))(.*)?", "g");

        /**
         * 工具函数,将匹配出来的各语句加到数组
         * @param line      当前匹配结果
         * @param js        是否为js代码
         * @returns {Function}
         */
        var add = function (line, js) {
            js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        };

        //  循环匹配相关字符串
        while (match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }

        //  加到函数体
        add(html.substr(cursor, html.length - cursor));

        //  with改变执行所需的作用域
        code = "with(this){" + code + "return r.join('');}";

        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
    }

    /***************
     * 工具类
     * *************/
    _Tool = {

        /**
         * 处理state或者hash值
         * @param needState 是否支持
         * @param path      目标路由
         */
        "pushStateOrHash": function (needState, path) {
            if (!path) {
                return;
            }
            if (needState) {
                history.pushState("", "", path);
            } else {
                location.hash = path;
            }
        },

        /**
         * 获取页面的hash和state值
         * @param   rootPath    首页路径
         * @returns {hash: "", path: ""}
         */
        "getHashOrState": function (rootPath) {
            var path = decodeURIComponent(location.pathname + _Tool.getSearch());
            var hash = location.href.match(/#(.*)$/);
            var output = {};
            hash = hash ? hash[0].replace(/\#/g, "") : "";
            if (!path.indexOf((rootPath || "/"))) {
                path = "/" + path.slice(rootPath.length);
            }
            output.hash = hash;
            output.path = path;
            return output;
        },

        /**
         * 获取url中那一串?xxx=yyy
         * @returns {String || ""}
         * */
        "getSearch": function () {
            var match = location.href.replace(/#.*/, "").match(/\?.+/);
            return match ? match[0] : "";
        },

        /**
         * 获取url中的查询字符串
         * @param url   被获取的字符串
         * @returns {{}||Object}
         */
        "getQueryStrng": function (url) {
            var arr = url.split("?")[1].split("&");
            var output = {};
            if (!url || url.indexOf("?") < 0) {
                return output;
            }
            arr.forEach(function (item) {
                var _temp = item.split("=");
                output[_temp[0]] = decodeURIComponent(_temp[1]);
                _temp = null;
            });
            return output;
        },

        /**
         * 合并两个对象
         * @param obj1          第一个对象
         * @param obj2          第二个对象
         * @param override      是否支持相同属性值覆盖
         * @returns {Object}
         */
        "merge": function (obj1, obj2, override) {
            Object.keys(obj2).forEach(function (i) {
                if (obj1[i] && override) {
                    obj1[i] = obj2[i];
                } else if (!obj1[i] && obj2[i]) {
                    obj1[i] = obj2[i];
                }
            });
            return obj1;
        },

        /**
         * 判断一个对象是否为指定类型
         * @param obj       被判断的类型
         * @param typeStr   希望的类型字符串(Boolean Number String Function Array Date RegExp Object)
         * @returns {boolean}
         */
        "isType": function (obj, typeStr) {
            return _class2.toString.call(obj).toLowerCase() === ("[object " + typeStr + "]").toLowerCase();
        },

        /**
         * 判断一个对象是否为伪数组
         * @param list  被判断的对象
         * @returns {*|boolean}
         */
        "isFakeArray": function (list) {
            return list && (typeof list.length === "number") && !(list instanceof Array);
        },

        /**
         * 把一个伪数组(有length属性,没有数组原型下的方法)转换真数组
         * @param fakeArray     伪数组
         * @returns {Array.<T>}
         */
        "toArray": function (fakeArray) {
            var res = [];
            if (_Tool.isFakeArray(fakeArray)) {
                res = _array2.slice.call(fakeArray);
            }
            return res;
        },

        /**
         * 生成一个随机字符串
         * @returns {string}
         */
        "randomStr": function () {
            return ("" + Math.random()).toString(16).replace(".", "");
        },

        /**
         * 执行回调函数
         * @returns {*}
         */
        "executeCallback": function () {
            var fn = arguments[0];
            var args = _array2.slice.call(arguments, 1);
            if (_Tool.isType(fn, "Function")) {
                return fn.apply(root, args);
            }
        },

        /**
         * http请求(GET)
         * @param opts  配置参数
         */
        "getRequest": function (opts) {
            var xhr = new XMLHttpRequest();

            //  支持带cookie参数发起请求
            xhr.withCredentials = true;
            xhr.open("GET", opts.url, true);
            xhr.send(null);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                        _Tool.executeCallback(opts.success, (opts.context || root), xhr);
                    } else {
                        _Tool.executeCallback(opts.fail, (opts.context || root), xhr);
                    }
                }
            };
        },

        /**
         * 抛出异常
         * @param msg   异常信息
         */
        "exception": function (msg) {
            throw msg;
        }

    };

    /***************
     * 事件模块
     * *************/
    _Event = {

        /**
         * 添加事件监听
         * @param obj   HTMLDOMElement
         * @param type  事件类型
         * @param fn    回调函数
         */
        "addEvent": function (obj, type, fn) {
            if (obj.attachEvent) {
                obj["e" + type + fn] = fn;
                obj[type + fn] = function (ev) {
                    ev = ev || root.event;
                    obj["e" + type + fn](ev);
                    _Event.prevDefault(ev);
                };
                obj.attachEvent("on" + type, function (ev) {
                    ev = ev || root.event;
                    obj[type + fn](ev);
                    _Event.prevDefault(ev);
                });
            } else {
                obj.addEventListener(type, function (ev) {
                    ev = ev || root.event;
                    fn();
                    _Event.prevDefault(ev);
                }, false);
            }
        },

        /**
         * 移除事件监听
         * @param obj   HTMLDOMElement
         * @param type  事件类型
         * @param fn    回调函数
         */
        "removeEvent": function (obj, type, fn) {
            if (obj.detachEvent) {
                obj.detachEvent("on" + type, obj[type + fn]);
                obj[type + fn] = null;
            } else {
                obj.removeEventListener(type, fn, false);
            }
        },

        /**
         * 事件代理
         * @param type          事件类型
         * @param condition     触发事件条件,可以是boolean或者函数(boolean类型的返回值)
         * @param fn            回调函数
         */
        "delegatEvent": function (type, condition, fn) {
            _Event.removeEvent(document, type);
            _Event.addEvent(document, type, function (ev) {
                ev = ev || event;
                if ((!_Tool.isType(condition, "Function") && condition) || condition()) {
                    _Tool.executeCallback(fn, ev);
                }
            });
        },

        /**
         * 阻止默认事件和事件冒泡
         * @param ev    事件句柄
         * @private
         */
        "prevDefault": function (ev) {
            //  阻止冒泡
            if (ev.stopPropagation) {
                ev.stopPropagation();
            } else {
                root.event.cancelBubble = true;
            }

            //  阻止默认事件
            if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                root.event.returnValue = false;
            }
        }
    };

    /***************
     * DOM操作模块
     * *************/
    _DOMTool = {
        /**
         * 判断一个对象是否为DOM节点
         * @param el    被判断的对象
         * @returns {*|boolean}
         */
        "isHTMLNode": function (el) {
            return el && el.nodeType === 1;
        },

        /**
         * 给元素追加class样式类
         * @param el            目标元素
         * @param classList     需要追加的类(String:"xxx"/"xxx yyy" | Array<String>)
         */
        "addClass": function (el, classList) {
            var classEs = el.classList;
            if (_Tool.isType(classList, "String")) {
                if (~classList.indexOf(" ")) {
                    classList = classList.split(" ");
                } else {
                    classList = [classList];
                }
            }
            if (classList.length) {
                classList.forEach(function (item) {
                    if (classEs.contains(item)) {
                        el.classList.add(item);
                    }
                    classEs = el.classList;
                });
            }
        },

        /**
         * 给元素追加class样式类
         * @param el            目标元素
         * @param classList     需要删除的类(String:"xxx"/"xxx yyy" | Array<String>)
         */
        "removeClass": function (el, classList) {
            var classEs = el.classList;
            if (_Tool.isType(classList, "String")) {
                if (~classList.indexOf(" ")) {
                    classList = classList.split(" ");
                } else {
                    classList = [classList];
                }
            }
            if (classList.length) {
                classList.forEach(function (item) {
                    if (classEs.contains(item)) {
                        el.classList.remove(item);
                    }
                    classEs = el.classList;
                });
            }
        },

        /**
         * 给元素设置样式
         * @param el        目标元素
         * @param attr      样式名(String/Object)
         * @param value     样式值[,String]
         */
        "setStyle": function (el, attr, value) {
            console.log(attr);
            var styleObj = {};
            var styleArr = [];
            if (arguments.length === 2) {
                styleObj = attr;
            } else if (arguments.length === 3) {
                styleObj["" + attr] = value;
            }
            styleArr = Object.keys(styleObj).map(function (item) {
                return item + ":" + styleObj[item];
            });
            el.style.cssText += ";" + styleArr.join(";");
        },

        /**
         * 设置元素的标签属性
         * @param el        目标元素
         * @param attr      属性名(String/Object)
         * @param value     属性值([,String])
         */
        "setAttributes": function (el, attr, value) {
            var attrObj = {};
            if (arguments.length === 2) {
                attrObj = attr;
            } else if (arguments.length === 3) {
                attrObj["" + attr] = value;
            }
            Object.keys(attrObj).forEach(function (item) {
                el.setAttributes(item, attrObj[item]);
            });
        },

        /**
         * 获取的标签属性
         * @param el        目标元素
         * @param attrs     属性名(String/Array<String>)
         * @returns {{}|Object}
         */
        "getAttributes": function (el, attrs) {
            var attrList = [];
            var output = {};
            if (_Tool.isType(attrs, "String")) {
                attrList = [attrs];
            } else if (_Tool.isType(attrs, "Array")) {
                attrList = attrs;
            }
            attrList.forEach(function (item) {
                var val = el.getAttributes(item);
                output[item] = val ? val : "";
            });
        }
    };

    return RouteAble;

}));
