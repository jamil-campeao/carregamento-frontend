import { useState, useEffect, useCallback } from "react";
import { ChargingStation, type ChargingStationData } from "./components/ChargingStation";
import { EventLog, type EventLogEntry } from "./components/EventLog";
import { ControlPanel } from "./components/ControlPanel";

export default function App() {
  const [lamportClock, setLamportClock] = useState(0);
  const [stations, setStations] = useState<ChargingStationData[]>([
    { id: "CARREGADOR_01", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
    { id: "CARREGADOR_02", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
    { id: "CARREGADOR_03", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
    { id: "CARREGADOR_04", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
    { id: "CARREGADOR_05", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
    { id: "CARREGADOR_06", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
  ]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [vehicleQueue, setVehicleQueue] = useState<string[]>([]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // ALTERAÇÃO 1: Função de incremento do relógio simplificada.
  // Ela agora apenas atualiza o estado e não retorna um valor, evitando o "stale closure".
  // A dependência foi removida, pois a função updater (prev => ...) já garante o valor mais recente.
  const incrementLamportClock = useCallback(() => {
    setLamportClock(prev => prev + 1);
  }, []);

  // ALTERAÇÃO 2: A função `addEvent` agora gerencia a atualização do relógio.
  // Ela recebe o novo valor do timestamp diretamente do `setLamportClock` updater.
  const addEvent = useCallback((source: string, description: string) => {
    let eventTimestamp = 0;
    setLamportClock(prevClock => {
      const newClock = prevClock + 1;
      eventTimestamp = newClock; // Captura o novo valor do relógio
      return newClock;
    });

    const newEvent: EventLogEntry = {
      id: `event_${eventTimestamp}_${Date.now()}`,
      timestamp: eventTimestamp,
      source,
      description,
      createdAt: new Date(),
    };
    setEvents(prev => [newEvent, ...prev]);
    return eventTimestamp; // Retorna o timestamp correto e atualizado
  }, []); // Dependências vazias, pois `setLamportClock` e `setEvents` são estáveis.

  const addVehicle = useCallback((vehicleId: string) => {
    if (!vehicleQueue.includes(vehicleId)) {
      setVehicleQueue(prev => [...prev, vehicleId]);
      addEvent("API_Gateway", `Novo veículo '${vehicleId}' solicitou carregamento`);
    }
  }, [vehicleQueue, addEvent]);

  const startCharging = useCallback((vehicleId: string, stationId: string) => {
    const timestamp = addEvent(stationId, `Iniciou o carregamento do '${vehicleId}'`);

    setStations(prev =>
      prev.map(station =>
        station.id === stationId
          ? { ...station, status: "Carregando", vehicleId, batteryLevel: 0, lamportTimestamp: timestamp }
          : station
      )
    );

    setVehicleQueue(prev => prev.filter(id => id !== vehicleId));
  }, [addEvent]);

  const stopCharging = useCallback((stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (station && station.vehicleId) {
      const timestamp = addEvent(stationId, `Carregamento do '${station.vehicleId}' finalizado`);

      setStations(prev =>
        prev.map(s =>
          s.id === stationId
            ? { ...s, status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: timestamp }
            : s
        )
      );

      // Simular faturamento
      setTimeout(() => {
        addEvent("Serviço_Faturamento", `Fatura gerada para '${station.vehicleId}'`);
      }, 500);
    }
  }, [stations, addEvent]);

  const toggleSimulation = useCallback(() => {
    const nextIsRunning = !isSimulationRunning;
    setIsSimulationRunning(nextIsRunning);
    addEvent("Sistema", nextIsRunning ? "Simulação iniciada" : "Simulação pausada");
  }, [isSimulationRunning, addEvent]);

  // Simulação automática de progresso de carregamento
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      setStations(prevStations =>
        prevStations.map(station => {
          if (station.status === "Carregando" && station.batteryLevel < 100) {
            const newLevel = Math.min(station.batteryLevel + Math.random() * 5 + 2, 100);

            // Adicionar evento de atualização de carga sem incrementar o relógio principal
            // (geralmente, atualizações de status não precisam de um evento de log global)
            // Se precisar, o addEvent deve ser chamado.
            if (Math.floor(newLevel / 25) > Math.floor(station.batteryLevel / 25)) {
              // A chamada ao addEvent foi mantida para seguir o comportamento original.
              setTimeout(() => {
                addEvent(station.id, `Atualização de carga: ${Math.floor(newLevel)}%`);
              }, 100);
            }

            if (newLevel >= 100 && station.vehicleId) {
              setTimeout(() => {
                stopCharging(station.id);
              }, 1000);
            }

            // Apenas o estado da estação é atualizado aqui, o relógio é atualizado nos eventos.
            return { ...station, batteryLevel: newLevel };
          }
          return station;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulationRunning, addEvent, stopCharging]);

  // ALTERAÇÃO 3: Lógica de alocação de veículos otimizada.
  // Agora aloca todos os veículos possíveis para todas as estações livres de uma só vez.
  useEffect(() => {
    if (!isSimulationRunning || vehicleQueue.length === 0) return;

    const freeStations = stations.filter(s => s.status === "Livre");
    const vehiclesToCharge = vehicleQueue.slice(0, freeStations.length);

    if (vehiclesToCharge.length > 0) {
      const timeout = setTimeout(() => {
        vehiclesToCharge.forEach((vehicleId, index) => {
          const stationId = freeStations[index].id;
          startCharging(vehicleId, stationId);
        });
      }, 2000); // Aumentei o delay para ser mais visível na UI

      return () => clearTimeout(timeout);
    }
  }, [isSimulationRunning, vehicleQueue, stations, startCharging]);

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center mb-8">
          Dashboard de Carregamento de Veículos Elétricos - Simulação de Sistema Distribuído
        </h1>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Painel de Estações de Carregamento - Lado Esquerdo */}
          <div className="col-span-3 space-y-4">
            <h2>Estações de Carregamento</h2>
            <div className="grid grid-cols-1 gap-3 max-h-full overflow-y-auto">
              {stations.map((station) => (
                <ChargingStation key={station.id} station={station} />
              ))}
            </div>
          </div>

          {/* Log de Eventos Globais - Centro */}
          <div className="col-span-6">
            <EventLog events={events} />
          </div>

          {/* Painel de Controle - Lado Direito */}
          <div className="col-span-3">
            <ControlPanel
              stations={stations}
              onAddVehicle={addVehicle}
              onStartCharging={startCharging}
              onStopCharging={stopCharging}
              vehicleQueue={vehicleQueue}
              isSimulationRunning={isSimulationRunning}
              onToggleSimulation={toggleSimulation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}