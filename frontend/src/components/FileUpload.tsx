import { useState, useRef } from "react";
import { Upload, FileText, X, FileUp, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelect: (file: File | null) => void;
  file: File | null;
  isLoading?: boolean;
}

const FileUpload = ({ label, accept = ".pdf,.doc,.docx,.txt", onFileSelect, file, isLoading = false }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300",
            "flex flex-col items-center justify-center gap-3 min-h-[160px] group",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
              : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-card"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
            isDragging 
              ? "bg-primary text-primary-foreground scale-110 rotate-6" 
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105"
          )}>
            <FileUp className="w-7 h-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop your file here or <span className="text-primary underline-offset-4 hover:underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, DOC, DOCX, TXT
            </p>
          </div>
          
          {/* Animated border on hover */}
          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300 pointer-events-none" />
          
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-border rounded-xl p-4 bg-card shadow-card animate-scale-in hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center relative">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <FileText className="w-6 h-6 text-primary" />
                )}
                {!isLoading && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-score-excellent flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • {isLoading ? "Parsing PDF..." : "Ready for analysis"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:rotate-90"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;