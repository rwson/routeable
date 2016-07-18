/**
 * index.js
 * scope类,指定作用域
 */

"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["tool"], function (Tool) {
            return factory(root, Tool);
        });
    } else {
        root.RFor = RFor;
    }

}(window, function (root, Tool, undefined) {

    /**
     * Controller对应的scope对象
     * @param compile   编译方法
     * @constructor
     */
    function Scope(compile) {
        this.uId = Tool.randomStr();        //  单独的id
        this.compile = compile;             //  存储compile实例,在数据set后,调用link方法
        this.data = {};                     //  数据对象
        this.events = {};                   //  事件对象
    }

    Scope.prototype = {

        "constructor": Scope,

        /**
         * 设置/新增数据
         * @param obj   要设置的数据
         */
        "set": function (obj) {
            //  转换成带getter/setter的对象,实现对数据的监听
            this.data = Tool.transfer(Tool.merge(this.data || {}, obj, true), {
                "context": this.compile,
                "beforeUpdate": this.compile.beforeUpdate,
                "update": this.compile.update
            });

            //  给数据进行第一次赋值
            Object.keys(obj).forEach(function (key) {
                var val = obj[key];
                if(!("" + val).length && Tool.isType(val, "string")) {
                    val = "";
                }
                this.data[key] = val;
            }.bind(this));
        },

        /**
         * 获取this.data中key对应的数据值
         * @param key   属性名
         * @returns {*}
         */
        "get": function (key) {
            return this.data[key];
        },

        /**
         * 更新数据
         * @param obj   要更新的数据
         */
        "update": function (obj) {
            Object.keys(obj).forEach(function (key) {
                this.data[key] = obj[key];
            }.bind(this));
        },

        /**
         * 删除数据
         * @param key   属性值
         */
        "remove": function (key) {
        },

        /**
         * 声明事件
         * @param obj   事件对象
         */
        "defineEvents": function (obj) {
            this.events = Tool.copy(obj, true);
        },

        /**
         * 获取数据或者事件回调
         * @param exp   数据或者事件回调对应的key
         * @returns {*}
         */
        "exec": function (exp) {
            return this.get(exp) || this.events[exp];
        },

        /**
         * link方法,做第一次数据绑定,代理执行Compile实例下的link,并且把Scope实例传入当scope
         */
        "link": function () {
            this.compile.link(this);
        }

    };

    return Scope;

}));
