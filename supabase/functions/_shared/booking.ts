// deno-lint-ignore-file no-explicit-any
type DB = any;

export type RoomItemInput = {
  roomId: string;
  quantity: number;
  adults: number;
  children?: number;
  extraBed?: boolean;
  notes?: string;
};

const EXTRA_BED_PER_NIGHT = 800;

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00Z").getTime();
  const b = new Date(checkOut + "T00:00:00Z").getTime();
  const n = Math.round((b - a) / 86400000);
  return n > 0 ? n : 0;
}

export async function bookedUnitsForRoom(
  db: DB,
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<number> {
  const { data: lines } = await db
    .from("booking_rooms")
    .select("quantity, bookings!inner(status, check_in, check_out)")
    .eq("room_id", roomId)
    .neq("bookings.status", "cancelled")
    .lt("bookings.check_in", checkOut)
    .gt("bookings.check_out", checkIn);
  let units = 0;
  for (const l of lines ?? []) units += Number(l.quantity) || 1;

  const { data: legacy } = await db
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .neq("status", "cancelled")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);
  if (legacy && legacy.length) {
    const ids = legacy.map((b: any) => b.id);
    const { data: hasChildren } = await db
      .from("booking_rooms")
      .select("booking_id")
      .in("booking_id", ids);
    const withChildren = new Set((hasChildren ?? []).map((r: any) => r.booking_id));
    for (const b of legacy) if (!withChildren.has(b.id)) units += 1;
  }
  return units;
}

export async function getRoomsByIds(db: DB, ids: string[]) {
  const unique = [...new Set(ids)];
  const { data, error } = await db
    .from("rooms")
    .select("id,name,price,weekend_price,capacity,images,category,total_units")
    .in("id", unique)
    .eq("is_active", true);
  if (error) throw new Error("Could not load rooms");
  const map: Record<string, any> = {};
  for (const r of data ?? []) map[r.id] = r;
  for (const id of unique) if (!map[id]) throw new Error("Room not found");
  return map;
}

export async function computeMultiQuote(
  db: DB,
  items: RoomItemInput[],
  checkIn: string,
  checkOut: string,
) {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) throw new Error("Invalid date range");
  if (!items.length) throw new Error("No rooms selected");
  const rooms = await getRoomsByIds(db, items.map((i) => i.roomId));
  const lines = items.map((i) => {
    const room = rooms[i.roomId];
    const qty = Math.max(1, Number(i.quantity) || 1);
    const extraBed = !!i.extraBed;
    const unitPrice = Number(room.price) * nights + (extraBed ? EXTRA_BED_PER_NIGHT * nights : 0);
    return {
      room,
      quantity: qty,
      adults: Math.max(1, Number(i.adults) || 1),
      children: Math.max(0, Number(i.children) || 0),
      extraBed,
      notes: i.notes?.trim() || null,
      unitPrice,
      lineTotal: unitPrice * qty,
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxRate = 0.12;
  const taxes = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + taxes;
  return { nights, lines, subtotal, taxRate, taxes, grandTotal };
}

export async function assertMultiAvailable(
  db: DB,
  items: RoomItemInput[],
  checkIn: string,
  checkOut: string,
) {
  const rooms = await getRoomsByIds(db, items.map((i) => i.roomId));
  const requested: Record<string, number> = {};
  for (const i of items)
    requested[i.roomId] = (requested[i.roomId] ?? 0) + Math.max(1, Number(i.quantity) || 1);
  for (const roomId of Object.keys(requested)) {
    const room = rooms[roomId];
    const totalUnits = Number(room.total_units) || 1;
    const booked = await bookedUnitsForRoom(db, roomId, checkIn, checkOut);
    const available = totalUnits - booked;
    if (requested[roomId] > available) {
      throw new Error(
        `${room.name}: only ${Math.max(0, available)} room(s) available for these dates`,
      );
    }
  }
}

export async function findExistingBooking(db: DB, orderId: string, paymentId: string) {
  const { data } = await db
    .from("bookings")
    .select("id")
    .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`)
    .limit(1);
  return data && data.length > 0 ? data[0].id : null;
}
