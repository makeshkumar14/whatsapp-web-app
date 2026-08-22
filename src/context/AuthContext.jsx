import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until the first onAuthStateChanged callback — avoids flashing Login on refresh
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is how Firebase persists login:
    // it restores the session from local storage, then fires with the User
    // (or null). Unsubscribe on unmount so we do not leak listeners.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Upsert the profile so first login creates users/{uid} and later
        // logins refresh name/photo if they changed in Google.
        try {
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            },
            { merge: true },
          );
        } catch (err) {
          // Firestore write failed (e.g. database not created yet, or rules blocked it).
          // Log the error but still allow the user to proceed — auth itself succeeded.
          console.error("Firestore profile write failed:", err.message);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function loginWithGoogle() {
    // signInWithPopup opens Google's account picker. On success, Auth
    // persists the session (browser local persistence by default) and
    // onAuthStateChanged above runs, which writes the Firestore user doc.
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    // signOut() clears the persisted session; onAuthStateChanged then
    // receives null and App shows the Login screen.
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
