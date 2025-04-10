import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthChangeEvent, AuthError, Session, User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { UserRole, Faculty, UserStatus } from '@/types'; // Ensure UserStatus is imported
import { ProfilesRow } from '@/types/database';
import { PostgrestError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

// Define LocalUser interface
interface LocalUser {
  fullName: string;
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus; // Add status field
  name?: string;
  student_id?: string;
  faculty?: string;
  batch?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
}

// Define AuthContextType interface
export interface AuthContextType {
  currentUser: LocalUser | null;
  session: Session | null;
  isLoading: boolean;
  isConnected: boolean;
  login: (emailOrId: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  registerUser: (
    email: string,
    password: string,
    name?: string,
    student_id?: string,
    faculty?: string,
    batch?: string
  ) => Promise<any>;
  updateProfile: (
    full_name?: string,
    student_id?: string,
    faculty?: string,
    batch?: string,
    phone?: string,
    avatar_url?: string | null
  ) => Promise<any>;
  getAllUsers: () => Promise<ProfilesRow[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: any }>;
  updateUserStatus: (userId: string, newStatus: UserStatus) => Promise<{ success: boolean; error?: any }>; // Declare updateUserStatus
}

// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast: uiToast } = useToast();

  const getLocalUserData = (): LocalUser | null => {
    const userData = localStorage.getItem("housing_nest_user");
    if (userData) {
      try {
        return JSON.parse(userData) as LocalUser;
      } catch (e) {
        console.error("Error parsing local user data:", e);
        return null;
      }
    }
    return null;
  };

  const saveLocalUserData = (user: LocalUser) => {
    localStorage.setItem("housing_nest_user", JSON.stringify(user));
  };

  // Fetch profile data for a given user
  const getProfileData = async (user: User): Promise<LocalUser | null> => {
    const localUser = getLocalUserData();
    if (localUser && localUser.id === user.id && !session) {
      setCurrentUser(localUser);
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("لم يتم العثور على بيانات المستخدم");

      const profileData = data as ProfilesRow;

      const userData: LocalUser = {
        id: user.id,
        email: user.email || "",
        role: (profileData.role as UserRole) || "user", // Correctly cast role
        status: (profileData.status as UserStatus) || 'active', // Add status handling
        fullName: profileData.full_name || "",
        name: profileData.full_name || "",
        student_id: profileData.student_id || undefined,
        faculty: profileData.faculty || undefined,
        batch: profileData.batch || undefined,
        phone: profileData.phone || undefined,
        avatar_url: profileData.avatar_url || undefined,
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      setCurrentUser(userData);
      saveLocalUserData(userData);
      setIsConnected(true);
      return userData;
    } catch (error) {
      console.error("خطأ في جلب بيانات الملف الشخصي:", error);
      setIsConnected(false);
      if (localUser && localUser.id === user.id) {
        setCurrentUser(localUser);
        return localUser;
      }
      setCurrentUser(null);
      return null;
    }
  };


  // Get initial session and profile data
  const getInitialSession = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(session);
      if (session?.user) {
        await getProfileData(session.user);
      } else {
        const localUser = getLocalUserData();
        setCurrentUser(localUser);
      }
      setIsConnected(true);
    } catch (error) {
      console.error("خطأ في الحصول على الجلسة الأولية:", error);
      setIsConnected(false);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(getInitialSession, 30000);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auth state listener
  useEffect(() => {
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && session?.user) {
        await getProfileData(session.user);
        setIsConnected(true);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        localStorage.removeItem("housing_nest_user");
      } else if (event === "USER_UPDATED" && session?.user) {
        await getProfileData(session.user);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  // Login function
  const login = async (emailOrId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      let userEmail = emailOrId;
      if (!emailOrId.includes('@')) {
        const { data: profilesArray, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("student_id", emailOrId);

        if (profileError) throw new Error("خطأ أثناء البحث عن المستخدم");
        if (!profilesArray || profilesArray.length !== 1 || !profilesArray[0].email) {
          throw new Error("لم يتم العثور على مستخدم بهذا المعرف أو الملف الشخصي غير مكتمل");
        }
        userEmail = profilesArray[0].email;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) throw new Error("بيانات الدخول غير صحيحة");
        if (authError.message.includes("Email not confirmed")) throw new Error("البريد الإلكتروني غير مؤكد");
        throw authError;
      }

      if (!data.session?.user) throw new Error("فشل تسجيل الدخول");

      await getProfileData(data.session.user);
      setSession(data.session);
      return true;

    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      toast.error((error as Error).message || "حدث خطأ غير متوقع");
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setIsConnected(true);
      return data;
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("حدث خطأ أثناء تسجيل الدخول بجوجل");
      setIsConnected(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setSession(null);
      localStorage.removeItem("housing_nest_user");
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout error:", error);
      setCurrentUser(null);
      setSession(null);
      localStorage.removeItem("housing_nest_user");
      toast.error("خطأ في تسجيل الخروج من الخادم، تم تسجيل الخروج محلياً");
    } finally {
      setIsLoading(false);
    }
  };

  // Register User function
  const registerUser = async (
    email: string, password: string, name?: string, student_id?: string, faculty?: string, batch?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("لم يتم إنشاء المستخدم");

      const profileData: Partial<ProfilesRow> = {
        id: data.user.id,
        full_name: name?.trim() || null,
        email: email || null,
        role: "user",
        status: 'active', // Default status
        student_id: student_id?.trim() || null,
        faculty: faculty?.trim() || null,
        batch: batch?.trim() || null,
      };

      const { error: profileError } = await supabase.from("profiles").insert(profileData);
      if (profileError) throw profileError;

      toast.success("تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني للتفعيل.");
      return { success: true, data };
    } catch (error) {
      console.error("خطأ في التسجيل:", error);
      toast.error(`خطأ في التسجيل: ${(error as Error).message}`);
      return { success: false, error };
    }
  };

  // Update Profile function
  const updateProfile = async (
    full_name?: string, student_id?: string, faculty?: string, batch?: string, phone?: string, avatar_url?: string | null
  ) => {
    if (!currentUser?.id) {
      toast.error("يجب تسجيل الدخول لتحديث الملف الشخصي");
      return { success: false, error: "User not logged in" };
    }
    try {
      const profileUpdates: Partial<ProfilesRow> = { updated_at: new Date().toISOString() };
      if (full_name !== undefined) profileUpdates.full_name = full_name.trim() || null;
      if (student_id !== undefined) profileUpdates.student_id = student_id.trim() || null;
      if (faculty !== undefined) profileUpdates.faculty = faculty.trim() || null;
      if (batch !== undefined) profileUpdates.batch = batch.trim() || null;
      if (phone !== undefined) profileUpdates.phone = phone.trim() || null;
      if (avatar_url !== undefined) profileUpdates.avatar_url = avatar_url === null ? null : (avatar_url.trim() || null);

      // Ensure status is not accidentally overwritten if not provided
      // delete profileUpdates.status; // We handle status updates separately

      const { error } = await supabase.from("profiles").update(profileUpdates).eq("id", currentUser.id);
      if (error) throw error;

      await getProfileData({ id: currentUser.id } as User);

      toast.success("تم تحديث الملف الشخصي بنجاح");
      return { success: true };
    } catch (error) {
      console.error("خطأ في تحديث الملف الشخصي:", error);
      toast.error(`خطأ في تحديث الملف الشخصي: ${(error as Error).message}`);
      return { success: false, error };
    }
  };

  // Get All Users function (Admin only)
  const getAllUsers = async (): Promise<ProfilesRow[]> => {
    if (currentUser?.role !== 'admin') {
      toast.error("غير مصرح لك بالوصول لهذه البيانات");
      return [];
    }
    try {
      // Select all columns including the new status column
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProfilesRow[];
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast.error(`خطأ في جلب المستخدمين: ${(error as Error).message}`);
      return [];
    }
  };

  // Update User Role function (Admin only)
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; error?: any }> => {
    if (currentUser?.role !== 'admin') {
      toast.error("غير مصرح لك بتغيير أدوار المستخدمين");
      return { success: false, error: "Permission denied" };
    }
    if (userId === currentUser.id) {
       toast.error("لا يمكنك تغيير دور حسابك الخاص.");
       return { success: false, error: "Cannot change own role" };
    }
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      toast.success(`تم تحديث دور المستخدم بنجاح إلى ${newRole === 'admin' ? 'مدير' : 'طالب'}`);
      return { success: true };
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(`خطأ في تحديث دور المستخدم: ${(error as Error).message}`);
      return { success: false, error };
    }
  };

  // Update User Status function (Admin only)
  const updateUserStatus = async (userId: string, newStatus: UserStatus): Promise<{ success: boolean; error?: any }> => {
    if (currentUser?.role !== 'admin') {
      toast.error("غير مصرح لك بتغيير حالة المستخدمين");
      return { success: false, error: "Permission denied" };
    }
     if (userId === currentUser.id) {
       toast.error("لا يمكنك تغيير حالة حسابك الخاص.");
       return { success: false, error: "Cannot change own status" };
    }
    try {
      // Update only the status and updated_at columns
      const { error } = await supabase.from('profiles').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      toast.success(`تم تحديث حالة المستخدم بنجاح إلى ${newStatus === 'active' ? 'نشط' : 'محظور'}`);
      return { success: true };
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`خطأ في تحديث حالة المستخدم: ${(error as Error).message}`);
      return { success: false, error };
    }
  };

  // Context value provided to consumers
  const contextValue: AuthContextType = {
    currentUser,
    session,
    isLoading,
    isConnected,
    login,
    loginWithGoogle,
    logout,
    registerUser,
    updateProfile,
    getAllUsers,
    updateUserRole,
    updateUserStatus, // Add the new function here
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("يجب استخدام useAuth داخل AuthProvider");
  }
  return context;
};
