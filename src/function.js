/*
 * @fileoverview Func object for entry function.
 */
'use strict';

goog.require("Entry.Utils");

/**
 * Block variable constructor
 * @param {variable model} variable
 * @constructor
 */
Entry.Func = function() {
    this.id = Entry.generateHash();
    this.content = new Entry.Code([
        [
            {
                type: "function_create",
                x: 40, y: 40
            }
        ]
    ]);
    this.block = null;
    this.hashMap = {};
};

Entry.Func.threads = {};

Entry.Func.registerFunction = function(functionHash, entity) {
    var threadHash = Entry.generateHash();
    var func = Entry.variableContainer.getFunction(functionHash);
    var script = new Entry.Script(entity);
    script.init(func.content.childNodes[0]);
    this.threads[threadHash] = script;
    return threadHash;
};

Entry.Func.executeFunction = function(threadHash) {
    var script = this.threads[threadHash];
    script = Entry.Engine.computeThread(script.entity, script);
    if (script) {
        this.threads[threadHash] = script;
        return true;
    } else {
        delete this.threads[threadHash];
        return false;
    }
};

Entry.Func.clearThreads = function() {
    this.threads = {};
};

Entry.Func.prototype.init = function(model) {
    this.id = model.id;
    this.content = Blockly.Xml.textToDom(model.content);
    var xmlText = '<xml>' + model.block + '</xml>';
    this.block = Blockly.Xml.textToDom(xmlText).childNodes[0];
};

Entry.Func.CREATE_BTN =
    '<xml><btn text="Lang.Workspace.create_function" ' +
    'onclick="Entry.variableContainer.createFunction()"></btn></xml>';

Entry.Func.createBtn = Entry.nodeListToArray(
    Blockly.Xml.textToDom(Entry.Func.CREATE_BTN).childNodes);

Entry.Func.FIELD_BLOCK =
    '<xml><block type="function_field_label"></block>' +
    '<block type="function_field_string"><value name="PARAM">' +
    '<block type="function_param_string"><mutation hashid="#1"/></block></value></block>' +
    '<block type="function_field_boolean"><value name="PARAM">' +
    '<block type="function_param_boolean"><mutation hashid="#2"/></block></value></block>' +
    '</xml>';

Entry.Func.fieldBlocks = Entry.nodeListToArray(
    Blockly.Xml.textToDom(Entry.Func.FIELD_BLOCK).childNodes);

Entry.Func.CREATE_BLOCK =
    '<xml><block type="function_create" deletable="false" x="28" y="28">' +
    '</block></xml>';

Entry.Func.edit = function(func) {
    this.cancelEdit();
    this.initEditView(func.content);
    this.targetFunc = func;
    this._funcChangeEvent = func.content.getEventMap("funcDef")[0].thread
        .changeEvent.attach(this, this.generateWsBlock);
    this.updateMenu();
};

Entry.Func.initEditView = function(content) {
    Entry.playground.mainWorkspace.setMode(Entry.Workspace.MODE_OVERLAYBOARD);
    var blockMenu = Entry.playground.mainWorkspace.getBlockMenu();
    Entry.playground.mainWorkspace.changeOverlayBoardCode(content);
};

Entry.Func.save = function() {
    this._funcChangeEvent.destroy();
    this.targetFunc.generateBlock(true);
    Entry.variableContainer.saveFunction(this.targetFunc);
    this.cancelEdit();
};

Entry.Func.cancelEdit = function() {
    if (!this.svg || !this.targetFunc)
        return;
    this._funcChangeEvent.destroy();
    this.parentView.removeChild(this.svg);
    Entry.Func.isEdit = false;
    Blockly.mainWorkspace.blockMenu.targetWorkspace = Blockly.mainWorkspace;
    if (!this.targetFunc.block) {
        delete Entry.variableContainer.functions_[this.targetFunc.id];
        delete Entry.variableContainer.selected;
    }
    delete this.targetFunc;
    this.updateMenu();
    Entry.variableContainer.updateList();
};

