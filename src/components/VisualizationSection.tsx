'use client'

import React from 'react';
import { BarChart3, Settings } from 'lucide-react';
import ChartSettings, { ChartType } from './ChartSettings';
import DataChart from './DataChart';
import DataPreview from './DataPreview';

// Define the data row type
type DataRow = Record<string, string | number | boolean | null>;

interface FileData {
    id: number;
    file: File;
    name: string;
    size: number;
    type: string;
}

interface VisualizationSectionProps {
    selectedFile: FileData | null;
    data: DataRow[];
    headers: string[];
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
    showSettings: boolean;
    isLoading: boolean;
    onChartTypeChange: (type: ChartType) => void;
    onXAxisChange: (axis: string) => void;
    onYAxisChange: (axis: string) => void;
    onToggleSettings: () => void;
}

const VisualizationSection: React.FC<VisualizationSectionProps> = ({
                                                                       selectedFile,
                                                                       data,
                                                                       headers,
                                                                       chartType,
                                                                       xAxis,
                                                                       yAxis,
                                                                       showSettings,
                                                                       isLoading,
                                                                       onChartTypeChange,
                                                                       onXAxisChange,
                                                                       onYAxisChange,
                                                                       onToggleSettings,
                                                                   }) => {
    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Data Visualization
                </h2>
                {selectedFile && (
                    <button
                        onClick={onToggleSettings}
                        className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        title="Toggle Settings"
                    >
                        <Settings className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                </div>
            )}

            {!selectedFile && !isLoading && (
                <div className="text-center py-20">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <div className="text-slate-300 text-lg mb-2">No data selected</div>
                    <div className="text-slate-400">Upload and select a file to start visualizing</div>
                </div>
            )}

            {selectedFile && showSettings && (
                <div className="mb-6">
                    <ChartSettings
                        chartType={chartType}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        headers={headers}
                        onChartTypeChange={onChartTypeChange}
                        onXAxisChange={onXAxisChange}
                        onYAxisChange={onYAxisChange} isYAxisNumeric={false}                    />
                </div>
            )}

            {/* Chart Display */}
            {selectedFile && xAxis && yAxis && !isLoading && (
                <div className="mb-6">
                    <DataChart
                        data={data}
                        chartType={chartType}
                        xAxis={xAxis}
                        yAxis={yAxis}
                    />
                </div>
            )}

            {/* Data Preview */}
            {selectedFile && data.length > 0 && !isLoading && (
                <DataPreview data={data} headers={headers} />
            )}
        </div>
    );
};

export default VisualizationSection;