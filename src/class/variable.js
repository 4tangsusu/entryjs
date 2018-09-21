/**
 * @fileoverview Variable object for entry variable block.
 */

'use strict';

import PIXIHelper from './pixi/helper/PIXIHelper';
import { PIXIDragHelper } from './pixi/helper/PIXIDragHelper';

/**
 * Block variable constructor
 * @param {variable model} variable
 * @constructor
 */
Entry.Variable = function(variable) {
    console.log("new Variable");
    Entry.assert(
        typeof variable.name == 'string',
        'Variable name must be given'
    );
    /** @type {string} */
    this.name_ = variable.name;
    /** @type {string} */
    this.id_ = variable.id ? variable.id : Entry.generateHash();
    this.type = variable.variableType || 'variable';
    /** @type {entry object.id} */
    this.object_ = variable.object || null;
    /** @type {boolean} */
    this.isCloud_ = variable.isCloud || false;

    this._nameWidth = null;
    this._valueWidth = null;

    /** @type {number||string} */
    var parsedValue = Entry.parseNumber(variable.value);
    if (typeof parsedValue == 'number') this.value_ = parsedValue;
    else if (!variable.value) this.value_ = 0;
    else this.value_ = variable.value;

    if (this.type == 'slide') {
        this.setMinValue(variable.minValue);
        this.setMaxValue(variable.maxValue);
    } else if (this.type == 'list')
        this.array_ = variable.array ? variable.array : [];

    if (!variable.isClone) {
        /** @type {boolean} */
        this.visible_ =
            variable.visible || typeof variable.visible == 'boolean'
                ? variable.visible
                : true;
        /** @type {number} */
        this.x_ = variable.x ? variable.x : null;
        /** @type {number} */
        this.y_ = variable.y ? variable.y : null;
        if (this.type == 'list') {
            this.width_ = variable.width ? variable.width : 100;
            this.height_ = variable.height ? variable.height : 120;
            this.scrollPosition = 0;
        }

        this.BORDER = 6;
        this.FONT = '10pt NanumGothic';
    }

    Entry.addEventListener('workspaceChangeMode', this.updateView.bind(this));
};

Entry.Variable.prototype._createListElementView = function(wrapperWidth){

    // this.elementView = new createjs.Container();
    // var indexView = new createjs.Text('asdf', this.FONT, '#000');
    // indexView.textBaseline = 'middle';

    var elementView = new PIXI.Container();
    var indexView = PIXIHelper.text("asdf", this.FONT, '#000', '', 'middle');

    // indexView.y = 5;
    indexView.y = 1;
    elementView.addChild(indexView);
    elementView.indexView = indexView;
    var valueWrapper = getNinePlane("vars/list_value_box", 6, 6, 6, 6);
    elementView.addChild(valueWrapper);
    elementView.valueWrapper = valueWrapper;
    // var valueView = new createjs.Text('fdsa', this.FONT, '#eee');
    var valueView = PIXIHelper.text('fdsa', this.FONT, '#eeeeee', '', 'middle');
    valueView.x = 24;
    // valueView.y = 6;
    valueView.y = 0;
    // valueView.textBaseline = 'middle';
    elementView.addChild(valueView);
    elementView.valueView = valueView;
    elementView.x = this.BORDER;

    valueWrapper.width = wrapperWidth;
    valueWrapper.height = 17;
    valueWrapper.x = 20;
    valueWrapper.y = -2;

    return elementView;
};

function __textWidth(pixiText) {
    return pixiText.getBounds().width;
}


/**
 * Generate variable view on canvas
 * @param {number} variableIndex index of this variable for render position
 */
