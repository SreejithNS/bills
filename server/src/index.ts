import * as express from "express";
import { json, RequestHandler, urlencoded } from "express";
import * as dotenv from "dotenv";
import * as morgan from "morgan";
import Controller from "./controllers/index";
import Server from "./Server";
import Authentication from "./controllers/Authentication";
import Authorization from "./controllers/Authorization";

dotenv.config({ path: "./.env.local" });

const app = express();
const port = parseInt(process.env.PORT ?? "", 10) || 3000;

const server = new Server(app, port);

const controllers: Array<Controller> = [
  Authentication,
  Authorization
];

const globalMiddleware: Array<RequestHandler> = [
  urlencoded({ extended: false }),
  json(),
  morgan("dev")
  // ...
];

Promise.resolve()
  .then(async () => {
    await server.initDatabase()
    server.loadGlobalMiddleware(globalMiddleware);
    server.loadControllers(controllers);
    server.run();
  }, (err) => { 
    console.error(err);
    process.exit(1);
  });

export {};
