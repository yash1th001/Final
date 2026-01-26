import { useState } from "react";
import { Settings, Key, Eye, EyeOff, Trash2, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";

// Inner component that uses profile hook - only mounted when dialog opens
const ProfileSettingsContent = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const { hasApiKey, updateGeminiApiKey, clearGeminiApiKey } = useProfile();
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a new API key.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateGeminiApiKey(newApiKey.trim());
      
      if (error) {
        throw error;
      }

      toast({
        title: "API Key Updated",
        description: "Your Gemini API key has been updated successfully.",
      });
      
      setNewApiKey("");
      setShowApiKey(false);
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Could not update API key.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsDeleting(true);
    try {
      const { error } = await clearGeminiApiKey();
      
      if (error) {
        throw error;
      }

      toast({
        title: "API Key Removed",
        description: "Your Gemini API key has been removed.",
      });
    } catch (err) {
      toast({
        title: "Removal Failed",
        description: err instanceof Error ? err.message : "Could not remove API key.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Profile Settings
        </DialogTitle>
        <DialogDescription>
          Manage your account settings and API keys.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Account Info */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Account</Label>
          <p className="text-sm">{user?.email}</p>
        </div>

        <Separator />

        {/* API Key Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <Label>Gemini API Key</Label>
            </div>
            {hasApiKey && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Configured
              </div>
            )}
          </div>

          {hasApiKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have an API key configured. You can update or remove it below.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="new-api-key" className="text-sm">New API Key (optional)</Label>
                <div className="relative">
                  <Input
                    id="new-api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter new API key to replace..."
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="pr-10"
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

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdateApiKey}
                  disabled={isSaving || !newApiKey.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Updating...
                    </>
                  ) : (
                    "Update Key"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteApiKey}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>No API key configured. You'll be prompted to enter one when using AI Review mode.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ProfileSettingsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isOpen && <ProfileSettingsContent onClose={() => setIsOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsDialog;