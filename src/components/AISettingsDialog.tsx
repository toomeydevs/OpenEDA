import { useState } from "react";
import { Settings, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

export function AISettingsDialog() {
    const [open, setOpen] = useState(false);
    const [apiKey, setApiKey] = useLocalStorage<string>("gemini-api-key", "");
    const [inputValue, setInputValue] = useState(apiKey);

    // Sync internal state when opening dialog
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setInputValue(apiKey);
        }
        setOpen(newOpen);
    };

    const handleSave = () => {
        setApiKey(inputValue.trim());
        setOpen(false);
        if (inputValue.trim()) {
            toast.success("API Key saved successfully");
        } else {
            toast.info("API Key cleared");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground w-full flex items-center justify-between sm:justify-center sm:w-auto"
                    aria-label="AI Settings"
                >
                    <span className="sm:hidden font-medium text-sm ml-1 text-foreground">AI Configuration</span>
                    <Settings className="h-4 w-4 hidden sm:block hover:text-foreground" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        AI Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Enter your Google Gemini API Key to enable Advanced AI Insights and Natural Language Querying.
                        Your key is stored securely in your browser's local storage and is only sent directly to Google's servers.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="apiKey" className="text-right text-sm font-medium">
                            API Key
                        </label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="AIzaSy..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="text-xs text-muted-foreground px-4 text-center">
                        You can get a free API key from Google AI Studio. OpenEDA will only send dataset summaries, not your entire uploaded files, to minimize token usage.
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setInputValue("")}>Clear Key</Button>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
