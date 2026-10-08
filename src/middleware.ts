import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from '@convex-dev/auth/nextjs/server';

const isPublicPage = createRouteMatcher(['/auth']);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (!isPublicPage(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, '/auth');
    }

    if (isPublicPage(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, '/');
    }
  },
  {
    // without a maxAge the auth cookies are session cookies, which browsers (mobile ones in
    // particular) drop when they close, signing people out
    cookieConfig: { maxAge: 60 * 60 * 24 * 365 },
  },
);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
