"use client";

import { createContext, useContext } from "react";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

interface UserContextValue {
  userId: string;
}

const UserContext = createContext<UserContextValue>({ userId: DEMO_USER_ID });

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ userId: DEMO_USER_ID }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
