"use client";
import { useState } from "react";
import { Copy, Save, Shield, Bell, Key, Database, Monitor } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('General');

    const tabs = [
        { name: 'General', icon: Monitor },
        { name: 'Security', icon: Shield },
        { name: 'Notifications', icon: Bell },
        { name: 'API Keys', icon: Key },
        { name: 'Data Management', icon: Database },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation */}
            <div className="w-full lg:w-64 flex flex-col gap-1">
                <h2 className="text-xl font-bold mb-4 px-2">Settings</h2>
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.name
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 opacity-80" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Settings Content */}
            <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 min-h-[500px]">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--color-border)]">
                    <div>
                        <h3 className="text-xl font-bold">{activeTab}</h3>
                        <p className="text-sm text-gray-400">Manage your organization's {activeTab.toLowerCase()} preferences.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>

                {activeTab === 'General' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Workspace Name</label>
                            <input type="text" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" defaultValue="Acme Corp Global" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Support Email</label>
                            <input type="email" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" defaultValue="support@acmecorp.com" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Timezone</label>
                            <select className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] appearance-none">
                                <option>UTC (Coordinated Universal Time)</option>
                                <option>EST (Eastern Standard Time)</option>
                                <option>PST (Pacific Standard Time)</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'API Keys' && (
                    <div className="space-y-6 max-w-2xl">
                        <p className="text-sm text-gray-400 mb-4">Use these keys to authenticate API requests from your backend services.</p>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-black/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-sm">Production Key</h4>
                                        <p className="text-xs text-gray-500">Last used: 2 mins ago</p>
                                    </div>
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-bold">Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="password" value="sk_live_1234567890abcdef" readOnly className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-gray-400 font-mono focus:outline-none" />
                                    <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-black/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-sm">Development / Test Key</h4>
                                        <p className="text-xs text-gray-500">Last used: 5 days ago</p>
                                    </div>
                                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs font-bold">Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="password" value="sk_test_0987654321fedcba" readOnly className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-gray-400 font-mono focus:outline-none" />
                                    <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">+ Generate New Key</button>
                        </div>
                    </div>
                )}

                {(activeTab === 'Security' || activeTab === 'Notifications' || activeTab === 'Data Management') && (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                        <Shield className="w-12 h-12 mb-4" />
                        <p>This section is under construction.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
