export interface IDHXLibrary {
	Layout: IDHXLayout;
	EventSystem: IEventSystem;
}

type IEventSystem = new () => IEventSource;
type IDHXLayout = new (target: HTMLElement, cfg: any) => ICell;

export interface IParams {
	[id: string]: any;
}

export interface ICell extends IEventSource {
	attach(obj: any): any;
	cell(name: string): ICell;
}

export type ITargetLocator = (root: ICell) => ICell;

export interface IRouteConfig {
	path: string;
	view: IViewFactory;
	redirect: string;
	params?: IParams;
}

export interface IView extends IViewEventSource {
	init(): ICell;
	ready(): void;
	show(target:string|ICell, view:IViewFactory, state?:IParams)
	destroy();
}

export type IViewFactory = new (app: IApp, state: IParams) => IView;

export interface IEventHandler {
	id: string;
	obj: IEventSource;
}

export interface IEventSource {
	on(name: string, handler: CallableFunction): string;
	detach(id: string): void;
	fire(name: string, args: any[]);
}

export interface IEventSourceHolder {
	events: IEventSource;
}

export interface IViewEventSource {
	on(obj: IEventSource, name: string, handler: CallableFunction): any;
	fire(name: string, args: any[]);
}

export interface IApp extends IView {
	events: IEventSource;
	routes(): IRouteConfig[];
}
