import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Define a more specific type for parsed row data
export type DataRow = Record<string, string | number | boolean | null>;

export interface ParsedData {
    data: DataRow[];
    headers: string[];
}

export class FileParserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileParserError';
    }
}

export const parseFile = async (file: File): Promise<ParsedData> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
        switch (extension) {
            case 'csv':
            case 'txt':
                return await parseCSV(file);
            case 'xlsx':
            case 'xls':
                return await parseExcel(file);
            case 'json':
                return await parseJSON(file);
            default:
                throw new FileParserError(`Unsupported file type: ${extension}`);
        }
    } catch (error) {
        if (error instanceof FileParserError) {
            throw error;
        }
        throw new FileParserError(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

const parseCSV = async (file: File): Promise<ParsedData> => {
    const text = await file.text();

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            complete: (result) => {
                if (result.errors.length > 0) {
                    reject(new FileParserError(`CSV parsing error: ${result.errors[0].message}`));
                    return;
                }

                const data = result.data as DataRow[];
                const headers = Object.keys(data[0] || {});

                if (headers.length === 0) {
                    reject(new FileParserError('No headers found in CSV file'));
                    return;
                }

                resolve({ data, headers });
            },
            error: (error: { message: string }) => {
                reject(new FileParserError(`CSV parsing error: ${error.message}`));
            }
        });
    });
};

const parseExcel = async (file: File): Promise<ParsedData> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (workbook.SheetNames.length === 0) {
        throw new FileParserError('No sheets found in Excel file');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as DataRow[];

    if (jsonData.length === 0) {
        throw new FileParserError('No data found in Excel sheet');
    }

    const headers = Object.keys(jsonData[0]);

    return {
        data: jsonData,
        headers
    };
};

const parseJSON = async (file: File): Promise<ParsedData> => {
    const text = await file.text();

    try {
        const jsonData = JSON.parse(text) as DataRow | DataRow[];
        const arrayData = Array.isArray(jsonData) ? jsonData : [jsonData];

        if (arrayData.length === 0) {
            throw new FileParserError('JSON file contains no data');
        }

        const headers = Object.keys(arrayData[0] || {});

        if (headers.length === 0) {
            throw new FileParserError('No properties found in JSON data');
        }

        return {
            data: arrayData,
            headers
        };
    } catch (error) {
        throw new FileParserError(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const validateData = (data: DataRow[], headers: string[]): boolean => {
    return data.length > 0 && headers.length > 0;
};

export const getNumericHeaders = (data: DataRow[], headers: string[]): string[] => {
    if (data.length === 0) return [];

    return headers.filter(header => {
        const sampleValues = data.slice(0, 10).map(row => row[header]);
        const numericValues = sampleValues.filter(value =>
            value !== null &&
            value !== undefined &&
            value !== '' &&
            !isNaN(Number(value))
        );

        // Consider it numeric if at least 70% of sample values are numeric
        return numericValues.length / sampleValues.length >= 0.7;
    });
};

export const getCategoricalHeaders = (data: DataRow[], headers: string[]): string[] => {
    const numericHeaders = getNumericHeaders(data, headers);
    return headers.filter(header => !numericHeaders.includes(header));
};