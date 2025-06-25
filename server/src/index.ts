
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createFoodItemInputSchema, dateInputSchema } from './schema';
import { createFoodItem } from './handlers/create_food_item';
import { getFoodItems } from './handlers/get_food_items';
import { getDailySummary } from './handlers/get_daily_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new food item log entry
  createFoodItem: publicProcedure
    .input(createFoodItemInputSchema)
    .mutation(({ input }) => createFoodItem(input)),
  
  // Get all food items, optionally filtered by date
  getFoodItems: publicProcedure
    .input(dateInputSchema.optional())
    .query(({ input }) => getFoodItems(input)),
  
  // Get daily calorie summary
  getDailySummary: publicProcedure
    .input(dateInputSchema.optional())
    .query(({ input }) => getDailySummary(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
