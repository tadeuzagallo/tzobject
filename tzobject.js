this.TZObject = function(){
	var callbacks = {};
	var attributes = {};
	
function TZObject(){
	var _this = this;
	
	var __init__ = function __init__(){
		if(!_this.el || !(window.$ || window.jQuery)){
			return false;
		}
		
		_this.originalElement = _this.el;
		_this.el = $(_this.el);
		
		if(_this.initialize){
			_this.initialize();
		}
		
		setEvents();
		
		_this.trigger('initialized');
	};
	
	var setEvents = function setEvents(){
		var x; var temp;
		if(!_this.events || _this.empty(_this.events)){
			return;
		}
		
		for(x in _this.events){
			if(x){
				temp = x.split(' ');
				if(temp.length > 1){
					var ev = temp.shift();
					var el = temp.join(' ');
					
					_this.jbind((el === 'true' ? false : el), ev, _this.events[x]);
				}else{
					_this.bind(x, _this.events[x]);
				}
			}
		}
	};
	
	__init__();
}

TZObject.VERSION = '0.1';

TZObject.prototype.getNew = function getNew(el){
	return  TZObject.extend({
		'el': el
	});
};

TZObject.prototype.exists = function exists(){
	this.update();
	return this.el.length != 0;
};

TZObject.prototype.trigger = function trigger(ev){
	var functions; var x;
	
	if(ev.indexOf(':') != -1){
		var short = ev.split(':').shift();
		
		var f1 = callbacks[short] || [];
		var f2 = callbacks[ev] || [];
		
		functions = f1.concat(f2);
	}else{
		functions = callbacks[ev] || [];
	}
	
	for(x in functions){
		functions[x]();
	}
	
	if(ev != 'all' && callbacks['all']){
		for(x in callbacks['all']){
			callbacks['all'][x](ev);
		}
	}
	
	return this;
};

TZObject.prototype.bind = function bind(ev, fn){
	if(!callbacks[ev]){
		callbacks[ev] = [];
	}
	
	fn = this.fn(fn);
	
	callbacks[ev].push(fn);
	return this;
};

TZObject.prototype.fn = function (fn){
	var type = typeof(fn);
	if(type == 'string'){
		return this[fn];
	}else if(type == 'function'){
		return fn;
	}
};

TZObject.prototype.unbind = function unbind(ev, fn){
	if(fn){
		fn = this.fn(fn);
		var x;
		if(typeof(callbacks[ev]) == 'object'){
			for(x in callbacks[ev]){
				if(callbacks[ev][x] === fn){
					delete callbacks[ev][x];
				}
			}
		}
	}else{
		delete callbacks[ev];
	}
	
	return this;
};


TZObject.prototype.jbind = function jbind(el, ev, fn){
	if(fn){
		fn = this.fn(fn);
		
		if(el){
			this.find(el).bind(ev, fn);
		}else{
			this.el.bind(ev, fn);
		}
	}
	
	return this;
};

TZObject.prototype.empty = function empty(obj){
	var type = typeof(obj);
	var x;
	
	switch(type){
		case 'object':
			for(x in obj){
				if(Object.prototype.hasOwnProperty.call(obj, x)){
					return false;
				}
			}
			break;
		case 'string':
			return obj.length === 0;
		case 'function':
			return false;
		case 'number':
			return obj === 0
	}
	
	return true;
}

TZObject.prototype.set = function set(data, sillent){
	var x;
	
	for(x in data){
		var alreadyExist = attributes[x] ? true : false;
		
		attributes[x] = data[x];
		
		if(!sillent){
			if(alreadyExist){
				this.trigger('changed:' + x);
			}else{
				this.trigger('added:' + x);
			}
		}
	}
	
	return this;
};

TZObject.prototype.get = function get(key){
	if(key){
		return attributes[key];
	}else{
		return attributes;
	}
};

TZObject.prototype.unset = function unset(key, sillent){
	if(attributes[key]){
		delete attributes[key];
		
		if(!sillent){
			this.trigger('removed:' + key);
		}
	}
	
	return this;
};

TZObject.prototype.setAll = function setAll(data, sillent){
	attributes = data;
	
	if(!sillent){
		this.trigger('refreshed');
	}
};

TZObject.prototype.toJSON = function toJSON(){
	return attributes;
};

TZObject.prototype.callbacks = function callbacks(){
	var txt = ''; var x; var y;
	
	for(x in callbacks){
		text += 'Event: ' + x + '\n';
		
		for(y in callbacks[x]){
			txt += y + ': ' + callbacks[x][y] + '\n';
		}
	}
	
	return txt;
};

TZObject.prototype.load = function load(url, cb, data){
	if(!cb){
		cb = {};
	}
	
	if(this.hasErros){
		this.restoreLoadDefaults();
	}
	
	jQuery.ajax({
		'url': url
		,'type': (data ? 'post': 'get')
		,'dataType': 'json'
		,'data': data || ''
		,'complete': cb.complete || this.complete
		,'success': cb.success || this.success
		,'error': cb.error || this.error
	});
	
	return this;
};

TZObject.prototype.complete = function complete(jqxhr, status){
	this.loadStatus = status;
};

TZObject.prototype.success = function  success(data, status, jqxhr){
	this.loadData = data;
	this.loadStatus = status;
	this.hasErrors = false;
};

TZObject.prototype.error = function error(jqxhr, status, error){
	this.loadStatus = status;
	this.loadError = error;
	this.hasErrors = true;
	
	this.renderError(status, jqxhr.status);
};

TZObject.prototype.renderError = function renderError(status, code){
	this.css({
		'background': 'rgb(255,245,230)'
		,'border': '1px solid red'
	});
	
	var text = "<h1 style='color: red;' align='center'>Ajax error!</h1>";
	text += "<div style='text-align: center;'><strong>textStatus</strong>" + ": "+ errorCode + "</div>";
	this.content(text);
};

TZObject.prototype.restoreLoadDefaults = function restoreLoadDefaults(){
	this.css({});
};

TZObject.prototype.render = function render(){
	if(this.template){
		this.content(this.template(this.toJSON()));
	}
	
	return this;
};

TZObject.prototype.validate = function validate(attr){
	var valid = true;
	var value;
	var rule;
	var x;
	
	if(this.rules){
		if(attr){
			var type = typeof(attr);
			
			if(type == 'string'){
				value = this.get(attr);
				rule = this.rules[attr];
				
				if(value === undefined || rule === undefined){
					return false;
				}else{
					return rule.test(value);
				}
			}else if(type == 'object'){
				for(x in attr){
					rule = this.rules[attr[x]];
					value = this.get(attr[x]);
					
					if(value === undefined || rule === undefined){
						return false;
					}else{
						if(!rule.test(value)){
							valid = false;
						}
					}
				}	
			}else{
				return false;
			}
		}else{
			for(x in this.rules){
				rule = this.rules[x];
				value = this.get(x);
				
				if(rule === undefined || value === undefined){
					return false;
				}else{
					if(!rule.test(value)){
						valid = false;
					}
				}
			}
		}
	}
	
	return valid;
};

TZObject.prototype.update = function update(){
	this.el = $(this.originalElement);
};


/*
 * Shortcut to jQuery methods
 */
TZObject.prototype.css = function css(){
	this.el.css.apply(this.el, arguments);
	return this;
};

TZObject.prototype.show = function show(){
	this.el.show();
	return this;
};

TZObject.prototype.hide = function hide(){
	this.el.hide();
	return this;
};

TZObject.prototype.remove = function remove(){
	this.el.remove();
	return this;
};

TZObject.prototype.clear = function clear(){
	this.el.empty();
	return this;
};

TZObject.prototype.find = TZObject.prototype.$ = function find(el){
	return this.el.find(el);
};

TZObject.prototype.content = function content(content){
	this.el.html(content);
	return this;
};

TZObject.prototype.height = function height(){
	return this.el.height.apply(this, arguments);
};

TZObject.prototype.width = function width(){
	return this.el.width.apply(this, arguments);
};

TZObject.prototype.append = function append(){
	this.el.append.apply(this, arguments);
	return this;
};

return TZObject;
};

