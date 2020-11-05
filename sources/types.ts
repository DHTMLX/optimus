export interface IDHXLibrary {
  EventSystem: IEventSystem;
}

type IEventSystem = new () => IEventSource;

export interface IParams<StateT> {
  [id: string]: any;
  store?: IStore<StateT>;
}

export interface ICell {
  attach(obj: any): any;
  attachHTML(obj: string): void;
  mount?(obj: HTMLElement): void;
}

export interface IView<StateT> extends IComponent<StateT> {
  init(): IDHXView | string | void;
  ready(): void;
  show(
    target: string | ICell,
    view: IViewFactory<StateT>,
    params?: IParams<StateT>
  ): void;
}

export interface IComponent<StateT> extends IComponentEventSource {
  init(): void;
  use(component: IComponentFactory<StateT>, params?: IParams<StateT>): void;
  observe(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown, state?: StateT) => void
  ): void;
  destroy(): void;
  _destroy(): void;
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
  fire(name: string, args: any[]): void;
}

export interface IEventSourceHolder {
  events: IEventSource;
}

export interface IComponentEventSource {
  on(obj: IEventSource, name: string, handler: CallableFunction): any;
  fire(name: string, args: any[]): void;
}

export interface IApp<StateT> extends IView<StateT> {
  store: IStore<StateT>;
  events: IEventSource;
  init(): void;
}

export type StatePathEvaluator<T> = (state: T) => unknown;

export interface IDHXView {
  destructor(): void;
  mount?(container: HTMLElement, vnode?: any): void;
}
