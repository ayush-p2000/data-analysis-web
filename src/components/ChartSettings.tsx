'use client';

import React from 'react';
import {
    BarChart3,
    LineChart,
    PieChart,
    AreaChart,
    ScatterChart,
    Radar,
    Settings,
    Zap
} from 'lucide-react';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';

interface ChartTypeOption {
    id: ChartType;
    name: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    recommended?: boolean;
    requiresNumericYAxis?: boolean;
}

interface ChartSettingsProps {
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
    headers: string[];
    onChartTypeChange: (type: ChartType) => void;
    onXAxisChange: (axis: string) => void;
    onYAxisChange: (axis: string) => void;
    isYAxisNumeric: boolean;
}

const chartTypes: ChartTypeOption[] = [
    {
        id: 'bar',
        name: 'Bar Chart',
        description: 'Compare values across categories',
        icon: BarChart3,
        color: 'from-indigo-500 to-purple-600',
        recommended: true
    },
    {
        id: 'line',
        name: 'Line Chart',
        description: 'Show trends over a continuous range',
        icon: LineChart,
        color: 'from-blue-500 to-cyan-600'
    },
    {
        id: 'area',
        name: 'Area Chart',
        description: 'Visualize quantitative data and volume',
        icon: AreaChart,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'pie',
        name: 'Pie Chart',
        description: 'Display the proportions of a whole',
        icon: PieChart,
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'scatter',
        name: 'Scatter Plot',
        description: 'Reveal correlations between two variables',
        icon: ScatterChart,
        color: 'from-pink-500 to-rose-600',
        requiresNumericYAxis: true
    },
    {
        id: 'radar',
        name: 'Radar Chart',
        description: 'Compare multiple variables at once',
        icon: Radar,
        color: 'from-violet-500 to-purple-600',
        requiresNumericYAxis: true
    }
];

const ChartSettings: React.FC<ChartSettingsProps> = ({
                                                         chartType,
                                                         xAxis,
                                                         yAxis,
                                                         headers,
                                                         onChartTypeChange,
                                                         onXAxisChange,
                                                         onYAxisChange,
                                                         isYAxisNumeric
                                                     }) => {
    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200 font-sans">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-500" />
                Chart Configuration
            </h2>

            {/* --- Chart Type Selection --- */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    1. Select Chart Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {chartTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = chartType === type.id;
                        // Only disable if the chart requires numeric Y-axis and we don't have one
                        const isDisabled = type.requiresNumericYAxis && !isYAxisNumeric;

                        return (
                            <button
                                key={type.id}
                                onClick={() => !isDisabled && onChartTypeChange(type.id)}
                                disabled={isDisabled}
                                className={`relative group p-4 rounded-lg border-2 text-center transition-all duration-200
                                ${
                                    isSelected
                                        ? 'border-indigo-500 shadow-lg scale-105'
                                        : isDisabled
                                            ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                                            : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                                }`}
                                title={isDisabled ? `This chart type requires a numeric Y-axis column. '${yAxis}' is not numeric.` : type.description}
                            >
                                {type.recommended && (
                                    <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full" title="Recommended">
                                        <Zap className="w-3 h-3" />
                                    </div>
                                )}
                                <div
                                    className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${type.color} mb-3`}
                                >
                                    <Icon className="w-7 h-7" />
                                </div>
                                <p className="font-semibold text-slate-800 text-sm">{type.name}</p>
                                <p className="text-xs text-slate-500">{type.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- Axis Selection --- */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    2. Select Data for Axes
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 text-slate-500 bg-slate-50 border rounded-lg">
                    {/* X-Axis Selector */}
                    <div>
                        <label htmlFor="x-axis-select" className="block text-sm font-medium text-slate-600 mb-1">
                            X-Axis (Category)
                        </label>
                        <select
                            id="x-axis-select"
                            value={xAxis}
                            onChange={(e) => onXAxisChange(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="" disabled>Select a column</option>
                            {headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Choose the column to group your data by.</p>
                    </div>

                    {/* Y-Axis Selector */}
                    <div>
                        <label htmlFor="y-axis-select" className="block text-sm font-medium text-slate-600 mb-1">
                            Y-Axis (Value)
                        </label>
                        <select
                            id="y-axis-select"
                            value={yAxis}
                            onChange={(e) => onYAxisChange(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="" disabled>Select a column</option>
                            {headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Choose the column to measure.</p>
                        {!isYAxisNumeric && yAxis && (
                            <p className="text-xs text-amber-600 mt-1">
                                Note: Some chart types (scatter, radar) require numeric values.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartSettings;