import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw Error("Chưa cấu hình Supabase. Xem hướng dẫn cài đặt trong README.");
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Read-only server rendering; auth route refreshes cookies. */
        }
      },
    },
  });
}
