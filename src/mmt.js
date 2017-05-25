// TODO
// Api for user add new tab
// API for user get the response from MMT
;(function($){
    $.fn.MMT = function(opt, isClick) {
        var $cfg = {

            MediaLibraries_Enabled: true,
            MediaLibraries_GridUrl: null,
            MediaLibraries_GridMultiSelect: true,
            MediaLibraries_GridField: {
                Id: 'pkid',
                Name: 'name',
                Alt: 'alt',
                Description: 'description',
                Src: 'src',
                ImageSize: 'image_size',
                ThumbSize: 'thumb_size'
            },
            MediaLibraries_UpdateUrl: null,
            MediaLibraries_Cols: [],
            MediaLibraries_InsertFn: null,

            MediaLibraries_FilterBox_Enabled: true,
            MediaLibraries_FilterBox_Url: null,

            MediaUpload_Enabled: true,
            MediaUpload_Url: null,

            FromUrl_Enabled: true,
            FromUrl_InsertFn: null,
            ButtonInsertLabel: 'Insert Image',
            ButtonUpdateToGridLabel: 'Update to Grid',

            width: '80%',
            height: 400

        }
        
        if (opt) {
            $.extend($cfg, opt);
        }

        var $mmt = {
            window: {
                selector: null,
                isInit: false,
                init: function() {
                    //this.isInit = true;
                    $('#mmtWindow').remove();
                    $('body').append('<div id="mmtWindow" style="display: none;"></div>');
                    this.selector = $('#mmtWindow');
                    this.selector .window({
                        title: 'Media Manager Tool',
                        width: $cfg.width,
                        height: $cfg.height,
                        iconCls:'icon-save',
                        modal: true,
                        content: '<div class="mmt-tabs"></div>'
                    });

                    $mmt.tabs.init();
                }
            },
            preview: {
                getImg: function(row) {
                    imgSize = null;
                    if (row[$cfg.MediaLibraries_GridField.ImageSize]) {
                        var tmp = row[$cfg.MediaLibraries_GridField.ImageSize].split('x');
                        row.width = tmp[0];
                        row.height = tmp[1];
                        if (parseInt(tmp[0]) >= parseInt(tmp[1])) {
                            imgSize = 'width="200"';
                        } else {
                            imgSize = 'height="200"';
                        }
                    }

                    return '<img src="{src}" {imgSize} />'
                        .replace('{src}', row.src)
                        .replace('{imgSize}', imgSize);

                },

                getForm: function(row) {
                    var UpdateGridButton = '';
                    if ($cfg.MediaLibraries_UpdateUrl) {
                        UpdateGridButton = '<div class="mmt-btn-update-to-grid"><label>&nbsp;</label><input type="button" data-id="{id}" class="l-btn mmt-btn mmt-update-to-grid mmt-update-to-grid-{id}" value="{ButtonUpdateToGridLabel}" /></div>'
                            .replace('{ButtonUpdateToGridLabel}', $cfg.ButtonUpdateToGridLabel)
                            .replace('{id}', row[$cfg.MediaLibraries_GridField.Id]);
                    }
                    return '<div class="mmt-form-items mmt-form-item-{id}"><label>Name</label>: <input class="textbox" name="name" value="{name}" /><br />'
                            .replace('{name}', row[$cfg.MediaLibraries_GridField.Name])
                            .replace('{id}', row[$cfg.MediaLibraries_GridField.Id]) +
                        '<label>Alt</label>: <input class="textbox" name="alt" value="{alt}" /><br />'.replace('{alt}', row[$cfg.MediaLibraries_GridField.Alt]) +
                        '<label>Description</label>: <input class="textbox " name="description" value="{description}" />{UpdateGridButton}</div>'
                            .replace('{description}', row[$cfg.MediaLibraries_GridField.Description])
                            .replace('{UpdateGridButton}', UpdateGridButton);
                },

                getSelectedItem: function(row) {
                    return '<a href="#" class="mmt-selected-item" data-id="{id}"><img src="{src}" width="20" height="20"/></a>'
                        .replace('{src}', row.src)
                        .replace('{id}', row[$cfg.MediaLibraries_GridField.Id]);
                },

                getInsertItem: function(selector, row) {
                    return {
                        id: row[$cfg.MediaLibraries_GridField.Id],
                        name: selector.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id] + ' input[name="name"]').val(),
                        alt: selector.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id] + ' input[name="alt"]').val(),
                        description: selector.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id] + ' input[name="description"]').val()
                    };
                },

                insert: function (selector) {
                    var data = [];
                    var selections = $mmt.tabs.MediaLibrary.dataGrid.selector.datagrid('getSelections');
                    for (var i in selections) {
                        var row = selections[i];
                        if (selector.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id]).length) {
                            data.push(this.getInsertItem(selector, row));
                        }
                    }
                    $mmt.window.selector.window('close');
                    return data;
                }
            },

            tabs: {
                selector: null,
                init: function() {
                    this.selector = $mmt.window.selector.find('.mmt-tabs');
                    this.selector.tabs({
                        border:false,
                        fit: true
                    });

                    if ($cfg.MediaLibraries_Enabled) {
                        $mmt.tabs.MediaLibrary.init();
                    }

                    if ($cfg.MediaUpload_Enabled) {
                        $mmt.tabs.MediaUpload.init();
                    }

                    if ($cfg.FromUrl_Enabled) {
                        $mmt.tabs.FromUrl.init();
                    }

                    $mmt.tabs.selector.tabs('select', 0);
                },

                MediaLibrary: {
                    previewMedia: null,
                    previewForm: null,
                    selectedItems: null,
                    insertButton: null,
                    uploadButton: null,
                    filterBox: null,
                    selector: null,
                    init: function() {
                        $mmt.tabs.selector.tabs('add', {
                            title: 'Media Libraries',
                            content: '<div class="mmt-tab-media-library"></div>'
                        });

                        this.selector = $mmt.window.selector.find('.mmt-tab-media-library');
                        this.selector.layout({fit:true}).layout('add', {
                            region: 'east',
                            width: 250,
                            border: 0,
                            content: '<div class="mmt-preview-media"></div>' +
                            '<form class="mmt-preview-form" method="post"></form>',
                            split: true
                        }).layout('add', {
                            region: 'center',
                            border: 0,
                            content: '<div class="mmt-tab-media-library-datagrid"></div>',
                            split: true
                        }).layout('add', {
                            region: 'south',
                            border: 0,
                            content: '<span class="mmt-selected-items"></span>' +
                            '<span><input class="l-btn mmt-btn mmt-insert-button" type="button" value="{ButtonInsertLabel}" /></span>'
                                .replace('{ButtonInsertLabel}', $cfg.ButtonInsertLabel),
                            height: 30,
                            split: true
                        });
                        this.previewMedia = this.selector.find('.mmt-preview-media');
                        this.previewForm = this.selector.find('.mmt-preview-form');
                        this.insertButton = this.selector.find('.mmt-insert-button');
                        this.updateButton = this.selector.find('.mmt-upload-button');
                        this.selectedItems = this.selector.find('.mmt-selected-items');

                        this.buttons.init();
                        this.dataGrid.init();

                        if ($cfg.MediaLibraries_FilterBox_Enabled) {
                            this.selector.layout('add', {
                                region: 'west',
                                width: 150,
                                border: 0,
                                content: '<ul class="mmt-filter-box"></ul>',
                                split: true
                            });
                            this.filterBox = this.selector.find('.mmt-filter-box');
                            this.dataTree.init();
                        }

                    },
                    dataTree: {
                        init: function () {
                            $mmt.tabs.MediaLibrary.filterBox.tree({
                                url: $cfg.MediaLibraries_FilterBox_Url,
                                onSelect: function (node) {
                                    $mmt.tabs.MediaLibrary.dataGrid.selector.datagrid('reload',{filter: node.id});
                                }
                            });
                        }
                    },
                    dataGrid: {
                        multiSelect: true,
                        queryParams: {},
                        selector: null,
                        formatter: {
                            image: function (value, row) {
                                return '<img src="' + row[$cfg.MediaLibraries_GridField.Src] + '" width="50" height="50" />';
                            }
                        },
                        init: function() {
                            this.selector = $mmt.window.selector.find('.mmt-tab-media-library-datagrid');
                            var defaultColums = [
                                {
                                    field: $cfg.MediaLibraries_GridField.Id,
                                    title: 'Image',
                                    width: 60,
                                    sortable:true,
                                    formatter: $mmt.tabs.MediaLibrary.dataGrid.formatter.image
                                },
                                {field: $cfg.MediaLibraries_GridField.Name, title: 'Title', width: 100, sortable:true},
                                {field: $cfg.MediaLibraries_GridField.Alt, title: 'Alt', width: 100, sortable:true},
                                {field: $cfg.MediaLibraries_GridField.Description, title: 'Description', width: 100, sortable:true},
                                {field: $cfg.MediaLibraries_GridField.ImageSize, title: 'Image Size', width: 100, sortable:true}
                            ];

                            this.selector.datagrid({
                                queryParams: $mmt.tabs.MediaLibrary.dataGrid.queryParams,
                                border:false,
                                singleSelect: !$mmt.tabs.MediaLibrary.dataGrid.multiSelect,
                                pagination:true,
                                fit: true,
                                url: $cfg.MediaLibraries_GridUrl,
                                idField: $cfg.MediaLibraries_GridField.Id,
                                method: 'get',
                                columns: [defaultColums],
                                onLoadSuccess: function() {

                                },
                                onClickRow: function(idx, row) {
                                    $mmt.tabs.MediaLibrary.preview.getFormItems(row);
                                    $mmt.tabs.MediaLibrary.preview.getSelectedItems();
                                },
                                onSelect: function(idx, row) {
                                    //Preview Img
                                    $mmt.tabs.MediaLibrary.previewMedia.html($mmt.preview.getImg(row));
                                    $mmt.tabs.MediaLibrary.preview.getFormItems(row);
                                    $mmt.tabs.MediaLibrary.preview.getSelectedItems();
                                }
                            });
                        }
                    },
                    preview: {
                        checkRowHasSelected: function(row) {
                            var selections = $mmt.tabs.MediaLibrary.dataGrid.selector.datagrid('getSelections');
                            for (var i in selections) {
                                if (row[$cfg.MediaLibraries_GridField.Id] == selections[i][$cfg.MediaLibraries_GridField.Id]) {
                                    return true;
                                }
                            }
                            return false;
                        },

                        getFormItems: function(row) {
                            if (this.checkRowHasSelected(row)) {
                                if ($mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id]).length === 0) {
                                    $mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-items').hide();
                                    $mmt.tabs.MediaLibrary.previewForm.append($mmt.preview.getForm(row));
                                    $mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id]).click($mmt.tabs.MediaLibrary.buttons.update);
                                }
                            } else {
                                $mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id]).unbind('click').remove();
                            }

                        },
                        getSelectedItems: function (selector, previewFormSelector) {
                            var items = '';
                            var selections = $mmt.tabs.MediaLibrary.dataGrid.selector.datagrid('getSelections');
                            for (var i in selections) {
                                items += $mmt.preview.getSelectedItem(selections[i]);
                            }

                            $mmt.tabs.MediaLibrary.selectedItems.html('').html(items);
                            $mmt.tabs.MediaLibrary.selectedItems.find('a').unbind('click').bind('click', function() {
                                $mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-items').hide();
                                $mmt.tabs.MediaLibrary.previewForm.find('.mmt-form-item-' + $(this).data('id')).show();
                            });
                        },
                    },
                    buttons: {
                        init: function() {
                            $mmt.tabs.MediaLibrary.insertButton.click(this.insert);
                        },

                        insert: function () {
                            var data = $mmt.preview.insert($mmt.tabs.MediaLibrary.previewForm);
                            if (typeof($cfg.MediaLibraries_InsertFn) == 'function') {
                                $cfg.MediaLibraries_InsertFn(data);
                            }

                            return data;
                        },

                        update: function() {
                            console.log('Update From Media')
                        }
                    }
                },

                MediaUpload: {
                    totalFileUpload: 0,
                    countFileUpload: 0,
                    uploadProgress: null,
                    selector: null,
                    init: function(){

                        $mmt.tabs.selector.tabs('add', {
                            title: 'Media Upload',
                            content: '<div class="mmt-tab-media-upload"><div class="mmt-tab-media-upload-drop-zone  datagrid-row-over datagrid-footer-inner" id="drop_zone">' +
                            'Drop files here or <input type="button" multiple class="l-btn mmt-btn mmt-tab-media-upload-file-browser-custom"  value="Select files" /> ' +
                            '<input type="file" style="display:none;" class="mmt-tab-media-upload-file-browser" multiple /></div>' +
                            '<div class="mmt-tab-media-upload-progress progressbar-value"></div></div>'
                        });

                        this.selector = $mmt.window.selector.find('.mmt-tab-media-upload');
                        this.uploadProgress = this.selector.find('.mmt-tab-media-upload-progress');

                        // bind event on file_browser_custom button
                        this.selector.find('.mmt-tab-media-upload-file-browser-custom').click(function() {
                            $mmt.tabs.MediaUpload.selector.find('.mmt-tab-media-upload-file-browser').click();
                        });

                        // bind event on mmt-tab-media-upload-drop-zone
                        var dropZone = document.getElementsByClassName('mmt-tab-media-upload-drop-zone')[0];
                        dropZone.addEventListener('dragover', $mmt.tabs.MediaUpload.handleDragOver, false);
                        dropZone.addEventListener('drop', $mmt.tabs.MediaUpload.handleFileSelectByDragOver, false);

                        var inputFile = document.getElementsByClassName('mmt-tab-media-upload-file-browser')[0];
                        inputFile.addEventListener('change', function () {
                            $mmt.tabs.MediaUpload.handleFileSelectByBrowser($mmt.tabs.MediaUpload.selector.find('.mmt-tab-media-upload-file-browser').prop('files'));
                        }, false);
                    },

                    handleDragOver: function(evt) {

                        evt.stopPropagation();
                        evt.preventDefault();
                        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
                    },

                    handleFileSelectByDragOver: function(evt) {
                        evt.stopPropagation();
                        evt.preventDefault();
                        $mmt.tabs.MediaUpload.initFileUpload(evt.dataTransfer.files);
                    },

                    handleFileSelectByBrowser: function($fileList)
                    {
                        $mmt.tabs.MediaUpload.initFileUpload($fileList);
                    },

                    initFileUpload: function ($fileList) {
                        this.totalFileUpload = $fileList.length;
                        $mmt.tabs.MediaUpload.uploadProgress.html('');
                        for (var i = 0; i < $fileList.length; i++) {
                            $mmt.tabs.MediaUpload.uploadProgress.append(
                                '<div class="progressbar">{name}[{filesize} byte(s)] <div class="mmt-tab-media-upload-progress-bar progressbar-text progress-bar-{idx}"></div></div>'.replace('{name}', $fileList[i].name)
                                    .replace('{filesize}', $fileList[i].size)
                                    .replace('{idx}', i)
                            );
                            $mmt.tabs.MediaUpload.ajaxFileUpload($fileList[i], i);
                        }

                    },

                    ajaxFileUpload: function(file, idx) {
                        var formData = new FormData();
                        formData.append('file', file);

                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', $cfg.MediaUpload_Url);
                        xhr.responseType = 'json';
                        xhr.onreadystatechange = function() {
                            this.uploadSuccess = function () {
                                $mmt.window.selector.find('.progress-bar-' + idx).css({'width': '100%', 'background-color': 'green'});
                                $mmt.tabs.MediaUpload.countFileUpload += 1;
                                if ($mmt.tabs.MediaUpload.countFileUpload >= $mmt.tabs.MediaUpload.totalFileUpload) {
                                    $mmt.tabs.MediaUpload.uploadProgress.html('');
                                    $mmt.tabs.MediaLibrary.dataGrid.selector.datagrid('reload');
                                    $mmt.tabs.selector.tabs('select', 0);
                                }
                                return true;
                            }
                            
                            this.uploadFail = function () {
                                $mmt.window.selector.find('.progress-bar-' + idx).css({'background-color': 'red'});
                                return false;
                            }
                            if (xhr.readyState == 4 && xhr.status == 200) {
                                if (null === xhr.response) {
                                    return this.uploadFail();
                                }
                                if(xhr.response.status) {
                                    return this.uploadSuccess();
                                } else {
                                    return this.uploadFail();
                                }
                            } else {
                                return this.uploadFail();
                            }
                            return false;
                        };

                        xhr.upload.onprogress = function (event) {
                            /*if (event.lengthComputable) {
                                var complete = (event.loaded / event.total * 70 | 0);
                                $mmt.window.selector.find('.progress-bar-' + idx).css('width', complete + '%');
                            }*/
                        };
                        xhr.send(formData);
                    }
                },

                FromUrl: {
                    previewMedia: null,
                    previewForm: null,
                    selectedItems: null,
                    insertButton: null,
                    updateButton: null,
                    inputUrl: null,
                    selector: null,

                    init: function() {
                        $mmt.tabs.selector.tabs('add', {
                            title: 'From URL',
                            content: '<div class="mmt-tab-from-url">From URL</div>'
                        });
                        this.selector = $mmt.window.selector.find('.mmt-tab-from-url');

                        this.selector.layout({fit:true}).layout('add', {
                            region: 'east',
                            width: 250,
                            border: 0,
                            content: '<div class="mmt-preview-media"></div>' +
                            '<form class="mmt-preview-form" method="post"></form>',
                            split: true
                        }).layout('add', {
                            region: 'center',
                            border: 0,
                            content: '<div class="mmt-input-url"><form>Source: <input type="text" class="textbox mmt-btn" name="src" placeholder="Enter you url image" /></form></div>',
                            split: true
                        }).layout('add', {
                            region: 'south',
                            border: 0,
                            content: '<span class="mmt-selected-items"></span>' +
                            '<span><input class="l-btn mmt-btn mmt-insert-button" type="button" value="{ButtonInsertLabel}" /></span>'
                                .replace('{ButtonInsertLabel}', $cfg.ButtonInsertLabel),
                            height: 30,
                            split: true
                        });
                        
                        this.previewMedia = this.selector.find('.mmt-preview-media');
                        this.previewForm = this.selector.find('.mmt-preview-form');
                        this.selectedItems = this.selector.find('.mmt-selected-items');
                        this.insertButton = this.selector.find('.mmt-insert-button');
                        this.updateButton = this.selector.find('.mmt-update-button');
                        this.inputUrl = this.selector.find('.mmt-input-url input');

                        this.inputUrl.bind('keyup', function(e){
                            var Img = new Image();
                            Img.onerror = function(){

                                $mmt.tabs.FromUrl.previewMedia.html('');
                                $mmt.tabs.FromUrl.previewForm.html('This image cannot download!');
                            }
                            Img.src = $(this).val();
                            Img.onload = function() {
                                var row = {
                                    id: 0,
                                    src: Img.src,
                                    image_size: Img.width + 'x' + Img.height,
                                    name: '',
                                    alt: '',
                                    description: ''
                                };
                                $mmt.tabs.FromUrl.previewMedia.html($mmt.preview.getImg(row));
                                $mmt.tabs.FromUrl.previewForm.html($mmt.preview.getForm(row));
                                $mmt.tabs.FromUrl.previewForm.find('.mmt-form-item-' + row[$cfg.MediaLibraries_GridField.Id]).unbind('click').click($mmt.tabs.FromUrl.buttons.update);
                                $mmt.tabs.FromUrl.selectedItems.html($mmt.preview.getSelectedItem(row));

                                Img.onload = function () {}
                            }


                        });
                        this.buttons.init();
                    },
                    buttons: {
                        init: function() {
                            $mmt.tabs.FromUrl.insertButton.click(this.insert);
                        },

                        insert: function() {
                            var data = [];
                            data.push($mmt.preview.getInsertItem($mmt.tabs.FromUrl.previewForm, {id: 0}));
                            if (typeof($cfg.FromUrl_InsertFn) == 'function') {
                                $cfg.FromUrl_InsertFn(data);
                            }

                            $mmt.window.selector.window('close');
                            return data;
                        },
                        update: function() {
                            console.log('Update From URL')
                        }
                    }
                }
            },

            checkCfgOptions: function () {
                if (!$cfg.MediaLibraries_GridUrl) {
                    console.log('Tab Media Libraries is disabled b/c u are not config value for $cfg.MediaLibraries_GridUrl');
                    $cfg.MediaLibraries_Enabled = false;
                }

                if (!$cfg.MediaUpload_Url) {
                    console.log('Tab Media Upload is disabled b/c u are not config value for $cfg.MediaUpload_Url');
                    $cfg.MediaUpload_Enabled = false;
                }

                if (!($cfg.MediaLibraries_Enabled || $cfg.MediaUpload_Enabled || $cfg.FromUrl_Enabled)) {
                    alert('You have to enable at least 1 tab');
                    return false;
                }

                return true;

            },

            open: function(obj) {
                if (false === this.checkCfgOptions()) {
                    return false;
                }

                this.tabs.MediaLibrary.dataGrid.multiSelect = $cfg.MediaLibraries_GridMultiSelect;

                if ($(obj).data('id')) {
                    this.tabs.MediaLibrary.dataGrid.multiSelect = false;
                    this.tabs.MediaLibrary.dataGrid.queryParams[$cfg.MediaLibraries_GridField.Id] = $(obj).data('id');

                }

                this.window.init();
            }
        };

        if (isClick) {
            $mmt.open(this);
            return;
        };

        $(this).bind('click', function(){
            $mmt.open(this);
            return;
        });
    };

    $.MMT = function (obj, opt) {
        $(obj).MMT(opt, true);
    };
})(jQuery);

