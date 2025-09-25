import { useState, useEffect, useCallback } from "react";
import { ChargingStation, type ChargingStationData } from "./components/ChargingStation";
import { EventLog, type EventLogEntry } from "./components/EventLog";
import { ControlPanel } from "./components/ControlPanel";

const API_BASE_URL = "http://72.60.12.191:8000/api"
const TOKEN = import.meta.env.VITE_API_TOKEN
const WEB_SOCKET_URL = `ws://72.60.12.191:8000/ws?token=${TOKEN}`

export default function App() {
  const [stations, setStations] = useState<ChargingStationData[]>([]);
  const [lamportClock, setLamportClock] = useState(0);
  const [vehicleQueue, setVehicleQueue] = useState<string[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  const fetchInitialState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estado-inicial`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${TOKEN}`
        }
      }
      );

      if (!response.ok) {
        throw new Error("Falha ao buscar estado inicial");
      }

      const data = await response.json();
      console.log(data)

      const stationsArray = Object.values(data.carregadores || {}) as ChargingStationData[];
      setStations(stationsArray);

      const eventsArray = (data.eventos || []).map((event: any) => ({
        ...event,
        createdAt: new Date()
      }));
    setEvents(eventsArray);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      // Inicia com um estado padrão em caso de erro, para a UI não quebrar
      setStations([
        { id: "CARREGADOR_01", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
        { id: "CARREGADOR_02", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
        { id: "CARREGADOR_03", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
        { id: "CARREGADOR_04", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
        { id: "CARREGADOR_05", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
        { id: "CARREGADOR_06", status: "Livre", vehicleId: null, batteryLevel: 0, lamportTimestamp: 0 },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  // Efeito para gerenciar a conexão WebSocket
  useEffect(() => {
    const ws = new WebSocket(WEB_SOCKET_URL);

    ws.onopen = () => {
      console.log("Conectado ao servidor WebSocket.");
    };

    ws.onmessage = (event) => {
      console.log("Mensagem recebida:", event);
      const message = JSON.parse(event.data);
      const { topic, payload } = message;

      if (topic.includes("status")) {
        // Atualiza o estado de uma estação específica
        setStations(prevStations => {
          const stationExists = prevStations.some(station => station.id === payload.carregador);
          if (stationExists) {
            // Atualiza a estação existente
            return prevStations.map(station =>
              station.id === payload.carregador
                ? {
                    id: payload.carregador,
                    status: payload.status === 'livre' ? 'Livre' : (payload.energia_consumida_kWh > 0 ? 'Carregando' : 'Ocupado'),
                    vehicleId: payload.carro_conectado,
                    batteryLevel: payload.energia_consumida_kWh, // Exemplo, idealmente o backend enviaria o nível da bateria
                    lamportTimestamp: payload.timestamp || station.lamportTimestamp
                  }
                : station
            );
          } else {
            // Adiciona a nova estação se ela não existir
            return [...prevStations, {
              id: payload.carregador,
              status: payload.status === 'livre' ? 'Livre' : (payload.energia_consumida_kWh > 0 ? 'Carregando' : 'Ocupado'),
              vehicleId: payload.carro_conectado,
              batteryLevel: payload.energia_consumida_kWh,
              lamportTimestamp: payload.timestamp || 0
            }];
          }
        });
      } else if (topic.includes("eventos")) {
        // Adiciona um novo evento ao log
        const newEvent: EventLogEntry = {
          id: `event_${payload.timestamp}_${Date.now()}`,
          timestamp: payload.timestamp,
          source: payload.carregador || payload.source,
          description: `Ação: ${payload.acao} para o carro ${payload.carro}`,
          createdAt: new Date(),
        };
        setEvents(prevEvents => [newEvent, ...prevEvents]);
      }
    };

    ws.onclose = () => {
      console.log("Desconectado do servidor WebSocket.");
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    // Função de limpeza para fechar a conexão ao desmontar o componente
    return () => {
      ws.close();
    };
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez

  // As funções de controle agora devem fazer chamadas à API em vez de simular
  const addVehicle = useCallback(async (vehicleId: string) => {
    // Esta funcionalidade precisará de um endpoint no backend
    console.log("TODO: Implementar chamada de API para adicionar veículo à fila", vehicleId);
  }, []);

  const startCharging = useCallback(async (vehicleId: string, stationId: string) => {
    // Esta funcionalidade precisará de um endpoint no backend
     console.log("TODO: Implementar chamada de API para iniciar carregamento", vehicleId, stationId);
  }, []);

  const stopCharging = useCallback(async (stationId: string) => {
     // Esta funcionalidade precisará de um endpoint no backend
     console.log("TODO: Implementar chamada de API para parar carregamento", stationId);
  }, []);

  const toggleSimulation = useCallback(async () => {
    // Esta funcionalidade precisará de um endpoint no backend
    console.log("TODO: Implementar chamada de API para iniciar/parar simulação");
  }, []);


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