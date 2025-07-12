
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { updateProjectChecklist, generateChecklist } from '@/lib/actions';
import type { Project, ChecklistItem } from '@/lib/types';
import { Loader2, Plus, Trash2, ListChecks, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type ChecklistCardProps = {
  project: Project;
};

export function ChecklistCard({ project }: ChecklistCardProps) {
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>(project.checklist || []);
  const [newItemText, setNewItemText] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setChecklist(project.checklist || []);
  }, [project.checklist]);

  const handleUpdate = async (updatedChecklist: ChecklistItem[]) => {
    setIsGenerating(true);
    const result = await updateProjectChecklist(project.id, updatedChecklist);
    if (result.success) {
      setChecklist(updatedChecklist);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error updating checklist',
        description: result.error,
      });
      // Revert to original state on failure
      setChecklist(project.checklist || []);
    }
    setIsGenerating(false);
  };

  const handleToggleItem = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    handleUpdate(updated);
  };

  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setNewItemText('');
    handleUpdate(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    handleUpdate(updated);
  };
  
  const handleGenerateChecklist = async () => {
    setIsGenerating(true);
    try {
        const result = await generateChecklist({
            projectName: project.name,
            projectDescription: project.description
        });
        
        if (result && result.items) {
          const newItems = result.items.map(itemText => ({
              id: `item-${Date.now()}-${Math.random()}`,
              text: itemText,
              completed: false,
          }));
          
          const updatedChecklist = [...checklist, ...newItems];
          await handleUpdate(updatedChecklist); // Let handleUpdate manage the state
          
          toast({
              title: 'Checklist Generated!',
              description: `${newItems.length} items have been added to your checklist.`,
          });
        } else {
           throw new Error("AI did not return any items.");
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to generate AI checklist. Please try again.',
        });
        setIsGenerating(false); // Ensure loading state is turned off on error
    }
  }

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className='flex items-center gap-2'>
                <ListChecks />
                Project Checklist
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleGenerateChecklist} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        <span className="sr-only">Generate with AI</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Generate with AI</p>
                </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a new checklist item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              disabled={isGenerating}
            />
            <Button onClick={handleAddItem} disabled={isGenerating || !newItemText.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
              <p>{completedCount} of {totalCount} completed</p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {checklist.length > 0 ? (
              checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => handleToggleItem(item.id)}
                    disabled={isGenerating}
                  />
                  <label
                    htmlFor={item.id}
                    className={cn(
                      'flex-grow text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                      item.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.text}
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isGenerating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete item</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                Kindly add this to a new checklist item to be included in this project's checklist
              </p>
            )}
          </div>
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto mt-2" />}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
