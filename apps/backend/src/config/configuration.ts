// The allowed browser origin, resolved in one place. WebSocket gateways evaluate
// their @WebSocketGateway() options at decoration time — before Nest's DI is
// available — so the gateway can't use ConfigService; it shares this helper
// instead of reading process.env a second, divergent way.
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'ecommerce_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  upload: {
    dest: process.env.UPLOAD_DEST ?? './uploads',
  },
});
