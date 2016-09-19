(function($) {
    'use strict';

    $.jqPaginator = function(el, options) {
        if (!(this instanceof $.jqPaginator)) {
            return new $.jqPaginator(el, options);
        }

        var self = this;
        var beforeIndex = false;
        var endIndex = false;
        // 分页插件的wrapper
        self.$container = $(el);

        self.$container.data('jqPaginator', self);

        self.init = function() {

            if (options.first || options.prev || options.next || options.last || options.page) {
                options = $.extend({}, {
                    first: '',
                    prev: '',
                    next: '',
                    last: '',
                    page: ''
                }, options);
            }

            self.options = $.extend({}, $.jqPaginator.defaultOptions, options);

            self.verify();

            self.extendJquery();

            self.render();

            // onPageChange的第一次执行
            self.fireEvent(this.options.currentPage, 'init', beforeIndex, endIndex);
        };

        // 一些错误的处理
        self.verify = function() {
            var opts = self.options;

            if (!self.isNumber(opts.totalPages)) {
                throw new Error('[jqPaginator] type error: totalPages');
            }

            if (!self.isNumber(opts.totalCounts)) {
                throw new Error('[jqPaginator] type error: totalCounts');
            }

            if (!self.isNumber(opts.pageSize)) {
                throw new Error('[jqPaginator] type error: pageSize');
            }

            if (!self.isNumber(opts.currentPage)) {
                throw new Error('[jqPaginator] type error: currentPage');
            }

            if (!self.isNumber(opts.visiblePages)) {
                throw new Error('[jqPaginator] type error: visiblePages');
            }

            if (!opts.totalPages && !opts.totalCounts) {
                throw new Error('[jqPaginator] totalCounts or totalPages is required');
            }

            if (!opts.totalPages && !opts.totalCounts) {
                throw new Error('[jqPaginator] totalCounts or totalPages is required');
            }

            if (!opts.totalPages && opts.totalCounts && !opts.pageSize) {
                throw new Error('[jqPaginator] pageSize is required');
            }

            if (opts.totalCounts && opts.pageSize) {
                opts.totalPages = Math.ceil(opts.totalCounts / opts.pageSize);
            }

            if (opts.currentPage < 1 || opts.currentPage > opts.totalPages) {
                throw new Error('[jqPaginator] currentPage is incorrect');
            }

            if (opts.totalPages < 1) {
                throw new Error('[jqPaginator] totalPages cannot be less currentPage');
            }
        };

        self.extendJquery = function() {
            $.fn.jqPaginatorHTML = function(s) {
                return s ? this.before(s).remove() : $('<p>').append(this.eq(0).clone()).html();
            };
        };

        // 渲染整个分页
        self.render = function() {
            self.renderHtml();
            self.setStatus();
            self.bindEvents();
        };

        // 构建分页
        self.renderHtml = function() {
            var html = [];

            var pages = self.getPages();
            for (var i = 0, j = pages.length; i < j; i++) {

                // 添加分页的主体部分
                html.push(self.buildItem('page', pages[i]));
            }

            // 添加分页的头和尾
            if (beforeIndex) {
                html.unshift(self.buildItem("beforeIndex", "<span>...</span>"));
            }

            self.isEnable('first') && html.unshift(self.buildItem('first', 1));
            self.isEnable('prev') && html.unshift(self.buildItem('prev', self.options.currentPage - 1));
            self.isEnable('statistics') && html.unshift(self.buildItem('statistics'));
            if (endIndex) {
                html.push(self.buildItem("endIndex", "<span>...</span>"));
            }
            if (self.options.totalPages > 1) {
                self.isEnable('last') && html.push(self.buildItem('last', self.options.totalPages));
            }

            self.isEnable('next') && html.push(self.buildItem('next', self.options.currentPage + 1));

            if (self.options.wrapper) {
                self.$container.html($(self.options.wrapper).html(html.join('')).jqPaginatorHTML());
            } else {
                self.$container.html(html.join(''));
            }
        };

        // 为每一个按钮添加类型和索引的属性
        self.buildItem = function(type, pageData) {
            var html = self.options[type]
                .replace(/{{page}}/g, pageData)
                .replace(/{{totalPages}}/g, self.options.totalPages)
                .replace(/{{totalCounts}}/g, self.options.totalCounts);

            return $(html).attr({
                'jp-role': type,
                'jp-data': pageData
            }).jqPaginatorHTML();
        };

        // 设置状态
        self.setStatus = function() {
            var options = self.options;

            if (!self.isEnable('first') || options.currentPage === 1) {
                // $('[jp-role=first]', self.$container).addClass(options.disableClass);
                $('[jp-role=first]', self.$container).addClass(options.activeClass);
            }
            if (!self.isEnable('prev') || options.currentPage === 1) {
                $('[jp-role=prev]', self.$container).addClass(options.disableClass);
            }
            if (!self.isEnable('next') || options.currentPage >= options.totalPages) {
                $('[jp-role=next]', self.$container).addClass(options.disableClass);
            }
            if (!self.isEnable('last') || options.currentPage >= options.totalPages) {
                // $('[jp-role=last]', self.$container).addClass(options.disableClass);
                $('[jp-role=last]', self.$container).addClass(options.activeClass);
            }

            $('[jp-role=page]', self.$container).removeClass(options.activeClass);
            $('[jp-role=page][jp-data=' + options.currentPage + ']', self.$container).addClass(options.activeClass);
        };

        /* 返回显示的页数的数组 */
        self.getPages = function() {
            var pages = [],
                visiblePages = self.options.visiblePages,
                currentPage = self.options.currentPage,
                totalPages = self.options.totalPages;

            if (visiblePages > totalPages) {
                visiblePages = totalPages;
            }

            var half = Math.floor(visiblePages / 2);
            // example 以currentPage来构建显示的页数 比如显示5页
            // current = 3 => 1 2 3 4 5
            // end = current + floor(5/2) = 5 确定
            // start = current - floor(5/2) 待定
            // 以currentPage来构建显示的页数 比如显示4页
            // 根据确定的end = current + floor(4/2) = 5  current = 3 => 2 3 4 5
            // start = current - floor(4/2) + 1 待定
            // 结合基数和偶数的start 加入一个%2的控制变量(奇数偶数不相同) => start = current - floor(visiblePage/2) + 1 - visiblePage % 2;
            var start = currentPage - half + 1 - visiblePages % 2;
            var end = currentPage + half;


            // 判断是否有...
            beforeIndex = (start > 1 && start - 1  > 1);
            endIndex = (end < totalPages && end + 1 < totalPages);

            // 头和尾的边界问题
            if (start < 1) {
                start = 1;
                end = visiblePages;
            }
            if (end > totalPages) {
                end = totalPages;
                start = 1 + totalPages - visiblePages;
            }



            // 如果检测到为首页或者尾页 则把第一页和最后一页去掉 （因为使用首页和尾页进行了替换）
            if (start == 1) {
                start = 2;
            }
            if (end == totalPages) {
                end = end - 1;
            }



            var itPage = start;
            while (itPage <= end) {
                pages.push(itPage);
                itPage++;
            }
            return pages;
        };

        // 判断是不是一个数字
        self.isNumber = function(value) {
            var type = typeof value;
            return type === 'number' || type === 'undefined';
        };

        // 判断对应的按钮是否存在
        self.isEnable = function(type) {
            return self.options[type] && typeof self.options[type] === 'string';
        };

        // 跳转到对应的页数
        self.switchPage = function(pageIndex) {
            self.options.currentPage = pageIndex;

            // 切换页数 1. 重新构建分页 2. 重新设置状态 3.重新绑定事件
            self.render();
            // self.fireEvent(pageIndex, 'change', beforeIndex, endIndex)
        };

        // 调用的是用户自己传的参数函数
        self.fireEvent = function(pageIndex, type, beforeIndex, endIndex) {
            return (typeof self.options.onPageChange !== 'function') || (self.options.onPageChange(pageIndex, type, beforeIndex, endIndex) !== false);
        };

        self.callMethod = function(method, options) {
            switch (method) {
                case 'option':
                    self.options = $.extend({}, self.options, options);
                    self.verify();
                    self.render();
                    break;
                case 'destroy':
                    self.$container.empty();
                    self.$container.removeData('jqPaginator');
                    break;
                default:
                    throw new Error('[jqPaginator] method "' + method + '" does not exist');
            }

            return self.$container;
        };

        self.bindEvents = function() {
            var opts = self.options;

            self.$container.off();

            // jp-role 按钮的类型
            self.$container.off('click', '[jp-role]');
            self.$container.on('click', '[jp-role]', function() {
                var $el = $(this);
                if ($el.hasClass(opts.disableClass) || $el.hasClass(opts.activeClass)) {
                    return;
                }

                // 按钮的页数索引
                var pageIndex = +$el.attr('jp-data');
                if (self.fireEvent(pageIndex, 'change')) {
                    self.switchPage(pageIndex);
                }
            });
        };

        self.init();

        return self.$container;
    };

    $.jqPaginator.defaultOptions = {
        wrapper: '',
        first: '<li class="first"><a href="javascript:;">{{page}}</a></li>',
        prev: '<li class="prev"><a href="javascript:;"> << </a></li>',
        next: '<li class="next"><a href="javascript:;"> >> </a></li>',
        last: '<li class="last"><a href="javascript:;">{{page}}</a></li>',
        page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
        beforeIndex: "{{page}}",
        endIndex: "{{page}}",
        totalPages: 0,
        totalCounts: 0,
        pageSize: 0,
        currentPage: 1,
        visiblePages: 7,
        disableClass: 'disabled',
        activeClass: 'active',
        onPageChange: null
    };

    $.fn.jqPaginator = function() {
        var self = this,
            args = Array.prototype.slice.call(arguments);

        if (typeof args[0] === 'string') {
            var $instance = $(self).data('jqPaginator');
            if (!$instance) {
                throw new Error('[jqPaginator] the element is not instantiated');
            } else {
                return $instance.callMethod(args[0], args[1]);
            }
        } else {
            return new $.jqPaginator(this, args[0]);
        }
    };

})(jQuery);