type ICallable = (...args: any[]) => any;
type dhmlXComponent = any;
type IViewCell = dhtmlXCell | HTMLCell | dhtmlXLayoutObject;

/* tslint:disable:interface-over-type-literal */
type hash = { [key: string]: any };
/* tslint:enable:interface-over-type-literal */

interface IDHXView {
	new (app: DHXApp, root: IViewCell): DHXView;
}

interface IFacade extends IEventBus{
	session: LocalSession
}

interface IEventBus{
	attachEvent: (name: string, handler: ICallable) => void,
	callEvent: (name: string, params: any[]) => void,
	getService: (name: string) => any,
	setService: (name: string, obj: any) => void
}



class LocalSession{
	get(key: string, def?: any): any{
		let value = window.localStorage.getItem(key);
		let data;
		try {
			data = value ? JSON.parse(value) : def;
		} catch(e){
			data = def;
		}
		return data;
	}
	set(key: string, value: any): void{
		value = JSON.stringify(value);
		window.localStorage.setItem(key, value);
	}
}

export class HTMLCell{
	private root: HTMLElement;
	constructor(root: HTMLElement){
		this.root = root;
	}
	attachLayout(config: any): dhtmlXLayoutObject{
		config.parent = this.root;
		return new dhtmlXLayoutObject(config);
	}
}



export class DHXView{
	public ui: dhmlXComponent;
	public root: dhtmlXCell;
	public app: DHXApp;

	private _tempServices:hash;
	private _slots: hash;
	private _usedSlots: hash;

	constructor(app:DHXApp, root:IViewCell){
		this.app = app;
		this.root = root as dhtmlXCell;

		this._tempServices = {};
		this._slots = {};
		this._usedSlots = {};
	}
	_cleanSlot(name:string):void{
		if (this._usedSlots[name]){
			this._usedSlots[name].destroy();
			this._usedSlots[name] = null;
		}
	}
	show(view:IDHXView | DHXView, cell:IViewCell | string){
		cell = cell || this.root;

		let name:string = uid();
		let uicell:IViewCell;
		if (typeof cell === "string"){
			name = cell;
			uicell = this._slots[name];
		} else {
			uicell = cell;
		}
		this._cleanSlot(name);

		let sub:DHXView;
		if (typeof view === "function"){
			sub = new view(this.app, uicell);
		} else {
			sub = view;
			sub.app = this.app;
			sub.root = uicell as dhtmlXCell;
		}

		let t = this._usedSlots[name] = sub;
		t.render();

		return t;
	}

	addSlot(name:string, obj:IViewCell){
		this._slots[name] = obj;
		this._cleanSlot(name);
	}

	refresh():void{
		this.clean();
		this.render();
	}

	attachEvent(name:string, handler:ICallable){
		this.app.attachEvent(name, handler, { bind: this, tag: this });
	}

	callEvent(name:string, params:any[]){
		this.app.callEvent(name, (params || []));
	}

	// @deprecated, remove in 1.0
	addService(name:string, obj:any):void{
		return this.setService(name, obj)
	}

	setService(name:string, obj:any):void{
		this.app.setService(name, obj);
		this._tempServices[name]=obj;
	}

	getService(name:string):any{
		return this.app.getService(name);
	}

	render():void{
		(window as any).dhtmlx.message("Render method is not implemented for the view");
	}

	clean():void{
		this.app.detachEvent({ tag: this });

		for (let key in this._tempServices){
			if (this.getService(key) === this._tempServices[key]){
				this.app.setService(key, null);
			}
		}

		// destroy UI
		if (this.ui){
			if (this.ui.destructor){
				this.ui.destructor();
			} else if (this.ui.unload){
				this.ui.unload();
			} else if (this.ui.close){
				this.ui.close();
			}
		}

		// destroy child views
		for (let key in this._usedSlots){
			this._usedSlots[key].destroy();
		}
		this._usedSlots = [];
	}

	imagepath(comp:string):string{
		return this.app.imagepath(comp);
	}

	destroy():void{
		this.clean();
		this._slots = this.ui = this.app = this.root = null;
	}
}

// new App(config)
// or
// this.show(App, cell)
// or
// this.show( new App(config), cell)

export class DHXApp extends DHXView{
	public session: LocalSession;
	public facade: IFacade;
	public config: any;
	public event: EventSystem;

