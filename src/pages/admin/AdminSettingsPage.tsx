import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
// import { useAuth } from '@/contexts/AuthContext'; // No longer needed directly
// import { useSettings } from '@/contexts/SettingsContext'; // No longer needed directly
import { useApp } from '@/contexts/AppContext'; // Import useApp hook
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  // Use the refactored useApp hook
  const { auth, settings: settingsContext, isLoading: isAppLoading } = useApp(); 
  const { currentUser } = auth; // Destructure currentUser from auth context
  // Destructure settings functions and state from settings context
  const { settings, isLoading: isLoadingSettings, getSetting, updateSetting, refreshSettings } = settingsContext; 

  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // Removed primaryColor state
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Populate form fields when settings are loaded
  useEffect(() => {
    if (!isLoadingSettings) {
      // Use default empty string or a default color if setting is not found initially
      setSiteName(getSetting('site_name', ''));
      setContactEmail(getSetting('contact_email', ''));
      // Removed primaryColor setting
    }
  }, [settings, isLoadingSettings, getSetting]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Update settings one by one
      const results = await Promise.all([
        updateSetting('site_name', siteName),
        updateSetting('contact_email', contactEmail)
        // Removed primaryColor update
      ]);

      if (results.every(r => r.success)) {
        toast.success("تم حفظ الإعدادات بنجاح.");
        // Optionally trigger theme update logic here if needed immediately
      } else {
        toast.error("فشل حفظ بعض الإعدادات.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ غير متوقع أثناء حفظ الإعدادات.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
     // Show loading or redirect placeholder while checking auth/role
    return (
      <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center">Loading user data...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideBottomNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">الإعدادات العامة</h1>
        <Button variant="ghost" size="icon" onClick={refreshSettings} disabled={isLoadingSettings} title="تحديث الإعدادات">
          <RefreshCw className={`h-5 w-5 ${isLoadingSettings ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Page Content */}
      <div className="mt-20 p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الموقع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSettings ? (
              <>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                {/* Removed primary color skeleton */}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="siteName">اسم الموقع</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="اسم الموقع الذي يظهر للمستخدمين"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="example@domain.com"
                    disabled={isSaving}
                  />
                </div>
                {/* Removed Primary Color Input */}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isLoadingSettings || isSaving}>
              {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminSettingsPage;
