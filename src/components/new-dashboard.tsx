'use client';

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Users, 
  MessageSquare, 
  Star,
  Sparkles,
  Plus,
  Crown,
  Trophy,
  Info,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from "lucide-react";
import { ProductTour } from "./product-tour";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Enhanced Background FX Component with theme support
const BackgroundFX: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  // Only show theme-dependent elements after mounting to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only determine theme on client-side to prevent hydration mismatch
  const isDark = mounted && theme === 'dark';
  
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Red spotlight effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
      
      {/* Star sparkles in background with floating animations - always render but control visibility */}
      <div className={`absolute inset-0 overflow-hidden transition-opacity duration-300 ${mounted ? (isDark ? 'opacity-100' : 'opacity-0') : 'opacity-0'}`}>
        <style jsx>{`
          @keyframes float-up-down {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes float-left-right {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(10px); }
          }
          @keyframes float-diagonal {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(5px, -5px); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.8; }
          }
        `}</style>
        
        {/* Small animated stars */}
        <div className="absolute top-[15%] left-[10%] w-[2px] h-[2px] rounded-full bg-white opacity-70" style={{ animation: 'twinkle 3s ease-in-out infinite, float-up-down 8s ease-in-out infinite' }}></div>
        <div className="absolute top-[25%] left-[30%] w-[1px] h-[1px] rounded-full bg-white opacity-50" style={{ animation: 'twinkle 2s ease-in-out infinite, float-left-right 10s ease-in-out infinite' }}></div>
        <div className="absolute top-[40%] left-[80%] w-[2px] h-[2px] rounded-full bg-white opacity-60" style={{ animation: 'twinkle 4s ease-in-out infinite, float-diagonal 12s ease-in-out infinite' }}></div>
        <div className="absolute top-[65%] left-[15%] w-[1px] h-[1px] rounded-full bg-white opacity-40" style={{ animation: 'twinkle 3.5s ease-in-out infinite, float-up-down 9s ease-in-out infinite' }}></div>
        <div className="absolute top-[75%] left-[60%] w-[2px] h-[2px] rounded-full bg-white opacity-70" style={{ animation: 'twinkle 2.5s ease-in-out infinite, float-left-right 11s ease-in-out infinite' }}></div>
      </div>
      
      {/* 3D perspective grid with enhanced depth */}
      <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-70 [perspective:500px]">
        <div className="absolute inset-0 [transform:rotateX(45deg)]">
          <div className="absolute animate-grid [inset:0%_0px] [margin-left:-50%] [height:300vh] [width:600vw] [transform-origin:100%_0_0] dark:[background-image:linear-gradient(to_right,rgba(255,50,50,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,50,50,0.05)_1px,transparent_0)] [background-image:linear-gradient(to_right,rgba(255,0,0,0.05)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,0,0,0.025)_1px,transparent_0)] [background-size:100px_100px] [background-repeat:repeat]"></div>
        </div>
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent to-70%"></div>
        
        {/* Side gradients for edge fading */}
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-background to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-background to-transparent"></div>
      </div>
      
      {/* Always render the grid and particles, but control visibility with CSS classes */}
      <div className={`absolute inset-0 bg-grid-red transition-opacity duration-300 ${mounted ? (isDark ? 'opacity-100' : 'opacity-0') : 'opacity-0'}`} />
      <div className={`absolute inset-0 particles transition-opacity duration-300 ${mounted ? (isDark ? 'opacity-100' : 'opacity-0') : 'opacity-0'}`} />
    </div>
  );
};

