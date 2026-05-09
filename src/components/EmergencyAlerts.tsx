import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { isWithinRadius, getDistanceKm } from '../lib/location';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, MapPin, Droplet, Phone, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getEmergencyGuidance } from '../services/geminiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export function EmergencyAlerts() {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Record<string, boolean>>({});
  const [aiGuidance, setAiGuidance] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isEligible = (lastDate: string | null) => {
    if (!lastDate) return true;
    const days = (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 90;
  };

  const currentEligibility = profile ? isEligible(profile.lastDonationDate) : true;
  const isAvailable = profile?.isAvailable ?? true;
  const canDonate = currentEligibility && isAvailable;

  const fetchAiGuidance = async (bloodGroup: string, urgency: string) => {
    setIsAiLoading(true);
    setAiGuidance('');
    const guidance = await getEmergencyGuidance(bloodGroup, urgency);
    setAiGuidance(guidance);
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    // Listen for active blood requests
    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Filter by location (10km) if user profile has location
      const nearbyRequests = data.filter(req => {
        if (!profile?.location || !req.location) return true; // Show all if location not available for filtering
        return isWithinRadius(profile.location, req.location, 10);
      });

      setRequests(nearbyRequests);

      // Simple notification for NEW requests
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const req = change.doc.data();
          if (req.bloodGroup === profile?.bloodGroup && isEligible(profile?.lastDonationDate)) {
            toast.error(`EMERGENCY: ${req.bloodGroup} needed at ${req.hospitalName}`, {
              duration: 10000,
              description: 'High Priority Alert',
              icon: <AlertCircle className="text-red-600" />
            });
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return () => unsubscribe();
  }, [profile, user]);

  const handleAccept = async (request: any) => {
    if (!user || !profile) return;
    
    try {
      // 1. Update request to add user to acceptedBy
      await updateDoc(doc(db, 'requests', request.id), {
        acceptedBy: arrayUnion(user.uid),
        updatedAt: new Date() // rules allow this
      });

      // 2. Add full profile (with phone) to private subcollection
      // This is where privacy is handled: only requester can see this.
      await setDoc(doc(db, 'requests', request.id, 'acceptedDonors', user.uid), {
        ...profile,
        updatedAt: new Date()
      });

      setAcceptedIds(prev => ({ ...prev, [request.id]: true }));
      toast.success('Response recorded. The hospital will contact you if needed.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${request.id}`);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Droplet className="w-12 h-12 mb-4 opacity-20" />
        <p>No active emergency requests in your area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <AlertCircle className="text-red-600 animate-pulse" />
        Nearby Emergencies
      </h2>
      <AnimatePresence>
        {requests.map(req => {
          const distance = profile?.location ? getDistanceKm(profile.location, req.location).toFixed(1) : null;
          const isAccepted = acceptedIds[req.id] || req.acceptedBy?.includes(user?.uid);

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-l-4 ${req.urgency === 'Critical' ? 'border-l-red-600' : 'border-l-orange-500'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={req.urgency === 'Critical' ? 'destructive' : 'secondary'}>
                        {req.urgency}
                      </Badge>
                      <CardTitle className="text-lg mt-1">{req.hospitalName}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {distance ? `${distance} km away` : req.location?.address || 'Location information available'}
                      </CardDescription>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg text-center border border-red-100 min-w-[60px]">
                      <span className="text-xs font-bold text-red-600 uppercase block">Group</span>
                      <span className="text-2xl font-black text-red-700">{req.bloodGroup}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground uppercase text-[10px] font-bold">Units Needed</span>
                      <span className="font-bold">{req.unitsNeeded}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground uppercase text-[10px] font-bold">Responded</span>
                      <span className="font-bold">{req.acceptedBy?.length || 0} Donors</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isAccepted ? (
                      <Button variant="outline" className="flex-1 border-green-600 text-green-700 bg-green-50 hover:bg-green-100" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Request Accepted
                      </Button>
                    ) : !canDonate ? (
                      <Button variant="outline" className="flex-1 border-red-200 text-red-400 font-bold" disabled>
                        {!isAvailable ? 'Unavailable' : '90-Day Wait'}
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                        onClick={() => handleAccept(req)}
                      >
                        I WANT TO DONATE
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => fetchAiGuidance(req.bloodGroup, req.urgency)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-red-600" />
                            AI Emergency Guidance
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
                              <p className="text-sm text-muted-foreground">Generating medical tips...</p>
                            </div>
                          ) : (
                            <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
                              {aiGuidance}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
