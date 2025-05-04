import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Home, Plus, RefreshCw, User, Users, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface Member {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
}

interface Household {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  createdAt?: string;
}

interface Invitation {
  id: number;
  householdId: number;
  invitedEmail: string;
  invitedByUserId: number;
  status: string;
  createdAt?: string;
  expiresAt?: string;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountSettingsPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Form states
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [newHouseholdDescription, setNewHouseholdDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Query for getting the user's household
  const { 
    data: household,
    isLoading: isLoadingHousehold
  } = useQuery({
    queryKey: ['/api/household'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/household');
        if (res.status === 404) return null; // No household
        return await res.json();
      } catch (error) {
        return null; // Handle error case
      }
    },
    enabled: !!user
  });
  
  // Query for getting household members
  const {
    data: members = [],
    isLoading: isLoadingMembers
  } = useQuery({
    queryKey: ['/api/household/members'],
    queryFn: async () => {
      if (!household) return [];
      const res = await apiRequest('GET', `/api/household/${household.id}/members`);
      return await res.json();
    },
    enabled: !!household
  });
  
  // Query for getting invitations
  const {
    data: invitations = [],
    isLoading: isLoadingInvitations
  } = useQuery({
    queryKey: ['/api/household/invitations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/household/invitations');
      return await res.json();
    },
    enabled: !!user
  });
  
  // Mutation for creating a household
  const createHouseholdMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/household', {
        name: newHouseholdName,
        description: newHouseholdDescription
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Household created',
        description: 'Your household has been created successfully.',
      });
      setNewHouseholdName('');
      setNewHouseholdDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/household'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create household',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for sending invitations
  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/household/invite', { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent',
        description: 'An invitation has been sent to the email address.',
      });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/household/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for leaving household
  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/household/leave');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Left household',
        description: 'You have left the household.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/household'] });
      queryClient.invalidateQueries({ queryKey: ['/api/household/members'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to leave household',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for removing a member
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/household/member/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the household.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/household/members'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove member',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for accepting an invitation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest('PATCH', `/api/household/invitation/${invitationId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitation accepted',
        description: 'You have joined the household.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/household'] });
      queryClient.invalidateQueries({ queryKey: ['/api/household/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to accept invitation',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for declining an invitation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest('PATCH', `/api/household/invitation/${invitationId}/decline`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitation declined',
        description: 'You have declined the invitation.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/household/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to decline invitation',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Check URL parameters for invitation handling
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const invitationId = params.get('invitation');
    const action = params.get('action');
    
    if (invitationId && action) {
      const id = parseInt(invitationId);
      
      if (action === 'accept') {
        acceptInvitationMutation.mutate(id);
      } else if (action === 'decline') {
        declineInvitationMutation.mutate(id);
      }
      
      // Remove params from URL
      setLocation('/account-settings');
    }
  }, [location]);
  
  // Handler for household creation
  const handleCreateHousehold = () => {
    if (!newHouseholdName.trim()) {
      toast({
        title: 'Validation error',
        description: 'Household name is required',
        variant: 'destructive'
      });
      return;
    }
    
    createHouseholdMutation.mutate();
  };
  
  // Handler for sending invitations
  const handleSendInvitation = () => {
    if (!inviteEmail.trim() || !emailRegex.test(inviteEmail)) {
      toast({
        title: 'Validation error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }
    
    sendInvitationMutation.mutate(inviteEmail);
  };
  
  // Handler for leaving household
  const handleLeaveHousehold = () => {
    if (confirm('Are you sure you want to leave this household?')) {
      leaveHouseholdMutation.mutate();
    }
  };
  
  // Handler for removing a member
  const handleRemoveMember = (userId: number, username: string) => {
    if (confirm(`Are you sure you want to remove ${username} from the household?`)) {
      removeMemberMutation.mutate(userId);
    }
  };
  
  // Handler for accepting an invitation
  const handleAcceptInvitation = (invitationId: number) => {
    acceptInvitationMutation.mutate(invitationId);
  };
  
  // Handler for declining an invitation
  const handleDeclineInvitation = (invitationId: number) => {
    declineInvitationMutation.mutate(invitationId);
  };
  
  const isHouseholdOwner = household && user?.id === household.ownerId;
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Account & Family Settings</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Family Sharing</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and update your account details
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={user?.username || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
              </div>
              
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Account Info</AlertTitle>
                <AlertDescription>
                  To change your account details, please contact support.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="family" className="mt-6 space-y-6">
          {isLoadingHousehold ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : household ? (
            // User has a household
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {household.name}
                    </CardTitle>
                    <CardDescription>
                      {household.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  
                  {!isHouseholdOwner && (
                    <Button 
                      variant="destructive" 
                      onClick={handleLeaveHousehold}
                      disabled={leaveHouseholdMutation.isPending}
                    >
                      {leaveHouseholdMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Leave Household
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Members</h3>
                  {isLoadingMembers ? (
                    <div className="flex justify-center p-4">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : members.length > 0 ? (
                    <div className="space-y-2">
                      {members.map((member: Member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{member.username}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            {member.id === household.ownerId && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Owner
                              </span>
                            )}
                            {member.id === user?.id && (
                              <span className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          
                          {isHouseholdOwner && member.id !== user?.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveMember(member.id, member.username)}
                              disabled={removeMemberMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {removeMemberMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No members found</p>
                  )}
                </div>
                
                {isHouseholdOwner && (
                  <div>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">Invite New Member</h3>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="inviteEmail" className="sr-only">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={handleSendInvitation}
                        disabled={sendInvitationMutation.isPending}
                      >
                        {sendInvitationMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Invite
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Pending Invitations</h4>
                      {invitations.length > 0 ? (
                        <div className="space-y-2">
                          {invitations.map((invitation: Invitation) => (
                            <div 
                              key={invitation.id} 
                              className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg text-sm"
                            >
                              <span>{invitation.invitedEmail}</span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                {invitation.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No pending invitations</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // User doesn't have a household
            <div className="space-y-6">
              {/* Invitations */}
              {pendingInvitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Household Invitations</CardTitle>
                    <CardDescription>
                      You have {pendingInvitations.length} pending household invitation(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingInvitations.map((invitation: Invitation) => (
                        <div 
                          key={invitation.id} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-secondary/10 rounded-lg gap-4"
                        >
                          <div>
                            <h4 className="font-medium">Invitation to join a household</h4>
                            <p className="text-sm text-muted-foreground">
                              You've been invited to join a family household
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineInvitation(invitation.id)}
                              disabled={declineInvitationMutation.isPending}
                            >
                              {declineInvitationMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                              disabled={acceptInvitationMutation.isPending}
                            >
                              {acceptInvitationMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Create household form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create a Household</CardTitle>
                  <CardDescription>
                    Create a household to share your pantry with family members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="householdName">Household Name</Label>
                      <Input
                        id="householdName"
                        placeholder="e.g., Smith Family"
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="householdDescription">Description (Optional)</Label>
                      <Input
                        id="householdDescription"
                        placeholder="Brief description of your household"
                        value={newHouseholdDescription}
                        onChange={(e) => setNewHouseholdDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCreateHousehold}
                    disabled={createHouseholdMutation.isPending}
                  >
                    {createHouseholdMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Home className="h-4 w-4 mr-2" />
                    )}
                    Create Household
                  </Button>
                </CardFooter>
              </Card>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Family Sharing Benefits</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Share your pantry inventory with family members</li>
                    <li>Collaborate on shopping lists</li>
                    <li>Access shared recipes</li>
                    <li>Reduce food waste as a family</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}