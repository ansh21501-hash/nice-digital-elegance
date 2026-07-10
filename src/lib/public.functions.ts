/* eslint-disable @typescript-eslint/no-explicit-any */
// Client wrappers for the `public-data` Supabase Edge Function.
import { supabase } from "@/integrations/supabase/client";

async function pub(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("public-data", {
    body: { action, ...(payload ?? {}) },
  });
  if (error) throw new Error(error.message);
  if (data && (data as any).error) throw new Error((data as any).error);
  return (data as any)?.result ?? data;
}

export const getRooms = () => pub("getRooms");
export const getRoomAvailability = (arg?: { data?: { checkIn?: string; checkOut?: string } }) =>
  pub("getRoomAvailability", arg?.data ?? {});
export const getOffers = () => pub("getOffers");
export const getServices = () => pub("getServices");
export const getEvents = () => pub("getEvents");
export const getMenu = () => pub("getMenu");
