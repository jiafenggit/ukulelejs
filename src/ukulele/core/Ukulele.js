/**
 * Create a new Ukulele
 * @class
 */

function Ukulele() {
	"use strict";
	var controllersDefinition = {};
	var componentsDefinition = {};
	var copyControllers = {};
	var self = this;
	/**
	 * @access a callback function when view was refreshed.
	 */
	this.refreshHandler = null;

	/**
	 * @access a callback function when view was initialized.
	 */
	this.initHandler = null;
	/**
	 * @access When using uku-repeat, parentUku to reference the Parent controller model's uku
	 */
	this.parentUku = null;

	/**
	 * @description getter of componentsDefinition
	 * @return {object} componentsDefinition
	 */
	this.getComponentsDefinition = function(){
        return componentsDefinition;
    };
	/**
	 * @description setter of componentsDefinition
	 * @param {object} value of componentsDefinition
	 */
    this.setComponentsDefinition = function(value){
        componentsDefinition = value;
    };

	this.getControllersDefinition = function(){
		return controllersDefinition;
	};
	/**
	 * @description bootstrap Ukulelejs
	 */
	 this.init = function () {
		 asyncCaller.exec(function(){
			 manageApplication();
		 });
 	};
	/**
	 * @description Register a controller model which you want to bind with view
	 * @param {string} instanceName controller's alias
	 * @param {object}  controllerInst controller's instance
	 */
	this.registerController = function (instanceName, controllerInst) {
		var controllerModel = new ControllerModel(instanceName, controllerInst);
		controllerInst._alias = instanceName;
		controllersDefinition[instanceName] = controllerModel;
	};

	/**
	 * @description deal with partial html element you want to manage by UkuleleJS
	 * @param {object} $element jquery html object e.g. $("#myButton")
	 * @param {boolean} watch whether refresh automatically or not
	 */
	this.dealWithElement = function (element) {
		analyizeElement(element);
	};
	/**
	 * @description deal with the uku-include componnent which need be to lazy loaded.
	 * @param {object} element dom
	 */
	this.loadIncludeElement = function (element) {
		if (element.getAttribute("load") === "false") {
			element.setAttribute("load", true);
			analyizeElement(element.parentNode);
		}
	};
	/**
	 * @description get the controller model's instance by alias.
	 * @param {object} expression  controller model's alias.
	 * @returns {object} controller model's instance
	 */
	this.getControllerModelByName = function (expression) {
		return getBoundControllerModelByName(expression);
	};
	/**
	 * @description refresh the view manually, e.g. you can call refresh in sync request's callback.
	 */
	this.refresh = function (alias,excludeElement) {
		runDirtyChecking(alias,excludeElement);
	};
	/**
	 * @description get value by expression
	 * @param {string} expression
	 */
	this.getFinalValueByExpression = function (expression) {
		var controller = this.getControllerModelByName(expression).controllerInstance;
		return UkuleleUtil.getFinalValue(this, controller, expression);
	};
	/**
	 * @description register component is ukujs
	 * @param {string} tag component's tag in html e.g 'user-list' (<user-list></user-list>)
	 * @param {string} templateUrl component's url
	 */
	var ajax = new Ajax();
	var asyncCaller = new AsyncCaller();
	this.registerComponent = function (tag,templateUrl){
		asyncCaller.pushAll(dealWithComponentConfig,[tag,templateUrl]);
		function dealWithComponentConfig(tag,template){
			ajax.get(templateUrl,function(result){
				var componentConfig = UkuleleUtil.getComponentConfiguration(result);
					analyizeComponent(tag,componentConfig,function(){
						dealWithComponentConfig.resolve(asyncCaller);
				});
			});
		}
	};

	function analyizeComponent(tag,config,callback){
		var deps = config.dependentScripts;
		if(deps && deps.length > 0){
			var ac = new AsyncCaller();
			for (var i = 0; i < deps.length; i++) {
				var dep = deps[i];
				ac.pushAll(loadDependentScript,[ac,dep]);
			}
			ac.exec(function(){
				buildeComponentModel(tag,config.template,config.componentControllerScript);
				callback();
			});
		}else{
			buildeComponentModel(tag,config.template,config.componentControllerScript);
			callback();
		}
	}
	function buildeComponentModel(tag,template,script){
		var debugComment = "//@ sourceURL="+tag+".js";
		script += debugComment;
		try{
			var controllerClazz = eval(script);
			var newComp = new ComponentModel(tag, template,controllerClazz);
			componentsDefinition[tag] = newComp;
		}catch(e){
			console.error(e);
		}
	}

	var dependentScriptsCache = {};
	function loadDependentScript(ac,src){
		if(!dependentScriptsCache[src]){
			var head = document.getElementsByTagName('HEAD')[0];
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.charset = 'utf-8';
			script.async = true;
			script.src = src;
			script.onload = function(e){
				dependentScriptsCache[e.target.src] = true;
				loadDependentScript.resolve(ac);
			};
			head.appendChild(script);
		}else{
			loadDependentScript.resolve();
		}
	}

	//脏检测
	function runDirtyChecking(ctrlAliasName, excludeElement) {
		if (ctrlAliasName) {
			if (typeof (ctrlAliasName) === "string") {
				watchController(ctrlAliasName);
			} else if (ObjectUtil.isArray(ctrlAliasName)) {
				for (var i = 0; i < ctrlAliasName.length; i++) {
					watchController(ctrlAliasName[i]);
				}
			}
		} else {
			for (var alias in controllersDefinition) {
				watchController(alias);
			}
		}

		function watchController(alias) {
			var controllerModel = controllersDefinition[alias];
			if (!controllerModel) {
				if (self.parentUku) {
					self.parentUku.refresh(alias);
				}
				return;
			}
			var controller = controllerModel.controllerInstance;
			var previousCtrlModel = copyControllers[alias];
			for (var i = 0; i < controllerModel.boundItems.length; i++) {
				var boundItem = controllerModel.boundItems[i];
				var attrName = boundItem.attributeName;
				if (previousCtrlModel) {
					if (boundItem.ukuTag === "selected") {
						attrName = attrName.split("|")[0];
					}
					var finalValue = UkuleleUtil.getFinalValue(self, controller, attrName);
					var previousFinalValue = UkuleleUtil.getFinalValue(self, previousCtrlModel, attrName);
					if (!ObjectUtil.compare(previousFinalValue, finalValue)) {
						attrName = boundItem.attributeName;
						var changedBoundItems = controllerModel.getBoundItemsByName(attrName);
						for (var j = 0; j < changedBoundItems.length; j++) {
							var changedBoundItem = changedBoundItems[j];
							if(changedBoundItem.element !== excludeElement || changedBoundItem.ukuTag !== "value"){
								changedBoundItem.render(controller);
							}
						}
						if (self.refreshHandler) {
							self.refreshHandler.call(self);
						}
					}
				}
			}
			self.copyControllerInstance(controller, alias);
		}
	}

	this.copyAllController = function() {
		for (var alias in controllersDefinition) {
			var controllerModel = controllersDefinition[alias];
			var controller = controllerModel.controllerInstance;
			this.copyControllerInstance(controller, alias);
		}
	};

	this.copyControllerInstance = function(controller, alias) {
		var previousCtrlModel = ObjectUtil.deepClone(controller);
		delete copyControllers[alias];
		copyControllers[alias] = previousCtrlModel;
	};
	//根据attrName 确定对应的ControllerModel ，比如  parent.mgr.xxx.yyy来找到以mgr为别名的ControllerModel
	function getBoundControllerModelByName(attrName) {
		var instanceName = UkuleleUtil.getBoundModelInstantName(attrName);
		var controllerModel = controllersDefinition[instanceName];
		if (!controllerModel) {
			var tempArr = attrName.split(".");
			var isParentScope = tempArr[0];
			if (isParentScope === "parent" && self.parentUku) {
				tempArr.shift();
				attrName = tempArr.join(".");
				return self.parentUku.getControllerModelByName(attrName);
			}
		}
		return controllerModel;
	}

	this.getBoundAttributeValue = function(attr, additionalArgu) {
		var controllerModel = getBoundControllerModelByName(attr);
		var controllerInst = controllerModel.controllerInstance;
		var result = UkuleleUtil.getFinalValue(self, controllerInst, attr, additionalArgu);
		return result;
	};

	function manageApplication() {
		var apps = Selector.querySelectorAll(document,"[uku-application]");//document.querySelectorAll("[uku-application]");
		if (apps.length === 1) {
			analyizeElement(apps[0]);
		} else {
			throw new Error("Only one 'uku-application' can be declared in a whole html.");
		}
	}
	var anylyzer;
	function analyizeElement(element){
		if(!anylyzer){
			anylyzer = new Analyzer(self);
		}
		anylyzer.analyizeElement(element);
	}
}