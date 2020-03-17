import { Component } from "./Component";
import {
  IApp,
  ICell,
  IComponentEventSource,
  IParams,
  IView,
  IViewFactory
} from "./types";

// tslint:disable-next-line:variable-name
export const TopView: string = "TopView";

export class View<StateT> extends Component<StateT>
  implements IView<StateT>, IComponentEventSource {
  protected cell: ICell;

  protected dhxRoot: ICell;
  protected htmlRoot: HTMLElement;
  private _views: Map<ICell | HTMLElement, IView<StateT>>;

  constructor(app: IApp<StateT>, params?: IParams<StateT>) {
    super(app, params);
    this._views = new Map();
  }

  show(
    cell: string | ICell,
    view: IViewFactory<StateT> | string,
    params?: IParams<StateT>
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

  destroy() {
    super.destroy();
    this._views.forEach(view => view.destroy());
  }
}
