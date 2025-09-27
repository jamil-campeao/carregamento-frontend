import { useState, useEffect, useCallback } from "react";
import {
  ChargingStation,
  type ChargingStationData,
} from "./components/ChargingStation";
import { EventLog, type EventLogEntry } from "./components/EventLog";
import { ControlPanel } from "./components/ControlPanel";

const API_BASE_URL = "http://72.60.12.191:8000/api";
const TOKEN = import.meta.env.VITE_API_TOKEN;
const WEB_SOCKET_URL = `ws://72.60.12.191:8000/ws?token=${TOKEN}`;

export default function App() {
  const [stations, setStations] = useState<ChargingStationData[]>([]);
  const [activeChargers, setActiveChargers] = useState<string[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  const fetchInitialState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estado-inicial`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao buscar estado inicial");
      }

      const data = await response.json();
      console.log("Estado inicial recebido:", data);

      const stationsData = data.carregadores || {};

      const stationsArray = Object.values(stationsData).map((station: any) => ({
        id: station.carregador,
        status:
          station.status === "livre"
            ? "Livre"
            : station.status === "offline"
            ? "Offline"
            : station.energia_consumida_kWh > 0
            ? "Carregando"
            : "Ocupado",
        vehicleId: station.carro_conectado,
        energiaConsumida: station.energia_consumida_kWh || 0,
        lamportTimestamp: station.timestamp || 0,
      }));

      setStations(stationsArray);

      const eventsArray = (data.eventos || []).map(
        (event: any): EventLogEntry => ({
          id: `event_${event.timestamp || Date.now()}_${Math.random()}`,
          timestamp: event.timestamp || 0,
          source: event.carregador || event.source || "Sistema",
          description: `Ação: ${event.acao || "Desconhecida"} para o carro ${
            event.carro || "N/A"
          }`,
          createdAt: new Date(),
        })
      );
      setEvents(eventsArray);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      // CORREÇÃO: Em caso de erro, começamos com a lista vazia.
      // A aplicação será populada via WebSocket à medida que os dados chegarem.
      setStations([]);
    }
  }, []);

  const fetchActiveChargers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/carregadores/ativos`, {
        headers: { Authorization: `${TOKEN}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveChargers(data.carregadores_ativos || []);
      }
    } catch (error) {
      console.error("Erro ao buscar carregadores ativos:", error);
    }
  }, []);

  const fetchBillingStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/status`, {
        headers: { Authorization: `${TOKEN}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsBillingRunning(data.status === "ativo");
      }
    } catch (error) {
      console.error("Erro ao buscar status do billing:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();
    fetchActiveChargers();
    fetchBillingStatus();
  }, [fetchInitialState, fetchActiveChargers, fetchBillingStatus]);

  useEffect(() => {
    const ws = new WebSocket(WEB_SOCKET_URL);

    ws.onopen = () => {
      console.log("Conectado ao servidor WebSocket.");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const { topic, payload } = message;

      if (topic.includes("status")) {
        setStations((prevStations) => {
          const newStatus = {
            id: payload.carregador,
            status:
              payload.status === "livre"
                ? "Livre"
                : payload.status === "offline"
                ? "Offline"
                : payload.energia_consumida_kWh > 0
                ? "Carregando"
                : "Ocupado",
            vehicleId: payload.carro_conectado,
            energiaConsumida: payload.energia_consumida_kWh || 0,
            lamportTimestamp: payload.timestamp || 0,
          };

          const stationIndex = prevStations.findIndex(
            (station) => station.id === payload.carregador
          );

          if (stationIndex > -1) {
            // Atualiza a estação existente
            const updatedStations = [...prevStations];
            updatedStations[stationIndex] = newStatus;
            return updatedStations;
          } else {
            // Adiciona a nova estação se ela não existir
            return [...prevStations, newStatus];
          }
        });
      } else if (topic.includes("eventos")) {
        const newEvent: EventLogEntry = {
          id: `event_${payload.timestamp || Date.now()}_${Math.random()}`,
          timestamp: payload.timestamp || 0,
          source: payload.carregador || payload.source || "Sistema",
          description: `Ação: ${payload.acao || "Desconhecida"} para o carro ${
            payload.carro || "N/A"
          }`,
          createdAt: new Date(),
        };
        setEvents((prevEvents) => [newEvent, ...prevEvents]);
      }
    };

    ws.onclose = () => {
      console.log("Desconectado do servidor WebSocket.");
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const addCharger = useCallback(
    async (chargerId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/carregadores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${TOKEN}`,
          },
          body: JSON.stringify({ carregador_id: chargerId }),
        });
        if (response.ok) {
          fetchActiveChargers();
        } else {
          console.error("Falha ao iniciar carregador.");
        }
      } catch (error) {
        console.error("Erro ao adicionar carregador:", error);
      }
    },
    [fetchActiveChargers]
  );

  const stopCharger = useCallback(
    async (stationId: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/carregadores/${stationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `${TOKEN}`,
            },
          }
        );
        if (response.ok) {
          fetchActiveChargers();
        } else {
          console.error("Falha ao parar carregador.");
        }
      } catch (error) {
        console.error("Erro ao parar carregador:", error);
      }
    },
    [fetchActiveChargers]
  );

  const toggleBilling = useCallback(async () => {
    const endpoint = isBillingRunning ? "stop" : "start";
    try {
      const response = await fetch(`${API_BASE_URL}/billing/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `${TOKEN}`,
        },
      });

      if (response.ok) {
        setIsBillingRunning(!isBillingRunning);
      } else {
        console.error("Falha ao alterar status do serviço de billing.");
      }
    } catch (error) {
      console.error("Erro ao acionar o serviço de billing:", error);
    }
  }, [isBillingRunning]);

  // NOVA FUNÇÃO PARA LIMPAR A SIMULAÇÃO
  const clearSimulation = useCallback(async () => {
    if (
      !window.confirm(
        "Tem certeza de que deseja limpar todos os carregadores e eventos? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/limpar-carregadores-e-eventos`,
        {
          method: "DELETE",
          headers: { Authorization: `${TOKEN}` },
        }
      );

      if (response.ok) {
        setEvents([]);
        setStations([]);
        fetchActiveChargers();
      } else {
        console.error("Falha ao limpar a simulação.");
        alert("Ocorreu um erro ao tentar limpar a simulação.");
      }
    } catch (error) {
      console.error("Erro ao limpar a simulação:", error);
      alert("Ocorreu um erro ao tentar limpar a simulação.");
    }
  }, [fetchActiveChargers]);

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center mb-8">
          Dashboard de Carregamento de Veículos Elétricos - Simulação de Sistema
          Distribuído
        </h1>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          <div className="col-span-3 space-y-4">
            <h2>Estações de Carregamento</h2>
            <div className="grid grid-cols-1 gap-3 max-h-full overflow-y-auto">
              {stations.map((station) => (
                <ChargingStation key={station.id} station={station} />
              ))}
            </div>
          </div>

          <div className="col-span-6">
            <EventLog events={events} />
          </div>

          <div className="col-span-3">
            <ControlPanel
              stations={stations}
              activeChargers={activeChargers}
              onAddCharger={addCharger}
              onStopCharger={stopCharger}
              isBillingRunning={isBillingRunning}
              onToggleBilling={toggleBilling}
              onClearSimulation={clearSimulation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
