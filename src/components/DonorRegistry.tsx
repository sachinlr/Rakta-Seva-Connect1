import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { getCurrentLocation } from '../lib/location';
import { toast } from 'sonner';

export function DonorRegistry() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    phone: '',
    lastDonationDate: '',
    isAvailable: true,
    displayName: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        bloodGroup: profile.bloodGroup || '',
        phone: profile.phone || '',
        lastDonationDate: profile.lastDonationDate ? profile.lastDonationDate.split('T')[0] : '',
        isAvailable: profile.isAvailable ?? true,
        displayName: profile.displayName || user?.displayName || ''
      });
    } else if (user) {
      setFormData(prev => ({ ...prev, displayName: user.displayName || '' }));
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.bloodGroup) {
      toast.error('Please select a blood group');
      return;
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: formData.displayName,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
        lastDonationDate: formData.lastDonationDate ? new Date(formData.lastDonationDate).toISOString() : null,
        isAvailable: formData.isAvailable,
        location,
        createdAt: profile?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      toast.success('Profile updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Donor Profile</CardTitle>
        <CardDescription>Register as a voluntary blood donor</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.displayName} 
              onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select 
              value={formData.bloodGroup} 
              onValueChange={v => setFormData({ ...formData, bloodGroup: v })}
            >
              <SelectTrigger id="bloodGroup">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="e.g. +91 9876543210"
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastDonation">Last Donation Date</Label>
            <Input 
              id="lastDonation" 
              type="date" 
              value={formData.lastDonationDate} 
              onChange={e => setFormData({ ...formData, lastDonationDate: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 pt-2">
            <Label htmlFor="available" className="flex flex-col space-y-1">
              <span>Available for Donation</span>
              <span className="font-normal text-xs text-muted-foreground">Toggle off if you are temporarily unable to donate</span>
            </Label>
            <Switch 
              id="available" 
              checked={formData.isAvailable} 
              onCheckedChange={v => setFormData({ ...formData, isAvailable: v })}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
            {loading ? 'Saving...' : 'Update Donor Info'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
