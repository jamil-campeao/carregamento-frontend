import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";

export interface EventLogEntry {
  id: string;
  timestamp: number;
  source: string;
  description: string;
  createdAt: Date;
}

interface EventLogProps {
  events: EventLogEntry[];
}

export function EventLog({ events }: EventLogProps) {
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  const getSourceColor = (source: string) => {
    if (source.includes("Carregador")) return "text-cyan-300";
    if (source.includes("API_Gateway")) return "text-emerald-300";
    if (source.includes("Serviço_Faturamento")) return "text-violet-300";
    if (source.includes("Sistema")) return "text-amber-300";
    return "text-slate-300";
  };

  return (
    <Card className="p-4 h-full border-slate-600/50 bg-card/80 backdrop-blur-sm">
      <h2 className="mb-4">Log de Eventos Globais</h2>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-2">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className="p-3 border border-slate-600/30 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  T: {event.timestamp}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${getSourceColor(event.source)}`}>
                      {event.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {sortedEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhum evento registrado ainda. Use os controles para iniciar a simulação.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}