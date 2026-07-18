/* eslint-disable @typescript-eslint/no-explicit-any */
// Client wrappers for the `public-data` Supabase Edge Function.
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";

async function pub(action: string, payload?: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.functions.invoke("public-data", {
      body: { action, ...(payload ?? {}) },
    });
    if (error) throw new Error(error.message);
    if (data && (data as any).error) throw new Error((data as any).error);
    return (data as any)?.result ?? data;
  } catch (e) {
    throw new Error(friendlyError(e, `We couldn't load ${action}. Please try again.`));
  }
}

export const getRooms = async () => {
  try {
    return await pub("getRooms");
  } catch (functionError) {
    // Public room inventory is also readable through the Data API. This keeps
    // the rooms and booking screens usable during a transient function outage.
    const { data, error } = await supabase
      .from("rooms")
      .select(
        "id,name,room_number,category,description,price,weekend_price,capacity,floor,amenities,images,status,sort_order,total_units",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw functionError;
    return data ?? [];
  }
};
export const getRoomAvailability = (arg?: { data?: { checkIn?: string; checkOut?: string } }) =>
  pub("getRoomAvailability", arg?.data ?? {});
export const getOffers = () => pub("getOffers");
export const getServices = () => pub("getServices");
export const getEvents = () => pub("getEvents");
export const getMenu = () => pub("getMenu");
