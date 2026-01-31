import { Router } from "express";
import authRoutes from "../modules/auth/presentation/auth.routes.js";

const v1Router = Router();

// Auth routes
v1Router.use("/auth", authRoutes);

export default v1Router;
