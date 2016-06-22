/***************
 * 事件模块
 * *************/

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./TOOL"], function (_Tool) {
            return factory(window, _Tool);
        });
    } else {
        root.Event = factory(window, Tool);
    }

}(window, function (root, _Tool, undefined) {

    var _Event = {

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
         * @param target        代理目标
         * @param type          事件类型
         * @param condition     触发事件条件,可以是boolean或者函数(boolean类型的返回值)
         * @param fn            回调函数
         */
        "delegatEvent": function (target, type, condition, fn) {
            _Event.removeEvent(target, type);
            _Event.addEvent(target, type, function (ev) {
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

    return _Event;

}));