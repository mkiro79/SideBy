import { Router } from "express";
import authRoutes from "../modules/auth/presentation/auth.routes.js";
import devAuthRoutes from "../modules/auth/presentation/dev-auth.routes.js";
import datasetsRoutes from "../modules/datasets/presentation/datasets.routes.js";

const v1Router = Router();

// Auth routes
v1Router.use("/auth", authRoutes);

// Dev Auth routes (solo en desarrollo)
v1Router.use("/auth", devAuthRoutes);

// Datasets routes
v1Router.use("/datasets", datasetsRoutes);

export default v1Router;