Entry.Variable.prototype.generateView = function(variableIndex) {
    console.log("generateView");
    var type = this.type;
    if (type == 'variable' || type == 'timer' || type == 'answer') {
        this.view_ = new PIXI.Container();
        this.view_.interactive = true;
        this.rect_ = getNinePlane("vars/var_bg", 6, 6, 6, 6);
        this.view_.addChild(this.rect_);
        this.view_.variable = this;
        this.wrapper_ = new PIXI.Graphics();
        this.view_.addChild(this.wrapper_);
        this.textView_ = PIXIHelper.text('asdf', this.FONT, '#000000', 'alphabetic');
        this.textView_.x = 4;
        this.textView_.y = -10;
        this.view_.addChild(this.textView_);

        this.valueView_ = PIXIHelper.text('asdf', '10pt NanumGothic', "#ffffff", 'alphabetic');

        var variableLength = Entry.variableContainer.variables_.length;
        if (this.getX() && this.getY()) {
            this.setX(this.getX());
            this.setY(this.getY());
        } else {
            //TODO
            this.setX(10 - 240 + Math.floor((variableLength % 66) / 11) * 80);
            this.setY(
                variableIndex * 24 +
                    20 -
                    135 -
                    Math.floor(variableLength / 11) * 264
            );
        }
        this.view_.visible = this.visible_;
        this.view_.addChild(this.valueView_);
        this.view_.cursor = "move";
        this.view_.on(PIXIDragHelper.DOWN, function(evt) {
            if (Entry.type != 'workspace') return;
            PIXIDragHelper.handleDrag(this);
            var gp = evt.data.global;

            this.offset = {
                x: this.x - (gp.x * 0.75 - 240),
                y: this.y - (gp.y * 0.75 - 135),
            };
        });

        this.view_.on(PIXIDragHelper.MOVE, function(evt) {
            if (Entry.type != 'workspace') return;
            var gp = evt.data.global;
            this.variable.setX(gp.x * 0.75 - 240 + this.offset.x);
            this.variable.setY(gp.y * 0.75 - 135 + this.offset.y);
            this.variable.updateView();
        });
    } else if (type == 'slide') {
        var slide = this;
        this.view_ = new PIXI.Container();
        this.view_.interactive = true;
        this.rect_ = getNinePlane("vars/var_bg", 6, 6, 6, 6);
        this.view_.addChild(this.rect_);
        this.view_.variable = this;
        this.wrapper_ = new PIXI.Graphics();
        this.view_.addChild(this.wrapper_);
        this.textView_ = PIXIHelper.text("name", this.FONT, '#000000', 'alphabetic');
        this.textView_.x = 4;
        this.textView_.y = -10;
        this.view_.addChild(this.textView_);

        this.valueView_ = PIXIHelper.text('value', '10pt NanumGothic', '#ffffff', 'alphabetic');

        this.view_.on(PIXIDragHelper.DOWN, function(evt) {
            if (Entry.type != 'workspace') return;
            PIXIDragHelper.handleDrag(this);
            var gp = evt.data.global;
            this.offset = {
                x: this.x - (gp.x * 0.75 - 240),
                y: this.y - (gp.y * 0.75 - 135),
            };
        });

        this.view_.on(PIXIDragHelper.MOVE, function(evt) {
            if (Entry.type != 'workspace' || slide.isAdjusting) return;
            var gp = evt.data.global;
            this.variable.setX(gp.x * 0.75 - 240 + this.offset.x);
            this.variable.setY(gp.y * 0.75 - 135 + this.offset.y);
            this.variable.updateView();
        });
        this.view_.visible = this.visible_;
        this.view_.addChild(this.valueView_);

        // var width =
        //     this.textView_.getMeasuredWidth() +
        //     this.valueView_.getMeasuredWidth() +
        //     26;

        var width =
            __textWidth(this.textView_) +
            __textWidth(this.valueView_) +
            26;

        width = Math.max(width, 90);
        this.maxWidth = width - 20;

        // this.slideBar_ = new createjs.Shape();
        // this.slideBar_.graphics
        //     .beginFill('#A0A1A1')
        //     .s('#A0A1A1')
        //     .ss(1)
        //     .dr(10, 10, this.maxWidth, 1.5);
        // this.view_.addChild(this.slideBar_);

        this.slideBar_ = new PIXI.Graphics();
        this.slideBar_
            .beginFill(0xA0A1A1)
            .drawRect(10, 10, this.maxWidth, 1.5);
        this.view_.addChild(this.slideBar_);



        var position = this.getSlidePosition(this.maxWidth);

        // this.valueSetter_ = new createjs.Shape();
        // this.valueSetter_.graphics
        //     .beginFill('#1bafea')
        //     .s('#A0A1A1')
        //     .ss(1)
        //     .dc(position, 10 + 0.5, 3);

        this.valueSetter_ = new PIXI.Graphics();
        this.valueSetter_.interactive = true;
        this.valueSetter_
            .beginFill(0x1bafea)
            .lineStyle(1, 0xA0A1A1)
            .drawCircle(position, 10 + 0.5, 3);



        this.valueSetter_.cursor = 'pointer';
        this.valueSetter_.on(PIXIDragHelper.DOWN, function(evt) {
            if (!Entry.engine.isState('run')) return;
            evt.stopPropagation();// 슬라이드가 드래그 될 때 변수 view가 drag 되는걸 막기 위함.
            PIXIDragHelper.handleDrag(this);
            var gp = evt.data.global;
            slide.isAdjusting = true;
            this.offsetX = -(this.x - gp.x * 0.75 + 240);
        });

        this.valueSetter_.on(PIXIDragHelper.MOVE, function(evt) {
            if (!Entry.engine.isState('run')) return;
            var gp = evt.data.global;
            var oldOffsetX = this.offsetX;
            this.offsetX = -(this.x - gp.x * 0.75 + 240);
            if (oldOffsetX === this.offsetX) return;
            var slideX = slide.getX();
            var value;
            if (slideX + 10 > this.offsetX) value = 0;
            else if (slideX + slide.maxWidth + 10 > this.offsetX)
                value = this.offsetX - slideX;
            else value = slide.maxWidth + 10;
            slide.setSlideCommandX(value);
        });
        this.valueSetter_.on(PIXIDragHelper.UP, function(evt) {
            slide.isAdjusting = false;
        });
        this.view_.addChild(this.valueSetter_);
        var variableLength = Entry.variableContainer.variables_.length;
        if (this.getX() && this.getY()) {
            this.setX(this.getX());
            this.setY(this.getY());
        } else {
            this.setX(10 - 240 + Math.floor(variableLength / 11) * 80);
            this.setY(
                variableIndex * 24 +
                    20 -
                    135 -
                    Math.floor(variableLength / 11) * 264
            );
        }
    } else {

        this.view_ = new PIXI.Container();
        this.view_.interactive = true;
        this.rect_ = getNinePlane("vars/list_bg", 2, 2, 2, 2);
        this.view_.addChild(this.rect_);
        this.view_.variable = this;
        this.titleView_ = PIXIHelper.text("asdf", this.FONT, '#000', 'alphabetic', 'center');
        this.titleView_.y = this.BORDER ;
        this.titleView_.x = this.width_ - 2;
        this.view_.addChild(this.titleView_);

        var resizeHandle = this.resizeHandle_ = Entry.stage._baseAsset.newSprite("vars/list_resize_handle");
        resizeHandle.anchor.set(1);

        resizeHandle.interactive = true;
        this.view_.addChild(resizeHandle);

        resizeHandle.list = this;

        resizeHandle.on('pointerover', (evt) => {
            resizeHandle.cursor = 'nwse-resize';
        });

        resizeHandle.on(PIXIDragHelper.DOWN, (evt) => {
            // if(Entry.type != 'workspace') return;
            PIXIDragHelper.handleDrag(resizeHandle);
            this.isResizing = true;
            var gp = evt.data.global;
            resizeHandle.offset = {
                x: gp.x * 0.75 - this.getWidth(),
                y: gp.y * 0.75 - this.getHeight(),
            };
            this.view_.cursor = 'nwse-resize';
        });

        resizeHandle.on(PIXIDragHelper.MOVE, (evt) => {
            // if(Entry.type != 'workspace') return;
            var gp = evt.data.global;
            this.setWidth(gp.x * 0.75 - resizeHandle.offset.x);
            this.setHeight(gp.y * 0.75 - resizeHandle.offset.y);
            this.updateView();
        });

        resizeHandle.on(PIXIDragHelper.UP, (evt) => {
            //resizeHandle.cursor = 'initial';
            this.view_.cursor = 'move';
            this.isResizing = false;
        });


        this.view_.on('pointerover', function(evt) {
            this.cursor = 'move';
        });

        this.view_.on(PIXIDragHelper.DOWN, function(evt) {
            if (Entry.type != 'workspace' || this.variable.isResizing) return;
            PIXIDragHelper.handleDrag(this);
            var gp = evt.data.global;
            this.offset = {
                x: this.x - (gp.x * 0.75 - 240),
                y: this.y - (gp.y * 0.75 - 135),
            };
            this.cursor = 'move';
        });

        this.view_.on(PIXIDragHelper.MOVE, function(evt) {
            if (Entry.type != 'workspace' || this.variable.isResizing) return;
            var gp = evt.data.global;
            this.variable.setX(gp.x * 0.75 - 240 + this.offset.x);
            this.variable.setY(gp.y * 0.75 - 135 + this.offset.y);
            this.variable.updateView();
        });

        var scrollButton = this.scrollButton_ = new PIXI.Graphics();
        scrollButton.interactive = true;
        scrollButton
            .beginFill(0xaaaaaa)
            .drawRoundedRect(0, 0, 7, 30, 3.5);
        this.view_.addChild(scrollButton);
        scrollButton.y = 23;

        scrollButton.list = this;
        scrollButton.cursor = 'pointer';
        scrollButton.on(PIXIDragHelper.DOWN, (evt) => {
            // if(Entry.type != 'workspace') return;
            evt.stopPropagation();
            PIXIDragHelper.handleDrag(scrollButton);
            var gp = evt.data.global;
            scrollButton.offset = {
                y: gp.y - scrollButton.y / 0.75
            };
        });
        scrollButton.on(PIXIDragHelper.MOVE, (evt) => {
            // if(Entry.type != 'workspace') return;

            var gp = evt.data.global;
            var yPos = (gp.y - scrollButton.offset.y) * 0.75;
            var min = 23;
            var max = this.getHeight() - 40;
            if(yPos < min) yPos = min;
            if(yPos > max) yPos = max;
            scrollButton.y = yPos;

            this.updateView();
        });

        if (this.getX() && this.getY()) {
            this.setX(this.getX());
            this.setY(this.getY());
        } else {
            var listLength = Entry.variableContainer.lists_.length;
            this.setX(-Math.floor((listLength % 24) / 6) * 110 + 120);
            this.setY(
                variableIndex * 24 + 20 - 135 - Math.floor(listLength / 6) * 145
            );
        }
    }

    this.setVisible(this.isVisible());

    this.updateView();

    Entry.stage.loadVariable(this);
};

