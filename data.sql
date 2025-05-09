

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_type" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_activity"("target_user_id" "uuid", "time_period" interval DEFAULT '30 days'::interval) RETURNS TABLE("action_type" "text", "action_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Check if the current user is an admin or the target user
    if not (is_admin(auth.uid()) or auth.uid() = target_user_id) then
        raise exception 'Unauthorized to view user activity';
    end if;

    return query
    select 
        ca.action_type,
        count(*) as action_count
    from card_actions ca
    where ca.user_id = target_user_id
    and ca.created_at > now() - time_period
    group by ca.action_type;
end;
$$;


ALTER FUNCTION "public"."get_user_activity"("target_user_id" "uuid", "time_period" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_school_id uuid;
begin
  -- Debug logging
  raise log 'Creating new user profile with metadata:';
  raise log 'raw_user_meta_data: %', new.raw_user_meta_data;
  raise log 'raw_app_meta_data: %', new.raw_app_meta_data;
  
  -- Try to get school_id from both metadata sources
  v_school_id := (new.raw_user_meta_data->>'school_id')::uuid;
  if v_school_id is null then
    v_school_id := (new.raw_app_meta_data->>'school_id')::uuid;
  end if;
  
  raise log 'Extracted school_id: %', v_school_id;
  
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    school_id
  )
  values (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'first_name')::text,
    (new.raw_user_meta_data->>'last_name')::text,
    coalesce((new.raw_user_meta_data->>'role')::user_type, 'user'::user_type),
    v_school_id
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_user"("invitee_email" "text", "invited_user_type" "public"."user_type" DEFAULT 'user'::"public"."user_type") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Check if the current user is an admin
    if not is_admin(auth.uid()) then
        raise exception 'Only admins can invite users';
    end if;
    
    -- The actual invitation will be handled by Supabase Auth UI
    -- This function is mainly for validation and future extensibility
    return;
end;
$$;


ALTER FUNCTION "public"."invite_user"("invitee_email" "text", "invited_user_type" "public"."user_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    return exists (
        select 1 from profiles
        where id = user_id
        and user_type = 'admin'
    );
end;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_user_admin"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Check if the current user is an admin
    if not is_admin(auth.uid()) then
        raise exception 'Only admins can promote users to admin';
    end if;

    -- Update the user's type to admin
    update profiles
    set user_type = 'admin'
    where id = target_user_id;
end;
$$;


ALTER FUNCTION "public"."make_user_admin"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_admin_status"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Check if the current user is an admin
    if not is_admin(auth.uid()) then
        raise exception 'Only admins can demote other admins';
    end if;

    -- Prevent removing the last admin
    if (select count(*) from profiles where user_type = 'admin') <= 1 then
        raise exception 'Cannot remove the last admin';
    end if;

    -- Update the user's type to regular user
    update profiles
    set user_type = 'user'
    where id = target_user_id;
end;
$$;


ALTER FUNCTION "public"."remove_admin_status"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."card_actions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "card_id" "uuid",
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "school_id" "uuid" NOT NULL,
    CONSTRAINT "card_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['upload'::"text", 'review'::"text", 'export'::"text", 'archive'::"text"])))
);


ALTER TABLE "public"."card_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_by" "uuid",
    "name" "text",
    "image_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "school_id" "uuid" NOT NULL,
    CONSTRAINT "cards_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "date" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "school_id" "uuid" NOT NULL,
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."extracted_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "image_path" "text",
    "fields" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "event_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "trimmed_image_path" "text",
    "school_id" "uuid" NOT NULL
);


ALTER TABLE "public"."extracted_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "school_id" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "status" "text" NOT NULL,
    "result_json" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "retries" integer DEFAULT 0,
    "event_id" "uuid",
    "image_path" "text",
    CONSTRAINT "processing_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'complete'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."processing_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_type" DEFAULT 'user'::"public"."user_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "school_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviewed_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "fields" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'reviewed'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "exported_at" timestamp with time zone,
    "event_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "review_status" "text",
    "school_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "image_path" "text"
);


