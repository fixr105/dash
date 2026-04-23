import { createSeedState } from "../../data/seed.js";
import type {
  Client,
  CommercialConfig,
  MetricsSnapshot,
  PortfolioState,
  Transaction,
  TransactionStatus,
} from "../types.js";

export interface CreateClientInput {
  name: string;
  product: string;
  limit: number;
  industry: string;
  status: Client["status"];
  actualCommercial?: Partial<CommercialConfig> | null;
  overrideCommercial?: Partial<CommercialConfig> | null;
  overrideEnabled?: boolean;
}

export interface CreateTransactionInput {
  clientId: string;
  amount: number;
  cycleDays: number;
  drawDate: string;
  dueDate: string;
  note: string;
}

export interface UpdateCommercialInput extends CommercialConfig {}

export interface MetricsInput extends MetricsSnapshot {}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneState(state: PortfolioState): PortfolioState {
  return structuredClone(state);
}

function mergeCommercialConfig(
  base: CommercialConfig,
  overrides?: Partial<CommercialConfig> | null,
): CommercialConfig {
  if (!overrides) {
    return structuredClone(base);
  }

  return {
    nbfc28: overrides.nbfc28 ?? base.nbfc28,
    nbfc54: overrides.nbfc54 ?? base.nbfc54,
    sourcing: overrides.sourcing ?? base.sourcing,
    collection: overrides.collection ?? base.collection,
    charges: overrides.charges ? structuredClone(overrides.charges) : structuredClone(base.charges),
  };
}

export class MemoryStore {
  private state: PortfolioState;

  constructor(initialState: PortfolioState = createSeedState()) {
    this.state = cloneState(initialState);
  }

  getState(): PortfolioState {
    return cloneState(this.state);
  }

  createClient(input: CreateClientInput): Client {
    const defaultConfig = mergeCommercialConfig(this.state.commercial, null);
    const actual = input.actualCommercial ? mergeCommercialConfig(this.state.commercial, input.actualCommercial) : null;
    const overrideBase = actual ?? this.state.commercial;
    const override =
      input.overrideEnabled && input.overrideCommercial
        ? {
            enabled: true,
            config: mergeCommercialConfig(overrideBase, input.overrideCommercial),
          }
        : { enabled: false, config: null };

    const client: Client = {
      id: createId("client"),
      name: input.name,
      product: input.product,
      limit: input.limit,
      industry: input.industry,
      status: input.status,
      commercial: {
        default: defaultConfig,
        actual,
        override,
      },
    };

    this.state.clients.push(client);
    return structuredClone(client);
  }

  deleteClient(clientId: string): void {
    this.state.clients = this.state.clients.filter((client) => client.id !== clientId);
    this.state.transactions = this.state.transactions.filter((transaction) => transaction.clientId !== clientId);
  }

  createTransaction(input: CreateTransactionInput): Transaction {
    const client = this.state.clients.find((candidate) => candidate.id === input.clientId);
    if (!client) {
      throw new Error("Client not found.");
    }

    const transaction: Transaction = {
      id: createId("txn"),
      clientId: client.id,
      clientName: client.name,
      product: client.product,
      amount: input.amount,
      approvedLimit: client.limit,
      cycleDays: input.cycleDays,
      drawDate: input.drawDate,
      dueDate: input.dueDate,
      note: input.note,
      status: "Active",
    };

    this.state.transactions.push(transaction);
    return structuredClone(transaction);
  }

  updateTransactionStatus(transactionId: string, status: TransactionStatus): Transaction {
    const transaction = this.state.transactions.find((candidate) => candidate.id === transactionId);
    if (!transaction) {
      throw new Error("Transaction not found.");
    }

    transaction.status = status;
    return structuredClone(transaction);
  }

  deleteTransaction(transactionId: string): void {
    this.state.transactions = this.state.transactions.filter((transaction) => transaction.id !== transactionId);
  }

  updateCommercials(input: UpdateCommercialInput): CommercialConfig {
    this.state.commercial = structuredClone(input);
    return structuredClone(this.state.commercial);
  }
}
