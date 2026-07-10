export type AppEnv = "development" | "test" | "production";

function readNodeEnv(): AppEnv{
    const value = process.env["NODE_ENV"];

    if (value === "development" || value === "test" || value === "production" ){
        return value;
    }

    throw new Error(
        'Invalid NODE_ENV. Expected "development", "test", or "production".',
    );
}

export const appEnv = readNodeEnv();
export const isProduction = appEnv === "production";
export const isDevelopment = appEnv === "development";
