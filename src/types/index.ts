// Define the core data row type
export type DataRow = Record<string, string | number | boolean | null>;

export interface FileData {
    id: number;
    file: File;
    name: string;
    size: number;
    type: string;
}

export interface ParsedData {
    data: DataRow[];
    headers: string[];
}

export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartDataPoint {
    [key: string]: string | number | boolean | null;
}

export interface FileUploadProps {
    files: FileData[];
    selectedFile: FileData | null;
    onFilesAdded: (files: FileData[]) => void;
    onFileRemove: (fileId: number) => void;
    onFileAnalyze: (file: FileData) => void;
}

export interface ChartSettingsProps {
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
    headers: string[];
    onChartTypeChange: (type: ChartType) => void;
    onXAxisChange: (axis: string) => void;
    onYAxisChange: (axis: string) => void;
}

export interface DataChartProps {
    data: DataRow[];
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
}

export interface DataPreviewProps {
    data: DataRow[];
    headers: string[];
}

export interface VisualizationSectionProps {
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