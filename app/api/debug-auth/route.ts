import { NextResponse } from "next/server";

// Debug endpoint to check if auth env vars are set (without exposing values)
export async function GET() {
  const hasSecret = !!process.env.AUTH_SECRET;
  const hasUsername = !!process.env.AUTH_CREDENTIALS_USERNAME;
  const hasPassword = !!process.env.AUTH_CREDENTIALS_PASSWORD;
  const usernameLength = process.env.AUTH_CREDENTIALS_USERNAME?.length || 0;
  const passwordLength = process.env.AUTH_CREDENTIALS_PASSWORD?.length || 0;

  return NextResponse.json({
    configured: {
      AUTH_SECRET: hasSecret,
      AUTH_CREDENTIALS_USERNAME: hasUsername,
      AUTH_CREDENTIALS_PASSWORD: hasPassword,
    },
    lengths: {
      username: usernameLength,
      password: passwordLength,
    },
    allSet: hasSecret && hasUsername && hasPassword,
  });
}
