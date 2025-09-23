import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { ChargingStationData } from "./ChargingStation";

interface ControlPanelProps {
  stations: ChargingStationData[];
  onAddVehicle: (vehicleId: string) => void;
  onStartCharging: (vehicleId: string, stationId: string) => void;
  onStopCharging: (stationId: string) => void;
  vehicleQueue: string[];
  isSimulationRunning: boolean;
  onToggleSimulation: () => void;
}

export function ControlPanel({
  stations,
  onAddVehicle,
  onStartCharging,
  onStopCharging,
  vehicleQueue,
  isSimulationRunning,
  onToggleSimulation
}: ControlPanelProps) {
  const [newVehicleId, setNewVehicleId] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isStartChargingOpen, setIsStartChargingOpen] = useState(false);

  const handleAddVehicle = () => {
    if (newVehicleId.trim()) {
      onAddVehicle(newVehicleId.trim());
      setNewVehicleId("");
      setIsAddVehicleOpen(false);
    }
  };

  const handleStartCharging = () => {
    if (selectedVehicle && selectedStation) {
      onStartCharging(selectedVehicle, selectedStation);
      setSelectedVehicle("");
      setSelectedStation("");
      setIsStartChargingOpen(false);
    }
  };

  const freeStations = stations.filter(station => station.status === "Livre");
  const busyStations = stations.filter(station => station.status === "Carregando");

  return (
    <Card className="p-4 space-y-4 border-slate-600/50 bg-card/80 backdrop-blur-sm">
      <h2>Painel de Controle</h2>
      
      <div className="space-y-3">
        <Button 
          onClick={onToggleSimulation} 
          variant={isSimulationRunning ? "destructive" : "default"}
          className="w-full"
        >
          {isSimulationRunning ? "Parar Simulação" : "Iniciar Simulação"}
        </Button>

        <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Adicionar Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicleId">ID do Veículo</Label>
                <Input
                  id="vehicleId"
                  value={newVehicleId}
                  onChange={(e) => setNewVehicleId(e.target.value)}
                  placeholder="Ex: CARRO_A"
                />
              </div>
              <Button onClick={handleAddVehicle} className="w-full">
                Adicionar à Fila
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isStartChargingOpen} onOpenChange={setIsStartChargingOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={vehicleQueue.length === 0 || freeStations.length === 0}
            >
              Iniciar Carregamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Carregamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Veículo na Fila</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleQueue.map((vehicleId) => (
                      <SelectItem key={vehicleId} value={vehicleId}>
                        {vehicleId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Carregador Disponível</Label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um carregador" />
                  </SelectTrigger>
                  <SelectContent>
                    {freeStations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStartCharging} className="w-full">
                Iniciar Carregamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-2">
          <Label>Parar Carregamento</Label>
          {busyStations.map((station) => (
            <Button
              key={station.id}
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onStopCharging(station.id)}
            >
              Parar {station.id} ({station.vehicleId})
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm mb-2">Fila de Veículos</h3>
        <div className="space-y-1">
          {vehicleQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Fila vazia</p>
          ) : (
            vehicleQueue.map((vehicleId, index) => (
              <div key={vehicleId} className="text-sm p-2 bg-muted rounded">
                {index + 1}. {vehicleId}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm mb-2">Status das Estações</h3>
        <div className="text-sm space-y-1">
          <div>Livres: {freeStations.length}</div>
          <div>Carregando: {busyStations.length}</div>
          <div>Total: {stations.length}</div>
        </div>
      </div>
    </Card>
  );
}