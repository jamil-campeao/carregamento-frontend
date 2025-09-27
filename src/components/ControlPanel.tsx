import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { ChargingStationData } from "./ChargingStation";

interface ControlPanelProps {
  stations: ChargingStationData[];
  activeChargers: string[];
  onAddCharger: (chargerId: string) => void;
  onStopCharger: (stationId: string) => void;
  isBillingRunning: boolean;
  onToggleBilling: () => void;
  onClearSimulation: () => void;
}

export function ControlPanel({
  stations,
  activeChargers,
  onAddCharger,
  onStopCharger,
  isBillingRunning,
  onToggleBilling,
  onClearSimulation,
}: ControlPanelProps) {
  const [newChargerId, setNewChargerId] = useState("");
  const [isAddChargerOpen, setIsAddChargerOpen] = useState(false);

  const handleAddCharger = () => {
    if (newChargerId.trim()) {
      onAddCharger(newChargerId.trim());
      setNewChargerId("");
      setIsAddChargerOpen(false);
    }
  };

  const busyStations = stations.filter(
    (station) => station.status === "Carregando"
  );

  return (
    <Card className="p-4 space-y-4 border-slate-600/50 bg-card/80 backdrop-blur-sm">
      <h2>Painel de Controle</h2>

      <div className="space-y-3">
        <Button
          onClick={onToggleBilling}
          variant={isBillingRunning ? "destructive" : "default"}
          className="w-full"
        >
          {isBillingRunning
            ? "Parar Serviço de Faturamento"
            : "Iniciar Serviço de Faturamento"}
        </Button>

        <Dialog open={isAddChargerOpen} onOpenChange={setIsAddChargerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Adicionar Novo Carregador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Carregador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chargerId">ID do Carregador</Label>
                <Input
                  id="chargerId"
                  value={newChargerId}
                  onChange={(e) => setNewChargerId(e.target.value)}
                  placeholder="Ex: CARREGADOR_07"
                />
              </div>
              <Button onClick={handleAddCharger} className="w-full">
                Adicionar Carregador
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={onClearSimulation}
          variant="destructive"
          className="w-full"
        >
          Limpar Simulação
        </Button>

        <div className="space-y-2 border-t pt-3">
          <Label>Parar Carregador</Label>
          {activeChargers.map((chargerId) => (
            <Button
              key={chargerId}
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onStopCharger(chargerId)}
            >
              Parar {chargerId}
            </Button>
          ))}
          {activeChargers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Nenhum carregador ativo.
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm mb-2">Status das Estações</h3>
        <div className="text-sm space-y-1">
          <div>
            Livres: {stations.filter((s) => s.status === "Livre").length}
          </div>
          <div>Carregando: {busyStations.length}</div>
          <div>Total de Estações Vistas: {stations.length}</div>
          <div>Carregadores Ativos: {activeChargers.length}</div>
        </div>
      </div>
    </Card>
  );
}
