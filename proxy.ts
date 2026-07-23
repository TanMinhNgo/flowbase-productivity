import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Clerk sends this request server-to-server. Leave its signed payload untouched
  // so the route handler can verify it with CLERK_WEBHOOK_SIGNING_SECRET.
  if (pathname === "/api/webhooks/clerk") {
    return;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|jpg|jpeg|png|woff|woff2|ico|csv|docx|xlsx|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
