import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// Removed useToast import
import { toast } from "sonner"; // Import sonner toast
import { useApp } from "@/contexts/AppContext"; // Use main hook
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

const EditPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Removed useToast hook call
  const { auth, properties: propertiesContext } = useApp();
  const { currentUser } = auth;
  const { properties, updateProperty } = propertiesContext;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (currentUser?.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // تحميل بيانات العقار
  useEffect(() => {
    if (!id) return;
    
    const loadPropertyData = async () => {
      try {
        console.log('Fetching property data for ID:', id);
        const property = await propertiesContext.getPropertyById(id);
        
        if (!property) {
          console.log('Property not found for ID:', id);
          // Use sonner toast.error
          toast.error("العقار غير موجود");
          navigate("/admin/properties");
          return;
        }
        
        console.log('Found property:', property);
        setFormData({
          name: property.name,
          location: property.location,
          rooms: property.rooms,
          beds: property.beds || 1,
          price: property.price,
          discount: property.discount || 0,
          property_type: property.property_type || "شقة",
          status: property.status || "للإيجار",
          amenities: property.amenities,
          images: property.images,
          description: property.description,
          available: property.available,
          residential_unit_type: property.residential_unit_type,
          housing_category: property.housing_category,
          area_type: property.area_type,
          special_property_type: property.special_property_type || 'عادي'
        });
      } catch (error) {
        console.error('Error loading property:', error);
        // Use sonner toast.error
        toast.error("خطأ في تحميل بيانات العقار", {
          description: "حدث خطأ أثناء تحميل بيانات العقار",
        });
        navigate("/admin/properties");
      }
    };
    
    loadPropertyData();
  }, [id, navigate, propertiesContext]); // Removed toast from dependency array

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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
  
  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      // Use sonner toast.error
      toast.error("الرابط فارغ", {
        description: "يرجى إدخال رابط صورة صالح",
      });
      return;
    }
    
    if (!imageUrl.match(/^(http|https):\/\/[^ "]+$/)) {
      // Use sonner toast.error
      toast.error("رابط غير صالح", {
        description: "يرجى إدخال رابط صورة صالح يبدأ بـ http:// أو https://",
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
    
    // Use sonner toast.success
    toast.success("تمت إضافة الصورة بنجاح");
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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
      // Use sonner toast.error
      toast.error("خطأ في التحميل", {
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
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
      // Use sonner toast.error
      toast.error("نوع ملف غير مدعوم", {
        description: "يرجى اختيار ملف صورة صالح",
      });
      return;
    }
    
    // Check if the file size is less than 2MB
    if (file.size > 2 * 1024 * 1024) {
      // Use sonner toast.error
      toast.error("حجم الملف كبير جدًا", {
        description: "يجب أن يكون حجم الصورة أقل من 2 ميجابايت",
      });
      return;
    }
    
    const imageUrl = await uploadImageToImgbb(file);
    
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      // Use sonner toast.success
      toast.success("تمت إضافة الصورة بنجاح");
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    // التحقق من البيانات المطلوبة
    if (!formData.name.trim()) {
      // Use sonner toast.error
      toast.error("اسم العقار مطلوب", {
        description: "يرجى إدخال اسم العقار",
      });
      return;
    }

    if (!formData.location.trim()) {
      // Use sonner toast.error
      toast.error("موقع العقار مطلوب", {
        description: "يرجى إدخال موقع العقار",
      });
      return;
    }

    if (formData.price <= 0) {
      // Use sonner toast.error
      toast.error("السعر غير صحيح", {
        description: "يجب أن يكون السعر أكبر من صفر",
      });
      return;
    }

    if (formData.images.length === 0) {
      // Use sonner toast.error
      toast.error("الصور مطلوبة", {
        description: "يرجى إضافة صورة واحدة على الأقل",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        rooms: formData.rooms,
        beds: formData.beds,
        price: formData.price,
        discount: formData.discount || 0,
        property_type: formData.property_type,
        status: formData.status,
        amenities: formData.amenities,
        images: formData.images,
        description: formData.description?.trim() || '',
        available: formData.available,
        residential_unit_type: formData.residential_unit_type,
        housing_category: formData.housing_category,
        area_type: formData.area_type,
        special_property_type: formData.special_property_type || 'عادي'
      };

      console.log('بيانات التحديث:', updateData);
      await updateProperty(id, updateData);
      
      // Use sonner toast.success
      toast.success("تم تحديث العقار بنجاح");
      
      // تأخير قليل قبل الانتقال للتأكد من ظهور رسالة النجاح
      setTimeout(() => {
        navigate("/admin/properties");
      }, 500);
      
    } catch (error) {
      console.error('خطأ في تحديث العقار:', error);
      // Use sonner toast.error
      toast.error("فشل تحديث العقار", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser?.role !== "admin") {
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
        <h1 className="font-bold text-lg">تعديل العقار</h1>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </div>

      <div className="mt-16 mb-24">
        <form id="edit-property-form" onSubmit={handleSubmit} className="space-y-6">
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
            <Label>صور العقار</Label>
            <div className="border border-border rounded-lg p-4">
              {formData.images.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden h-40">
                      <img
                        src={image}
                        alt={`العقار ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 left-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
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
                      placeholder="أو أدخل رابط الصورة (URL)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddImageUrl} 
                      className="flex-shrink-0"
                      disabled={isUploading}
                    >
                      <PlusCircle className="h-4 w-4 ml-2" />
                      إضافة
                    </Button>
                  </div>
                </div>
                
                {formData.images.length === 0 && (
                  <div className="flex items-center justify-center border border-dashed border-border rounded-lg h-40 bg-muted/50">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        يرجى إضافة صور للعقار عن طريق تحميلها أو إضافة روابط
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <Button
          className="w-full"
          form="edit-property-form"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "جاري التحديث..." : "حفظ التغييرات"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default EditPropertyPage;