/**
 * Update this.view_
 */
Entry.Variable.prototype.updateView = function() {
    if (!this.view_) return;

    if (this.isVisible()) {
        if (this.type == 'variable') {
            this.view_.x = this.getX();
            this.view_.y = this.getY();
            var oldContent = this.textView_.text;
            var newContent;
            if (this.object_) {
                var obj = Entry.container.getObject(this.object_);
                if (obj) newContent = obj.name + ':' + this.getName();
                else newContent = this.getName();
            } else newContent = this.getName();

            if (oldContent !== newContent) {
                this.textView_.text = newContent;
                this._nameWidth = null;
            }

            if (this.isNumber()) {
                if (this.value_[0] !== 0 && Entry.isInteger(this.value_))
                    this.valueView_.text = '' + this.getValue();
                else
                    this.valueView_.text = Number(this.getValue())
                        .toFixed(2)
                        .replace('.00', '');
            } else {
                this.valueView_.text = this.getValue();
            }

            // if (this._nameWidth === null)
            //     this._nameWidth = this.textView_.getMeasuredWidth();

            if (this._nameWidth === null)
                this._nameWidth = PIXIHelper.textWidth(this.textView_);

            this.valueView_.x = this._nameWidth + 14;
            this.valueView_.y = -10;
            // INFO: Number체크는 slide 일때만 하도록 처리 기본 문자로 처리함(#4876)


            if (this._valueWidth === null) {
                this._valueWidth = PIXIHelper.textWidth(this.valueView_);
            }
            this.rect_.position.set(0, -14);
            this.rect_.width = this._nameWidth + this._valueWidth + 26;
            this.rect_.height = 20;

            // this.wrapper_.graphics
            //     .clear()
            //     .f('#1bafea')
            //     .ss(1, 2, 0)
            //     .s('#1bafea')
            //     .rc(
            //         this._nameWidth + 7,
            //         -11,
            //         this._valueWidth + 15,
            //         14,
            //         7,
            //         7,
            //         7,
            //         7
            //     );

            this.wrapper_
                .clear()
                .beginFill(0x1bafea)
                .lineStyle(1, 0x1bafea)
                .drawRoundedRect(
                    this._nameWidth + 7,
                    -11,
                    this._valueWidth + 15,
                    14,
                    7
                );


        } else if (this.type == 'slide') {
            this.view_.x = this.getX();
            this.view_.y = this.getY();
            var oldContent = this.textView_.text;
            var newContent;
            if (this.object_) {
                var obj = Entry.container.getObject(this.object_);
                if (obj) newContent = obj.name + ':' + this.getName();
                else newContent = this.getName();
            } else newContent = this.getName();

            if (oldContent !== newContent) {
                this.textView_.text = newContent;
                this._nameWidth = null;
            }

            // if (this._nameWidth === null)
            //     this._nameWidth = this.textView_.getMeasuredWidth();

            if (this._nameWidth === null) {
                this._nameWidth = PIXIHelper.textWidth(this.textView_);
            }

            this.valueView_.x = this._nameWidth + 14;
            this.valueView_.y = -10;
            var value = String(this.getValue());

            if (this.isFloatPoint()) {
                var reg = /\.(.*)/;

                //check the value is float
                var ret = reg.exec(value);
                if (!ret) value += '.00';
                else {
                    while (reg.exec(value)[1].length < 2) value += '0';
                }
            }

            this.valueView_.text = value;

            // if (this._valueWidth === null)
            //     this._valueWidth = this.valueView_.getMeasuredWidth();

            if (this._valueWidth === null)
                this._valueWidth = PIXIHelper.textWidth(this.valueView_);

            var width = this._nameWidth + this._valueWidth + 26;
            width = Math.max(width, 90);
            // this.rect_.graphics
            //     .clear()
            //     .f('#ffffff')
            //     .ss(1, 2, 0)
            //     .s('#A0A1A1')
            //     .rc(0, -14, width, 33, 4, 4, 4, 4);


            this.rect_.position.set(0, -14);
            this.rect_.width = width;
            this.rect_.height = 33;

            // this.wrapper_.graphics
            //     .clear()
            //     .f('#1bafea')
            //     .ss(1, 2, 0)
            //     .s('#1bafea')
            //     .rc(
            //         this._nameWidth + 7,
            //         -11,
            //         this._valueWidth + 15,
            //         14,
            //         7,
            //         7,
            //         7,
            //         7
            //     );

            this.wrapper_
                .clear()
                .beginFill(0x1bafea)
                .lineStyle(1, 0x1bafea)
                .drawRoundedRect(
                    this._nameWidth + 7,
                    -11,
                    this._valueWidth + 15,
                    14,
                    7
                );

            var width = this._nameWidth + this._valueWidth + 26;
            width = Math.max(width, 90);
            this.maxWidth = width - 20;

            // this.slideBar_.graphics
            //     .clear()
            //     .beginFill('#A0A1A1')
            //     .s('#A0A1A1')
            //     .ss(1)
            //     .dr(10, 10, this.maxWidth, 1.5);

            this.slideBar_
                .clear()
                .beginFill(0xA0A1A1)
                .lineStyle(1, 0xA0A1A1)
                .drawRect(10, 10, this.maxWidth, 1.5);

            var position = this.getSlidePosition(this.maxWidth);

            this.valueSetter_
                .clear()
                .beginFill(0x1bafea)
                .lineStyle(1, 0xA0A1A1)
                .drawCircle(position, 10 + 0.5, 3);

        } else if (this.type == 'list') {
            this.view_.x = this.getX();
            this.view_.y = this.getY();
            this.resizeHandle_.x = this.width_ - 2;
            this.resizeHandle_.y = this.height_ - 2;
            var arr = this.array_;

            var name = this.getName();
            if (this.object_) {
                var obj = Entry.container.getObject(this.object_);
                if (obj) name = obj.name + ':' + name;
            }

            this.titleView_.text = name;
            // if (this.titleView_.getMeasuredWidth() > this.width_) {
            //     name = name + '..';
            //     while (this.titleView_.getMeasuredWidth() > this.width_) {
            //         name = name.substr(0, name.length - 3) + '..';
            //         this.titleView_.text = name;
            //     }
            // }

            if (PIXIHelper.textWidth(this.titleView_) > this.width_) {
                name = name + '..';
                while (PIXIHelper.textWidth(this.titleView_) > this.width_) {
                    name = name.substr(0, name.length - 3) + '..';
                    this.titleView_.text = name;
                }
            }

            this.titleView_.x = (this.width_ - this.titleView_.width) / 2;

            this.rect_.width = this.width_;
            this.rect_.height = this.height_;

            while (this.view_.children[4]) {
                this.view_.removeChild(this.view_.children[4]);
                PIXIHelper.needDestroy(this.view_.children[4]);
            }
            var maxView = Math.floor((this.getHeight() - 20) / 20);

            var isOverFlow = maxView < arr.length;
            var totalWidth = this.getWidth();
            var wrapperWidth =
                totalWidth - 2 * this.BORDER - (isOverFlow ? 30 : 20);

            if (isOverFlow) {
                if (this.scrollButton_.y > this.getHeight() - 40)
                    this.scrollButton_.y = this.getHeight() - 40;

                this.scrollButton_.x = totalWidth - 12;
                this.scrollPosition = Math.floor(
                    (this.scrollButton_.y - 23) /
                        (this.getHeight() - 23 - 40) *
                        (arr.length - maxView)
                );
            } else {
                  this.scrollPosition = 0;
            }
            this.scrollButton_.visible = isOverFlow;

            var _cache = {};
            //because of min Width of list
            //maxLen can not be under 3
            //so start from 3
            var maxLen = 3;
            wrapperWidth -= 6;



            for (
                var i = this.scrollPosition;
                i < this.scrollPosition + maxView && i < arr.length;
                i++
            ) {
                var elementView = this._createListElementView(wrapperWidth);
                if (
                    Entry.getMainWS() &&
                    Entry.getMainWS().getMode() ===
                        Entry.Workspace.MODE_VIMBOARD
                )
                    elementView.indexView.text = i;
                else elementView.indexView.text = i + 1;

                var text = String(arr[i].data);
                var valueView = elementView.valueView;
                var cachedText = _cache[text.substr(0, 150)];

                if (cachedText) valueView.text = cachedText;
                else {
                    var execText = text.substr(0, maxLen);
                    var charIndex = maxLen;

                    valueView.text = text;

                    // if (valueView.getMeasuredWidth() > wrapperWidth) {
                    if (PIXIHelper.textWidth(valueView) > wrapperWidth) {
                        valueView.text = execText;

                        while (
                            // valueView.getMeasuredWidth() < wrapperWidth &&
                            PIXIHelper.textWidth(valueView) < wrapperWidth &&
                            text[charIndex] !== undefined
                        ) {
                            execText += text[charIndex++];
                            valueView.text = execText;
                        }

                        var subCnt = 1;
                        // while (valueView.getMeasuredWidth() > wrapperWidth) {
                        while (PIXIHelper.textWidth(valueView) > wrapperWidth) {
                            execText =
                                execText.substr(0, execText.length - subCnt) +
                                '..';
                            valueView.text = execText;
                            subCnt = 3;
                        }
                    } else execText = text;

                    _cache[text.substr(0, 150)] = execText;
                    maxLen = Math.max(execText.length, maxLen);
                }

                elementView.y = (i - this.scrollPosition) * 20 + 23;
                this.view_.addChild(elementView);
            }
        } else if (this.type == 'answer') {
            this.view_.x = this.getX();
            this.view_.y = this.getY();
            this.textView_.text = this.getName();
            this.valueView_.y = -10;
            if (this.isNumber()) {
                var v = Number(this.getValue());
                if (parseInt(this.getValue(), 10) == this.getValue())
                    this.valueView_.text = v;
                else
                    this.valueView_.text = Number(v)
                        .toFixed(1)
                        .replace('.00', '');
            } else {
                this.valueView_.text = this.getValue();
            }
            // if (this._nameWidth === null)
            //     this._nameWidth = this.textView_.getMeasuredWidth();
            // if (this._valueWidth === null)
            //     this._valueWidth = this.valueView_.getMeasuredWidth();

            if (this._nameWidth === null)
                this._nameWidth = PIXIHelper.textWidth(this.textView_);
            if (this._valueWidth === null)
                this._valueWidth = PIXIHelper.textWidth(this.valueView_);

            this.valueView_.x = this._nameWidth + 14;

            this.rect_.position.set(0, -14);
            this.rect_.width = this._nameWidth + this._valueWidth + 26;
            this.rect_.height = 20;


            // this.wrapper_.graphics
            //     .clear()
            //     .f('#E457DC')
            //     .ss(1, 2, 0)
            //     .s('#E457DC')
            //     .rc(
            //         this._nameWidth + 7,
            //         -11,
            //         this._valueWidth + 15,
            //         14,
            //         7,
            //         7,
            //         7,
            //         7
            //     );

            this.wrapper_
                .clear()
                .beginFill(0xE457DC)
                .lineStyle(1, 0xE457DC, 0)
                .drawRoundedRect(
                    this._nameWidth + 7,
                    -11,
                    this._valueWidth + 15,
                    14,
                    7
                );

        } else {
            this.view_.x = this.getX();
            this.view_.y = this.getY();
            this.textView_.text = this.getName();

            // if (this._nameWidth === null)
            //     this._nameWidth = this.textView_.getMeasuredWidth();

            if (this._nameWidth === null)
                this._nameWidth = PIXIHelper.textWidth(this.textView_);

            this.valueView_.x = this._nameWidth + 14;
            this.valueView_.y = 1;
            if (this.isNumber())
                this.valueView_.text = Number(this.getValue())
                    .toFixed(1)
                    .replace('.00', '');
            else this.valueView_.text = this.getValue();

            // if (this._valueWidth === null)
            //     this._valueWidth = this.valueView_.getMeasuredWidth();

            if (this._valueWidth === null)
                this._valueWidth = PIXIHelper.textWidth(this.valueView_);

            // this.rect_.graphics
            //     .clear()
            //     .f('#ffffff')
            //     .ss(1, 2, 0)
            //     .s('#A0A1A1')
            //     .rc(
            //         0,
            //         -14,
            //         this._nameWidth + this._valueWidth + 26,
            //         20,
            //         4,
            //         4,
            //         4,
            //         4
            //     );

            this.rect_
                .clear()
                .beginFill(0xffffff)
                .lineStyle(1, 0xA0A1A1)
                .drawRoundedRect(
                    0,
                    -14,
                    this._nameWidth + this._valueWidth + 26,
                    20,
                    4
                );

            // this.wrapper_.graphics
            //     .clear()
            //     .f('#ffbb14')
            //     .ss(1, 2, 0)
            //     .s('orange')
            //     .rc(
            //         this._nameWidth + 7,
            //         -11,
            //         this._valueWidth + 15,
            //         14,
            //         7,
            //         7,
            //         7,
            //         7
            //     );

            this.wrapper_
                .clear()
                .beginFill(0xffbb14)
                .lineStyle(1, 0xffa500) //orange color
                .drawRoundedRect(
                    this._nameWidth + 7,
                    -11,
                    this._valueWidth + 15,
                    14,
                    7
                );

        }
    }
    Entry.requestUpdate = true;
};

