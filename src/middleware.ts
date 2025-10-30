import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                     nextUrl.pathname.startsWith("/register")
  const isLandlordRoute = nextUrl.pathname.startsWith("/landlord")
  const isTenantRoute = nextUrl.pathname.startsWith("/tenant")

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    if (userRole === "LANDLORD") {
      return NextResponse.redirect(new URL("/landlord/dashboard", nextUrl))
    }
    if (userRole === "TENANT") {
      return NextResponse.redirect(new URL("/tenant/dashboard", nextUrl))
    }
  }

  // Protect landlord routes
  if (isLandlordRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (userRole !== "LANDLORD") {
      return NextResponse.redirect(new URL("/tenant/dashboard", nextUrl))
    }
  }

  // Protect tenant routes
  if (isTenantRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (userRole !== "TENANT") {
      return NextResponse.redirect(new URL("/landlord/dashboard", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/landlord/:path*",
    "/tenant/:path*",
    "/login",
    "/register",
  ],
}
