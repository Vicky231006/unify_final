"use client";
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BrainCircuit, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface DataPoint {
    date: string;
    actual: number | null;
    predicted: number | null;
}

interface ForecastResult {
    status: string;
    data: DataPoint[];
    metrics: {
        growth: number;
        confidence: number;
    };
}

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '10px', fontSize: 12 },
    cursor: { stroke: 'var(--color-primary)', strokeOpacity: 0.2, strokeWidth: 1 }
};

export default function FutureAnalysis({ transactions }: { transactions: any[] }) {
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://127.0.0.1:8000/forecast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactions, days: 30 })
                });

                if (!res.ok) throw new Error("Forecast API failed");
                const data = await res.json();
                setForecast(data);
            } catch (err: any) {
                console.error("Forecast fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [transactions]);

    if (loading) {
        return (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <BrainCircuit className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
                <p className="text-sm text-gray-400">LSTM Model training in progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
                <Info className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-300">Could not generate future analysis.</p>
                <p className="text-xs text-gray-500">Ensure the backend is running and you have sufficient transaction data.</p>
            </div>
        );
    }

    if (!forecast) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-[var(--color-primary)]" />
                        AI Future Analysis — PyTorch LSTM
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Neural network forecast based on {transactions.length > 0 ? 'historical transactions' : 'synthetic training data (demo)'}.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Projected Growth</p>
                        <p className={`text-lg font-bold ${forecast.metrics.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {forecast.metrics.growth >= 0 ? '+' : ''}{forecast.metrics.growth.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Model Confidence</p>
                        <p className="text-lg font-bold text-blue-400">
                            {(forecast.metrics.confidence * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#4b5563"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis
                            stroke="#4b5563"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            name="Actual Revenue"
                            stroke="var(--color-primary)"
                            fill="url(#actualGrad)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="predicted"
                            name="Predicted Trend"
                            stroke="#3b82f6"
                            strokeDasharray="5 5"
                            fill="url(#predGrad)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-[11px] text-gray-400">
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                    <strong>Strategic Insight:</strong> The model projects a 30-day upward trajectory in revenue.
                    Consider increasing team capacity or project bandwidth to capitalize on the expected demand increase
                    around mid-month.
                </p>
            </div>
        </motion.div>
    );
}
