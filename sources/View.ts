import {
  IApp,
  ICell,
  IEventHandler,
  IEventSource,
  IEventSourceHolder,
  IParams,
  IView,
  IViewEventSource,
  IViewFactory,
  StatePathEvaluator
} from "./types";

// tslint:disable-next-line:variable-name
export const TopView: string = "TopView";

export class View<StateT> implements IView<StateT>, IViewEventSource {
  protected app: IApp<StateT>;
  protected cell: ICell;
  protected params: IParams<StateT>;
  protected dhxRoot: ICell;
  protected htmlRoot: HTMLElement;

  private _stateHandlers: Map<
    StatePathEvaluator<StateT>,
    ((value: unknown) => void)[]
  >;
  private _views: Map<ICell | HTMLElement, IView<StateT>>;
  private _events: IEventHandler[];

  constructor(app: IApp<StateT>, params: IParams<StateT>) {
    this.app = app;
    this.params = params || {};

    this._views = new Map();
    this._events = [];
  }

  on(
    obj: IEventSource | IEventSourceHolder,
    name: string,
    handler: CallableFunction
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

    const state = { id: events.on(name, handler), obj: events };
    this._events.push(state);
    return state;
  }

  fire(name, data) {
    return this.app.events.fire(name, data);
  }

  show(
    cell: string | ICell,
    view: IViewFactory<StateT> | string,
    params: IParams<StateT>
  ): IView<StateT> {
    let htmlTarget: HTMLElement = null;
    let dhxTarget: ICell = null;

    if (cell) {
      if (typeof cell === "string") {
        if (cell === TopView) {
          htmlTarget = window as any;
        } else {
          htmlTarget = (this.htmlRoot || document).querySelector(cell);
        }
      } else {
        dhxTarget = typeof cell === "string" ? null : cell;
      }
    } else {
      if (this.htmlRoot) {
        htmlTarget = this.htmlRoot;
      }
      if (this.dhxRoot) {
        dhxTarget = this.dhxRoot;
      }
    }

    const target = htmlTarget || dhxTarget;
    params = params || {};
    if (!params.store && this.params.store) {
      params.store = this.params.store;
    }
    const old = this._views.get(target);
    if (old && cell !== TopView) {
      old.destroy();
      this._views.delete(target);
    }

    let now: IView<StateT> = null;
    let subroot: string | ICell = null;
    if (typeof view !== "string") {
      now = new view(this.app, params);
      this._views.set(target, now);
      subroot = now.init();
    } else {
      subroot = view;
    }

    if (dhxTarget) {
      (now as any).dhxRoot = subroot;
      if (typeof subroot === "string") {
        dhxTarget.attachHTML(subroot);
      } else {
        dhxTarget.attach(subroot);
      }
    } else {
      if (now) {
        (now as any).htmlRoot = htmlTarget;
      }
      if (typeof subroot === "string") {
        htmlTarget.innerHTML = subroot;
      } else {
        htmlTarget.innerHTML = "";
        // windows do not have one
        if (subroot.mount) {
          subroot.mount(htmlTarget);
        }
      }
    }

    if (now) {
      now.ready();
    }

    return now;
  }

  init(): ICell {
    return null;
  }

  ready(): void {
    /* do nothing */
  }

  observe(
    evaluator: StatePathEvaluator<StateT>,
    handler: (value: unknown) => void
  ) {
    if (!this._stateHandlers.has(evaluator)) {
      this._stateHandlers.set(evaluator, []);
    }
    this._stateHandlers.get(evaluator).push(handler);
    if (!this.params.state || !this.params.state.observe) {
      throw new Error(`Store for view ${this.constructor.name} is not set`);
    }
    this.params.store.observe(evaluator, handler);
  }

  destroy() {
    this._events.forEach(a => {
      a.obj.detach(a.id);
    });

    this._views.forEach(view => view.destroy());

    [...this._stateHandlers.entries()].forEach(([prop, handlers]) =>
      handlers.forEach(h => this.params.store.unobserve(prop, h))
    );
  }
}
