import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export interface ChargingStationData {
  id: string;
  status: "Livre" | "Carregando" | "Ocupado" | "Offline";
  vehicleId: string | null;
  energiaConsumida: number;
  lamportTimestamp: number;
}

interface ChargingStationProps {
  station: ChargingStationData;
}

export function ChargingStation({ station }: ChargingStationProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livre":
        return "bg-green-500";
      case "Carregando":
        return "bg-yellow-500";
      case "Ocupado":
        return "bg-red-500";
      case "Offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Livre":
        return "secondary";
      case "Carregando":
        return "default";
      case "Ocupado":
        return "destructive";
      // Adicionado caso para Offline
      case "Offline":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{station.id}</h3>
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(station.status)}`}
        />
      </div>

      <Badge
        variant={getStatusBadgeVariant(station.status)}
        className="w-full justify-center"
      >
        {station.status}
      </Badge>

      <div className="space-y-2">
        <div>
          <span className="text-sm text-muted-foreground">ID do Veículo:</span>
          <p className="text-sm">{station.vehicleId || "N/A"}</p>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">
            Energia Consumida:
          </span>
          <p className="text-sm font-medium">
            {station.energiaConsumida.toFixed(2)} kWh
          </p>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">
            Timestamp Lamport:
          </span>
          <p className="text-sm font-mono">{station.lamportTimestamp}</p>
        </div>
      </div>
    </Card>
  );
}
