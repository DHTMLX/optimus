import {
  IApp,
  ICell,
  IDHXLibrary,
  IEventSource,
  IParams,
  StatePathEvaluator
} from "./types";
import { View } from "./View";

declare var dhx: IDHXLibrary;

export class App<
  StateT extends {
    observe(
      evaluator: StatePathEvaluator<StateT>,
      handler: (value: unknown) => void
    );
    unobserve(
      evaluator: StatePathEvaluator<StateT>,
      handler: (value: unknown) => void
    );
  }
> extends View<StateT> implements IApp<StateT> {
  public events: IEventSource;
  public router: any;
  private _state: StateT;

  constructor(app: IApp<StateT>, state: IParams<StateT>) {
    super(app, state);

    this.app = this;
    this.events = new dhx.EventSystem();
  }
  render(target: string | ICell) {
    if (!target) {
      target = "body";
    }

    if (typeof target === "string") {
      this.htmlRoot = document.querySelector(target);
    } else {
      this.dhxRoot = target;
    }

    this.init();
  }
}
