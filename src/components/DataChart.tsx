import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, ScatterChart, Scatter, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { BarChart3, TrendingUp, Download, Filter } from 'lucide-react';
import { TooltipProps } from 'recharts';

// --- TYPE DEFINITIONS ---
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';
export type AggregationMethod = 'average' | 'sum' | 'count' | 'min' | 'max';
export type SortOrder = 'asc' | 'desc' | 'none';

type DataRow = Record<string, string | number | boolean | null>;

interface DataChartProps {
    data: DataRow[];
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
}

interface AggregatedDataItem {
    category: string;
    value: number;
    _sum: number;
    _count: number;
    _min: number;
    _max: number;
    records: DataRow[];
}

interface DrillDownConfig {
    sortOrder: SortOrder;
    topN: number;
    showFilters: boolean;
}

// --- MAIN COMPONENT ---
const DataChart: React.FC<DataChartProps> = ({ data, chartType, xAxis, yAxis }) => {
    // --- STATE MANAGEMENT ---
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>('average');
    const [drillDownConfig, setDrillDownConfig] = useState<DrillDownConfig>({
        sortOrder: 'desc',
        topN: 10,
        showFilters: true
    });

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

    // --- DATA PROCESSING & AGGREGATION ---
    const { chartData, detailedMap, scatterData } = useMemo(() => {
        const map = new Map<string, AggregatedDataItem>();
        const scatterPoints: { x: number, y: number, originalData: DataRow }[] = [];

        for (const item of data) {
            const xRaw = item[xAxis];
            const yRaw = item[yAxis];
            if (xRaw === undefined || yRaw === undefined || xRaw === null || yRaw === null) continue;

            const xVal = String(xRaw);
            const yVal = Number(yRaw);
            if (xVal === '' || isNaN(yVal)) continue;

            // Collect data for scatter plot
            const xNum = Number(xRaw);
            if (!isNaN(xNum)) {
                scatterPoints.push({ x: xNum, y: yVal, originalData: item });
            }

            // Aggregate data for other charts
            const existing = map.get(xVal);
            if (!existing) {
                map.set(xVal, {
                    category: xVal,
                    value: yVal, // This value is recalculated after the loop
                    _sum: yVal,
                    _count: 1,
                    _min: yVal,
                    _max: yVal,
                    records: [item]
                });
            } else {
                existing._sum += yVal;
                existing._count++;
                existing._min = Math.min(existing._min, yVal);
                existing._max = Math.max(existing._max, yVal);
                existing.records.push(item);
            }
        }

        // Apply the selected aggregation method
        map.forEach(item => {
            switch (aggregationMethod) {
                case 'sum': item.value = item._sum; break;
                case 'count': item.value = item._count; break;
                case 'min': item.value = item._min; break;
                case 'max': item.value = item._max; break;
                case 'average':
                default:
                    item.value = item._count > 0 ? parseFloat((item._sum / item._count).toFixed(2)) : 0;
                    break;
            }
        });

        const finalChartData = Array.from(map.values());
        const finalDetailedMap = new Map(finalChartData.map(entry => [entry.category, entry.records]));

        return { chartData: finalChartData, detailedMap: finalDetailedMap, scatterData: scatterPoints };
    }, [data, xAxis, yAxis, aggregationMethod]);

    // --- DRILL-DOWN DATA PROCESSING ---
    const processedDrillDownData = useMemo(() => {
        if (!expandedCategory) return [];
        const records = detailedMap.get(expandedCategory) || [];

        let processedData = records.map(record => ({
            ...record,
            numericValue: Number(record[yAxis]) || 0
        }));

        if (drillDownConfig.sortOrder !== 'none') {
            processedData.sort((a, b) => {
                return drillDownConfig.sortOrder === 'asc' ? a.numericValue - b.numericValue : b.numericValue - a.numericValue;
            });
        }

        if (drillDownConfig.topN > 0) {
            processedData = processedData.slice(0, drillDownConfig.topN);
        }

        return processedData;
    }, [expandedCategory, detailedMap, yAxis, drillDownConfig]);


    // --- EVENT HANDLERS & HELPERS ---
    const handleBarClick = (entry: AggregatedDataItem) => {
        if (chartType !== 'bar' || !entry?.category || !detailedMap.has(entry.category)) return;
        setExpandedCategory(expandedCategory === entry.category ? null : entry.category);
    };

    const downloadFile = (content: string, type: string, filename: string) => {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadCSV = (dataToDownload: Record<string, unknown>[], filename: string) => {
        if (dataToDownload.length === 0) return;
        const headers = Object.keys(dataToDownload[0]);
        const csvContent = [
            headers.join(','),
            ...dataToDownload.map(row =>
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',')
            )
        ].join('\n');
        downloadFile(csvContent, 'text/csv;charset=utf-8;', filename);
    };

    const downloadJSON = (dataToDownload: Record<string, unknown>[], filename: string) => {
        if (dataToDownload.length === 0) return;
        const jsonContent = JSON.stringify(dataToDownload, null, 2);
        downloadFile(jsonContent, 'application/json;charset=utf-8;', filename);
    };

    const downloadDrillDownData = (format: 'csv' | 'json') => {
        if (!expandedCategory || processedDrillDownData.length === 0) return;
        const filename = `${expandedCategory}_drill-down_${new Date().toISOString().split('T')[0]}.${format}`;

        if (format === 'csv') {
            downloadCSV(processedDrillDownData, filename);
        } else {
            downloadJSON(processedDrillDownData, filename);
        }
    };

    const downloadSummaryData = (format: 'csv' | 'json') => {
        const summaryData = chartData.map(item => ({
            [xAxis]: item.category,
            count: item._count,
            total: item._sum,
            min: item._min,
            max: item._max,
            average: item._count > 0 ? parseFloat((item._sum / item._count).toFixed(2)) : 0
        }));
        const filename = `chart_summary_${new Date().toISOString().split('T')[0]}.${format}`;

        if (format === 'csv') {
            downloadCSV(summaryData, filename);
        } else {
            downloadJSON(summaryData, filename);
        }
    };

    // --- CUSTOM TOOLTIPS ---
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload as AggregatedDataItem;
        return (
            <div className="bg-white p-3 rounded shadow-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{`${xAxis}: ${label}`}</p>
                <p className="text-indigo-600 font-medium">{`${aggregationMethod.charAt(0).toUpperCase() + aggregationMethod.slice(1)} of ${yAxis}: ${payload[0].value}`}</p>
                {data._count && (
                    <div className="mt-2 pt-2 border-t text-sm text-slate-600 space-y-1">
                        <p>Count: <span className="font-medium">{data._count}</span></p>
                        <p>Total: <span className="font-medium">{data._sum.toLocaleString()}</span></p>
                        <p>Range: <span className="font-medium">{data._min.toLocaleString()} - {data._max.toLocaleString()}</span></p>
                    </div>
                )}
            </div>
        );
    };

    const CustomScatterTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 rounded shadow-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{`${xAxis}: ${data.x}`}</p>
                <p className="text-indigo-600 font-medium">{`${yAxis}: ${data.y}`}</p>
            </div>
        );
    };

    // --- CHART RENDERER ---
    const renderChart = () => {
        const aggregationText = aggregationMethod.charAt(0).toUpperCase() + aggregationMethod.slice(1);

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} onClick={({ activePayload }) => handleBarClick(activePayload?.[0]?.payload)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(199, 210, 254, 0.4)' }} />
                            <Legend />
                            <Bar dataKey="value" name={`${aggregationText} of ${yAxis}`} fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={`${aggregationText} of ${yAxis}`} stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="value" name={`${aggregationText} of ${yAxis}`} stroke="#6366f1" fill="#c7d2fe" />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="x" name={xAxis} />
                            <YAxis type="number" dataKey="y" name={yAxis} />
                            <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <Scatter name="Data Points" data={scatterData} fill="#6366f1" />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData.slice(0, 10).map(item => ({ name: item.category, value: item.value }))}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                outerRadius="80%"
                                label={entry => entry.name}
                            >
                                {chartData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                            </Pie>
                            <Tooltip content={({ active, payload }) => active && payload?.length ? (
                                <div className="bg-white p-3 rounded shadow-lg border">
                                    <p className="font-semibold">{payload[0].name}</p>
                                    <p className="text-indigo-600">Value: {payload[0].value?.toLocaleString()}</p>
                                </div>
                            ) : null}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={chartData.slice(0, 7).map(item => ({ subject: item.category, value: item.value }))}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis />
                            <Radar name={`${aggregationText} of ${yAxis}`} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    // --- RENDER LOGIC ---
    if (chartData.length === 0 && scatterData.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-md border">
                <BarChart3 className="mx-auto mb-4 text-slate-400 w-12 h-12" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Valid Data to Display</h3>
                <p className="text-slate-500 max-w-md mx-auto">Please check your axis selections and ensure the selected columns contain valid data for charting.</p>
            </div>
        );
    }

    const aggregationText = aggregationMethod.charAt(0).toUpperCase() + aggregationMethod.slice(1);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md space-y-6 border border-slate-200 font-sans">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    <span>
                        {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart:
                        <span className="text-indigo-600"> {aggregationText} of {yAxis}</span> by {xAxis}
                    </span>
                </h2>
                <div className="flex items-center gap-4 text-slate-500 flex-wrap">
                    {chartType !== 'scatter' && (
                        <div>
                            <label htmlFor="aggregation-select" className="text-sm font-medium text-slate-600 mr-2">Aggregate by:</label>
                            <select
                                id="aggregation-select"
                                value={aggregationMethod}
                                onChange={e => setAggregationMethod(e.target.value as AggregationMethod)}
                                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="average">Average</option>
                                <option value="sum">Sum</option>
                                <option value="count">Count</option>
                                <option value="min">Minimum</option>
                                <option value="max">Maximum</option>
                            </select>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => downloadSummaryData('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={() => downloadSummaryData('json')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors">
                            <Download className="w-4 h-4" /> JSON
                        </button>
                    </div>
                </div>
            </div>

            {chartType === 'bar' && (
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-md text-center">
                    💡 Tip: Click a bar to drill down into its detailed records.
                </div>
            )}

            {/* Chart Area */}
            <div className="w-full h-[400px]">
                {renderChart()}
            </div>

            {/* Drill-Down Panel */}
            {chartType === 'bar' && expandedCategory && (
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h3 className="font-semibold text-slate-800 text-lg">
                            Drill-Down: <span className="text-indigo-600">{expandedCategory}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <button onClick={() => downloadDrillDownData('csv')} className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                                    <Download className="w-4 h-4" /> CSV
                                </button>
                                <button onClick={() => downloadDrillDownData('json')} className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                                    <Download className="w-4 h-4" /> JSON
                                </button>
                            </div>
                            <button onClick={() => setDrillDownConfig(p => ({ ...p, showFilters: !p.showFilters }))} className="p-2 text-slate-700 rounded-md hover:bg-slate-200">
                                <Filter className="w-4 h-4" />
                            </button>
                            <button onClick={() => setExpandedCategory(null)} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Close</button>
                        </div>
                    </div>

                    {drillDownConfig.showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white rounded-md border">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                                <select value={drillDownConfig.sortOrder} onChange={e => setDrillDownConfig(p => ({ ...p, sortOrder: e.target.value as SortOrder }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500">
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                    <option value="none">Original</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Show Top N</label>
                                <input type="number" min="1" max="1000" value={drillDownConfig.topN} onChange={e => setDrillDownConfig(p => ({ ...p, topN: parseInt(e.target.value) || 10 }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => setDrillDownConfig({ sortOrder: 'desc', topN: 10, showFilters: true })} className="w-full px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Reset</button>
                            </div>
                        </div>
                    )}

                    {(() => {
                        const records = detailedMap.get(expandedCategory);
                        if (!records?.length) return <p className="p-4 text-center text-slate-500">No detailed records available.</p>;

                        const values = records.map(row => Number(row[yAxis])).filter(v => !isNaN(v));
                        if (values.length === 0) {
                            return <p className="p-4 text-center text-slate-500">No numeric data to summarize for this category.</p>;
                        }

                        const count = values.length;
                        const total = values.reduce((a, b) => a + b, 0);
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const avg = count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
                        const summaryStats = [
                            { label: 'Record Count', value: count.toLocaleString() },
                            { label: 'Total Value', value: total.toLocaleString() },
                            { label: 'Minimum Value', value: min.toLocaleString() },
                            { label: 'Maximum Value', value: max.toLocaleString() },
                            { label: 'Average Value', value: avg.toLocaleString() }
                        ];

                        return (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                                    {summaryStats.map(stat => (
                                        <div key={stat.label} className="p-4 bg-white rounded-lg shadow-sm text-center border">
                                            <div className="text-sm text-slate-500">{stat.label}</div>
                                            <div className="text-xl font-semibold text-slate-800 mt-1">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                                {processedDrillDownData.length > 0 && (
                                    <div className="bg-white rounded-md border">
                                        <div className="p-3 bg-slate-100 border-b">
                                            <h4 className="font-medium text-slate-700">Showing {processedDrillDownData.length} of {count} Records</h4>
                                        </div>
                                        <div className="max-h-96 overflow-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="sticky top-0 bg-slate-100 text-slate-600 z-10">
                                                <tr>{Object.keys(processedDrillDownData[0] || {}).filter(key => key !== 'numericValue').map(key => <th key={key} className="px-4 py-2 text-left font-medium">{key}</th>)}</tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                {processedDrillDownData.map((record, index) => (
                                                    <tr key={index} className="hover:bg-indigo-50">
                                                        {Object.entries(record).filter(([key]) => key !== 'numericValue').map(([key, value]) => (
                                                            <td key={key} className="px-4 py-2 text-slate-700 whitespace-nowrap">{String(value ?? '-')}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Overall Summary Table */}
            {chartType !== 'scatter' && chartData.length > 0 && (
                <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">📊 Data Summary by {xAxis}</h3>
                    <div className="max-h-96 overflow-auto">
                        <table className="min-w-full text-sm text-left border rounded-md overflow-hidden">
                            <thead className="bg-slate-200 text-slate-700">
                            <tr>
                                {['Category', 'Count', 'Total', 'Min', 'Max', 'Average'].map(header =>
                                    <th key={header} className="px-4 py-2 font-medium">{header === 'Category' ? xAxis : header}</th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="bg-white">
                            {chartData.map(item => (
                                <tr key={item.category} className="border-t border-slate-100 text-slate-600">
                                    <td className="px-4 py-2 font-medium">{item.category}</td>
                                    <td className="px-4 py-2">{item._count.toLocaleString()}</td>
                                    <td className="px-4 py-2">{item._sum.toLocaleString()}</td>
                                    <td className="px-4 py-2">{item._min.toLocaleString()}</td>
                                    <td className="px-4 py-2">{item._max.toLocaleString()}</td>
                                    <td className="px-4 py-2 font-medium text-indigo-600">{item._count > 0 ? (item._sum / item._count).toFixed(2) : 'N/A'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataChart;