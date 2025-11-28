import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  userProfile: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, userProfile: null })
}));

export const useSkillStore = create((set) => ({
  skillsOffered: [],
  skillsWanted: [],
  
  setSkillsOffered: (skills) => set({ skillsOffered: skills }),
  setSkillsWanted: (skills) => set({ skillsWanted: skills }),
  addSkillOffered: (skill) => set((state) => ({
    skillsOffered: [...state.skillsOffered, skill]
  })),
  addSkillWanted: (skill) => set((state) => ({
    skillsWanted: [...state.skillsWanted, skill]
  })),
  removeSkillOffered: (skillId) => set((state) => ({
    skillsOffered: state.skillsOffered.filter(s => s.id !== skillId)
  })),
  removeSkillWanted: (skillId) => set((state) => ({
    skillsWanted: state.skillsWanted.filter(s => s.id !== skillId)
  }))
}));

export const useSessionStore = create((set) => ({
  sessions: [],
  activeSessions: [],
  currentSession: null,
  
  setSessions: (sessions) => set({ sessions }),
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addSession: (session) => set((state) => ({
    sessions: [...state.sessions, session]
  }))
}));

export const useCreditStore = create((set) => ({
  credits: 0,
  creditHistory: [],
  
  setCredits: (credits) => set({ credits }),
  setCreditHistory: (history) => set({ creditHistory: history }),
  addCredit: (amount) => set((state) => ({
    credits: state.credits + amount
  })),
  removeCredit: (amount) => set((state) => ({
    credits: Math.max(0, state.credits - amount)
  }))
}));

export const useMatchStore = create((set) => ({
  potentialMatches: [],
  isMatching: false,
  
  setMatches: (matches) => set({ potentialMatches: matches }),
  setIsMatching: (matching) => set({ isMatching: matching }),
  clearMatches: () => set({ potentialMatches: [] })
}));

export const useChatStore = create((set) => ({
  messages: [],
  isTyping: false,
  
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setIsTyping: (typing) => set({ isTyping: typing }),
  clearMessages: () => set({ messages: [] })
}));