/**
 * Variable name getter
 * @return {string}
 */
Entry.Variable.prototype.getName = function() {
    return this.name_;
};

/**
 * Variable name setter
 * @param {!string} variableName
 */
Entry.Variable.prototype.setName = function(variableName) {
    Entry.assert(
        typeof variableName == 'string',
        'Variable name must be string'
    );
    this.name_ = variableName;
    this._nameWidth = null;
    this.updateView();
    Entry.requestUpdateTwice = true;
};

/**
 * Variable id getter
 * @return {string}
 */
Entry.Variable.prototype.getId = function() {
    return this.id_;
};

Entry.Variable.prototype.setId = function(id) {
    this.id_ = id;
};

/**
 * Variable value getter
 * @return {number}
 */
Entry.Variable.prototype.getValue = function() {
    // INFO: Number체크는 slide 일때만 하도록 처리 기본 문자로 처리함(#4876)
    if (this.type === 'slide' && this.isNumber()) return Number(this.value_);
    else return this.value_;
};

/**
 * Verify value is number
 * @return {boolean}
 */
Entry.Variable.prototype.isNumber = function() {
    return Entry.Utils.isNumber(this.value_);
};

/**
 * Variable value setter
 * @param {!string} variableValue
 */
Entry.Variable.prototype.setValue = function(value) {
    if (this.type != 'slide') this.value_ = value;
    else {
        value = Number(value);
        if (value < this.minValue_) this.value_ = this.minValue_;
        else if (value > this.maxValue_) this.value_ = this.maxValue_;
        else this.value_ = value;
    }

    this._valueWidth = null;
    this.updateView();
    Entry.requestUpdateTwice = true;
};

