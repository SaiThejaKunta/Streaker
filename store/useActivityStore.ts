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
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  invitations: [],
  isLoading: false,

  loadActivities: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 400));
    set({ activities: [], isLoading: false });
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
      
      set({ invitations: data || [] });
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
}));
