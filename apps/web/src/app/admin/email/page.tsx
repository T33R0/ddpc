'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { Switch } from '@repo/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { Plus, Trash2, Send, Calendar, Clock, Save, Eye, Users, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseSimpleMarkdown } from '../../../lib/text-formatting';

type TabType = 'compose' | 'settings' | 'recipients';

type EmailChannel = {
    id: string;
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
};

// Types for the Weekly Build Log form
type WeeklyBuildLogData = {
    date: string;
    features: string[];
    fixes: string[];
    improvements: string[];
    message: string;
    proTip: string;
    scheduledAt: string;
};

export default function EmailAdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('compose');
    const [channels, setChannels] = useState<EmailChannel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');

    // Form State
    const [buildLogData, setBuildLogData] = useState<WeeklyBuildLogData>({
        date: '',
        features: [''],
        fixes: [''],
        improvements: [''],
        message: '',
        proTip: '',
        scheduledAt: '',
    });

    const [isSending, setIsSending] = useState(false);

    // Set default date on client-side only to avoid hydration mismatch
    useEffect(() => {
        setBuildLogData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0] ?? ''
        }));
    }, []);

    // Fetch Channels
    const fetchChannels = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('email_channels')
            .select('*')
            .order('name');

        if (error) {
            toast.error('Failed to load channels');
            console.error(error);
        } else {
            setChannels(data || []);
            if (data && data.length > 0 && !selectedChannelId) {
                // Default to Weekly Build Log if present
                const wbl = data.find(c => c.slug === 'weekly-build-log');
                setSelectedChannelId(wbl ? wbl.id : data[0].id);
            }
        }
    }, [selectedChannelId]);

    useEffect(() => {
        // Only redirect if we are DEFINITELY loaded and DEFINITELY not an admin
        if (!loading && user && profile && profile.role !== 'admin') {
            router.push('/');
        }
        // If loaded but no user, redirect to login (or root)
        if (!loading && !user) {
            router.push('/');
        }

        if (loading || !user || profile?.role !== 'admin') return;

        fetchChannels();
    }, [loading, user, profile, router, fetchChannels]);

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    // Form Handlers
    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...buildLogData.features];
        newFeatures[index] = value;
        setBuildLogData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setBuildLogData(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const removeFeature = (index: number) => {
        setBuildLogData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleFixChange = (index: number, value: string) => {
        const newFixes = [...buildLogData.fixes];
        newFixes[index] = value;
        setBuildLogData(prev => ({ ...prev, fixes: newFixes }));
    };

    const addFix = () => {
        setBuildLogData(prev => ({ ...prev, fixes: [...prev.fixes, ''] }));
    };

    const removeFix = (index: number) => {
        setBuildLogData(prev => ({ ...prev, fixes: prev.fixes.filter((_, i) => i !== index) }));
    };

    const handleImprovementChange = (index: number, value: string) => {
        const newImprovements = [...buildLogData.improvements];
        newImprovements[index] = value;
        setBuildLogData(prev => ({ ...prev, improvements: newImprovements }));
    };

    const addImprovement = () => {
        setBuildLogData(prev => ({ ...prev, improvements: [...prev.improvements, ''] }));
    };

    const removeImprovement = (index: number) => {
        setBuildLogData(prev => ({ ...prev, improvements: prev.improvements.filter((_, i) => i !== index) }));
    };

    const toggleChannelActive = async (id: string, currentState: boolean) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('email_channels')
            .update({ is_active: !currentState })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update channel status');
        } else {
            toast.success('Channel status updated');
            fetchChannels();
        }
    };

    const handleSend = async () => {
        if (!selectedChannelId) return;

        // Basic Validation
        if (!buildLogData.features.some(f => f.trim()) &&
            !buildLogData.fixes.some(f => f.trim()) &&
            !buildLogData.improvements.some(f => f.trim())) {
            if (!confirm('No features, fixes, or improvements listed. Send anyway?')) return;
        }

        setIsSending(true);
        try {
            const supabase = createClient();
            const response = await fetch('/api/admin/send-newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    channelId: selectedChannelId,
                    data: buildLogData,
                    scheduledAt: buildLogData.scheduledAt ? new Date(buildLogData.scheduledAt).toISOString() : null
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Newsletter ${buildLogData.scheduledAt ? 'scheduled' : 'sent'} successfully!`);
                // Reset Logic or redirect could go here
            } else {
                toast.error(result.error || 'Failed to send newsletter');
            }
        } catch (error) {
            console.error('Send error:', error);
            toast.error('An error occurred while sending');
        } finally {
            setIsSending(false);
        }
    };

    // Live Preview Component
    const Preview = () => (
        <div className="bg-white text-black font-sans p-8 rounded-lg shadow-lg border border-gray-200 max-w-2xl mx-auto">
            <div className="text-center border-b border-gray-100 pb-8 mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">DDPC // BUILD LOG</h1>
                <p className="text-gray-500 text-sm">Progress for the week of {(() => {
                    const parts = buildLogData.date.split('-').map(Number);
                    if (parts.length === 3) {
                        const [y, m, d] = parts as [number, number, number];
                        return new Date(y, m - 1, d).toLocaleDateString();
                    }
                    return new Date().toLocaleDateString(); // Fallback
                })()}</p>
            </div>

            <div className="space-y-8">
                {buildLogData.message && (
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">FROM THE SHOP</h3>
                        <div 
                            className="text-gray-700 leading-relaxed text-base"
                            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(buildLogData.message) }}
                        />
                    </div>
                )}

                <div className="border-b border-gray-100 mb-8" />

                {buildLogData.features.some(f => f.trim()) && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">FRESH OFF THE LIFT</h3>
                        <ul className="space-y-2">
                            {buildLogData.features.filter(f => f.trim()).map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-black font-bold mt-0.5">•</span>
                                    <span 
                                        className="text-gray-900 leading-relaxed text-sm"
                                        dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(feature) }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {buildLogData.fixes.some(f => f.trim()) && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">UNDER THE HOOD FIXES</h3>
                        <ul className="space-y-2">
                            {buildLogData.fixes.filter(f => f.trim()).map((fix, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-black font-bold mt-0.5">•</span>
                                    <span 
                                        className="text-gray-900 leading-relaxed text-sm"
                                        dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(fix) }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {buildLogData.improvements.some(f => f.trim()) && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">ON THE ROADMAP</h3>
                        <ul className="space-y-2">
                            {buildLogData.improvements.filter(f => f.trim()).map((imp, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-black font-bold mt-0.5">•</span>
                                    <span 
                                        className="text-gray-900 leading-relaxed text-sm"
                                        dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(imp) }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="border-b border-gray-100 my-8" />

                {buildLogData.proTip && (
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            💡 PIT CREW TIP
                        </h4>
                        <div 
                            className="text-gray-600 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(buildLogData.proTip) }}
                        />
                    </div>
                )}

                <div className="border-b border-gray-100 my-8" />

                <div className="text-center my-8">
                    <a href="#" className="inline-block bg-black text-white font-semibold py-3 px-6 rounded-md">
                        Go to my Garage
                    </a>
                </div>

                <div className="pt-8 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-400">
                        You received this email because you are subscribed to the Weekly Build Log.
                        <br />
                        <span className="underline">Unsubscribe from updates</span>.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Operations Center</h1>
                    <p className="text-muted-foreground mt-1">Manage and dispatch newsletters to your community.</p>
                </div>
            </div>

            <div className="mb-6">
                <ToggleGroup type="single" value={activeTab} onValueChange={(v) => v && setActiveTab(v as TabType)}>
                    <ToggleGroupItem value="compose" className="gap-2">
                        <Send className="h-4 w-4" /> Compose
                    </ToggleGroupItem>
                    <ToggleGroupItem value="settings" className="gap-2">
                        <Save className="h-4 w-4" /> Settings
                    </ToggleGroupItem>
                    <ToggleGroupItem value="recipients" className="gap-2">
                        <Users className="h-4 w-4" /> Recipients
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {activeTab === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration</CardTitle>
                                <CardDescription>Select channel and schedule</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Channel</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedChannelId}
                                        onChange={(e) => setSelectedChannelId(e.target.value)}
                                    >
                                        {channels.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Log Date</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={buildLogData.date}
                                                onChange={(e) => setBuildLogData(prev => ({ ...prev, date: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Schedule Send (Optional)</Label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={buildLogData.scheduledAt}
                                                onChange={(e) => setBuildLogData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content</CardTitle>
                                <CardDescription>What's new this week?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Message */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>From The Shop (Message)</Label>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            <span>Use **bold**, *italic*, __underline__</span>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={buildLogData.message}
                                        onChange={(e) => setBuildLogData(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="We just launched this week..."
                                        rows={4}
                                    />
                                </div>

                                {/* Features */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-green-600 font-semibold">Fresh Off The Lift (New Features)</Label>
                                        <Button variant="outline" size="sm" onClick={addFeature} type="button">
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {buildLogData.features.map((feature, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                                placeholder="e.g. Added User Preferences UI..."
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFeature(idx)}
                                                disabled={buildLogData.features.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Fixes */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-red-600 font-semibold">Under The Hood (Fixes)</Label>
                                        <Button variant="outline" size="sm" onClick={addFix} type="button">
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {buildLogData.fixes.map((fix, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={fix}
                                                onChange={(e) => handleFixChange(idx, e.target.value)}
                                                placeholder="e.g. Fixed navigation bug on mobile..."
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFix(idx)}
                                                disabled={buildLogData.fixes.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Improvements */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sky-600 font-semibold">On The Roadmap (Improvements)</Label>
                                        <Button variant="outline" size="sm" onClick={addImprovement} type="button">
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {buildLogData.improvements.map((imp, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={imp}
                                                onChange={(e) => handleImprovementChange(idx, e.target.value)}
                                                placeholder="e.g. Upcoming dashboard refresh..."
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeImprovement(idx)}
                                                disabled={buildLogData.improvements.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Pro Tip */}
                                <div className="space-y-2">
                                    <Label>Pit Crew Tip</Label>
                                    <Textarea
                                        value={buildLogData.proTip}
                                        onChange={(e) => setBuildLogData(prev => ({ ...prev, proTip: e.target.value }))}
                                        placeholder="Share a helpful tip for users..."
                                        rows={4}
                                    />
                                </div>

                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSend} disabled={isSending} size="lg">
                                <Send className="h-4 w-4 mr-2" />
                                {isSending ? 'Processing...' : buildLogData.scheduledAt ? 'Schedule Newsletter' : 'Send Newsletter'}
                            </Button>
                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg items-center flex gap-2 text-sm text-muted-foreground mb-4">
                            <Eye className="h-4 w-4" /> Live Preview
                        </div>
                        <div className="border-4 border-muted rounded-xl p-4 md:p-8 bg-gray-100 min-h-[600px]">
                            <Preview />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'recipients' ? (
                /* Recipients Tab */
                <RecipientsView channelId={selectedChannelId} />
            ) : (
                /* Settings Tab */
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Channel Management</CardTitle>
                        <CardDescription>Manage available email channels for users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {channels.map(channel => (
                                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                    <div>
                                        <h3 className="font-semibold">{channel.name}</h3>
                                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                                            Slug: {channel.slug}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm ${channel.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                                            {channel.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <Switch
                                            checked={channel.is_active}
                                            onCheckedChange={() => toggleChannelActive(channel.id, channel.is_active)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {channels.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No channels found. Run the database migration.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Recipients Component
function RecipientsView({ channelId }: { channelId: string }) {
    const [recipients, setRecipients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!channelId) return;

        const fetchRecipients = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/recipients?channelId=${channelId}`);
                const data = await res.json();
                if (data.recipients) {
                    setRecipients(data.recipients);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to fetch recipients');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipients();
    }, [channelId]);

    if (!channelId) {
        return <div className="text-muted-foreground p-4">Please select a channel first.</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recipients List</CardTitle>
                <CardDescription>
                    {loading ? 'Loading...' : `Found ${recipients.length} active subscribers for this channel.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-8 text-center">Loading recipients...</div>
                ) : (
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">User ID</th>
                                    <th className="p-4 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipients.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4 font-mono text-xs">{user.id}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {recipients.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                            No recipients found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