	private top:DHXApp;
	private services:hash;

	constructor(app: DHXApp, root?: IViewCell | HTMLElement | string){
		// create wrapper for root node
		root = root || document.body;
		if ((root as dhtmlXCell).attachLayout){
			super(null, root as dhtmlXCell);
		} else {
			if (typeof root === "string"){
				root = toNode(root);
			}
			super(null, new HTMLCell(root as HTMLElement));
		}

		this.app = this;
		if (app instanceof DHXApp){
			this.top = app;
		}

		this.event = new EventSystem(this);

		// event bus facade
		this.session = new LocalSession();
		this.facade = {
			session: 		this.session,
			attachEvent: 	this.attachEvent.bind(this),
			callEvent: 		this.callEvent.bind(this),
			getService: 	this.getService.bind(this),
			setService: 	this.setService.bind(this)
		};

		this.services = {};
		this.config = ( app instanceof DHXApp ? app.config : app ) || {};
	}

	attachEvent(name:string, code:ICallable, config?:any){
		return this.event.on(name, code, config);
	}
	detachEvent(config:any){
		return this.event.detach(config);
	}
	callEvent(name:string, args:any[]){
		return this.event.fire(name, args);
	}
	show(view: IDHXView | DHXView, cell?:IViewCell|string): dhmlXComponent{
		let t = super.show(view, cell);
		this.callEvent("onAppRender",[]);
		return t;
	}

	setService(name:string, obj:any):void{
		this.services[name] = obj;
	}
	getService(name:string):any{
		return this.services[name];
	}

	imagepath(comp:string):string{
		let images = this.config.images || "//cdn.dhtmlx.com/edge/imgs/";
		let skin = this.config.skin || "material";
		return images+"/dhx"+comp+"_"+skin+"/";
	}

	destroy():void{
		super.destroy();
		this.services = this.config = null;
	}
}


// Common helpers

let seed = 0;
export function uid():string{
	return (++seed)+"";
}

export function toNode(n:string | HTMLElement):HTMLElement{
	if (typeof n === "string"){
		return (document.getElementById(n) || document.querySelector(n)) as HTMLElement;
	}
	return n;
}

export function event(node:HTMLElement, name:string, handler:ICallable):void{
	node.addEventListener(name, handler);
}

export function delay(code:ICallable):void{
	window.setTimeout(code, 1);
}

export class EventSystem{
	private evs:hash;
	private master: any;

	constructor(master:any){
		this.master = master || this;
		this.evs = {};
	}

	detach(config:any){
		for (let key in this.evs){
			let line = this.evs[key];
			for (let i = line.length - 1; i >= 0; i--){
				if (line[i].config.tag === config.tag){
					line.splice(i,1);
				}
			}
		}
	}

	on(name:string, code:ICallable, config:any){
		name = name.toLowerCase();
		config = config || {};

		let stack = this.evs[name] || [];

		stack.push({ code, config });
		this.evs[name] = stack;
	}

	fire(name:string, args:any[]){
		name = name.toLowerCase();
		let stack = this.evs[name];
		let result = true;

		if (stack){
			for (let i=0; i<stack.length; i++){
				let line = stack[i];
				let bind = line.config.bind || this.master;
				result = line.code.apply(bind, args);
			}
		}

		return result;
	}
}

export function copy(source:any):any{
	let target:(hash|any[]) = Array.isArray(source)?[]:{};

	for (let method in source){
		let from = source[method];
		if(from && typeof from === "object"){
			if (!(from instanceof Date)){
				target[method] = copy(from);
			} else{
				target[method] = new Date(from);
			}
		} else {
			target[method] = from;
		}
	}
	return target;
}

export class DHXLocale{
	private _polyglot:any;
	private _langs:any;
	private _locale:string;
	private _t:ICallable;

	constructor(polyglot:any, langs?:any, lang?:string){
		this._polyglot = polyglot;
		this._langs = langs;
		this._locale = lang || "en";
		this.setLang(this._locale);
	}
	setLang(locale:string, phrases?:any){
		phrases = phrases || this._langs[locale];
		let poly = new this._polyglot({ locale, phrases });
		this._locale = locale;
		this._t = poly.t.bind(poly);
	}
	getLang():string{
		return  this._locale
	}
	helper():ICallable{
		return this._t;
	}
}