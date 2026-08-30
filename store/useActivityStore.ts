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
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*, streak:streaks(*), inviter:profiles!invitations_inviter_id_fkey(*)')
        .eq('invitee_id', user.id)
        .eq('status', 'pending');
        
      if (error) throw error;

      const invitations = (data || []).map((inv: any) => ({
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
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      // 1. Get the activity
      const { data: activity, error: actErr } = await supabase
        .from('activities')
        .select('*, streak:streaks(*)')
        .eq('id', activityId)
        .single();
        
      if (actErr || !activity) throw actErr || new Error('Activity not found');
      
      const checkInId = activity.data?.check_in_id;
      const originalUserId = activity.user_id; 
      const streakId = activity.streak_id;
      
      if (!checkInId) throw new Error('Check-in ID missing');

      if (approve) {
        await supabase.from('check_ins').update({ status: 'verified' }).eq('id', checkInId);
        
        const { data: member } = await supabase
          .from('streak_members')
          .select('*')
          .eq('streak_id', streakId)
          .eq('user_id', originalUserId)
          .single();
          
        if (member) {
          const newCount = member.current_count + 1;
          const coins = 10; 
          
          await supabase.from('streak_members').update({
            current_count: newCount,
            longest_count: Math.max(member.longest_count || 0, newCount)
          }).eq('id', member.id);
          
          const { data: profile } = await supabase.from('profiles').select('coin_balance').eq('id', originalUserId).single();
          if (profile) {
            await supabase.from('profiles').update({ coin_balance: profile.coin_balance + coins }).eq('id', originalUserId);
          }
          
          await supabase.from('activities').insert({
            user_id: originalUserId,
            streak_id: streakId,
            type: 'check_in',
            data: { note: activity.data?.note, coins: coins, verified_by: user.id }
          });
        }
      } else {
        await supabase.from('check_ins').update({ status: 'rejected' }).eq('id', checkInId);
      }
      
      await supabase.from('activities').update({ data: { ...activity.data, completed: true, result: approve ? 'approved' : 'rejected' } }).eq('id', activityId);
      
    } catch (err) {
      console.error("verifyCheckIn err:", err);
      throw err;
    }
  },
}));
