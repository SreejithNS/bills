import * as express from "express";
import { json, RequestHandler, urlencoded } from "express";
import * as dotenv from "dotenv";
import Controller from "./controllers/index";
import Server from "./Server";

dotenv.config({ path: "./.env.local" });
const app = express();
const port = parseInt(process.env.PORT ?? "", 10) || 3000;

const server = new Server(app, port);

const controllers: Array<Controller> = [];

const globalMiddleware: Array<RequestHandler> = [
  urlencoded({ extended: false }),
  json(),
  // ...
];

Promise.resolve()
  .then(() => server.initDatabase())
  .then(async () => {
    server.loadGlobalMiddleware(globalMiddleware);
    server.loadControllers(controllers);
    server.run();
  });

export {};
