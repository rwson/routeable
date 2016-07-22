/**
 * r-click指令
 */

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["tool", "event", "dirBase"], function (Tool, Event, dirBase) {
            return factory(root, Tool, Event, dirBase);
        });
    }

}(window, function (root, Tool, Event, dirBase, undefined) {

    function RClick(dirCfg) {
        dirBase.call(this, dirCfg);
        this.priority = 3;
        return this;
    }

    RClick.prototype = {

        "constructor": RClick,

        "link": function (el, exp, scope, context) {
            //  修正scope
            this.scope = this.scope || scope;
            Event.removeEvent(el, "click", exp);
            Event.addEvent(el, "click", exp.bind(context));
        }
    };

    return {
        "name": "RClick",
        "type": "event",
        "priority": 3,
        "constructor": RClick
    };

}));