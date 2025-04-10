import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  // Update to use refactored useApp
  const { bookings: bookingsContext, properties: propertiesContext, auth } = useApp(); 
  const { bookingRequests } = bookingsContext; // Destructure bookingRequests
  const { properties } = propertiesContext; // Destructure properties
  const { currentUser } = auth; // Destructure currentUser

  if (!currentUser) {
    return (
      <AppLayout title="الحجوزات" hideBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-12">
          <CalendarClock className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">قم بتسجيل الدخول لعرض الحجوزات</h1>
          <p className="text-muted-foreground text-center mb-6">
            قم بتسجيل الدخول لإدارة طلبات الحجز الخاصة بك
          </p>
          <Button onClick={() => navigate("/login")}>تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  // Filter bookings for the current user if they're a student
  const userBookings = bookingRequests.filter(
    (booking) => currentUser.role !== "admin" ? booking.userId === currentUser.id : true
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد المراجعة";
      case "approved":
        return "تمت الموافقة";
      case "rejected":
        return "تم الرفض";
      default:
        return "غير معروف";
    }
  };

  return (
    <AppLayout title="" hideBottomNav={false}>
      {userBookings.length > 0 ? (
        <div className="space-y-4">
          {userBookings.map((booking) => {
            const property = properties.find((p) => p.id === booking.propertyId);
            if (!property) return null;

            return (
              <div
                key={booking.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                <div className="flex items-start p-4">
                  <div className="w-24 h-24 rounded-md overflow-hidden ml-4">
                    <img
                      src={
                        property.images[0] ||
                        "https://via.placeholder.com/100?text=صورة+غير+متوفرة"
                      }
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{property.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {property.location}
                    </p>
                    <div
                      className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </div>
                    <p className="text-sm mt-2">
                      تاريخ الطلب:{" "}
                      {new Date(booking.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border p-3 bg-muted/30 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <CalendarClock className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">لا توجد حجوزات</h1>
          <p className="text-muted-foreground text-center mb-6">
            لم تقم بطلب حجز أي عقار بعد
          </p>
          <Button onClick={() => navigate("/search")}>استعرض العقارات</Button>
        </div>
      )}
    </AppLayout>
  );
};

export default BookingsPage;
