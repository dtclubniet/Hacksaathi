
'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Loader2,
  MessageCircle,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { InviteToTeamDialog } from "@/components/invite-to-team-dialog";

const startChat = async (supabase: any, currentUser: any, otherUser: any, router: any, firstMessage?: string) => {
    try {
        const participantIds = [currentUser.id, otherUser.id].sort();

        // Check if a conversation already exists between the two users.
        const { data: existingConvo, error: existingError } = await supabase
            .from('conversations')
            .select('id, status')
            .or(`and(participant_one.eq.${participantIds[0]},participant_two.eq.${participantIds[1]}),and(participant_one.eq.${participantIds[1]},participant_two.eq.${participantIds[0]})`)
            .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw existingError;
        }
        
        if (existingConvo) {
            // If a chat already exists, just navigate to it.
            if (existingConvo.status === 'blocked') {
                toast.error("You cannot message this user.");
                return;
            }
            router.push(`/chat?conversationId=${existingConvo.id}`);
            return;
        }

        // Conversation doesn't exist, create a new one using the secure RPC function.
        // This function creates the conversation and sends the first message in a single transaction.
        const { data: newConvoId, error: rpcError } = await supabase.rpc('create_conversation_and_send_message', {
            p_participant_one: participantIds[0],
            p_participant_two: participantIds[1],
            p_requester_id: currentUser.id,
            p_first_message: firstMessage || ''
        });


        if (rpcError) {
            throw rpcError;
        }

        if (newConvoId) {
            toast.success("Message request sent!");
            router.push(`/chat?conversationId=${newConvoId}`);
        } else {
             toast.error("Could not create a new chat.");
        }

    } catch (error: any) {
        console.error("Error starting chat:", error);
        toast.error("Could not start chat", { description: error.message });
    }
};

const StartChatDialog = ({ person, currentUser, router }: { person: any, currentUser: any, router: any }) => {
    const supabase = createClient();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSendMessage = async () => {
        if (!currentUser || !person) return;
        if (!message.trim()) {
            toast.error("Please write a message to send a request.");
            return;
        }
        setLoading(true);
        await startChat(supabase, currentUser, person, router, message);
        setLoading(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send a message request to {person.full_name}</DialogTitle>
                    <DialogDescription>
                        This will start a new conversation. They will need to accept your request before you can chat freely.
                    </DialogDescription>
                </DialogHeader>
                <Textarea 
                    placeholder="Write your opening message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        <Send className="w-4 h-4 mr-2" />
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const UserProfile = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const supabase = createClient();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params.id) return;
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: authUserProfile, error: authUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (authUserError) {
        toast.error("Could not fetch your profile.");
        router.push('/dashboard');
        return;
      }
      setCurrentUser(authUserProfile);
      
      // Prevent users from viewing their own profile via this page
      if (user.id === params.id) {
        router.push('/profile');
        return;
      }

      // Check if the current user is a team owner
      const { count } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (count && count > 0) {
        setIsTeamOwner(true);
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        setProfileData(null);
      } else {
        setProfileData(data);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [params.id, supabase, router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Profile Not Found</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6 text-center">
            <p>Could not find a profile for this user.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold truncate">{profileData.full_name}'s Profile</h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentUser && profileData && (
                    <StartChatDialog person={profileData} currentUser={currentUser} router={router} />
                )}
                {isTeamOwner && currentUser && profileData && (
                    <InviteToTeamDialog person={profileData} currentUser={currentUser}>
                        <Button size="sm" className="flex-1">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite to Team
                        </Button>
                    </InviteToTeamDialog>
                )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 border-0 shadow-soft bg-card">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileData.avatar_url} />
              <AvatarFallback>{profileData.full_name?.slice(0,2)}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold">{profileData.full_name}</h2>
            <p className="text-muted-foreground max-w-md">{profileData.bio}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profileData.location || 'Location not set'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact & Links */}
        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Contact & Links</h3>
          <div className="space-y-3">
            {profileData.github_url && <div className="flex items-center gap-3">
              <Github className="w-5 h-5" />
              <a href={profileData.github_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {profileData.github_url}
              </a>
            </div>}
            {profileData.linkedin_url && <div className="flex items-center gap-3">
              <Linkedin className="w-5 h-5" />
              <a href={profileData.linkedin_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {profileData.linkedin_url}
              </a>
            </div>}
            {profileData.portfolio_url && <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <a href={profileData.portfolio_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {profileData.portfolio_url}
              </a>
            </div>}
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profileData.tech_stack?.map((skill:string, index: number) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill}
              </Badge>
            )) || <p className="text-sm text-muted-foreground">No skills listed.</p>}
          </div>
        </Card>

        {/* Interests */}
        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profileData.interests?.map((interest: string, index: number) => (
              <Badge key={index} variant="outline" className="text-sm">
                {interest}
              </Badge>
            )) || <p className="text-sm text-muted-foreground">No interests listed.</p>}
          </div>
        </Card>

        {/* Experience */}
        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Experience</h3>
          <p className="text-muted-foreground capitalize">{profileData.experience || 'Not specified'}</p>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