Entry.Func.getMenuXml = function() {
    var blocks = [];
    if (!this.targetFunc)
        blocks = blocks.concat(this.createBtn);
    if (this.targetFunc) {
        var fieldXml = this.FIELD_BLOCK;
        fieldXml = fieldXml.replace('#1', Entry.generateHash());
        fieldXml = fieldXml.replace('#2', Entry.generateHash());
        var xml = Blockly.Xml.textToDom(fieldXml).childNodes;
        blocks = blocks.concat(Entry.nodeListToArray(xml));
    }
    for (var i in Entry.variableContainer.functions_) {
        var func = Entry.variableContainer.functions_[i];
        if (func === this.targetFunc) {
            var block = Entry.Func.generateBlock(
                this.targetFunc,
                Blockly.Xml.workspaceToDom(Entry.Func.workspace),
                func.id).block;
            blocks.push(block);
        } else
            blocks.push(func.block);
    }
    return blocks;
};

Entry.Func.syncFunc = function() {
    var func = Entry.Func;
    if (!func.targetFunc)
        return;
    var fieldText = func.workspace.topBlocks_[0].toString();
    var workspaceLength = func.workspace.topBlocks_.length;
    if ((func.fieldText != fieldText ||
        func.workspaceLength != workspaceLength) &&
            Blockly.Block.dragMode_ < 1) {
        func.updateMenu();
        func.fieldText = fieldText;
        func.workspaceLength = workspaceLength;
    }
};

Entry.Func.setupMenuCode = function() {
    var blockMenu = Entry.playground.mainWorkspace.getBlockMenu();
    var menuCode = blockMenu.getCategoryCodes("func");
    this._fieldLabel = menuCode.createThread([{
        type: "function_field_label"
    } ]).getFirstBlock();
    this._fieldString = menuCode.createThread([{
        type: "function_field_string",
        params: [
            {type: this.requestParamBlock("string")}
        ]
    }]).getFirstBlock();
    this._fieldBoolean = menuCode.createThread([{
        type: "function_field_boolean",
        params: [
            {type: this.requestParamBlock("boolean")}
        ]
    }]).getFirstBlock();
    this.menuCode = menuCode;
}

Entry.Func.refreshMenuCode = function() {
    this._fieldString.params[0].changeType(this.requestParamBlock("string"));
    this._fieldBoolean.params[0].changeType(this.requestParamBlock("boolean"));
};

Entry.Func.requestParamBlock = function(type) {
    var id = Entry.generateHash();
    var blockPrototype, hashMap;
    switch (type) {
        case "string":
            blockPrototype = Entry.block.function_param_string;
            break;
        case "boolean":
            blockPrototype = Entry.block.function_param_boolean;
            break;
        default:
            return null;
    }

    var blockSchema = function () {};
    blockSchema.prototype = blockPrototype;
    blockSchema = new blockSchema();
    blockSchema.changeEvent = new Entry.Event();

    var blockType = type + "Param_" + id;
    Entry.block[blockType] = blockSchema;
    return blockType;
};

Entry.Func.updateMenu = function() {
    var blockMenu = Entry.playground.mainWorkspace.getBlockMenu();
    if (!this.menuCode)
        this.setupMenuCode();
    blockMenu.banClass("functionInit");
    blockMenu.unbanClass("functionEdit");
};

Entry.Func.prototype.edit = function() {
    if (Entry.Func.isEdit)
        return;
    Entry.Func.isEdit = true;
    if (!Entry.Func.svg)
        Entry.Func.initEditView();
    else {
        this.parentView.appendChild(this.svg);
    }
};

