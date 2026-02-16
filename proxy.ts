import { NextResponse } from "next/server";

export function proxy(_req: Request) {
  return NextResponse.next();
}
