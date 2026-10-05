import { Express, Request, Response } from "express";

export function swaggerDocs(app: Express, port: number) {
  app.get("/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send({ openapi: "3.0.0", info: { title: "Chatbot API", version: "1.0.0" } });
  });
}

export default swaggerDocs;
