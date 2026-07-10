// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, publicClient } from "../_shared/supabase.ts";
import { bookedUnitsForRoom } from "../_shared/booking.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const { action, checkIn, checkOut } = await req.json();
    const pub = publicClient();

    switch (action) {
      case "getRooms": {
        const { data, error } = await pub
          .from("rooms")
          .select(
            "id,name,room_number,category,description,price,weekend_price,capacity,floor,amenities,images,status,sort_order,total_units",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "getOffers": {
        const { data, error } = await pub
          .from("offers")
          .select("id,title,description,type,code,discount,image")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "getServices": {
        const { data, error } = await pub
          .from("services")
          .select("id,title,description,group_name,icon,tags,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "getEvents": {
        const { data, error } = await pub
          .from("events")
          .select(
            "id,name,subtitle,badge,description,capacity,size,floor,price,image,amenities,coming_soon,sort_order",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "getMenu": {
        const { data: cats, error: cErr } = await pub
          .from("menu_categories")
          .select("id,name,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (cErr) throw new Error(cErr.message);
        const { data: items, error: iErr } = await pub
          .from("menu_items")
          .select("id,category_id,name,price,sort_order")
          .eq("is_available", true)
          .order("sort_order", { ascending: true });
        if (iErr) throw new Error(iErr.message);
        const result = (cats ?? [])
          .map((c: any) => ({
            category: c.name,
            items: (items ?? [])
              .filter((i: any) => i.category_id === c.id)
              .map((i: any) => ({ name: i.name, price: i.price ?? "" })),
          }))
          .filter((c: any) => c.items.length > 0);
        return json(result);
      }
      case "getRoomAvailability": {
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const ci = checkIn || today;
        const co = checkOut || tomorrow;
        const db = adminClient();
        const { data: rooms, error } = await db
          .from("rooms")
          .select("id,name,category,total_units")
          .eq("is_active", true);
        if (error) throw new Error(error.message);
        const result = [];
        for (const room of rooms ?? []) {
          const total = Number(room.total_units) || 0;
          const booked = await bookedUnitsForRoom(db, room.id, ci, co);
          result.push({
            roomId: room.id,
            name: room.name,
            category: room.category,
            total,
            booked,
            available: Math.max(0, total - booked),
          });
        }
        return json(result);
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e: any) {
    console.error("public-data error", e);
    return json({ error: e?.message ?? "Server error" }, 500);
  }
});
