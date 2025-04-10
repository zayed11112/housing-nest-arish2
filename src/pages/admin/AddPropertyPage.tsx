import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, PlusCircle, X, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyStatus, PropertyType, ResidentialUnitType, HousingCategory, AreaType, SpecialPropertyType } from "@/types";
import { useProperties } from "@/contexts/PropertiesContext";
import { toast } from "sonner";

const amenitiesList = [
  "WiFi",
  "مياه",
  "كهرباء",
  "غاز",
  "أثاث",
  "تكييف",
  "مطبخ",
  "غسالة",
  "ثلاجة",
];

const propertyTypes: PropertyType[] = ["شقة", "غرفة", "سرير", "فيلا", "شاليه"];
const propertyStatuses: PropertyStatus[] = ["للإيجار", "للبيع", "للمصيف"];

const imgbbApiKey = "e5ca1f47577dd78e2b024ada3ecb6dd9";

const AddPropertyPage: React.FC = () => {
  console.log('تم تحميل صفحة إضافة العقار');
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { currentUser, isLoading: authLoading } = useAuth();
  const { addProperty, isLoading: propertiesLoading } = useProperties();
  
  // إضافة حالة تتبع الاتصال
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // تعيين عنوان الصفحة عند التحميل
    document.title = "إضافة عقار جديد - شركة السهم";
    
    // إعادة المحاولة في حالة فشل الاتصال
    if (connectionError) {
      const timer = setTimeout(() => {
        console.log('إعادة محاولة الاتصال بعد فشل سابق...');
        setConnectionError(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    console.log('تنفيذ useEffect في صفحة إضافة العقار');
    console.log('معلومات المستخدم:', currentUser);
    console.log('حالة التحميل:', authLoading);
    
    if (!authLoading && (!currentUser || currentUser.role !== "admin")) {
      console.error('المستخدم ليس مسؤولاً:', currentUser?.role);
      uiToast({
        title: "تنبيه الوصول",
        description: "ليس لديك صلاحيات للوصول إلى هذه الصفحة",
        variant: "destructive",
      });
      
      navigate("/");
    }
  }, [currentUser, navigate, authLoading, uiToast]);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rooms: 1,
    beds: 1,
    price: 0,
    discount: 0,
    property_type: "شقة" as PropertyType,
    status: "للإيجار" as PropertyStatus,
    amenities: [] as string[],
    images: [] as string[],
    description: "",
    available: true,
    residential_unit_type: undefined as ResidentialUnitType | undefined,
    housing_category: undefined as HousingCategory | undefined,
    area_type: undefined as AreaType | undefined,
    special_property_type: undefined as SpecialPropertyType | undefined,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["rooms", "beds", "price", "discount"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const amenities = [...prev.amenities];
      if (amenities.includes(amenity)) {
        return {
          ...prev,
          amenities: amenities.filter((a) => a !== amenity),
        };
      } else {
        return {
          ...prev,
          amenities: [...amenities, amenity],
        };
      }
    });
  };

  const toggleAvailability = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      available: checked,
    }));
  };
  
  const uploadImageToImgbb = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', imgbbApiKey);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`فشل في تحميل الصورة: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Use display_url as it's the direct link to the image
        return data.data.display_url;
      } else {
        throw new Error('فشل في تحميل الصورة: خطأ في استجابة الخادم');
      }
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      uiToast({
        title: "خطأ في التحميل",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      uiToast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the file size is less than 2MB
    if (file.size > 2 * 1024 * 1024) {
      uiToast({
        title: "حجم الملف كبير جدًا",
        description: "يجب أن يكون حجم الصورة أقل من 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }
    
    const imageUrl = await uploadImageToImgbb(file);
    
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      toast.success("تمت إضافة الصورة بنجاح");
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      uiToast({
        title: "الرابط فارغ",
        description: "يرجى إدخال رابط صورة صالح",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageUrl.match(/^(http|https):\/\/[^ "]+$/)) {
      uiToast({
        title: "رابط غير صالح",
        description: "يرجى إدخال رابط صورة صالح يبدأ بـ http:// أو https://",
        variant: "destructive",
      });
      return;
    }
    
    // Add the image URL to formData
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
    
    // Reset image URL input
    setImageUrl("");
    
    toast.success("تمت إضافة الصورة بنجاح");
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('تم النقر على زر إرسال نموذج إضافة العقار');
    
    // التحقق من حالة تسجيل الدخول
    if (!currentUser && !localStorage.getItem("housing_nest_user")) {
      uiToast({
        title: "غير مسجل دخول",
        description: "يرجى تسجيل الدخول لإضافة عقار جديد",
        variant: "destructive",
      });
      return;
    }
    
    // التحقق من البيانات المطلوبة
    if (formData.images.length === 0) {
      console.warn('تنبيه: لم يتم إضافة صور للعقار');
      uiToast({
        title: "لا توجد صور للعقار",
        description: "يرجى إضافة صورة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name.trim() || !formData.location.trim()) {
      console.warn('تنبيه: البيانات المطلوبة غير مكتملة');
      uiToast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("بدء إرسال بيانات العقار:", formData);
      
      // إنشاء نسخة من البيانات للإرسال
      const propertyData = {
        name: formData.name,
        location: formData.location,
        rooms: formData.rooms,
        beds: formData.beds,
        price: formData.price,
        discount: formData.discount,
        property_type: formData.property_type,
        status: formData.status,
        amenities: formData.amenities,
        images: formData.images,
        description: formData.description,
        available: formData.available,
        residential_unit_type: formData.residential_unit_type,
        housing_category: formData.housing_category,
        area_type: formData.area_type,
        special_property_type: formData.special_property_type,
      };
      
      console.log("بيانات العقار المعدة للإرسال:", propertyData);
      
      // استدعاء وظيفة إضافة العقار
      const result = await addProperty(propertyData);
      
      console.log('نتيجة إضافة العقار:', result);
      console.log('تمت إضافة العقار بنجاح، جاري التنقل إلى صفحة إدارة العقارات');
      
      toast.success("تمت إضافة العقار بنجاح");
      
      // تأخير قليل للتأكد من عرض رسالة النجاح قبل التنقل
      setTimeout(() => {
        navigate("/admin/properties");
      }, 500);
      
    } catch (error) {
      console.error("خطأ في إضافة العقار:", error);
      
      // تحقق مما إذا كانت المشكلة متعلقة بالاتصال
      if (error instanceof Error && 
         (error.message.includes('network') || 
          error.message.includes('connection') || 
          error.message.includes('timeout'))) {
        
        setConnectionError(true);
        uiToast({
          title: "مشكلة في الاتصال",
          description: "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message.includes('لديك صلاحية')) {
        uiToast({
          title: "خطأ في الصلاحيات",
          description: "يجب أن تكون مسؤولاً لإضافة عقار جديد",
          variant: "destructive",
        });
      } else {
        uiToast({
          title: "فشل إضافة العقار",
          description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout hideBottomNav>
        <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/properties")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">إضافة عقار جديد</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="mt-16 mb-24 flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">جاري التحميل...</p>
            <p className="text-sm text-muted-foreground mt-2">يتم التحقق من صلاحيات الوصول</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <AppLayout hideBottomNav>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/properties")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">إضافة عقار جديد</h1>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </div>

      <div className="mt-16 mb-24">
        <form id="property-form" onSubmit={(e) => {
          e.preventDefault(); // منع السلوك الافتراضي للنموذج
          handleSubmit(e);
        }} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العقار</Label>
            <Input
              id="name"
              name="name"
              placeholder="اسم العقار"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">الموقع</Label>
            <Input
              id="location"
              name="location"
              placeholder="العنوان التفصيلي"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rooms">عدد الغرف</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                min="1"
                value={formData.rooms}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beds">عدد الأسرّة</Label>
              <Input
                id="beds"
                name="beds"
                type="number"
                min="1"
                value={formData.beds}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="property_type">نوع العقار</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value: PropertyType) =>
                  setFormData({ ...formData, property_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العقار" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">حالة العقار</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PropertyStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة العقار" />
                </SelectTrigger>
                <SelectContent>
                  {propertyStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">السعر (جنيه)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">الخصم (جنيه)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min="0"
                value={formData.discount}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المرافق المتوفرة</Label>
            <div className="grid grid-cols-2 gap-2 border border-border rounded-lg p-4">
              {amenitiesList.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id={`amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`}>{amenity}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف العقار</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="أدخل وصفاً تفصيلياً للعقار"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>متاح للحجز</Label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={toggleAvailability}
              />
              <Label htmlFor="available">
                {formData.available ? "متاح" : "غير متاح"}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium mb-2 block">صور العقار</Label>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 ml-2" />
                      تحميل صورة
                    </>
                  )}
                </Button>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="أو أدخل رابط الصورة"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleAddImageUrl}
                    disabled={isUploading}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    إضافة
                  </Button>
                </div>
              </div>
              
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group border border-border rounded-md overflow-hidden">
                      <img 
                        src={url} 
                        alt={`صورة ${index + 1}`} 
                        className="w-full h-24 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">لم يتم إضافة صور بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">قم بتحميل الصور أو إضافة روابط مباشرة</p>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-4 border-b pb-2">التصنيفات الإضافية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="residential_unit_type">نوع الوحدة السكنية</Label>
              <Select
                value={formData.residential_unit_type || "none"}
                onValueChange={(value: ResidentialUnitType | "none") =>
                  setFormData({ ...formData, residential_unit_type: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوحدة السكنية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  <SelectItem value="أوضة سنجل">أوضة سنجل</SelectItem>
                  <SelectItem value="أوضة دابل">أوضة دابل</SelectItem>
                  <SelectItem value="شقة غرفتين">شقة غرفتين</SelectItem>
                  <SelectItem value="شقة ثلاث غرف">شقة ثلاث غرف</SelectItem>
                  <SelectItem value="استوديو">استوديو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="housing_category">فئة الإسكان</Label>
              <Select
                value={formData.housing_category || "none"}
                onValueChange={(value: HousingCategory | "none") =>
                  setFormData({ ...formData, housing_category: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة الإسكان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  <SelectItem value="بنات">بنات</SelectItem>
                  <SelectItem value="اولاد">اولاد</SelectItem>
                  <SelectItem value="مصيف">مصيف</SelectItem>
                  <SelectItem value="عائلات">عائلات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="area_type">المنطقة</Label>
              <Select
                value={formData.area_type || "none"}
                onValueChange={(value: AreaType | "none") =>
                  setFormData({ ...formData, area_type: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  <SelectItem value="المساعيد">المساعيد</SelectItem>
                  <SelectItem value="الاداري">الاداري</SelectItem>
                  <SelectItem value="برادا">برادا</SelectItem>
                  <SelectItem value="قرية سما">قرية سما</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="special_property_type">نوع العقار الخاص</Label>
              <Select
                value={formData.special_property_type || "none"}
                onValueChange={(value: SpecialPropertyType | "none") =>
                  setFormData({ ...formData, special_property_type: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العقار الخاص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">عادي</SelectItem>
                  <SelectItem value="شقق لقطة">شقق لقطة</SelectItem>
                  <SelectItem value="عروض شركة السهم">عروض شركة السهم</SelectItem>
                  <SelectItem value="شقق VIP">شقق VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-20"></div> {/* Spacer to avoid overlap with fixed button */}
        </form>
        
        {/* زر احتياطي في حالة وجود مشكلة في زر الإرسال الثابت */}
        <div className="flex justify-center mb-12">
          <Button
            type="button"
            className="w-3/4"
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                جاري الإضافة...
              </span>
            ) : (
              <span className="flex items-center">
                <PlusCircle className="h-4 w-4 ml-2" />
                إضافة العقار
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <Button
          type="submit"
          form="property-form"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
              جاري الإضافة...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <PlusCircle className="h-4 w-4 ml-2" />
              إضافة العقار
            </span>
          )}
        </Button>
      </div>
    </AppLayout>
  );
};

export default AddPropertyPage;
