import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  isAdmin: false,
  isDemoAdmin: false,
  enterDemo: () => {},
  logout: async () => {},
  loading: true,
});
