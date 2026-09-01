// ============================================================
// STREAKER — Activity Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { useStreakStore } from './useStreakStore';
import type { Activity, Invitation } from '../types';

interface ActivityState {
  activities: Activity[];
  invitations: Invitation[];
  isLoading: boolean;

  // Actions
  loadActivities: () => Promise<void>;
  loadInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  verifyCheckIn: (activityId: string, approve: boolean) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  invitations: [],
  isLoading: false,

  loadActivities: async () => {
    set({ isLoading: true });
    try {
      // Scoped to streaks the current user is actually a member of - the
      // raw table is globally readable at the RLS level, but the feed
      // itself shouldn't surface activity for streaks the viewer isn't in.
      const myStreakIds = useStreakStore.getState().streaks.map((s) => s.id);
      if (myStreakIds.length === 0) {
        set({ activities: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*, user:profiles!activities_user_id_fkey(*)')
        .in('streak_id', myStreakIds)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      set({ activities: data || [], isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  loadInvitations: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      
      const fetchInvitations = (select: string) =>
        supabase
          .from('invitations')
          .select(select)
          .eq('invitee_id', user.id)
          .eq('status', 'pending');

      // The creator embed lets an invite name who owns the streak, not just who
      // sent it - the two are often but not always the same person.
      let res = await fetchInvitations(
        '*, streak:streaks(*, creator:profiles!streaks_created_by_fkey(*)), inviter:profiles!invitations_inviter_id_fkey(*)'
      );

      if (res.error) {
        // That embed is decorative; being able to accept an invitation is not.
        // If the relationship hint ever stops resolving (FK recreated from the
        // dashboard, table rebuilt), retry without it rather than leaving the
        // invitee looking at an empty Invites tab with no way through.
        console.warn(
          'loadInvitations: creator embed failed, retrying without it:',
          res.error.message
        );
        res = await fetchInvitations(
          '*, streak:streaks(*), inviter:profiles!invitations_inviter_id_fkey(*)'
        );
      }

      if (res.error) throw res.error;

      const invitations = (res.data || []).map((inv: any) => ({
        ...inv,
        streak: inv.streak ? { ...inv.streak, coin_buy_in: inv.streak.buy_in || 0 } : inv.streak,
      }));

      set({ invitations });
    } catch (err) {
      console.error("loadInvitations err:", err);
    }
  },

  acceptInvitation: async (invitationId: string) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const invitation = get().invitations.find(i => i.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      const streak = invitation.streak;
      if (!streak) throw new Error('Streak not found');

      const buyIn = streak.coin_buy_in || 0;
      if (user.coin_balance < buyIn) {
        throw new Error('Not enough coins for buy-in');
      }

      // Add to streak_members
      const { error: memErr } = await supabase
        .from('streak_members')
        .insert({
          streak_id: streak.id,
          user_id: user.id,
          role: 'member',
          current_count: 0
        });
      if (memErr) throw memErr;

      // Update invitation status
      const { error: invErr } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      if (invErr) throw invErr;

      // Activity feed
      await supabase.from('activities').insert({
        user_id: user.id,
        streak_id: streak.id,
        type: 'joined',
      });

      if (buyIn > 0) {
        await useAuthStore.getState().updateCoinBalance(-buyIn);
      }

      await useStreakStore.getState().loadStreaks();

      set(state => ({
        invitations: state.invitations.filter(i => i.id !== invitationId)
      }));

    } catch (err) {
      console.error("acceptInvitation err:", err);
      throw err;
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      set(state => ({
        invitations: state.invitations.filter(i => i.id !== invitationId)
      }));
    } catch (err) {
      console.error("declineInvitation err:", err);
      throw err;
    }
  },

  verifyCheckIn: async (activityId: string, approve: boolean) => {
    try {
      // All the actual writes (check_ins status, streak_members count,
      // profiles coin_balance, the resulting check_in activity) happen
      // atomically in verify_check_in, which also enforces that the caller
      // is an active member of the streak - streak_members/profiles both
      // have wide-open UPDATE policies (needed for cross-member writes like
      // this), so that membership check has to live here, not in RLS.
      const { error } = await supabase.rpc('verify_check_in', {
        p_activity_id: activityId,
        p_approve: approve,
      });
      if (error) throw error;
    } catch (err) {
      console.error("verifyCheckIn err:", err);
      throw err;
    }
  },
}));
