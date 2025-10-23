import { NextResponse } from "next/server";

export async function GET() {
  // 임시 더미 데이터
  const data = [
    { name: "Antiviral Search", uuid: "mock-ws-1" },
    { name: "Oncology Project", uuid: "mock-ws-2" },
  ];
  return NextResponse.json(data);
}
