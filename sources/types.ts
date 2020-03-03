export interface IDHXLibrary {
  Layout: IDHXLayout;
  EventSystem: IEventSystem;
}

type IEventSystem = new () => IEventSource;
type IDHXLayout = new (target: HTMLElement, cfg: any) => ICell;

export interface IParams<StateT> {
  [id: string]: any;
  state?: StateT;
}

export interface ICell extends IEventSource {
  attach(obj: any): any;
  attachHTML(obj: string): void;
  mount(obj: HTMLElement): void;
  cell(name: string): ICell;
}

export type ITargetLocator = (root: ICell) => ICell;

export interface IView<StateT> extends IViewEventSource {
  init(): ICell | string;
  ready(): void;
  show(
    target: string | ICell,
    view: IViewFactory<StateT>,
    state?: IParams<StateT>
  );
  destroy();
}

export type IViewFactory<StateT> = new (
  app: IApp<StateT>,
  state: IParams<StateT>
) => IView<StateT>;

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

export interface IApp<StateT> extends IView<StateT> {
  events: IEventSource;
}

export type StatePathEvaluator<T> = (state: T) => unknown;
