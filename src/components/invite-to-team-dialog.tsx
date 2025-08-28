'use client';

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Send, Loader2, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";


export const InviteToTeamDialog = ({ person, currentUser, children }: { person: any, currentUser: any, children: React.ReactNode }) => {
    const supabase = createClient();
    const router = useRouter();
    const [ownedTeams, setOwnedTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
  
    const handleFetchOwnedTeams = async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('owner_id', currentUser.id);
  
      if (error) {
        toast.error("Failed to fetch your teams.");
      } else {
        setOwnedTeams(data);
      }
      setLoading(false);
    };

    const handleSendInvite = async () => {
        if (!selectedTeam) {
            toast.error("Please select a team to invite to.");
            return;
        }
        
        const team = ownedTeams.find(t => t.id === selectedTeam);
        if (!team) return;

        try {
            const { error: rpcError } = await supabase.rpc('invite_user_to_team', {
                p_invited_user_id: person.id,
                p_team_id: team.id
            });

            if (rpcError) throw rpcError;
            
            toast.success(`Invitation sent to ${person.full_name} to join ${team.name}!`);
            setIsOpen(false);

        } catch (error: any) {
            console.error("Error sending invitation:", error);
            if (error.message.includes('already exists')) {
                 toast.info("An invitation has already been sent to this user for this team.");
            } else {
                toast.error("Failed to send invitation.", { description: error.message });
            }
        }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (open) handleFetchOwnedTeams();
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {person.full_name} to a team</DialogTitle>
            <DialogDescription>
              Select one of your teams to send an invitation. This will send them a notification.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : ownedTeams.length > 0 ? (
            <Select onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {ownedTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">You don't own any teams. <Link href="/teams/create" onClick={() => setIsOpen(false)} className="text-primary underline">Create one now!</Link></p>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSendInvite} disabled={!selectedTeam}>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
};
