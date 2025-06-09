'use client'

import React, { useState } from 'react';
import { UploadCloud, BarChart3 } from 'lucide-react';
import FileUpload from './FileUpload';
import VisualizationSection from './VisualizationSection';
import { parseFile, FileParserError } from '@/utils/fileParser';
import { ChartType } from './ChartSettings';

interface FileData {
    id: number;
    file: File;
    name: string;
    size: number;
    type: string;
}

type DataRow = Record<string, string | number | boolean | null>;

const DataAnalyzer: React.FC = () => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [data, setData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);

    const handleFilesAdded = (newFiles: FileData[]) => {
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileRemove = (fileId: number) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        if (selectedFile && selectedFile.id === fileId) {
            resetVisualization();
        }
    };

    const handleFileAnalyze = async (fileData: FileData) => {
        setIsLoading(true);
        try {
            const result = await parseFile(fileData.file);
            setData(result.data);
            setHeaders(result.headers);
            setSelectedFile(fileData);
            setShowSettings(true);
            if (!xAxis && result.headers.length > 0) setXAxis(result.headers[0]);
            if (!yAxis && result.headers.length > 1) setYAxis(result.headers[1]);
        } catch (error) {
            console.error('Error parsing file:', error);
            let errorMessage = 'Error parsing file. Please check the file format.';
            if (error instanceof FileParserError) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const resetVisualization = () => {
        setSelectedFile(null);
        setData([]);
        setHeaders([]);
        setXAxis('');
        setYAxis('');
        setShowSettings(false);
    };

    const handleChartTypeChange = (type: ChartType) => setChartType(type);
    const handleXAxisChange = (axis: string) => setXAxis(axis);
    const handleYAxisChange = (axis: string) => setYAxis(axis);
    const handleToggleSettings = () => setShowSettings(prev => !prev);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <BarChart3 className="w-10 h-10 text-purple-300 mb-3" />
                    <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">
                        Data Analyzer
                    </h1>
                    <p className="text-slate-300 text-lg">
                        Upload your data and generate interactive visualizations
                    </p>
                </div>

                <div className="flex flex-col gap-8">
                    {/* File Upload Section */}
                    <div className="w-full">
                        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <UploadCloud className="w-5 h-5 text-white/70" />
                                <h2 className="text-xl font-semibold text-white">Upload Files</h2>
                            </div>
                            <FileUpload
                                files={files}
                                selectedFile={selectedFile}
                                onFilesAdded={handleFilesAdded}
                                onFileRemove={handleFileRemove}
                                onFileAnalyze={handleFileAnalyze}
                            />
                        </div>
                    </div>

                    {/* Visualization Section */}
                    <div className="w-full">
                        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6">
                            <VisualizationSection
                                selectedFile={selectedFile}
                                data={data}
                                headers={headers}
                                chartType={chartType}
                                xAxis={xAxis}
                                yAxis={yAxis}
                                showSettings={showSettings}
                                isLoading={isLoading}
                                onChartTypeChange={handleChartTypeChange}
                                onXAxisChange={handleXAxisChange}
                                onYAxisChange={handleYAxisChange}
                                onToggleSettings={handleToggleSettings}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataAnalyzer;
