import {
	IApp,
	ICell,
	IEventHandler,
	IEventSource,
	IEventSourceHolder,
	IParams,
	IRouteConfig,
	ITargetLocator,
	IView,
	IViewEventSource,
	IViewFactory,
} from "./types";

export class View implements IView, IViewEventSource {
	protected app: IApp;
	protected cell: ICell;
	protected params: IParams;
	protected root: ICell;

	private _routes: IRouteConfig[];
	private _views: Map<ICell, IView>;
	private _events: IEventHandler[];

	constructor(app: IApp, params: IParams) {
		this.app = app;
		this.params = params || {};

		this._views = new Map();
		this._events = [];
	}

	on(obj: IEventSource | IEventSourceHolder, name: string, handler: CallableFunction) : any {
		if (arguments.length === 2){
			handler = (name as any) as CallableFunction;;
			name = (obj as any) as string;
			obj = this.app
		}

		const holder = obj as IEventSourceHolder;
		const events : IEventSource =holder.events ? holder.events : obj as IEventSource;	

		const state = { id: events.on(name, handler), obj:events };
		this._events.push(state);
		return state;
	}

	fire(name, data){
		return this.app.fire(name, data);
	}

	_toCell(name: string | ITargetLocator): ICell {
		if (!name) {
			name = "content";
		}

		if (typeof name === "string") {
			return this.root.cell(name);
		} else {
			return name(this.root);
		}
	}

	show(cell:string|ICell, view:IViewFactory, params:IParams) {
		const target = (typeof cell === "string") ? this._toCell(cell) : cell;
		params = params || {};
		const old = this._views.get(target);
		if (old) {
			old.destroy();
		}

		const now = new view(this.app, params);
		this._views.set(target, now);

		const subroot = now.init();

		(now as any).root = subroot;
		
		if (target){
			target.attach(subroot);
		}

		now.ready();
	}

	init():ICell {
		return null;
	}
	ready():void { 
		/* do nothing */
	}
	destroy() {
		this._events.forEach(a => {
			a.obj.detach(a.id);
		});
	}
}