ALTER TABLE "public"."reviewed_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "pricing_tier" "text",
    "stripe_price_id" "text",
    "has_paid" boolean DEFAULT false
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb",
    "school_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_actions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_profiles_with_login" AS
 SELECT "p"."id",
    "p"."email",
    "p"."first_name",
    "p"."last_name",
    "p"."role",
    "u"."last_sign_in_at"
   FROM ("public"."profiles" "p"
     LEFT JOIN "auth"."users" "u" ON (("p"."id" = "u"."id")));


ALTER TABLE "public"."user_profiles_with_login" OWNER TO "postgres";


ALTER TABLE ONLY "public"."card_actions"
    ADD CONSTRAINT "card_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extracted_data"
    ADD CONSTRAINT "extracted_data_document_id_key" UNIQUE ("document_id");



ALTER TABLE ONLY "public"."extracted_data"
    ADD CONSTRAINT "extracted_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviewed_data"
    ADD CONSTRAINT "reviewed_data_document_id_key" UNIQUE ("document_id");



ALTER TABLE ONLY "public"."reviewed_data"
    ADD CONSTRAINT "reviewed_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_actions"
    ADD CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_extracted_data_event_id" ON "public"."extracted_data" USING "btree" ("event_id");



CREATE INDEX "idx_processing_jobs_status" ON "public"."processing_jobs" USING "btree" ("status");



CREATE INDEX "idx_reviewed_data_event_id" ON "public"."reviewed_data" USING "btree" ("event_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."schools" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_extracted_data_updated_at" BEFORE UPDATE ON "public"."extracted_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviewed_data_updated_at" BEFORE UPDATE ON "public"."reviewed_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."card_actions"
    ADD CONSTRAINT "card_actions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_actions"
    ADD CONSTRAINT "card_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."extracted_data"
    ADD CONSTRAINT "extracted_data_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviewed_data"
    ADD CONSTRAINT "reviewed_data_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."user_actions"
    ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can update all cards" ON "public"."cards" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "Admins can view all actions" ON "public"."card_actions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "Admins can view all cards" ON "public"."cards" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "Allow authenticated users to insert schools" ON "public"."schools" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update schools" ON "public"."schools" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view schools" ON "public"."schools" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow trigger inserts" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."extracted_data" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."reviewed_data" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."extracted_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."reviewed_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."events" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."extracted_data" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."reviewed_data" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert their own actions" ON "public"."card_actions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own cards" ON "public"."cards" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can read profiles in their school" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("school_id" IN ( SELECT "profiles_1"."school_id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))));



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own cards" ON "public"."cards" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view cards they created" ON "public"."cards" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own actions" ON "public"."card_actions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."card_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extracted_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "profiles_insert_trigger" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "profiles_read_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."reviewed_data";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."get_user_activity"("target_user_id" "uuid", "time_period" interval) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_activity"("target_user_id" "uuid", "time_period" interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_activity"("target_user_id" "uuid", "time_period" interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_user"("invitee_email" "text", "invited_user_type" "public"."user_type") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_user"("invitee_email" "text", "invited_user_type" "public"."user_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_user"("invitee_email" "text", "invited_user_type" "public"."user_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."make_user_admin"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."make_user_admin"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_user_admin"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_admin_status"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_admin_status"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_admin_status"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."card_actions" TO "anon";
GRANT ALL ON TABLE "public"."card_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."card_actions" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."extracted_data" TO "anon";
GRANT ALL ON TABLE "public"."extracted_data" TO "authenticated";
GRANT ALL ON TABLE "public"."extracted_data" TO "service_role";



GRANT ALL ON TABLE "public"."processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviewed_data" TO "anon";
GRANT ALL ON TABLE "public"."reviewed_data" TO "authenticated";
GRANT ALL ON TABLE "public"."reviewed_data" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."user_actions" TO "anon";
GRANT ALL ON TABLE "public"."user_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_actions" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles_with_login" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles_with_login" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles_with_login" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
