import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ArrowLeft,
  MapPin,
  BedDouble,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Tag,
  Home,
  Bed,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext"; // Use main hook
import BookingRequestForm from "@/components/BookingRequestForm";
import { Faculty } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Update to use refactored useApp
  const { 
    properties: propertiesContext, 
    favorites: favoritesContext, 
    auth, 
    // requestBooking is likely part of bookingsContext, check if needed
  } = useApp(); 
  const { properties } = propertiesContext;
  const { isPropertyInFavorites, addToFavorites, removeFromFavorites } = favoritesContext;
  const { currentUser } = auth;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const property = properties.find((p) => p.id === id);
  const isFavorite = property ? isPropertyInFavorites(property.id) : false;

  const nextImage = () => {
    if (property) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (property) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  if (!property) {
    return (
      <AppLayout hideBottomNav>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">العقار غير موجود</h1>
          <Button onClick={() => navigate("/search")}>العودة للبحث</Button>
        </div>
      </AppLayout>
    );
  }

  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(property.id);
        toast({
          title: "تم الإزالة من المفضلة",
          description: "تم إزالة العقار من قائمة المفضلة بنجاح",
        });
      } else {
        await addToFavorites(property.id);
        toast({
          title: "تمت الإضافة للمفضلة",
          description: "تمت إضافة العقار إلى قائمة المفضلة بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث قائمة المفضلة",
        variant: "destructive",
      });
    }
  };

  const handleBookingRequest = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setIsBookingFormOpen(true);
  };

  const handleBookingSubmit = async (formData: {
    fullName: string;
    faculty: Faculty;
    batch: string;
    phone: string;
    alternativePhone?: string;
  }) => {
    if (!property || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      // تحضير البيانات للإرسال
      const bookingData = {
        property_id: property.id,
        user_id: currentUser.id,
        full_name: formData.fullName,
        faculty: formData.faculty,
        batch: formData.batch,
        phone: formData.phone,
        alternative_phone: formData.alternativePhone || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('إرسال بيانات الحجز:', bookingData);
      console.log('Using user_id:', currentUser.id); // Log the user ID
      
      // حفظ طلب الحجز في قاعدة البيانات
      // Remove .select() - it might cause issues and isn't needed here
      const { error } = await supabase.from("booking_requests").insert(bookingData); 

      // Log the result immediately (error only)
      console.log('Supabase insert result:', { error });

      if (error) {
        console.error('خطأ في إرسال طلب الحجز (Supabase):', error);
        throw error;
      }

      // تحديث واجهة المستخدم بعد نجاح العملية
      toast({
        title: "تم إرسال طلب الحجز",
        description:
          "تم إرسال طلب الحجز بنجاح. سنتواصل معك قريباً لتأكيد الحجز.",
      });
      
      setIsBookingFormOpen(false);
    } catch (error: any) { // Add :any to type error for accessing message
      console.error('خطأ في إرسال طلب الحجز:', error);
      // Display the specific Supabase error message
      const errorMessage = error?.message || "لم نتمكن من إرسال طلب الحجز";
      toast({
        title: "حدث خطأ",
        description: errorMessage, // Use the specific error message here
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout hideBottomNav>
      <div className="pb-20">
        {/* Header with back button */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">{property.name}</h1>
          <Button variant="ghost" size="icon" onClick={handleFavoriteToggle}>
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </Button>
        </div>

        {/* Property images gallery */}
        <div className="mt-16 mb-4">
          <div className="relative overflow-hidden rounded-lg">
            <div className="relative h-72">
              <img
                src={property.images[currentImageIndex] || "https://via.placeholder.com/600x400?text=صورة+غير+متوفرة"}
                alt={`${property.name} - صورة ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {property.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {!property.available && (
                <div className="absolute top-0 right-0 left-0 bottom-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full text-base font-bold">
                    غير متاح
                  </span>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${property.name} - صورة مصغرة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property details */}
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold mb-2">{property.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 ml-1" />
            <span>{property.location}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <Home className="h-5 w-5 ml-1" />
              <span>{property.property_type}</span>
            </div>
            <div className="flex items-center">
              <Tag className="h-5 w-5 ml-1" />
              <span>{property.status}</span>
            </div>
            <div className="flex items-center">
              <BedDouble className="h-5 w-5 ml-1" />
              <span>{property.rooms} غرف</span>
            </div>
            <div className="flex items-center">
              <Bed className="h-5 w-5 ml-1" />
              <span>{property.beds} سرير</span>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">السعر</h2>
            <p className="text-2xl font-bold text-primary">
              {property.price} <span className="text-base">جنيه/شهر</span>
            </p>
            {property.discount > 0 && (
              <p className="text-sm text-red-500 mt-1">
                خصم: {property.discount} جنيه
              </p>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">المرافق المتاحة</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">وصف العقار</h2>
            <p className="text-muted-foreground">{property.description}</p>
          </div>
        </div>

        {/* Action buttons at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex items-center justify-between gap-2">
          <Button
            disabled={!property.available}
            onClick={handleBookingRequest}
            className="flex-1"
          >
            {property.available ? "طلب حجز" : "غير متاح للحجز"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("tel:01093130120")}
            className="flex items-center"
          >
            <Phone className="h-5 w-5 ml-1" />
            <span>اتصال</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://wa.me/201093130120")}
            className="flex items-center"
          >
            <MessageSquare className="h-5 w-5 ml-1" />
            <span>واتساب</span>
          </Button>
        </div>

        {/* Booking Request Form */}
        <BookingRequestForm
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          onSubmit={handleBookingSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default PropertyDetailsPage;
