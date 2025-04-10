import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PropertyCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden h-full">
      {/* صورة العقار (سكيلتون) */}
      <Skeleton className="w-full h-48" />
      
      <CardContent className="p-4">
        {/* العنوان (سكيلتون) */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        
        {/* السعر (سكيلتون) */}
        <Skeleton className="h-5 w-1/2 mb-3" />
        
        {/* المعلومات الإضافية (سكيلتون) */}
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {/* زر (سكيلتون) */}
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
};

export default PropertyCardSkeleton; 