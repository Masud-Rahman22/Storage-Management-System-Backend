/* eslint-disable no-console */
import mongoose from 'mongoose';
import config from './app/config';
import app from './app';
import { Server } from 'http';

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_URL as string);
    server = app.listen(config.PORT, () => {
      console.log(`App listening on port ${config.PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

main();


//for asynchronus
process.on('unhandledRejection', () => {
  console.log('UnhandledRejection is detected, shutting down the server');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

//for synchronus
process.on('uncaughtException', () => {
  console.log('uncaughtException is detected, shutting down the server');
  process.exit(1);
});
