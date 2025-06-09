'use client'

import React, { useCallback, useRef } from 'react';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';

interface FileData {
    id: number;
    file: File;
    name: string;
    size: number;
    type: string;
}

interface FileUploadProps {
    files: FileData[];
    selectedFile: FileData | null;
    onFilesAdded: (files: FileData[]) => void;
    onFileRemove: (fileId: number) => void;
    onFileAnalyze: (file: FileData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
                                                   files,
                                                   selectedFile,
                                                   onFilesAdded,
                                                   onFileRemove,
                                                   onFileAnalyze,
                                               }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((newFiles: File[]) => {
        const validFiles = newFiles.filter(file => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            return ['csv', 'xlsx', 'xls', 'json', 'txt'].includes(extension || '');
        });

        const fileData: FileData[] = validFiles.map(file => ({
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream'
        }));

        onFilesAdded(fileData);
    }, [onFilesAdded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    }, [processFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        processFiles(selectedFiles);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files
            </h2>

            {/* Drag & Drop Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-purple-400 rounded-lg p-8 text-center hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <div className="text-white mb-2">
                    Drag & drop files here or <span className="text-purple-400">browse</span>
                </div>
                <div className="text-sm text-slate-300">
                    Supports CSV, Excel, JSON, TXT files
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-3">Uploaded Files</h3>
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                    selectedFile?.id === file.id
                                        ? 'bg-purple-500/20 border-purple-400'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium truncate">
                                            {file.name}
                                        </div>
                                        <div className="text-slate-300 text-xs">
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileAnalyze(file);
                                        }}
                                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                        title="Analyze"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileRemove(file.id);
                                        }}
                                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;