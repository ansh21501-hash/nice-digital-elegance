-- Fix broken is_staff: restrict to actual staff roles
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin','hotel_manager','restaurant_manager','event_manager',
        'reception','content_manager','accountant','support'
      )
  );
$function$;

-- Public read for gallery (website display)
GRANT SELECT ON public.gallery TO anon;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT TO anon, authenticated USING (true);

-- Public read for approved/featured reviews
GRANT SELECT ON public.reviews TO anon;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved');