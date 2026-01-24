import { useState } from "react";
import { Key, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ApiKeyDialog = ({ isOpen, onClose, onSuccess }: ApiKeyDialogProps) => {
  const { updateGeminiApiKey } = useProfile();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateGeminiApiKey(apiKey.trim());
      
      if (error) {
        throw error;
      }

      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been securely stored.",
      });
      
      setApiKey("");
      onClose();
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Failed to Save",
        description: err instanceof Error ? err.message : "Could not save API key.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setApiKey("");
    setShowApiKey(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Enter Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Your API key will be securely stored and used for AI-powered resume analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>
              Get your free API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">🔒 Secure Storage</p>
            <p>Your API key is encrypted and stored securely. It will only be used for AI resume analysis.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;