Entry.Func.generateBlock = function(func, content, id) {
    var topBlocks = Entry.nodeListToArray(content.childNodes);
    var createBlock;
    for (var i in topBlocks)
        if (topBlocks[i].getAttribute('type') == 'function_create')
            createBlock = topBlocks[i];
    var script = new Entry.Script();
    script.init(createBlock);
    var field = script;
    if (field.values)
        field = script.values.FIELD;
    var mutationXml = '<mutation hashid="' + id + '">';
    var fieldXml = '';
    var description = '';
    var stringCount = 0;
    var booleanCount = 0;
    func.stringHash = {};
    func.booleanHash = {};
    while(true) {
        var type = field.type;
        switch (type) {
            case 'function_field_label':
                mutationXml += '<field type="label" content="' +
                    field.fields.NAME.replace("<", "&lt;").replace(">", "&gt;") + '"></field>';
                description += field.fields.NAME;
                break;
            case 'function_field_boolean':
                var hash = field.values.PARAM.hashId;
                mutationXml += '<field type="boolean" hashid="' + hash +
                               '"></field>';
                fieldXml += '<value name="' + hash + '"><block type="True">' +
                    '</block></value>';
                func.booleanHash[hash] = booleanCount;
                booleanCount++;
                description += '논리값' + booleanCount;
                break;
            case 'function_field_string':
                var hash = field.values.PARAM.hashId;
                mutationXml += '<field type="string" hashid="' + hash +
                               '"></field>';
                fieldXml += '<value name="' + hash + '"><block type="text">' +
                    '<field name="NAME">10</field></block></value>';
                func.stringHash[hash] = stringCount;
                stringCount++;
                description += '문자값' + stringCount;
                break;
        }
        if (field.values && field.values.NEXT) field = field.values.NEXT;
        else break;
        description += ' ';
    }
    mutationXml += '</mutation>';
    var blockText = '<xml><block type="function_general">' + mutationXml +
        fieldXml + '</block></xml>';
    var block = Blockly.Xml.textToDom(blockText).childNodes[0];
    if (!description) description = "함수";
    return {block: block, description: description};
};

Entry.Func.prototype.generateBlock = function(toSave) {
    var generatedInfo = Entry.Func.generateBlock(this, this.content, this.id);
    this.block = generatedInfo.block;
    this.description = generatedInfo.description;
};

Entry.Func.generateWsBlock = function() {
    var defBlock = this.targetFunc.content.getEventMap("funcDef")[0];
    var outputBlock = defBlock.params[0];
    var booleanIndex = 0;
    var stringIndex = 0;
    while(outputBlock) {
        var value = outputBlock.params[0];
        switch(outputBlock.type) {
            case 'function_field_label':
                break;
            case 'function_field_boolean':
                Entry.Mutator.mutate(value.type, {template: "boolean" + booleanIndex});
                booleanIndex++;
                break;
            case 'function_field_string':
                Entry.Mutator.mutate(value.type, {template: "string" + stringIndex});
                stringIndex++;
                break;
        }
        outputBlock = outputBlock.getOutputBlock();
    }
    this.refreshMenuCode();
    return;
    var topBlocks = content.childNodes;
    var createBlock;
    for (var i in topBlocks) {
        if (topBlocks[i].getAttribute('type') == 'function_create') {
            createBlock = topBlocks[i];
            break;
        }
    }
    var script = new Entry.Script();
    script.init(createBlock);
    var field = script;
    if (field.values)
        field = script.values.FIELD;
    var mutationXml = '<mutation hashid="' + id + '">';
    var fieldXml = '';
    var description = '';
    var stringCount = 0;
    var booleanCount = 0;
    func.stringHash = {};
    func.booleanHash = {};
    while(true) {
        switch (field.type) {
            case 'function_field_label':
                mutationXml += '<field type="label" content="' +
                    field.fields.NAME.replace("<", "&lt;").replace(">", "&gt;") + '"></field>';
                description += field.fields.NAME;
                break;
            case 'function_field_boolean':
                var hash = field.values.PARAM.hashId;
                mutationXml += '<field type="boolean" hashid="' + hash +
                               '"></field>';
                fieldXml += '<value name="' + hash + '"><block type="function_param_boolean">' +
                    '<mutation hashid="'+ hash +'"></mutation></block></value>';
                func.booleanHash[hash] = booleanCount;
                booleanCount++;
                description += '논리값' + booleanCount;
                break;
            case 'function_field_string':
                var hash = field.values.PARAM.hashId;
                mutationXml += '<field type="string" hashid="' + hash +
                               '"></field>';
                fieldXml += '<value name="' + hash + '"><block type="function_param_string">' +
                    '<mutation hashid="'+ hash +'"></mutation></block></value>';
                func.stringHash[hash] = stringCount;
                stringCount++;
                description += '문자값' + stringCount;
                break;
        }
        if (field.values && field.values.NEXT)
            field = field.values.NEXT;
        else break;
        description += ' ';
    }
    mutationXml += '</mutation>';
    var blockText = '<xml><block type="function_general">' +
        mutationXml + fieldXml + '</block></xml>';
    if (!description) description = "함수";
    return {
        block: Blockly.Xml.textToDom(blockText).childNodes[0],
        description: description
    };
};