/**
 * Variable visible state getter
 * @return {boolean}
 */
Entry.Variable.prototype.isVisible = function() {
    return this.visible_;
};

/**
 * Variable visible state setter
 * @param {!string} visibleState
 */
Entry.Variable.prototype.setVisible = function(visibleState) {
    Entry.assert(
        typeof visibleState == 'boolean',
        'Variable visible state must be boolean'
    );
    if (this.visible === visibleState) return;
    this.view_.visible = visibleState;
    this.visible_ = visibleState;
    this.updateView();
};

/**
 * X coordinate setter
 * @param {number} x
 */
Entry.Variable.prototype.setX = function(x) {
    /** @type {number} */
    this.x_ = x;
    this.updateView();
};

/**
 * X coordinate getter
 * @return {number}
 */
Entry.Variable.prototype.getX = function() {
    return this.x_;
};

/**
 * Y coordinate setter
 * @param {number} y
 */
Entry.Variable.prototype.setY = function(y) {
    /** @type {number} */
    this.y_ = y;
    this.updateView();
};

/**
 * Y coordinate getter
 * @return {number}
 */
Entry.Variable.prototype.getY = function() {
    return this.y_;
};

/**
 * width setter
 * @param {number} width
 */
Entry.Variable.prototype.setWidth = function(width) {
    /** @type {number} */
    width = width < 100 ? 100 : width;
    this.width_ = width;
    this.updateView();
};

