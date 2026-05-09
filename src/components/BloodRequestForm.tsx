import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getCurrentLocation } from '../lib/location';
import { toast } from 'sonner';

export function BloodRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    bloodGroup: '',
    urgency: 'Standard',
    unitsNeeded: 1,
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.bloodGroup) {
      toast.error('Please select blood group needed');
      return;
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const requestId = Math.random().toString(36).substring(2, 9);
      const requestData = {
        id: requestId,
        hospitalName: formData.hospitalName,
        bloodGroup: formData.bloodGroup,
        urgency: formData.urgency,
        unitsNeeded: formData.unitsNeeded,
        location,
        status: 'Active',
        requesterId: user.uid,
        requesterPhone: formData.phone,
        acceptedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'requests', requestId), requestData);
      toast.success('Emergency alert broadcasted!');
      if (onSuccess) onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          Emergency Blood Need
        </CardTitle>
        <CardDescription>Broadcast a request to all nearby donors</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hospital">Hospital Name</Label>
            <Input 
              id="hospital" 
              placeholder="e.g. City General Hospital"
              value={formData.hospitalName} 
              onChange={e => setFormData({ ...formData, hospitalName: e.target.value })} 
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reqBloodGroup">Blood Group Needed</Label>
              <Select 
                value={formData.bloodGroup} 
                onValueChange={v => setFormData({ ...formData, bloodGroup: v })}
              >
                <SelectTrigger id="reqBloodGroup">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select 
                value={formData.urgency} 
                onValueChange={v => setFormData({ ...formData, urgency: v })}
              >
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="units">Units Needed</Label>
              <Input 
                id="units" 
                type="number" 
                min="1"
                value={formData.unitsNeeded} 
                onChange={e => setFormData({ ...formData, unitsNeeded: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reqPhone">Point of Contact Phone</Label>
              <Input 
                id="reqPhone" 
                type="tel"
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-bold" disabled={loading}>
            {loading ? 'Broadcasting...' : 'BROADCAST EMERGENCY ALERT'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
