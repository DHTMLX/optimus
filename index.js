class LocalSession{
	get(key, def){
		var value = window.localStorage.getItem(key);
		var data;
		try {
			data = value ? JSON.parse(value) : def;
		} catch(e){
			data = def;
		}
		return data;
	}
	set(key, value){
		value = JSON.stringify(value);
		window.localStorage.setItem(key, value);
	}
}

export class HTMLCell{
	constructor(root){
		this.root = root;
	}
	attachLayout(config){
		return new dhtmlXLayoutObject(this.root, config);
	}
}

export class DHXView{
	constructor(app, root){
		this.app = app || this;
		this.root = root;

		this._tempServices = {};
		this._slots = {};
		this._usedSlots = {};
	}
	_cleanSlot(name){
		if (this._usedSlots[name]){
			this._usedSlots[name].destroy();
			this._usedSlots[name] = null;
		}
	}
	show(view, cell){
		cell = cell || this.root;

		let name = uid();
		if (typeof cell === "string"){
			name = cell;
			cell = this._slots[cell];
		}
		this._cleanSlot(name);
		
		
		var sub;
		if (typeof view === "function"){
			sub = new view(this.app, cell);
		} else {
			sub = view;
			sub.app = this;
			sub.root = cell;
		}

		var t = this._usedSlots[name] = sub;
		t.render();

		return t;
	}

	addSlot(name, obj){
		this._slots[name] = obj;
		this._cleanSlot(name);
	}

	refresh(){
		this.clean();
		this.render();
	}

	attachEvent(name, handler){
		this.app.attachEvent(name, handler, { bind: this, tag: this });
	}

	callEvent(name, params){
		this.app.callEvent(name, (params || []));
	}

	addService(name, obj){
		this.app.addService(name, obj);
		this._tempServices[name]=obj;
	}

	getService(){
		return this.app.getService(name);
	}

	render(){
		dhtmlx.message("Render method is not implemented for the view");
	}

	clean(){
		this.app.detachEvent({ tag: this });

		for (let key in this._tempServices){
			if (this.getService(key) === this._tempServices[key])
				this.app.setService(key, null);
		}

		//destroy UI
		if (this.ui){
			if (this.ui.destructor)
				this.ui.destructor();
			else if (this.ui.unload)
				this.ui.unload();
			else if (this.ui.close){
				this.ui.close();			
			}
		}

		//destroy child views
		for (let key in this._usedSlots)
			this._usedSlots[key].destroy();
		this._usedSlots = [];
	}

	imagepath(comp){
		return this.app.imagepath(comp);
	}

	destroy(){
		this.clean();
		this._slots = this.model = this.ui = this.app = this.root = null;
	}
}

// new App(config)
// or
// this.show(App, cell)
// or
// this.show( new App(config), cell)

export class DHXApp extends DHXView{
	constructor(app, root){
		//create wrapper for root node
		root = root || document.body;
		if (!root.attachLayout){
			root = toNode(root || document.body);
			root = new HTMLCell(root);
		}

		super(null, root);
		if (app instanceof DHXApp)
			this.top = app;

		addEventSystem(this);

		//event bus facade
		this.session = new LocalSession();
		this.facade = {
			session: 		this.session,
			attachEvent: 	this.attachEvent.bind(this),
			callEvent: 		this.callEvent.bind(this),
			getService: 	this.getService.bind(this),
			setService: 	this.addService.bind(this)
		};

		this.services = {};
		this.config = ( app instanceof DHXApp ? app.config : app ) || {};
	}
	show(view, cell, name){
		let t = super.show(view, cell, name);
		this.callEvent("onAppRender",[]);
		return t;
	}

	addService(name, obj){
		this.services[name] = obj;
	}
	getService(name){
		return this.services[name];
	}

	imagepath(comp){
		var images = this.config.images || "//cdn.dhtmlx.com/edge/imgs/";
		var skin = this.config.skin || "material";
		return images+"/dhx"+comp+"_"+skin+"/";
	}

	destroy(){
		super.destroy();
		this.services = this.events = this.config = null;
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

export class DHXLocale{
	constructor(Polyglot, langs, lang){
		this._polyglot = Polyglot;
		this._langs = langs;
		this._locale = lang || "en";
		this.setLang(this._locale);
	}
	setLang(locale, phrases){
		phrases = phrases || this._langs[locale];
		var poly = new this._polyglot({ locale, phrases });
		this._locale = locale;
		this._t = poly.t.bind(poly);
	}
	getLang(){
		return  this._locale
	}
	helper(){
		return this._t;
	}
}