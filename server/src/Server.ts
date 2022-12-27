import { Application, RequestHandler, Router } from "express";
import { Server as ServerType } from "http";
import mongoose from "mongoose";
import Controller from "./controllers";
import logger from "./utils/Logger";

export default class Server {
  private app: Application;

  private apiBasePath = /^\/api(?=\/|$)/;

  private readonly port: number;

  public static isDev = process.env.NODE_ENV !== "production";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  loadMiddleware(globalMiddleware: RequestHandler[]) {}

  constructor(app: Application, port: number) {
    console.log("Hello world");
    this.app = app;
    this.port = port;
  }

  public run(): ServerType {
    return this.app.listen(this.port, () => {
      logger(`Up and running on port ${this.port}`);
    });
  }

  public loadGlobalMiddleware(middleware: Array<RequestHandler>): void {
    // global stuff like cors, body-parser, etc
    middleware.forEach((mw) => {
      this.app.use(mw);
    });
  }

  public loadControllers(controllers: Array<Controller>): void {
    const router = Router();
    controllers.forEach((controller) => {
      // use setRoutes method that maps routes and returns Router object
      router.use(controller.path, controller.setRoutes());
    });

    this.app.use(this.apiBasePath, router); // Matches only /api
  }

  public async initDatabase(): Promise<typeof mongoose> {
    // connect to mongoose connection and return promise
    const user = encodeURIComponent(process.env.MONGO_USER ?? "");
    const passwd = encodeURIComponent(process.env.MONGO_PWD ?? "");
    const cluster = process.env.MONGO_CLUSTER;
    const dbName = process.env.MONGO_DB_NAME;
    const MONGO_URL = `mongodb+srv://${user}:${passwd}@${cluster}/${dbName}?retryWrites=true&w=majority`;

    return mongoose.connect(MONGO_URL ?? "", {});
  }
}
