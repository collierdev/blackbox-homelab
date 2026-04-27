export declare function importGoogleIcalFile(params: {
    filename: string;
    fileDataBase64: string;
    projectId?: string;
}): Promise<{
    imported: number;
    failed: number;
    parsed: number;
    deduped: number;
}>;
//# sourceMappingURL=icalImport.d.ts.map