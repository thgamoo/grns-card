import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import './index.css'
import App from './App.tsx'

const rootRoute = createRootRoute({
  component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
})

const cardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cards',
})

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
})

const tutorialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tutorial',
})

const decksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/decks',
})

const graphRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/graph',
})

const fieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field',
})

const worldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/world',
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  cardsRoute,
  rulesRoute,
  tutorialRoute,
  decksRoute,
  graphRoute,
  fieldRoute,
  worldRoute,
])

const routerBasepath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const router = createRouter({ routeTree, basepath: routerBasepath })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
