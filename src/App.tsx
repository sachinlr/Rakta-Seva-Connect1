import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DonorRegistry } from './components/DonorRegistry';
import { BloodRequestForm } from './components/BloodRequestForm';
import { EmergencyAlerts } from './components/EmergencyAlerts';
import { HospitalDashboard } from './components/HospitalDashboard';
import { Toaster } from './components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Droplet, Heart, Shield, Users, Activity, Bell, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';

function LandingPage() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
          <Droplet className="text-white w-14 h-14" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
          RAKTA-SEVA <span className="text-red-600">CONNECT</span>
        </h1>
        <p className="text-xl text-slate-500 mt-4 max-w-lg mx-auto">
          The "Golden Hour" bridge connecting voluntary blood donors with emergencies in real-time.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mb-12">
        <div className="flex flex-col items-center">
          <div className="bg-red-50 p-3 rounded-xl mb-3 text-red-600">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Instant Alerts</h3>
          <p className="text-sm text-slate-500">Real-time notifications only for your blood group type.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-red-50 p-3 rounded-xl mb-3 text-red-600">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold">10km Proximity</h3>
          <p className="text-sm text-slate-500">Focused on local taluka level emergency responses.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-red-50 p-3 rounded-xl mb-3 text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Privacy First</h3>
          <p className="text-sm text-slate-500">Your phone number is only shared when you accept a request.</p>
        </div>
      </div>

      <Button size="lg" className="bg-red-600 hover:bg-red-700 h-14 px-10 text-lg font-bold rounded-full" onClick={signIn}>
        Get Started with Google
      </Button>
    </div>
  );
}

function MainApp() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('emergencies');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Droplet className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-lg">RAKTA-SEVA</span>
          </div>
          <Button variant="ghost" className="text-xs text-slate-500" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto p-4 pb-24">
        {!profile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-red-800"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Finish Your Profile
            </h3>
            <p className="text-sm">Please complete your donor profile to receive life-saving alerts in your area.</p>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="emergencies" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="request" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" /> Request
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergencies" className="space-y-6 focus-visible:outline-none">
            <EmergencyAlerts />
          </TabsContent>

          <TabsContent value="request" className="space-y-6 focus-visible:outline-none">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1">
                <TabsTrigger value="new">Project Requirement</TabsTrigger>
                <TabsTrigger value="history">My Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="new">
                <BloodRequestForm onSuccess={() => setActiveTab('emergencies')} />
              </TabsContent>
              <TabsContent value="history">
                <HospitalDashboard />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="profile" className="focus-visible:outline-none">
            <DonorRegistry />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Nav Simulation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 grid grid-cols-3 md:hidden z-50">
        <button 
          className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'emergencies' ? 'text-red-600' : 'text-slate-400'}`}
          onClick={() => setActiveTab('emergencies')}
        >
          <Bell className="w-6 h-6" />
          <span className="text-[10px] font-bold">ALERTS</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'request' ? 'text-red-600' : 'text-slate-400'}`}
          onClick={() => setActiveTab('request')}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold">REQUEST</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'profile' ? 'text-red-600' : 'text-slate-400'}`}
          onClick={() => setActiveTab('profile')}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-bold">PROFILE</span>
        </button>
      </nav>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-600">
        <div className="relative">
          <Droplet className="text-white w-12 h-12 animate-bounce" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 w-8 h-2 bg-red-800/30 rounded-full blur-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" expand={true} closeButton={true} />
    </AuthProvider>
  );
}
