import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export function getAuthUser(): Promise<User | null> {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