var extend = function extend(data){
	var child = TZ.inherits(this, data);
	child.extend = extend;
	return child;
};

TZObject.extend = extend; 


this.TZ = {
	"each": function(obj, func){
		for(var x in obj)
			func(obj[x], x, obj);
		return obj;
	}
	,"extend": function(to, from){
		for(var x in from){
			to[x] = from[x];
		}
	}
	,"wrap": function(obj, fn){
		return function(){
			fn.apply(obj, arguments);
		}
	}
	,"bind": function(obj){
		fns = Array.prototype.slice.call(arguments, 1);
		
		TZ.each(fns, function(f){
			obj[f] = TZ.wrap(obj, obj[f]);
		});
		
		return obj;
	}
	,"inherits": function(parent, data){
		var child;
		parent = parent();
	
		if(data && data.hasOwnProperty("constructor")){
			child = data.constructor;
		}else{
			child = function(){ return parent.apply(this, arguments); };
		}
		
		function F(){}
		
		F.prototype = parent.prototype;
		child.prototype = new F();
		
		
		child.prototype.constructor = child;
		
		if(data) TZ.extend(child.prototype, data);
		
		return new child;
	}
	,"template": function(templateID){
		var templateText = $('#'+templateID).html();
		return TZTemplate.init(templateText);
	}
};

/*
 * Another object to support a little template system
 */
this.TZTemplate = {
	"toPrint": /<%=[\s]*([^%]*)[\s]*%>/g
	,"toEval": /<%[\s]*([^%]*)[\s]*%>/g
	,"init": function(templateText, templateObject){
		
		var template = this.formatTemplate(templateText);
		
		var templateFunction = new Function('templateObject', template);
		
		return templateObject ? templateFunction(templateObject) : templateFunction;
	}
	,"formatTemplate": function(templateText){
		
		return 'var template = [];'
		+ 'with(templateObject || {}){'
			+ 'template.push(\''
			+ templateText
			.replace(/'/g, "\\'")
			
			.replace(this.toPrint, function(match, code, all){
				return '\',' + code.trim().replace(/\\'/g, '\'') + ',\'';
			})
			
			.replace(this.toEval, function(match, code, all){
				return '\');'
				+ code.trim()
				.replace(/\\'/g, '\'')
				+ 'template.push(\'';
			})
			.replace(/\n/g, '\\n')
		+ '\');};'
		+ 'return template.join(\'\')';
	}
}