const SIHInfoDisplay = () => {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchSihInfo = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('sih_info')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error && error.code !== 'PGRST116') { // Ignore no rows found error
                console.error("Error fetching SIH info", error);
            } else {
                setInfo(data);
            }
            setLoading(false);
        };
        fetchSihInfo();
    }, [supabase]);

    if (loading) {
        return (
             <Card className="card-hover bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-md border-primary/20 overflow-hidden group w-full max-w-4xl mx-auto flex justify-center items-center h-60">
                 <Loader2 className="animate-spin h-8 w-8 text-primary"/>
            </Card>
        );
    }
    
    if (!info) {
        // Render a default attractive banner
        return (
            <section aria-labelledby="platform-banner" className="w-full max-w-4xl mx-auto">
                <Card 
                    className="card-hover bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-md border-primary/20 overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                   <Image 
    src="/your-logo.png" 
    alt="HackSaathi Logo" 
    width={64}
    height={64}
    className="w-6 h-6 object-contain"
/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-primary">HackSaathi Platform</h3>
                                    <p className="text-sm text-muted-foreground">Your gateway to innovation and collaboration</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
    <Badge className="bg-primary/20 text-primary border-primary/30">
        <Sparkles className="w-3 h-3 mr-1" />
        Active
    </Badge>
    <Button 
        variant="outline" 
        size="sm"
        onClick={(e) => {
            e.stopPropagation();
            window.location.href = '/teams';
        }}
        className="border-primary/30 text-primary hover:bg-primary/10"
    >
        Explore Teams
    </Button>
    <ArrowRight className={`w-5 h-5 text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
</div>
                        </div>
                        
                        {isExpanded && (
                            <div className="mt-6 pt-6 border-t border-primary/20 animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(false);
                                        }}
                                        className="text-primary hover:bg-primary/10"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </Button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-primary mb-2">Platform Features</h4>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                AI-powered teammate matching
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                Real-time team collaboration
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                Smart project discovery
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-primary mb-2">Quick Stats</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-primary/5 rounded-lg p-3 text-center">
                                                <div className="font-bold text-primary">1000+</div>
                                                <div className="text-muted-foreground">Users</div>
                                            </div>
                                            <div className="bg-primary/5 rounded-lg p-3 text-center">
                                                <div className="font-bold text-primary">250+</div>
                                                <div className="text-muted-foreground">Teams</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </section>
        );
    }

    return (
    <section aria-labelledby="sih-announcement" className="w-full max-w-4xl mx-auto">
         <Card 
            className="card-hover bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-md border-primary/20 overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30"
            onClick={() => setIsExpanded(!isExpanded)}
         >
             {info.image_url && !isExpanded && (
                <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1]">
                    <Image 
                        src={info.image_url} 
                        alt={info.title} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                                    <Image 
    src="/your-logo.png" 
    alt="HackSaathi Logo" 
    width={64}
    height={64}
    className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
/>
                                </div>
                                <Badge className="bg-primary/20 backdrop-blur-sm text-white border-white/30 text-xs sm:text-sm">
                                    Read Problem Statement
                                </Badge>
                            </div>
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = '/teams';
                                }}
                                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm"
                            >
                                Read Problem Statement
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg sm:text-xl text-white line-clamp-2">{info.title}</h3>
                            <ArrowRight className={`w-5 h-5 text-white ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                    </div>
                </div>
             )}
             
             <div className="p-4 sm:p-6">
                {!info.image_url && (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Image 
    src="/your-logo.png" 
    alt="HackSaathi Logo" 
    width={64}
    height={64}
    className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-lg sm:text-xl text-primary truncate">{info.title}</h3>
                                <Badge className="bg-primary/20 text-primary border-primary/30 mt-1 text-xs sm:text-sm">
                                    Latest News
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = 'https://sih.gov.in/sih2025PS';
                                }}
                                className="border-primary/30 text-primary hover:bg-primary/10 text-xs sm:text-sm"
                            >
                                Read Problem Statement
                            </Button>
                            <ArrowRight className={`w-5 h-5 text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                    </div>
                )}
                
                {isExpanded ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                }}
                                className="text-primary hover:bg-primary/10"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                        </div>
                        {info.image_url && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                <Image 
                                    src={info.image_url} 
                                    alt={info.title} 
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-xl sm:text-2xl text-primary mb-3">{info.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{info.content}</p>
                        </div>
                    </div>
                ) : !info.image_url && (
                    <div className="mt-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {info.content}
                        </p>
                    </div>
                )}
             </div>
         </Card>
    </section>
);
};


// Quick Actions Component
const QuickActions: React.FC = () => {
  const actions = [
    { title: "PeerJet", subtitle: "AI Teammate Finder", icon: <Sparkles className="w-5 h-5" />, href: "/profile/finder" },
    { title: "Discover", subtitle: "Find teammates", icon: <Star className="w-5 h-5" />, href: "/discover" },
    { title: "Find a Team", subtitle: "Team search", icon: <Users className="w-5 h-5" />, href: "/teams" },
    { title: "Chat", subtitle: "Messages", icon: <MessageSquare className="w-5 h-5" />, href: "/chat" },
  ];

  return (
    <section aria-labelledby="quick-actions" className="space-y-4" data-tour="quick-actions">
      <h2 id="quick-actions" className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Card
            key={a.title}
            role="button"
            tabIndex={0}
            onClick={() => window.location.href = a.href}
            className="group card-hover bg-card border-border p-6 hover:animate-glow-pulse focus:animate-glow-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl flex items-center justify-center bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.25),transparent_60%)]">
                <div className="transition-transform duration-200 group-hover:scale-110">
                  {a.icon}
                </div>
              </div>
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.subtitle}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

// Activity Feed Component
const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchActivities = async () => {
        const {data: { user }} = await supabase.auth.getUser();
        if (!user) return;

        const {data, error} = await supabase
            .from('activity_log')
            .select('*, user:users(full_name, avatar_url)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching activities", error);
        } else {
            setActivities(data);
        }
    }
    fetchActivities();
  }, [supabase]);

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  }
  
  const displayedActivities = activities.slice(0, 4);

  return (
    <section aria-labelledby="recent-activity" className="space-y-4" data-tour="recent-activity">
      <h2 id="recent-activity" className="text-xl font-semibold">Recent Activity</h2>
       {activities.length > 4 ? (
            <ScrollArea className="h-72 pr-4">
                <div className="space-y-3">
                    {activities.map((it) => (
                    <Card key={it.id} className="bg-card border-border px-5 py-4 animate-fade-in card-hover">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={it.user?.avatar_url} />
                                    <AvatarFallback>{it.user?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                <div className="font-medium text-sm">
                                    You {it.action} <span className="font-bold">{it.details?.team_name || it.details?.to || ''}</span>
                                </div>
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{timeSince(it.created_at)}</span>
                        </div>
                    </Card>
                    ))}
                </div>
            </ScrollArea>
       ) : activities.length > 0 ? (
          <div className="space-y-3">
            {displayedActivities.map((it) => (
              <Card key={it.id} className="bg-card border-border px-5 py-4 animate-fade-in card-hover">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={it.user?.avatar_url} />
                            <AvatarFallback>{it.user?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                        <div className="font-medium text-sm">
                            You {it.action} <span className="font-bold">{it.details?.team_name || it.details?.to || ''}</span>
                        </div>
                        </div>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{timeSince(it.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
       ) : (
          <p className="text-muted-foreground text-sm">No recent activity yet.</p>
       )}
    </section>
  );
};

// My Teams Component
const MyTeams = () => {
    const [myTeams, setMyTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);


    useEffect(() => {
        const fetchMyTeams = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setCurrentUser(user);

            const { data: teamIds } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id);

            if (teamIds && teamIds.length > 0) {
                const ids = teamIds.map(t => t.team_id);
                const { data: teamsData, error } = await supabase
                    .from('teams')
                    .select('*, team_members(count)')
                    .in('id', ids);

                if (error) {
                    console.error(error);
                } else {
                    setMyTeams(teamsData);
                }
            } else {
                 setMyTeams([]);
            }
            setLoading(false);
        };
        fetchMyTeams();
    }, [supabase]);
    
    return (
        <section aria-labelledby="my-teams" className="space-y-4" data-tour="my-teams">
            <div className="flex items-center justify-between">
                <h2 id="my-teams" className="text-xl font-semibold">My Teams</h2>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/teams/create"><Plus className="mr-2 h-4 w-4" />Create Team</Link>
                </Button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : myTeams.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {myTeams.slice(0, 4).map((team) => (
                        <Card key={team.id} className="card-hover bg-card border-border overflow-hidden">
                            <Link href={`/teams/${team.id}`} className="block h-full">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="size-10 rounded-xl">
                                                <AvatarImage src={team.banner_url} className="object-cover" />
                                                <AvatarFallback><Users className="size-5" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{team.name}</h3>
                                                <p className="text-sm text-muted-foreground">{team.project_name}</p>
                                            </div>
                                        </div>
                                         {currentUser?.id === team.owner_id && (
                                            <Badge variant="secondary" className="text-xs font-medium border-yellow-500/50 text-yellow-600">
                                                <Crown className="w-3 h-3 mr-1.5" />
                                                Owner
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex -space-x-2">
                                            <Badge variant="outline">{team.team_members[0].count} / {team.member_limit} members</Badge>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card className="flex flex-col items-center justify-center p-8 text-center bg-card border-border">
                    <p className="text-sm text-muted-foreground mb-4">You haven't joined any teams yet.</p>
                    <Button onClick={() => router.push('/teams')}>Find a Team</Button>
                </Card>
            )}
        </section>
    );
};

// Main Dashboard Component
export const NewDashboard = () => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [showTour, setShowTour] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkTourStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('has_completed_tour')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error("Error fetching tour status", error);
                } else if (profile && !profile.has_completed_tour) {
                    setShowTour(true);
                }
            }
            setLoading(false);
        };
        checkTourStatus();
    }, [supabase]);

    const handleTourComplete = async () => {
        setShowTour(false);
        if (user) {
            await supabase
                .from('users')
                .update({ has_completed_tour: true })
                .eq('id', user.id);
        }
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundFX />
      {showTour && <ProductTour onComplete={handleTourComplete} />}
      
      <main className="container mx-auto px-4 pb-16 space-y-10 pt-6 relative z-10">
         <div role="search" aria-label="Global search" className="pb-4" data-tour="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teams, people, or projects..."
              className="h-12 rounded-2xl pl-12 text-base placeholder:text-muted-foreground bg-muted/50 border-input focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="space-y-12">
            <SIHInfoDisplay />
            <QuickActions />
            <MyTeams />
            <ActivityFeed />
        </div>
      </main>
    </div>
  );
};