/**
 * width getter
 * @return {number}
 */
Entry.Variable.prototype.getWidth = function() {
    return this.width_;
};

Entry.Variable.prototype.isInList = function(x, y) {
    var xArea = this.getX() + this.width_;
    var yArea = this.getY() + this.height_;
    // if(Entry.engine.state == 'stop' && this.type== 'list');
};

/**
 * height setter
 * @param {number} height
 */
Entry.Variable.prototype.setHeight = function(height) {
    /** @type {number} */
    height = height < 100 ? 100 : height;
    this.height_ = height;
    this.updateView();
};

/**
 * height getter
 * @return {number}
 */
Entry.Variable.prototype.getHeight = function() {
    return this.height_;
};

/**
 * save current state data to 'snapshot_'
 */
Entry.Variable.prototype.takeSnapshot = function() {
    this.snapshot_ = this.toJSON();
};

/**
 * load snapshot to current variable
 */
Entry.Variable.prototype.loadSnapshot = function() {
    this.snapshot_ && this.syncModel_(this.snapshot_);
    delete this.snapshot_;
};

/**
 * sync this model with parameter
 * @param {!entity model}
 * @private
 */
Entry.Variable.prototype.syncModel_ = function(variableModel) {
    var isCloud = this.isCloud_;
    if (this.type == 'list') {
        if (!isCloud) this.array_ = variableModel.array;
        this.setWidth(variableModel.width);
        this.setHeight(variableModel.height);
    }
    if (!isCloud) this.setValue(variableModel.value);

    this.setName(variableModel.name);
    this.setX(variableModel.x);
    this.setY(variableModel.y);
    this.setVisible(variableModel.visible);
    this.isCloud_ = variableModel.isCloud;
};

