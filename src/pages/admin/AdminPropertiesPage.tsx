import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash, ArrowLeft, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties } from "@/contexts/PropertiesContext";
import { toast } from "sonner";

const AdminPropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { currentUser, isLoading } = useAuth();
  const { properties, deleteProperty, duplicateProperty } = useProperties();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  // Check if the user is an admin, if not redirect to home
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "admin")) {
      uiToast({
        title: "تنبيه الوصول",
        description: "ليس لديك صلاحيات للوصول إلى هذه الصفحة",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [currentUser, navigate, isLoading, uiToast]);

  const handleDeleteProperty = async () => {
    if (propertyToDelete) {
      try {
        await deleteProperty(propertyToDelete);
        toast.success("تم حذف العقار بنجاح");
      } catch (error) {
        toast.error("فشل حذف العقار");
      } finally {
        setIsDeleteDialogOpen(false);
        setPropertyToDelete(null);
      }
    }
  };

  const handleDuplicateProperty = async (propertyId: string) => {
    try {
      await duplicateProperty(propertyId);
      toast.success("تم تكرار العقار بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل تكرار العقار");
      console.error("Error duplicating property:", error);
    }
  };

  const openDeleteDialog = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout hideBottomNav>
        <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">إدارة العقارات</h1>
          <div className="w-9 h-9"></div>
        </div>
        <div className="mt-16 mb-20">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-40 w-full" />
            ))}
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
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">إدارة العقارات</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('تم النقر على زر إضافة عقار جديد في الأعلى');
            console.log('الانتقال إلى:', '/admin/properties/add');
            navigate("/admin/properties/add");
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-16 mb-20">
        {properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
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
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        property.available
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {property.available ? "متاح" : "غير متاح"}
                    </div>
                    <p className="text-sm mt-2">
                      {property.rooms} غرف · {property.price} جنيه/شهر
                    </p>
                  </div>
                </div>
                <div className="border-t border-border p-3 bg-muted/30 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleDuplicateProperty(property.id)}
                  >
                    <Copy className="h-4 w-4 ml-1" />
                    تكرار
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() =>
                      navigate(`/admin/properties/edit/${property.id}`)
                    }
                  >
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center"
                    onClick={() => openDeleteDialog(property.id)}
                  >
                    <Trash className="h-4 w-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">لا توجد عقارات مضافة</p>
            <Button onClick={() => {
              console.log('تم النقر على زر إضافة عقار جديد الوسطي');
              console.log('الانتقال إلى:', '/admin/properties/add');
              navigate("/admin/properties/add");
            }}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عقار جديد
            </Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <Button
          className="w-full"
          onClick={() => {
            console.log('تم النقر على زر إضافة عقار جديد السفلي');
            console.log('الانتقال إلى:', '/admin/properties/add');
            navigate("/admin/properties/add");
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة عقار جديد
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا العقار بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty}>
              نعم، قم بالحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AdminPropertiesPage;
