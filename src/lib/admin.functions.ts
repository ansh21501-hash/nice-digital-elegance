/* eslint-disable @typescript-eslint/no-explicit-any */
// Client wrappers for the `admin` Supabase Edge Function.
// Admin unlock returns a token that is stored in localStorage and sent with
// every subsequent privileged request.
import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "nice_admin_token";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

async function adm(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin", {
    body: { action, token: getToken(), ...(payload ?? {}) },
  });
  if (error) throw new Error(error.message);
  if (data && (data as any).error) throw new Error((data as any).error);
  return data as any;
}

export const adminUnlock = async ({ data }: { data: { password: string } }) => {
  const r = await adm("unlock", { password: data.password });
  if (r?.ok && r.token) {
    try {
      localStorage.setItem(TOKEN_KEY, r.token);
    } catch {
      /* ignore */
    }
  }
  return { ok: !!r?.ok };
};

export const adminStatus = async () => adm("status");
export const adminLogout = async () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  return adm("logout");
};

export const adminList = async ({ data }: { data: any }) => adm("list", data);
export const adminUpsert = async ({ data }: { data: any }) => adm("upsert", data);
export const adminDelete = async ({ data }: { data: any }) => adm("delete", data);
export const adminUpload = async ({ data }: { data: any }) => adm("upload", data);
export const adminSettingsList = async () => adm("settingsList");
export const adminSettingSave = async ({ data }: { data: any }) => adm("settingSave", data);
export const adminSettingDelete = async ({ data }: { data: any }) => adm("settingDelete", data);
export const adminResendEmail = async ({ data }: { data: any }) => adm("resendEmail", data);
export const adminNotificationsMarkRead = async ({ data }: { data: any }) =>
  adm("notificationsMarkRead", data);
export const adminNotificationsClear = async () => adm("notificationsClear");
export const adminBookingRooms = async ({ data }: { data: any }) => adm("bookingRooms", data);
export const adminBookingRoomUpdate = async ({ data }: { data: any }) =>
  adm("bookingRoomUpdate", data);
