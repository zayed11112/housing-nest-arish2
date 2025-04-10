import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  User, 
  LogOut, 
  School, 
  BookOpen, 
  Mail, 
  Settings, 
  Edit, 
  Phone,
  X,
  Save,
  Upload,
  Camera,
  Trash2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// قائمة الكليات
const FACULTIES = [
  "كلية طب الأسنان – Dentistry (DENT)",
  "كلية الصيدلة – Pharmacy (PHAR)",
  "كلية الهندسة – Engineering (ENG)",
  "كلية تكنولوجيا المعلومات وعلوم الحاسب – Computer Science (CS)",
  "كلية إدارة الأعمال – Business Administration (BA)",
  "كلية الإعلام – Mass Communication (MC)",
  "أخرى"
];

// مفتاح API لـ imgbb
const IMGBB_API_KEY = "d4c80caf18ac57a20be196713f4245c2";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading, updateProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: "",
    faculty: "",
    batch: "",
    student_id: "",
    phone: ""
  });
  
  // تحديث البيانات عند تحميل المستخدم
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        faculty: currentUser.faculty || "",
        batch: currentUser.batch || "",
        student_id: currentUser.student_id || "",
        phone: currentUser.phone || ""
      });
      
      // لإصلاح المشكلة - طباعة بيانات المستخدم للتشخيص
      console.log("بيانات المستخدم الحالي:", currentUser);
    }
  }, [currentUser]);
  
  // التحقق من تسجيل دخول المستخدم وإعادة التوجيه إذا لم يكن مسجلاً
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  // معالجة تغيير قيم النموذج
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // معالجة تغيير القائمة المنسدلة
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      faculty: value
    }));
  };
  
  // وظيفة لرفع الصورة إلى imgbb
  const uploadImageToImgbb = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`فشل رفع الصورة: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`فشل رفع الصورة: ${data.error?.message || 'خطأ غير معروف'}`);
      }
      
      // استخدام رابط الصورة المباشر بدلاً من صفحة الموقع
      return data.data.display_url;
    } catch (error) {
      console.error("Error uploading to imgbb:", error);
      throw new Error(error instanceof Error ? error.message : "فشل رفع الصورة لسبب غير معروف");
    }
  };
  
  // معالجة تغيير الصورة
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.includes('image/')) {
      toast.error("الرجاء اختيار ملف صورة صالح");
      return;
    }
    
    // التحقق من حجم الملف (أقل من 2 ميجابايت)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }
    
    try {
      setIsUploading(true);
      const imageUrl = await uploadImageToImgbb(file);
      
      // تحديث الصورة في الملف الشخصي
      const result = await updateProfile(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        imageUrl
      );
      
      if (result.success) {
        toast.success("تم تحديث صورة الملف الشخصي بنجاح");
      } else {
        toast.error("فشل في تحديث صورة الملف الشخصي");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // فتح مربع حوار اختيار الملف
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // إزالة الصورة الحالية
  const handleRemoveImage = async () => {
    if (!currentUser?.avatar_url) return;
    
    try {
      setIsRemoving(true);
      
      const result = await updateProfile(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        null
      );
      
      if (result.success) {
        toast.success("تم إزالة صورة الملف الشخصي بنجاح");
      } else {
        toast.error("فشل في إزالة صورة الملف الشخصي");
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء إزالة الصورة");
    } finally {
      setIsRemoving(false);
    }
  };
  
  // حفظ البيانات
  const handleSaveProfile = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await updateProfile(
        formData.name,
        formData.student_id,
        formData.faculty,
        formData.batch,
        formData.phone
      );
      
      toast.success("تم تحديث بياناتك بنجاح");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث البيانات");
    } finally {
      setIsSaving(false);
    }
  };

  // إذا لم يكن هناك مستخدم، إرجع null لأن useEffect سيقوم بإعادة التوجيه
  if (!currentUser) {
    return null;
  }

  // استخراج المعلومات من كائن المستخدم
  const userInfo = {
    name: currentUser.name || "مستخدم جديد",
    role: currentUser.role === "user" ? "طالب" : 
           currentUser.role === "admin" ? "مدير" : "زائر",
    email: currentUser.email || "غير متوفر",
    student_id: currentUser.student_id || "",
    faculty: currentUser.faculty || "",
    batch: currentUser.batch || "",
    phone: currentUser.phone || "",
    avatar_url: currentUser.avatar_url || ""
  };

  return (
    <AppLayout title="الملف الشخصي" hideBottomNav={false}>
      {isLoading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 overflow-hidden group">
                {userInfo.avatar_url ? (
                  <img
                    src={userInfo.avatar_url}
                    alt={userInfo.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
                
                {/* طبقة تفاعلية لتغيير الصورة */}
                <div 
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full"
                  onClick={handleImageUploadClick}
                >
                  <div className="text-white flex flex-col items-center cursor-pointer">
                    {isUploading ? (
                      <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin mb-1"></div>
                    ) : (
                      <Camera className="h-6 w-6 mb-1" />
                    )}
                    <span className="text-xs">تغيير الصورة</span>
                  </div>
                </div>
                
                {/* زر تغيير الصورة */}
                <DropdownMenu open={isImageMenuOpen} onOpenChange={setIsImageMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer shadow-md">
                      {isUploading || isRemoving ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem onClick={handleImageUploadClick}>
                      <Upload className="h-4 w-4 ml-2" />
                      <span>رفع صورة جديدة</span>
                    </DropdownMenuItem>
                    {userInfo.avatar_url && (
                      <DropdownMenuItem onClick={handleRemoveImage}>
                        <Trash2 className="h-4 w-4 ml-2 text-destructive" />
                        <span className="text-destructive">إزالة الصورة الحالية</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* حقل إدخال الصورة (مخفي) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-bold">{userInfo.name}</h2>
            <p className="text-muted-foreground">{userInfo.role}</p>
          </div>

          {/* معلومات الطالب */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">معلومات الطالب</h3>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل البيانات
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>تعديل المعلومات الشخصية</DialogTitle>
                    <DialogDescription>
                      قم بتحديث معلوماتك الشخصية ثم اضغط حفظ لتطبيق التغييرات
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="أدخل اسمك الكامل"
                        className="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_id">الرقم التعريفي (ID)</Label>
                      <Input
                        id="student_id"
                        name="student_id"
                        value={formData.student_id}
                        onChange={handleInputChange}
                        placeholder="أدخل الرقم التعريفي الخاص بك"
                        className="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty">الكلية</Label>
                      <Select
                        value={formData.faculty}
                        onValueChange={handleSelectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الكلية" />
                        </SelectTrigger>
                        <SelectContent>
                          {FACULTIES.map((faculty) => (
                            <SelectItem key={faculty} value={faculty}>
                              {faculty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batch">الدفعة/السنة الدراسية</Label>
                      <Input
                        id="batch"
                        name="batch"
                        value={formData.batch}
                        onChange={handleInputChange}
                        placeholder="أدخل الدفعة أو السنة الدراسية"
                        className="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="أدخل رقم الهاتف"
                        className="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </DialogClose>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 ml-2" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {userInfo.student_id ? (
                <div className="flex items-center">
                  <User className="h-5 w-5 ml-2 text-muted-foreground" />
                  <span className="text-muted-foreground">الرقم التعريفي:</span>
                  <span className="mr-2">{userInfo.student_id}</span>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <User className="h-5 w-5 ml-2" />
                  <span>الرقم التعريفي: غير محدد</span>
                </div>
              )}
              {userInfo.faculty ? (
                <div className="flex items-center">
                  <School className="h-5 w-5 ml-2 text-muted-foreground" />
                  <span className="text-muted-foreground">الكلية:</span>
                  <span className="mr-2">{userInfo.faculty}</span>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <School className="h-5 w-5 ml-2" />
                  <span>الكلية: غير محددة</span>
                </div>
              )}
              {userInfo.batch ? (
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 ml-2 text-muted-foreground" />
                  <span className="text-muted-foreground">الدفعة:</span>
                  <span className="mr-2">{userInfo.batch}</span>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="h-5 w-5 ml-2" />
                  <span>الدفعة: غير محددة</span>
                </div>
              )}
              {userInfo.phone ? (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 ml-2 text-muted-foreground" />
                  <span className="text-muted-foreground">رقم الهاتف:</span>
                  <span className="mr-2">{userInfo.phone}</span>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-5 w-5 ml-2" />
                  <span>رقم الهاتف: غير محدد</span>
                </div>
              )}
            </div>
          </div>

          {/* لوحة الإدارة */}
          {currentUser.role === "admin" && (
            <div className="bg-primary/10 border border-border rounded-lg p-4 mb-6">
              <h3 className="font-bold text-lg mb-4">الإدارة</h3>
              <Button 
                className="w-full" 
                onClick={() => navigate("/admin")}
              >
                <Settings className="h-4 w-4 ml-2" />
                الذهاب إلى لوحة التحكم
              </Button>
            </div>
          )}

          {/* معلومات الاتصال */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-4">معلومات الاتصال</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 ml-2 text-muted-foreground" />
                <span className="text-muted-foreground">البريد الإلكتروني:</span>
                <span className="mr-2">
                  {userInfo.email}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="text-center bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
            <p className="text-amber-800 font-medium">
              قم بتحديث معلوماتك الشخصية وصورتك الشخصية باستخدام أزرار التعديل المتاحة
            </p>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </>
      )}
    </AppLayout>
  );
};

export default ProfilePage; 