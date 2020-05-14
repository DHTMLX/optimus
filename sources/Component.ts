import {
  IApp,
  IComponent,
  IComponentEventSource,
  IComponentFactory,
  IEventHandler,
  IEventSource,
  IEventSourceHolder,
  IParams,
  StatePathEvaluator
} from "./types";

export class Component<StateT>
  implements IComponent<StateT>, IComponentEventSource {
  protected app: IApp<StateT>;
  protected _events: IEventHandler[];
  protected _components: IComponent<StateT>[];

  protected _stateHandlers: Map<
    StatePathEvaluator<StateT>,
    ((value: unknown) => void)[]
  >;

  protected params: IParams<StateT>;

  constructor(app: IApp<StateT>, params?: IParams<StateT>) {
    this.app = app;
    this.params = params || {};
    this._events = [];
    this._components = [];
    this._stateHandlers = new Map();
  }
  init() {
    return;
  }
  use(component: IComponentFactory<StateT>, params?: IParams<StateT>) {
    params = params || {};
    if (!params.store && this.params.store) {
      params.store = this.params.store;
    }
    const cmp = new component(this.app, params);
    this._components.push(cmp);
    cmp.init();
  }
  observe(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown, state?: StateT) => void
  ) {
    if (!this._stateHandlers.has(evaluator)) {
      this._stateHandlers.set(evaluator, []);
    }
    this._stateHandlers.get(evaluator).push(handler);
    if (!this.params.store || !this.params.store.observe) {
      throw new Error(`Store for view ${this.constructor.name} is not set`);
    }
    this.params.store.observe(evaluator, handler);
  }
  on(
    obj: IEventSource | IEventSourceHolder | string,
    name: string | CallableFunction,
    handler?: CallableFunction
  ): any {
    if (arguments.length === 2) {
      handler = (name as any) as CallableFunction;
      name = (obj as any) as string;
      obj = this.app;
    }

    const holder = obj as IEventSourceHolder;
    const events: IEventSource = holder.events
      ? holder.events
      : (obj as IEventSource);

    if (typeof name === "string") {
      events.on(name, handler);
      const state = { id: name, obj: events };

      this._events.push(state);
      return state;
    }
  }

  fire(name, data) {
    return this.app.events.fire(name, data);
  }
  destroy() {
    this._events.forEach(a => {
      a.obj.detach(a.id);
    });

    this._components.forEach(c => c.destroy());
    if (this.params) {
      [...this._stateHandlers.entries()].forEach(([prop, handlers]) =>
        handlers.forEach(h => this.params.store.unobserve(prop, h))
      );
    }
  }
}
