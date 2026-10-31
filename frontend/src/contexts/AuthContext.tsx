import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { INITIAL_USERS } from '../services/mockHospitalData';
import { logActivity } from '../services/activityLogService';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isEquipmentManager: boolean;
  loading: boolean;
  canManageDepartment: (departmentId: string) => boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsDemo: (demoRole: UserRole, specificDeptId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Mặc định đăng nhập với tài khoản Quản trị viên Bệnh viện
    const cached = localStorage.getItem('hosp_current_user_profile');
    return cached ? JSON.parse(cached) : INITIAL_USERS[0];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        try {
          const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
            localStorage.setItem('hosp_current_user_profile', JSON.stringify(data));
          }
        } catch (e) {
          console.warn('Lỗi lấy user profile từ Firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = userProfile?.role === 'Admin';
  const isEquipmentManager = userProfile?.role === 'EquipmentManager';

  const canManageDepartment = (departmentId: string): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'Admin') return true;
    return userProfile.departmentIds?.includes(departmentId) || false;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(cred.user);
      const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (docSnap.exists()) {
        const prof = docSnap.data() as UserProfile;
        setUserProfile(prof);
        localStorage.setItem('hosp_current_user_profile', JSON.stringify(prof));
        await logActivity(prof, 'LOGIN', 'AUTH', `Đăng nhập hệ thống qua Firebase Auth`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (demoRole: UserRole, specificDeptId?: string) => {
    setLoading(true);
    try {
      let selected: UserProfile;
      if (demoRole === 'Admin') {
        selected = INITIAL_USERS[0];
      } else {
        selected = specificDeptId
          ? {
              ...INITIAL_USERS[1],
              displayName: `Quản lý Thiết bị (${specificDeptId})`,
              departmentIds: [specificDeptId],
            }
          : INITIAL_USERS[1];
      }

      setUserProfile(selected);
      localStorage.setItem('hosp_current_user_profile', JSON.stringify(selected));
      await logActivity(
        selected,
        'LOGIN',
        'AUTH',
        `Đăng nhập chế độ Demo / Kiểm thử vai trò: ${selected.role} (${selected.displayName})`
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (userProfile) {
      await logActivity(userProfile, 'LOGOUT', 'AUTH', `Đăng xuất khỏi hệ thống`);
    }
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('hosp_current_user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: userProfile?.role || 'EquipmentManager',
        isAdmin,
        isEquipmentManager,
        loading,
        canManageDepartment,
        loginWithEmail,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
