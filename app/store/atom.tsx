import { atom } from "jotai";

export const walletAtom = atom<string | null>(null);
export const solbalanceAtom = atom<number | null>(null);
export const splbalanceAtom = atom<number | null>(null);
export const mintAddrAtom = atom<string | null>(
  "2KKSenYVufSyMSdEDnxexD9VHzz8Y3AaFEAdNx2Gjw46"
);

export const transactionResultAtom = atom<{
  signature: string;
  success: boolean;
} | null>(null);