/**
 * convert this variable's data to JSON.
 * @return {JSON}
 */
Entry.Variable.prototype.toJSON = function() {
    var json = {};
    json.name = this.name_;
    json.id = this.id_;
    json.visible = this.visible_;
    json.value = this.value_;
    json.variableType = this.type;
    if (this.type == 'list') {
        json.width = this.getWidth();
        json.height = this.getHeight();
        json.array = JSON.parse(JSON.stringify(this.array_));
    } else if (this.type == 'slide') {
        json.minValue = this.minValue_;
        json.maxValue = this.maxValue_;
    }
    json.isCloud = this.isCloud_;
    json.object = this.object_;
    json.x = this.x_;
    json.y = this.y_;
    return json;
};

/**
 * Remove self
 */
Entry.Variable.prototype.remove = function() {
    //this.parent.dialog = null;
    Entry.stage.removeVariable(this);
};

/**
 * clone self
 */
Entry.Variable.prototype.clone = function() {
    return new Entry.Variable(Object.assign(this.toJSON(), { isClone: true }));
};

Entry.Variable.prototype.getType = function() {
    return this.type;
};

Entry.Variable.prototype.setType = function(type) {
    this.type = type;
};

Entry.Variable.prototype.getSlidePosition = function(width) {
    var minValue = this.minValue_;
    var maxValue = this.maxValue_;
    var value = this.value_;
    var ratio = Math.abs(value - minValue) / Math.abs(maxValue - minValue);
    return width * ratio + 10;
};

