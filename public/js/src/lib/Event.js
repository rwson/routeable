/***************
 * 事件模块
 * *************/

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["tool"], function (Tool) {
            return factory(window, Tool);
        });
    }

}(window, function (root, Tool, undefined) {

    var Event = {

        /**
         * 添加事件监听
         * @param obj   HTMLDOMElement
         * @param type      事件类型
         * @param fn        回调函数
         * @param prevDef   阻止默认事件
         */
        "addEvent": function (obj, type, fn, prevDef) {
            var types = type;
            if (Tool.isType(types, "string")) {
                types = [type];
            }
            types.forEach(function (type) {
                if (obj.attachEvent) {
                    obj["e" + type + fn] = fn;
                    obj[type + fn] = function (ev) {
                        ev = ev || root.event;
                        obj["e" + type + fn](ev);
                        if (prevDef) {
                            Event.prevDefault(ev);
                        }
                    };
                    obj.attachEvent("on" + type, function (ev) {
                        ev = ev || root.event;
                        obj[type + fn](ev);
                        if (prevDef) {
                            Event.prevDefault(ev);
                        }
                    });
                } else {
                    obj.addEventListener(type, function (ev) {
                        ev = ev || root.event;
                        fn(ev);
                        if (prevDef) {
                            Event.prevDefault(ev);
                        }
                    }, false);
                }
            });
        },

        /**
         * 移除事件监听
         * @param obj   HTMLDOMElement
         * @param type  事件类型(String/Array)
         * @param fn    回调函数
         */
        "removeEvent": function (obj, type, fn) {
            var types = type;
            if (Tool.isType(types, "string")) {
                types = [type];
            }
            types.forEach(function (type) {
                obj["on" + type] = null;
            });
        },

        /**
         * 事件代理
         * @param target        代理目标
         * @param type          事件类型
         * @param condition     触发事件条件,可以是boolean或者函数(boolean类型的返回值)
         * @param fn            回调函数
         */
        "delegatEvent": function (target, type, condition, fn) {
            Event.removeEvent(target, type);
            Event.addEvent(target, type, function (ev) {
                ev = ev || event;
                if ((!Tool.isType(condition, "Function") && condition) || condition()) {
                    Tool.executeCallback(fn, ev);
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

    return Event;

}));
