var Paginator = function(options) {
    return (function() {
        var $tab_content = $(options.table_content);
        var $table = $(options.table);
        var table_tml = options.table_tml;
        var empty_tip = options.empty_tip
        var page_size = 10;
        var total = 0;
        var current_num = 1;
        var loading = $tab_content.find(".loading");
        var totalPage = $tab_content.find(".totalPage");
        var tbody = $tab_content.find("tbody");
        var exception_tip = $tab_content.find(".exception_tip");
        var ifselectChange = false;
        var iftotalChange = false;
        var ifromSelectChange = false;
        var selectArea = $tab_content.find(".dataTables_length select");
        // var cacheTable = $tab_content.find("#prefileTable");
        var paginate = options.table_content + " .paginate";
        var URL = options.url;
        var offset = 0;
        var especiallOffset = false;
        return {
            url: URL,
            page_size: page_size,
            firstload: true,
            getSendData: function() {
                return $.extend(true, {}, {
                    pagesize: this.page_size,
                    offset: offset
                }, options.sendData)
            },
            bind: function() {
                selectArea.on("change", function(event) {
                    ifselectChange = true;
                    this.page_size = parseInt($(event.target).find("option:selected").val());
                    if (this.page_size > total) {
                        offset = 0;
                    }
                    this.ajax_get(URL, this.page_size, offset);
                }.bind(this))
            },
            ajax_get: function(url, page_size, offset) {
                Util.ajax_func(url, "GET", this.getSendData(), "json", this.paginatorSuccess.bind(this), function() {
                    if (this.firstload) {
                        loading.show();
                        exception_tip.hide()
                    }
                }.bind(this));
            },
            load_table_data: function(data) {
                options.process_data && options.process_data(data);
                tbody.html(table_tml({
                    data: data
                }));
            },
            createPaginator: function(totalPage, currentPage) {
                $.jqPaginator(paginate, {
                    totalPages: totalPage,
                    visiblePages: 3,
                    currentPage: currentPage,
                    onPageChange: function(num, type, beforeIndex, endIndex) {
                        if (ifromSelectChange) {
                            ifromSelectChange = false;
                        } else {
                            if (this.firstload) {
                                offset = 0;
                                this.firstload = false;
                            } else {
                                current_num = num;
                                offset = (num - 1) * this.page_size;
                                this.ajax_get(URL, this.page_size, offset);
                            }
                        }

                    }.bind(this)
                });
            },
            initShowTable: function() {
                // 隐藏loading显示和异常信息的显示
                loading.hide();
                exception_tip.hide();
                $table.css("visibility", "visible");
            },
            paginatorSuccess: function(data) {
                this.initShowTable();
                // 为异常错误的情况
                if (data.code != 0) {
                    exception_tip.show().text(data.message);
                    return;
                }

                // 为空的情况
                if (data.total == 0) {
                    tbody.html("");
                    exception_tip.show().text(empty_tip);
                    return;
                }

                if (data.data.length >= 0) {
                    var total_size = data.total;
                    var length = data.data.length;
                    if (total_size != total) {
                        iftotalChange = true;
                    }
                    total = total_size;
                    totalPage.text("共" + total + "条");
                    // if (length < this.page_size && offset == 0) {
                    //     return this.load_table_data(data.data);
                    // } else {
                    var currentPage;
                    var page = Math.ceil(total / this.page_size);
                    // currentPage关系到计算offset的法则

                    // 判断是否请求来自于选择条目
                    if (ifselectChange) {
                        ifselectChange = false;
                        // 如果是来自于选择条目， 那么通知分页offset不使用currentPage来计算
                        ifromSelectChange = true;
                        currentPage = Math.ceil(offset / this.page_size) + 1;
                        if (currentPage > page) {
                            currentPage = page;
                        }
                        this.createPaginator(page, currentPage);
                    }
                    // 判断请求的时候是否总的数目已经改变
                    if (iftotalChange) {
                        iftotalChange = false;
                        if (this.firstload) {
                            currentPage = 1;
                        } else {
                            if (length > 0) {
                                currentPage = current_num;
                            } else {
                                currentPage = 1;
                            }
                        }

                        // console.log(page, currentPage);
                        this.createPaginator(page, currentPage);
                    }

                    this.load_table_data(data.data);
                    // }
                }
            },
            init: function() {
                this.bind();
                this.ajax_get(URL, this.page_size, offset);
            }
        }
    })()
}

module.exports = Paginator