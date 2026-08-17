import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTwin, type Profile, type UserRole, getRoleConfig } from "@/lib/twin-store";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { state, updateProfile } = useTwin();
  const [draft, setDraft] = useState<Profile>(state.profile);

  const cfg = getRoleConfig(draft.role);

  const fields: { key: keyof Profile; label: string; type?: string; suffix?: string }[] = [
    { key: "name", label: "Name" },
    { key: "age", label: "Current age", type: "number" },
    { key: "targetAge", label: cfg.targetAgeLabel, type: "number" },
    { key: "monthlyIncome", label: cfg.incomeLabel, type: "number" },
    { key: "monthlyExpenses", label: cfg.expensesLabel, type: "number" },
    { key: "netWorth", label: cfg.savingsLabel, type: "number" },
    { key: "targetNetWorth", label: cfg.targetSavingsLabel, type: "number" },
    { key: "savingsRate", label: "Savings rate (%)", type: "number" },
    { key: "sleepHours", label: "Usual sleep (h/night)", type: "number" },
    { key: "studyHours", label: cfg.studyLabel + " (h/week)", type: "number" },
    { key: "screenTime", label: "Screen time (h/day)", type: "number" },
    { key: "exerciseDays", label: "Active days per week", type: "number" },
    { key: "focusArea", label: cfg.focusLabel },
    { key: "goalName", label: cfg.goalLabel },
    { key: "goalCurrent", label: "Goal progress", type: "number" },
    { key: "goalTarget", label: "Goal target", type: "number" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(state.profile);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Everything your twin uses to model your future. Change role or metrics at any time.
          </DialogDescription>
        </DialogHeader>
        
        {/* Role Selector */}
        <div className="rounded-lg border border-border bg-muted/20 p-3.5 mb-2">
          <Label className="label-xs mb-1.5 block">Your Active Role Persona</Label>
          <Select
            value={draft.role || "professional"}
            onValueChange={(val: UserRole) => setDraft({ ...draft, role: val })}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">🎓 Student (Coursework, study & pocket savings)</SelectItem>
              <SelectItem value="professional">💼 Working Professional (Salary, career & retirement)</SelectItem>
              <SelectItem value="retiree">🌿 Retiree / Senior (Pension, wellness & longevity)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={String(f.key)} className="grid gap-1.5">
                <Label className="label-xs" htmlFor={String(f.key)}>
                  {f.label}
                </Label>
                <Input
                  id={String(f.key)}
                  type={f.type ?? "text"}
                  value={String(draft[f.key] ?? "")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await updateProfile(draft);
                toast.success("Settings and role updated!");
                onOpenChange(false);
              } catch (e: any) {
                toast.error(e.message || "Failed to save settings");
              }
            }}
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
