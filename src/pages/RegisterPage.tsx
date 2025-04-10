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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff, School, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from '@/integrations/supabase/client';

// تعريف مخطط التحقق للتسجيل
const formSchema = z
  .object({
    email: z.string().email({
      message: "يرجى إدخال بريد إلكتروني صالح",
    }),
    password: z.string().min(6, {
      message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const RegisterPage = () => {
  // Removed uiToast declaration
  const navigate = useNavigate();
  const { registerUser, currentUser, isLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // إعداد نموذج React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // وظيفة التسجيل
  const onSubmit = async (values: FormValues) => {
    if (status === "loading") return;
    
    setStatus("loading");
    try {
      // إنشاء حساب فقط بالبريد الإلكتروني وكلمة المرور
      await registerUser(
        values.email, 
        values.password, 
        "", // اسم فارغ 
        // "", // Removed argument for student_id
        "", // كلية فارغة
        ""  // دفعة فارغة
      );
      
      setStatus("success");
      toast.success("تم إنشاء الحساب بنجاح");
      
      // إعادة توجيه إلى الصفحة الرئيسية بعد نجاح التسجيل
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      setStatus("error");
      // Replaced uiToast with toast.error from sonner
      toast.error("خطأ في إنشاء الحساب", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    }
  };

  return (
    <AppLayout title="إنشاء حساب جديد">
      <div className="flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* عرض تحذير للمشاكل في الاتصال */}
          {hasConnectionError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h3 className="text-red-800 font-medium">مشكلة في الاتصال</h3>
                <p className="text-red-700 text-sm">
                  يبدو أن هناك مشكلة في الاتصال بخادم البيانات. حاول مرة أخرى لاحقاً.
                </p>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                            autoComplete="new-password"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                            <Lock className="h-5 w-5" />
                          </span>
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="أعد إدخال كلمة المرور"
                            className="pr-10 rtl"
                            autoComplete="new-password"
                            disabled={status === "loading"}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="mr-2">جاري إنشاء الحساب...</span>
                    </div>
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:underline"
                    >
                      تسجيل الدخول
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RegisterPage;
