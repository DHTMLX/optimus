class LocalSession{
	get(key, def){
		var value = window.localStorage.getItem(key);
		return value === null ? def : value; 
	}
	set(key, value){
		window.localStorage.setItem(key, value);
	}
}

export class DHXApp{
	constructor(config){
		addEventSystem(this);

		//event bus facade
		this.session = new LocalSession();
		this.events = {
			attachEvent: this.attachEvent,
			callEvent: this.callEvent
		};

		this.services = {};
		this.config = config || {};

		//create wrapper for root node
		let root = toNode(this.config.container || document.body);
		if (!root.tagName)
			this.root = root;
		else
			this.root = {
				root,
				attachLayout:function(config){
					return new dhtmlXLayoutObject(this.root, config);
				}
			};
	}
	show(view){
		var t = new view(this, this.root);
		t.render();

		return t;
	}

	addService(name, obj){
		this.services[name] = obj;
	}
	getService(name){
		return this.services[name];
	}

	imagepath(comp){
		return this.config.images+"/dhx"+comp+"_"+this.config.skin+"/";
	}
	destructor(){
		this.services = this.events = this.root = this.config = null;
	}
}


export class DHXView{
	constructor(app, root){
		this.app = app;
		this.root = root;
	}
	show(view, cell){
		var t = new view(this.app, cell);
		t.render();

		return t;
	}

	attachEvent(name, handler){
		this.app.attachEvent(name, handler, { bind: this, tag: this });
	}

	callEvent(name, params){
		this.app.callEvent(name, (params || []));
	}

	render(){
		dhtmlx.message("Render method is not implemented for the view");
	}

	destructor(){
		this.app.detachEvent({ tag: this });
		this.model = this.ui = this.app = this.root = null;
	}
}

// Common helpers

var seed = 0;
export function uid(){
	return ++seed;
}

export function toNode(n){
	if (typeof n === "string")
		return document.getElementById(n) || document.querySelector(n);
	return n;
}

export function event(node, name, handler){
	node.addEventListener(name, handler);
}

export function delay(code){
	window.setTimeout(code, 1);
}

export function addEventSystem(obj){
	obj = obj || {};
	let evs = {};

	obj.detachEvent = function(config){
		for (var key in evs){
			var line = evs[key];
			for (var i = line.length - 1; i >= 0; i--)
				if (line[i].config.tag === config.tag)
					line.splice(i,1);
		}
	};

	obj.attachEvent = function(name, code, config){
		name = name.toLowerCase();
		config = config || {};

		let stack = evs[name] || [];

		stack.push({ code, config });
		evs[name] = stack;
	};

	obj.callEvent = function(name, args){
		window.console.log(name, args);
		name = name.toLowerCase();
		let stack = evs[name];
		let result = true;

		if (stack)
			for (let i=0; i<stack.length; i++){
				let line = stack[i];
				let bind = line.config.bind || this;
				result = line.code.apply(bind, args);
			}
	
		return result;
	};
}


export function copy(source){
	var target = Array.isArray(source)?[]:{};

	for (var method in source){
		var from = source[method];
		if(from && typeof from == "object"){
			if (!(from instanceof Date)){
				target[method] = copy(from);
			} else
				target[method] = new Date(from);
		} else {
			target[method] = from;
		}
	}
	return target;	
};