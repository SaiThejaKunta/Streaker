// ============================================================
// STREAKER — Activity Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { Activity, Invitation } from '../types';
import { MOCK_ACTIVITIES, MOCK_INVITATIONS } from '../utils/mockData';

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
    set({ activities: MOCK_ACTIVITIES, isLoading: false });
  },

  loadInvitations: async () => {
    await new Promise((r) => setTimeout(r, 300));
    set({ invitations: MOCK_INVITATIONS });
  },

  acceptInvitation: async (invitationId: string) => {
    await new Promise((r) => setTimeout(r, 400));
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
      ),
    }));
  },

  declineInvitation: async (invitationId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: 'declined' as const } : inv
      ),
    }));
  },
}));
