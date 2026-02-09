export type {
  AmountMode,
  DedupeStrategy,
  ParsedRecipient,
  ParseRecipientsResult,
  RecipientFixesConfig,
  RecipientRowInput,
  RecipientStatus,
  RecipientTotals,
  RecipientValidation,
} from "@/lib/recipients";

export type { SprayEvent, SprayEventType } from "@/lib/sprayEventsClient";

export type TransactionRecord = {
  id: string;
  type: "native" | "token";
  hash: string;
  status: "pending" | "success" | "error";
  timestamp: string;
  recipients: number;
  totalFormatted: string;
  tokenSymbol: string;
  networkKey: string;
  sequence: number;
  errorMessage?: string;
};

export type BatchProgress = {
  status: "idle" | "submitting" | "confirmed" | "error";
  totalRecipients: number;
  batchSize: number;
  totalBatches: number;
  currentBatch: number;
  txHash?: string | null;
  errorMessage?: string | null;
};

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};

export type AllowanceStatus =
  | "unknown"
  | "loading"
  | "approved"
  | "needs_approval";

export type Erc20Steps = {
  active: boolean;
  currentStep: "idle" | "approving" | "approved" | "sending" | "complete";
  approvalTxHash: string | null;
  sendTxHash: string | null;
  error: string | null;
};
