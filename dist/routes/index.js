"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../app/modules/user/user.route");
const storageSystem_route_1 = require("../app/modules/StorageSytem/storageSystem.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/user',
        route: user_route_1.UserRouter,
    },
    {
        path: '/storage',
        route: storageSystem_route_1.StorageSystemRouter,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
