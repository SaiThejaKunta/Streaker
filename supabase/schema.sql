-- ============================================================
-- STREAKER — Supabase Database Schema
-- ============================================================
-- Run this in the SQL Editor of a fresh Supabase project to set
-- up the schema this app expects. Assumes uuid-ossp (uuid_generate_v4)
-- is available, which Supabase enables by default.
--
-- Reconstructed from the live project via the Schema Visualizer's
-- "Copy as SQL" export and SQL Editor queries against pg_proc /
-- pg_trigger / pg_policies (Supabase does not currently expose a
-- one-click full pg_dump in the dashboard, and `supabase db dump`
-- requires a local Docker install).
-- ============================================================

-- ---- Tables ----

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text,
  coin_balance integer NOT NULL DEFAULT 1000,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.streaks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  emoji text DEFAULT '🔥'::text,
  category text DEFAULT 'custom'::text,
  target_days integer,
  is_group boolean DEFAULT false,
  buy_in integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT streaks_pkey PRIMARY KEY (id),
  CONSTRAINT streaks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.streak_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  streak_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text,
  current_count integer NOT NULL DEFAULT 0,
  longest_count integer NOT NULL DEFAULT 0,
  status text DEFAULT 'active'::text,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT streak_members_pkey PRIMARY KEY (id),
  CONSTRAINT streak_members_streak_id_fkey FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE,
  CONSTRAINT streak_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.check_ins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  streak_id uuid NOT NULL,
  user_id uuid NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'verified'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
  CONSTRAINT check_ins_pkey PRIMARY KEY (id),
  CONSTRAINT check_ins_streak_id_fkey FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE,
  CONSTRAINT check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  streak_id uuid,
  type text NOT NULL,
  data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT activities_streak_id_fkey FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE
);

CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  streak_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_streak_id_fkey FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE,
  CONSTRAINT invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id),
  CONSTRAINT invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.profiles(id)
);

-- ---- Functions ----

-- Auto-creates a profile row whenever a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, coin_balance)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    1000
  );
  RETURN new;
END;
$$;

-- Deletes a streak (creator only), refunding any group buy-in coins first.
-- NOTE: marked SECURITY DEFINER here because there is no DELETE policy on
-- `streaks` below, and this function also updates OTHER members'
-- `profiles.coin_balance` - both require bypassing RLS. Double check this
-- matches the real function's Security setting in Supabase (Database >
-- Functions > delete_streak > Advanced settings) before relying on it.
CREATE OR REPLACE FUNCTION public.delete_streak(p_streak_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_buy_in INTEGER;
  v_is_group BOOLEAN;
BEGIN
  -- 1. Verify the streak exists and the caller is the creator
  SELECT created_by, buy_in, is_group
  INTO v_creator_id, v_buy_in, v_is_group
  FROM public.streaks
  WHERE id = p_streak_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Streak not found.';
  END IF;

  IF v_creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the creator can delete this streak.';
  END IF;

  -- 2. Refund coins if it was a group streak with a buy-in
  IF v_is_group AND v_buy_in > 0 THEN
    UPDATE public.profiles
    SET coin_balance = coin_balance + v_buy_in
    WHERE id IN (
      SELECT user_id FROM public.streak_members WHERE streak_id = p_streak_id
    );
  END IF;

  -- 3. Delete the streak (cascades to streak_members, activities, check_ins, invitations)
  DELETE FROM public.streaks WHERE id = p_streak_id;
END;
$$;

-- ---- Triggers ----

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---- Row Level Security ----

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can update profiles." ON public.profiles FOR UPDATE USING (true);

-- streaks
-- NOTE: the next two policies are functional duplicates (same effect, added
-- at different times) - kept both to match the live database exactly.
CREATE POLICY "Streaks are viewable by everyone." ON public.streaks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create streaks." ON public.streaks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow authenticated users to create streaks" ON public.streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update streaks." ON public.streaks FOR UPDATE USING (auth.uid() = created_by);

-- streak_members
-- NOTE: same duplicate-policy situation as `streaks` above.
CREATE POLICY "Members are viewable by everyone." ON public.streak_members FOR SELECT USING (true);
CREATE POLICY "Users can join streaks." ON public.streak_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to join streaks" ON public.streak_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can update memberships." ON public.streak_members FOR UPDATE USING (true);

-- check_ins
CREATE POLICY "Check-ins are viewable by everyone." ON public.check_ins FOR SELECT USING (true);
CREATE POLICY "Users can create their own check-ins." ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group members can update check-ins" ON public.check_ins FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.streak_members
    WHERE streak_members.streak_id = check_ins.streak_id
      AND streak_members.user_id = auth.uid()
  )
);

-- activities
-- NOTE: same duplicate-policy situation as `streaks` above.
CREATE POLICY "Activities are viewable by everyone." ON public.activities FOR SELECT USING (true);
CREATE POLICY "Users can create their own activities." ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to create activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can update activities." ON public.activities FOR UPDATE USING (true);

-- invitations
CREATE POLICY "Invitations viewable by invitee and inviter" ON public.invitations FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);
CREATE POLICY "Users can create invitations" ON public.invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Invitees can update invitations" ON public.invitations FOR UPDATE USING (auth.uid() = invitee_id);
