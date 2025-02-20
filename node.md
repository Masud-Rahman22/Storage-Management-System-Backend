# Installation

To install eslint 8-3

```
https://blog.logrocket.com/linting-typescript-eslint-prettier/
```

1. Install express
2. install dotenv cors mongoose
3. Install ts and set up its file `npm i -D ts-node-dev`

   ```
   tsc --init
   ```
4. Create `dist` and `src` folder for ts and connect it in `rootdir` and `outdir`
5. `pacakge.json` update

   ```ts
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1",
       "build" : "tsc"
     },
   ```
6. make the config file to access the `env` file from dotnev docimport dotenv from'dotenv';
7. Set up the server `server.ts`

   ```ts
   import mongoose from "mongoose";
   import config from "./app/config";
   import app from "./app";

   async function main() {
       try{
           await mongoose.connect(config.database_URL as string);

           app.listen(config.PORT, () => {
             console.log(`Example app listening on port ${config.PORT}`);
           });
       }catch(error){
           console.log(error);

       }

   }

   ```
8. Configure the `eslint` [Eslint doc](https://blog.logrocket.com/linting-typescript-eslint-prettier/ "Link")
   from ts eslint

> eslint  ?

- Check by eslint

```bash
  npx eslint .
```

- fix

```bash
npx eslint . --fix
```

9. Prettier

```bash
npm install --save-dev prettier
```

update in settings.json

install

```bash
npm install --save-dev eslint-config-prettier
```

10. install ts node dev

```bash
npm i ts-node-dev
```

11. validator for ts mongoose

```bash
npm i validator
```

for ts isntall as dev dependecy

```
npm i -D @types/validator
```
