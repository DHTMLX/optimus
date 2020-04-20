export interface IDHXLibrary {
  Layout: IDHXLayout;
  EventSystem: IEventSystem;
}

type IEventSystem = new () => IEventSource;
type IDHXLayout = new (target: HTMLElement, cfg: any) => ICell;

export interface IParams<StateT> {
  [id: string]: any;
  store?: IStore<StateT>;
}

export interface ICell extends IEventSource {
  attach(obj: any): any;
  attachHTML(obj: string): void;
  mount(obj: HTMLElement): void;
  cell(name: string): ICell;
}

export type ITargetLocator = (root: ICell) => ICell;

export interface IView<StateT> extends IComponentEventSource {
  init(): ICell | string;
  ready(): void;
  show(
    target: string | ICell,
    view: IViewFactory<StateT>,
    params?: IParams<StateT>
  );
  destroy();
}

export interface IComponent<StateT> extends IComponentEventSource {
  init();
  use(component: IComponentFactory<StateT>, params?: IParams<StateT>);
  observe(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown, state?: StateT) => void
  );
  destroy();
}

export interface IStore<StateT> {
  observe(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown, state?: StateT) => void
  ): void;
  unobserve(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown, state?: StateT) => void
  ): void;
}

export type IViewFactory<StateT> = new (
  app: IApp<StateT>,
  params?: IParams<StateT>
) => IView<StateT>;

export type IComponentFactory<StateT> = new (
  app: IApp<StateT>,
  params?: IParams<StateT>
) => IComponent<StateT>;

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

export interface IComponentEventSource {
  on(obj: IEventSource, name: string, handler: CallableFunction): any;
  fire(name: string, args: any[]);
}

export interface IApp<StateT> extends IView<StateT> {
  store: IStore<StateT>;
  events: IEventSource;
}

export type StatePathEvaluator<T> = (state: T) => unknown;
