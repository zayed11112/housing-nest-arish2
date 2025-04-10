import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed useToast import
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from '@/integrations/supabase/client';

// تعريف مخطط التحقق لنموذج تسجيل الدخول
const loginFormSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صالح",
  }),
  password: z.string().min(6, {
    message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage = () => {
  // Removed uiToast declaration
  const navigate = useNavigate();
  const { login, currentUser, isLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // إذا كان المستخدم مسجل الدخول بالفعل، إعادة التوجيه إلى الصفحة الرئيسية
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }

    // فحص حالة الاتصال بالخادم
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('properties').select('count').limit(1);
        setHasConnectionError(!!error);
      } catch (e) {
        setHasConnectionError(true);
      }
    };

    checkConnection();
  }, [currentUser, navigate]);

  // إعداد نموذج البريد الإلكتروني React Hook Form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // وظيفة تسجيل الدخول
  const onSubmit = async (values: LoginFormValues) => {
    if (status === "loading") return;
    
    setStatus("loading");
    setLoginAttempted(true);
    try {
      await login(values.email, values.password);
      setStatus("success");
      toast.success("تم تسجيل الدخول بنجاح");
      
      // إعادة توجيه إلى الصفحة الرئيسية بعد نجاح تسجيل الدخول
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      setStatus("error");
      // Replaced uiToast with toast.error from sonner
      toast.error("خطأ في تسجيل الدخول", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">مرحباً بك مجدداً</h1>
            <p className="text-muted-foreground">سجل دخولك للوصول إلى حسابك</p>
          </div>

          {/* عرض تحذير للمشاكل في الاتصال */}
          {hasConnectionError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h3 className="text-red-800 font-medium">مشكلة في الاتصال</h3>
                <p className="text-red-700 text-sm">
                  يبدو أن هناك مشكلة في الاتصال بخادم البيانات. حاول مرة أخرى لاحقاً.
                </p>
              </div>
            </div>
          )}

          {/* في حالة المحاولة والتحميل المستمر لفترة طويلة */}
          {loginAttempted && isLoading && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
              <div>
                <h3 className="text-yellow-800 font-medium">جاري التحميل لفترة طويلة</h3>
                <p className="text-yellow-700 text-sm">
                  نواجه تأخيراً في الاستجابة من الخادم. يرجى الانتظار أو إعادة المحاولة.
                </p>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                            <Mail className="h-5 w-5" />
                          </span>
                          <Input
                            {...field}
                            placeholder="أدخل بريدك الإلكتروني"
                            className="pr-10 rtl"
                            autoComplete="email"
                            disabled={status === "loading"}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                            <Lock className="h-5 w-5" />
                          </span>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="أدخل كلمة المرور"
                            className="pr-10 rtl"
                            autoComplete="current-password"
                            disabled={status === "loading"}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="mr-2">جاري تسجيل الدخول...</span>
                    </div>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LoginPage;
