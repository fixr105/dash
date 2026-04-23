import type { ComponentType } from "react";

import { Placeholder } from "../pages/Placeholder";

export type AppRoute = {
  path: string;
  component: ComponentType;
};

export const appRoutes: AppRoute[] = [
  {
    path: "/",
    component: Placeholder
  }
];
