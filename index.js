class LocalSession {
    get(key, def) {
        let value = window.localStorage.getItem(key);
        let data;
        try {
            data = value ? JSON.parse(value) : def;
        }
        catch (e) {
            data = def;
        }
        return data;
    }
    set(key, value) {
        value = JSON.stringify(value);
        window.localStorage.setItem(key, value);
    }
}
export class HTMLCell {
    constructor(root) {
        this.root = root;
    }
    attachLayout(config) {
        config.parent = this.root;
        return new dhtmlXLayoutObject(config);
    }
}
export class DHXView {
    constructor(app, root) {
        this.app = app;
        this.root = root;
        this._tempServices = {};
        this._slots = {};
        this._usedSlots = {};
    }
    _cleanSlot(name) {
        if (this._usedSlots[name]) {
            this._usedSlots[name].destroy();
            this._usedSlots[name] = null;
        }
    }
    show(view, cell) {
        cell = cell || this.root;
        let name = uid();
        let uicell;
        if (typeof cell === "string") {
            name = cell;
            uicell = this._slots[name];
        }
        else {
            uicell = cell;
        }
        this._cleanSlot(name);
        let sub;
        if (typeof view === "function") {
            sub = new view(this.app, uicell);
        }
        else {
            sub = view;
            sub.app = this.app;
            sub.root = uicell;
        }
        let t = this._usedSlots[name] = sub;
        t.render();
        return t;
    }
    addSlot(name, obj) {
        this._slots[name] = obj;
        this._cleanSlot(name);
    }
    refresh() {
        this.clean();
        this.render();
    }
    attachEvent(name, handler) {
        this.app.attachEvent(name, handler, { bind: this, tag: this });
    }
    callEvent(name, params) {
        this.app.callEvent(name, (params || []));
    }
    // @deprecated, remove in 1.0
    addService(name, obj) {
        return this.setService(name, obj);
    }
    setService(name, obj) {
        this.app.setService(name, obj);
        this._tempServices[name] = obj;
    }
    getService(name) {
        return this.app.getService(name);
    }
    render() {
        window.dhtmlx.message("Render method is not implemented for the view");
    }
    clean() {
        this.app.detachEvent({ tag: this });
        for (let key in this._tempServices) {
            if (this.getService(key) === this._tempServices[key]) {
                this.app.setService(key, null);
            }
        }
        // destroy UI
        if (this.ui) {
            if (this.ui.destructor) {
                this.ui.destructor();
            }
            else if (this.ui.unload) {
                this.ui.unload();
            }
            else if (this.ui.close) {
                this.ui.close();
            }
        }
        // destroy child views
        for (let key in this._usedSlots) {
            this._usedSlots[key].destroy();
        }
        this._usedSlots = [];
    }
    imagepath(comp) {
        return this.app.imagepath(comp);
    }
    destroy() {
        this.clean();
        this._slots = this.ui = this.app = this.root = null;
    }
}
// new App(config)
// or
// this.show(App, cell)
// or
// this.show( new App(config), cell)
export class DHXApp extends DHXView {
    constructor(app, root) {
        // create wrapper for root node
        root = root || document.body;
        if (root.attachLayout) {
            super(null, root);
        }
        else {
            if (typeof root === "string") {
                root = toNode(root);
            }
            super(null, new HTMLCell(root));
        }
        this.app = this;
        if (app instanceof DHXApp) {
            this.top = app;
        }
        this.event = new EventSystem(this);
        // event bus facade
        this.session = new LocalSession();
        this.facade = {
            session: this.session,
            attachEvent: this.attachEvent.bind(this),
            callEvent: this.callEvent.bind(this),
            getService: this.getService.bind(this),
            setService: this.setService.bind(this)
        };
        this.services = {};
        this.config = (app instanceof DHXApp ? app.config : app) || {};
    }
    attachEvent(name, code, config) {
        return this.event.on(name, code, config);
    }
    detachEvent(config) {
        return this.event.detach(config);
    }
    callEvent(name, args) {
        return this.event.fire(name, args);
    }
    show(view, cell) {
        let t = super.show(view, cell);
        this.callEvent("onAppRender", []);
        return t;
    }
    setService(name, obj) {
        this.services[name] = obj;
    }
    getService(name) {
        return this.services[name];
    }
    imagepath(comp) {
        let images = this.config.images || "//cdn.dhtmlx.com/edge/imgs/";
        let skin = this.config.skin || "material";
        return images + "/dhx" + comp + "_" + skin + "/";
    }
    destroy() {
        super.destroy();
        this.services = this.config = null;
    }
}
// Common helpers
let seed = 0;
export function uid() {
    return (++seed) + "";
}
export function toNode(n) {
    if (typeof n === "string") {
        return (document.getElementById(n) || document.querySelector(n));
    }
    return n;
}
export function event(node, name, handler) {
    node.addEventListener(name, handler);
}
export function delay(code) {
    window.setTimeout(code, 1);
}
export class EventSystem {
    constructor(master) {
        this.master = master || this;
        this.evs = {};
    }
    detach(config) {
        for (let key in this.evs) {
            let line = this.evs[key];
            for (let i = line.length - 1; i >= 0; i--) {
                if (line[i].config.tag === config.tag) {
                    line.splice(i, 1);
                }
            }
        }
    }
    on(name, code, config) {
        name = name.toLowerCase();
        config = config || {};
        let stack = this.evs[name] || [];
        stack.push({ code, config });
        this.evs[name] = stack;
    }
    fire(name, args) {
        name = name.toLowerCase();
        let stack = this.evs[name];
        let result = true;
        if (stack) {
            for (let i = 0; i < stack.length; i++) {
                let line = stack[i];
                let bind = line.config.bind || this.master;
                result = line.code.apply(bind, args);
            }
        }
        return result;
    }
}
export function copy(source) {
    let target = Array.isArray(source) ? [] : {};
    for (let method in source) {
        let from = source[method];
        if (from && typeof from === "object") {
            if (!(from instanceof Date)) {
                target[method] = copy(from);
            }
            else {
                target[method] = new Date(from);
            }
        }
        else {
            target[method] = from;
        }
    }
    return target;
}
export class DHXLocale {
    constructor(polyglot, langs, lang) {
        this._polyglot = polyglot;
        this._langs = langs;
        this._locale = lang || "en";
        this.setLang(this._locale);
    }
    setLang(locale, phrases) {
        phrases = phrases || this._langs[locale];
        let poly = new this._polyglot({ locale, phrases });
        this._locale = locale;
        this._t = poly.t.bind(poly);
    }
    getLang() {
        return this._locale;
    }
    helper() {
        return this._t;
    }
}
