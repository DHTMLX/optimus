import { IApp, ICell, IDHXLibrary, IEventSource, IParams } from "./types";
import { View } from "./View";

declare var dhx: IDHXLibrary;

export class App extends View implements IApp {
	public events: IEventSource;
	public router: any;

	constructor(app: IApp, state: IParams) {
		super(app, state);

		this.app = this;
		this.events = new dhx.EventSystem();
	}
	render(target: string|ICell) {
		if (!target){
			target = "body";
		}
	
		if (typeof target === "string"){
			this.htmlRoot = document.querySelector(target);
		} else {
			this.dhxRoot = target
		}

		this.init();
	}
	routes(){
		return [];
	}
	setRouter(router){
		this.router = router;

		const routes = this.routes();
		routes.forEach(r => {
			let cb;
			if (r.redirect){
				cb = () => router.navigate(r.redirect);
			} else {
				cb = url => {
					const params = {};

					if (r.params){
						Object.assign(params, r.params);
					}
					if (url && typeof url === "object"){
						Object.assign(params, url);
					}
					
					this.show("", r.view, params);
				};
			}

			if (r.path === ":not-found:"){
				router.notFound(cb)
			} else {
				router.on(r.path, cb);
			}
		})

		router.resolve();
	}
}
