const env = Deno.env.get('ENVIRONMENT') ?? Deno.env.get('NODE_ENV') ?? 'development';
const isProduction = env === 'production';

export const logger = {
  info: (message: string, data?: unknown) => {
    if (isProduction) {
      console.log(message);
    } else {
      console.log(message, data);
    }
  },
  error: (message: string, data?: unknown) => {
    if (isProduction) {
      console.error(message);
    } else {
      console.error(message, data);
    }
  },
  debug: (message: string, data?: unknown) => {
    if (!isProduction) {
      console.log(message, data);
    }
  }
};
