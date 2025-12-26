import { Textarea } from "./ui/textarea";

interface TextInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

const TextInput = ({ label, placeholder, value, onChange, rows = 6 }: TextInputProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none bg-card border-border focus:border-primary focus:ring-primary/20 transition-all"
      />
    </div>
  );
};

export default TextInput;
