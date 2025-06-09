'use client'

import React from 'react';

// Define the data row type
type DataRow = Record<string, string | number | boolean | null>;

interface DataPreviewProps {
    data: DataRow[];
    headers: string[];
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, headers }) => {
    if (!data.length || !headers.length) {
        return null;
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-3">Data Preview</h3>
            <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-white/20">
                        {headers.slice(0, 6).map((header) => (
                            <th key={header} className="text-left p-2 text-slate-300 font-medium">
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {data.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b border-white/10">
                            {headers.slice(0, 6).map((header) => (
                                <td key={header} className="p-2 text-white">
                                    {String(row[header] || '').substring(0, 50)}
                                    {String(row[header] || '').length > 50 ? '...' : ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
                {data.length > 5 && (
                    <div className="text-center text-slate-400 text-sm mt-3">
                        Showing 5 of {data.length} rows
                        {headers.length > 6 && ` • Showing 6 of ${headers.length} columns`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataPreview;