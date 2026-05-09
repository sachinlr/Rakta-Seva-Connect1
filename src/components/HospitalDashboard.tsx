import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Phone, CheckCircle, XCircle, Users, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

function AcceptedDonorsList({ requestId }: { requestId: string }) {
  const [donors, setDonors] = useState<any[]>([]);

  useEffect(() => {
    // Listen to the private subcollection where donors share their info with the hospital
    const q = collection(db, 'requests', requestId, 'acceptedDonors');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDonors(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, [requestId]);

  if (donors.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No donors have accepted this request yet.</p>;
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Users className="w-4 h-4" />
        Accepted Donors ({donors.length})
      </h3>
      {donors.map((donor, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-muted">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{donor.displayName?.substring(0, 2) || 'DN'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{donor.displayName}</p>
              <p className="text-xs text-muted-foreground">{donor.bloodGroup} Donor</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="gap-2">
            <a href={`tel:${donor.phone}`}>
              <Phone className="w-3 h-3" />
              Call
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}

export function HospitalDashboard() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('requesterId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'requests', id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Active Requests</h2>
      {myRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>You haven't posted any blood requests yet.</p>
        </div>
      ) : (
        myRequests.map(req => (
          <Card key={req.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge variant={req.status === 'Active' ? 'default' : 'secondary'}>{req.status}</Badge>
                    <Badge variant="outline">{req.bloodGroup}</Badge>
                  </div>
                  <CardTitle className="text-lg">{req.hospitalName}</CardTitle>
                  <CardDescription>Posted on {req.createdAt?.toDate().toLocaleDateString()}</CardDescription>
                </div>
                {req.status === 'Active' && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="text-green-600" onClick={() => updateStatus(req.id, 'Fulfilled')}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="text-red-600" onClick={() => updateStatus(req.id, 'Cancelled')}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AcceptedDonorsList requestId={req.id} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
