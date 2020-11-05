import { Component } from "./Component";
import {
  IApp,
  ICell,
  IComponentEventSource,
  IDHXView,
  IParams,
  IView,
  IViewFactory
} from "./types";

// tslint:disable-next-line:variable-name
export const TopView: string = "TopView";

export class View<StateT> extends Component<StateT>
  implements IView<StateT>, IComponentEventSource {
  private _views: Map<ICell | HTMLElement | number, IView<StateT>>;
  private _rootView: IDHXView;

  constructor(app: IApp<StateT>, params?: IParams<StateT>) {
    super(app, params);
    this._views = new Map();
  }

  show(
    cell: string | HTMLElement | ICell,
    view: IViewFactory<StateT> | string,
    params?: IParams<StateT>
  ): IView<StateT> {
    let viewKey: HTMLElement | number | ICell;
    let htmlRoot: HTMLElement = null;
    let dhxRoot: ICell = null;

    // correct show target if necessary
    if (cell) {
      if (typeof cell === "string") {
        if (cell === TopView) {
          // generate unique value
          // as we can have multiple TopViews at the same time
          viewKey = new Date().valueOf();
        } else {
          htmlRoot = document.querySelector(cell);
        }
      } else if ((cell as HTMLElement).tagName) {
        htmlRoot = cell as HTMLElement;
      } else {
        dhxRoot = cell as ICell;
      }
    }

    viewKey = viewKey || htmlRoot || dhxRoot;

    params = params || {};
    if (!params.store && this.params.store) {
      params.store = this.params.store;
    }

    // get and destroy old subview
    const old = this._views.get(viewKey);
    if (old) {
      old._destroy();
      this._views.delete(viewKey);
    }

    // special handling for string content
    if (typeof view === "string") {
      this._attach(htmlRoot, dhxRoot, view);
      return null;
    }

    // create new view
    let now = new view(this.app, params);

    // attach to parent
    this._attach(htmlRoot, dhxRoot, now.init() || null);

    // store view in hash of kids
    this._views.set(viewKey, now);

    now.ready();
    return now;
  }

  init(): IDHXView | string | void {}

  ready(): void {
    /* do nothing */
  }

  destroy(): void {
    /* do nothing */
  }

  _destroy() {
    super._destroy();

    // destroy sub-views
    this._views.forEach(view => view._destroy());

    // destroy main widget, if any
    if (this._rootView) {
      this._rootView.destructor();
    }

    this._views = this._rootView = null;
  }

  private _attach(
    htmlRoot: HTMLElement,
    dhxRoot: ICell,
    content: string | IDHXView
  ): void {
    if (typeof content === "string") {
      // the HTML string content
      if (htmlRoot) {
        htmlRoot.innerHTML = content;
      } else if (dhxRoot) {
        dhxRoot.attachHTML(content);
      }
    } else if (content) {
      // dhx widget was provided
      if (htmlRoot) {
        content.mount(htmlRoot);
      } else if (dhxRoot) {
        dhxRoot.attach(content);
      }

      this._rootView = content;
    }
  }
}
