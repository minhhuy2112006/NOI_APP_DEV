import {runMaintenance} from "./maintenance";
import { snapshot, demoMode } from "./demo-db";
import { currentUser } from "./auth";
import { supabase } from "./supabase";
export async function getData() {
  const user = await currentUser();
  if (demoMode()) {runMaintenance();return snapshot(user);}
  const client = await supabase();
  const { data, error } = await client.rpc("noi_snapshot");
  if (error)
    throw Error(
      "Không thể tải dữ liệu. Kiểm tra migration và kết nối Supabase.",
    );
  return { ...data, user, mode: "connected" } as ReturnType<typeof snapshot>;
}
export type AppData = Awaited<ReturnType<typeof getData>>;
