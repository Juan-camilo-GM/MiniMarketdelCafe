import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
});
