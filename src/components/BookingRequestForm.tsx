import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Faculty } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// تعريف الكليات بما يتوافق مع نوع Faculty في ملف types/index.ts
const faculties: Faculty[] = [
  "كلية طب الأسنان – Dentistry (DENT)",
  "كلية الصيدلة – Pharmacy (PHAR)",
  "كلية الهندسة – Engineering (ENG)",
  "كلية تكنولوجيا المعلومات وعلوم الحاسب – Computer Science (CS)",
  "كلية إدارة الأعمال – Business Administration (BA)",
  "كلية الإعلام – Mass Communication (MC)",
  "أخرى",
];

interface BookingRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    faculty: Faculty;
    batch: string;
    phone: string;
    alternativePhone?: string;
  }) => void;
  isSubmitting: boolean;
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  // Update to use refactored useApp
  const { auth } = useApp(); 
  const { currentUser } = auth; // Destructure currentUser
  
  const [formData, setFormData] = useState({
    fullName: "",
    faculty: "" as Faculty,
    batch: "",
    phone: "",
    alternativePhone: "",
  });
  const [formErrors, setFormErrors] = useState({
    fullName: false,
    faculty: false,
    batch: false,
    phone: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill form with user data when available
  useEffect(() => {
    if (currentUser) {
      // تحقق مما إذا كانت قيمة faculty من currentUser هي قيمة صالحة من نوع Faculty
      const userFaculty = currentUser.faculty;
      const isValidFaculty = userFaculty ? faculties.includes(userFaculty as Faculty) : false;
      
      setFormData(prev => ({
        ...prev,
        fullName: currentUser.fullName || "",
        faculty: isValidFaculty ? (userFaculty as Faculty) : "" as Faculty,
        batch: currentUser.batch || "",
      }));
    }
    // عند فتح النموذج، نقوم بإعادة تعيين أخطاء النموذج ورسالة الخطأ
    setFormErrors({
      fullName: false,
      faculty: false,
      batch: false,
      phone: false,
    });
    setSubmitError(null);
  }, [currentUser, isOpen]);

  const validateForm = () => {
    const errors = {
      fullName: !formData.fullName.trim(),
      faculty: !formData.faculty,
      batch: !formData.batch.trim(),
      phone: !formData.phone.trim() || !/^\d{10,11}$/.test(formData.phone.trim()),
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (validateForm()) {
      try {
        onSubmit(formData);
      } catch (error) {
        setSubmitError("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
        console.error("Error submitting booking request:", error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // إعادة تعيين خطأ الحقل عند الكتابة فيه
    setFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, faculty: value as Faculty }));
    // إعادة تعيين خطأ الكلية عند اختيار قيمة
    setFormErrors(prev => ({ ...prev, faculty: false }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>طلب حجز</DialogTitle>
          <DialogDescription>
            يرجى ملء جميع الحقول المطلوبة لإرسال طلب الحجز
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName" className={formErrors.fullName ? "text-destructive" : ""}>الاسم بالكامل</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="أدخل اسمك بالكامل"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              disabled={!!currentUser?.fullName}
              className={formErrors.fullName ? "border-destructive" : ""}
            />
            {formErrors.fullName && (
              <p className="text-destructive text-sm">يرجى إدخال الاسم بالكامل</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty" className={formErrors.faculty ? "text-destructive" : ""}>الكلية</Label>
            <Select
              value={formData.faculty}
              onValueChange={handleSelectChange}
              required
              disabled={!!currentUser?.faculty}
            >
              <SelectTrigger className={formErrors.faculty ? "border-destructive" : ""}>
                <SelectValue placeholder="اختر كليتك" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.faculty && (
              <p className="text-destructive text-sm">يرجى اختيار الكلية</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch" className={formErrors.batch ? "text-destructive" : ""}>دفعة</Label>
            <Input
              id="batch"
              name="batch"
              placeholder="مثال: 2024"
              value={formData.batch}
              onChange={handleInputChange}
              required
              disabled={!!currentUser?.batch}
              className={formErrors.batch ? "border-destructive" : ""}
            />
            {formErrors.batch && (
              <p className="text-destructive text-sm">يرجى إدخال الدفعة</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className={formErrors.phone ? "text-destructive" : ""}>رقم الهاتف</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="أدخل رقم هاتفك"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className={formErrors.phone ? "border-destructive" : ""}
            />
            {formErrors.phone && (
              <p className="text-destructive text-sm">يرجى إدخال رقم هاتف صحيح (10-11 رقم)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternativePhone">رقم هاتف بديل (اختياري)</Label>
            <Input
              id="alternativePhone"
              name="alternativePhone"
              type="tel"
              placeholder="أدخل رقم هاتف بديل"
              value={formData.alternativePhone}
              onChange={handleInputChange}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestForm;
