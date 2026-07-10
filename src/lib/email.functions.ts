/* eslint-disable @typescript-eslint/no-explicit-any */
// Client wrappers for the `emails` Supabase Edge Function.
import { supabase } from "@/integrations/supabase/client";

async function mail(action: string, data: any) {
  const { data: res, error } = await supabase.functions.invoke("emails", {
    body: { action, data },
  });
  if (error) throw new Error(error.message);
  if (res && (res as any).error) throw new Error((res as any).error);
  return res as any;
}

export const sendBookingEmail = async ({ data }: { data: any }) => mail("sendBookingEmail", data);
export const sendContactEmail = async ({ data }: { data: any }) => mail("sendContactEmail", data);
export const sendPaymentReceiptEmail = async ({ data }: { data: any }) =>
  mail("sendPaymentReceiptEmail", data);
export const sendVenueEnquiry = async ({ data }: { data: any }) => mail("sendVenueEnquiry", data);
export const sendEmail = async ({ data }: { data: any }) => mail("sendEmail", data);
export const sendNewsletter = async ({ data }: { data: any }) => mail("sendNewsletter", data);
