import {
  IApp,
  ICell,
  IDHXLibrary,
  IDHXView,
  IEventSource,
  IParams,
  IStore,
  IView,
  IViewFactory
} from "./types";
import { View } from "./View";

declare var dhx: IDHXLibrary;

export class App<StateT> extends View<StateT> implements IApp<StateT> {
  public events: IEventSource;
  public store: IStore<StateT>;

  private _root: string | HTMLElement | ICell;

  constructor(app: IApp<StateT>, state: IParams<StateT>) {
    super(app, state);
    this.app = this;
    this.events = new dhx.EventSystem();
  }
  render(target: string | HTMLElement | ICell) {
    this._root = target || document.body;
    this.init();
  }
  show(
    _cell: string | ICell,
    view: IViewFactory<StateT> | string,
    params?: IParams<StateT>
  ): IView<StateT> {
    return super.show(this._root, view, params);
  }
}
