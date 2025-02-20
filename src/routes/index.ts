
import { Router } from 'express';
import { UserRouter} from '../app/modules/user/user.route';
import { StorageSystemRouter } from '../app/modules/StorageSytem/storageSystem.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: UserRouter,
  },
  {
    path: '/storage',
    route: StorageSystemRouter,
  },
 
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;