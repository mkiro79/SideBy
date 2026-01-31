import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { connectDB } from "../config/database.js";
import { UserModel } from "../modules/users/infrastructure/user.schema.js";
import logger from "../utils/logger.js";

interface SeedConfig {
  email: string;
  password: string;
  googleId?: string;
  name: string;
}

const getSeedConfig = (): SeedConfig => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const googleId = process.env.SEED_ADMIN_GOOGLE_ID;
  const name = process.env.SEED_ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error(
      "Missing required seed environment variables: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME",
    );
  }

  return {
    email,
    password,
    googleId: googleId && googleId !== "0" ? googleId : undefined,
    name,
  };
};

const seedAdminUser = async (): Promise<void> => {
  try {
    logger.info("Starting database seeding...");

    // Connect to database
    await connectDB();

    // Get seed configuration
    const config = getSeedConfig();

    // Check if admin user already exists
    const existingAdmin = await UserModel.findOne({ email: config.email });

    if (existingAdmin) {
      logger.info(
        { email: config.email },
        "Admin user already exists. Updating...",
      );

      // Hash new password
      const passwordHash = await bcrypt.hash(config.password, 10);

      // Update existing admin
      await UserModel.updateOne(
        { email: config.email },
        {
          $set: {
            passwordHash,
            googleId: config.googleId,
            name: config.name,
            role: "admin",
            updatedAt: new Date(),
          },
        },
      );

      logger.info({ email: config.email }, "Admin user updated successfully");
      logger.warn("⚠️  Password updated. Use this password to login.");
    } else {
      logger.info({ email: config.email }, "Creating new admin user...");

      // Hash password
      const passwordHash = await bcrypt.hash(config.password, 10);

      // Create new admin user
      const adminUser = new UserModel({
        _id: randomUUID(),
        email: config.email,
        passwordHash,
        googleId: config.googleId,
        name: config.name,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await adminUser.save();

      logger.info({ email: config.email }, "Admin user created successfully");
      logger.warn(
        "⚠️  Admin created with provided password. Change it after first login!",
      );
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Error during database seeding");
    throw error;
  } finally {
    // Close database connection
    await import("mongoose").then((mongoose) => mongoose.default.disconnect());
    logger.info("Database connection closed");
  }
};

// Execute seed script
try {
  await seedAdminUser();
  logger.info("Seed script finished");
  process.exit(0);
} catch (error) {
  logger.error({ err: error }, "Seed script failed");
  process.exit(1);
}
