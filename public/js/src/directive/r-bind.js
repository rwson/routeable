/**
 * r-bind指令
 */

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["tool"], function (Tool) {
            return factory(root, Tool);
        });
    } else {
        root.RBind = RBind;
    }

}(window, function (root, Tool, undefined) {

    function RBind() {
        return this;
    }

    RBind.prototype = {

        "constructor": RBind,

        "link": function (el, exp, scope) {
            el.innerHTML = exp;
        }

    };

    return {
        "name": "RBind",
        "constructor": RBind
    };

}));


