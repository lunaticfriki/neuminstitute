import type { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./containers/Home.container').then((m) => m.HomeContainer),
  },
];
