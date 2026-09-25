const requests = new Map<string, { count: number; expires: number }>();
export function guardRequest(request: Request, key: string, limit = 60) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
    .origin;
  if (!origin || origin !== expected)
    throw Error("Nguồn yêu cầu không hợp lệ.");
  const now = Date.now();
  if (requests.size > 10000)
    for (const [k, v] of requests) if (v.expires < now) requests.delete(k);
  const bucket = requests.get(key);
  if (!bucket || bucket.expires < now)
    requests.set(key, { count: 1, expires: now + 60000 });
  else if (++bucket.count > limit)
    throw Error("Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.");
}
