import {
  IApp,
  ICell,
  IEventHandler,
  IEventSource,
  IEventSourceHolder,
  IParams,
  IRouteConfig,
  IView,
  IViewEventSource,
  IViewFactory
} from "./types";

// tslint:disable-next-line:variable-name
export const TopView: string = "TopView";

export class View implements IView, IViewEventSource {
  protected app: IApp;
  protected cell: ICell;
  protected params: IParams;
  protected dhxRoot: ICell;
  protected htmlRoot: HTMLElement;

  private _routes: IRouteConfig[];
  private _views: Map<ICell | HTMLElement, IView>;
  private _events: IEventHandler[];

  constructor(app: IApp, params: IParams) {
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

  show(cell: string | ICell, view: IViewFactory | string, params: IParams) : IView {
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
    const old = this._views.get(target);
    if (old && cell !== TopView) {
      old.destroy();
    }

    let now: IView = null;
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

  destroy() {
    this._events.forEach(a => {
      a.obj.detach(a.id);
    });
  }
}