Entry.Variable.prototype.setSlideCommandX = function(value) {
    // var command = this.valueSetter_.graphics.command;
    if(!this.valueSetter_.command) {
        this.valueSetter_.command = {};
    }
    var command = this.valueSetter_.command;
    value = typeof value == 'undefined' ? 10 : value;
    value = Math.max(value, 10);
    value = Math.min(this.maxWidth + 10, value);
    command.x = value;
    this.updateSlideValueByView();
};

Entry.Variable.prototype.updateSlideValueByView = function() {
    var maxWidth = this.maxWidth;
    // var position = Math.max(this.valueSetter_.graphics.command.x - 10, 0);
    var position = Math.max(this.valueSetter_.command.x - 10, 0);
    var ratio = position / maxWidth;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    var minValue = parseFloat(this.minValue_);
    var maxValue = parseFloat(this.maxValue_);

    var value = (
        minValue + Number(Math.abs(maxValue - minValue) * ratio)
    ).toFixed(2);
    value = parseFloat(value);

    if (value < minValue) value = this.minValue_;
    else if (value > maxValue) value = this.maxValue_;
    if (!this.isFloatPoint()) value = Math.round(value);

    this.setValue(value);
};

Entry.Variable.prototype.getMinValue = function() {
    return this.minValue_;
};

Entry.Variable.prototype.setMinValue = function(minValue) {
    this._valueWidth = null;

    minValue = minValue || 0;
    this.minValue_ = minValue;
    if (this.value_ < minValue) this.setValue(minValue);
    this.isMinFloat = Entry.isFloat(this.minValue_);
    this.updateView();
};

Entry.Variable.prototype.getMaxValue = function() {
    return this.maxValue_;
};

Entry.Variable.prototype.setMaxValue = function(maxValue) {
    this._valueWidth = null;

    maxValue = maxValue || 100;
    this.maxValue_ = maxValue;
    if (this.value_ > maxValue) this.value_ = maxValue;
    this.isMaxFloat = Entry.isFloat(this.maxValue_);
    this.updateView();
};

Entry.Variable.prototype.isFloatPoint = function() {
    return this.isMaxFloat || this.isMinFloat;
};


function getNinePlane(key, a, b, c, d) {
    return new PIXI.mesh.NineSlicePlane(Entry.stage._baseAsset.getTexture(key), a, b, c, d);
}