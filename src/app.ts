import express, { Request, Response } from 'express';
import cors from 'cors';
import router from './routes';
import cookieParser from 'cookie-parser';
import path from 'path';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFound } from './app/middlewares/notFound';
import { auth } from './app/middlewares/auth';
const app = express();

//parser
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173/'],
    credentials: true,
  }),
);
app.use(cookieParser());

/*---------------- MIDDLEWARES -----------------------*/

// app.use(logger)

/*------------ APPLICATION ROUTES -------------------*/
app.use('/', router);
app.use(
  '/uploads',
  auth(),
  express.static(path.join(process.cwd(), 'uploads')),
);
/*------------ Test route -------------------*/
const test = async (req: Request, res: Response) => {
  res.send('server is RUNNIG !!! 😎😎😎');
};
app.get('/', test);

/**------------ GLOBAL ERROR HANDLER -------------------*/
app.use(globalErrorHandler);

/** ------------ NOT FOUND URL ------------------- */
app.use(notFound as never);
export default app;
