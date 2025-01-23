"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAtom } from "jotai";
import {
  mintAddrAtom,
  solbalanceAtom,
  splbalanceAtom,
  walletAtom,
} from "./store/atom";
import React, { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js"; // Import the necessary Solana SDK components
import { Program, AnchorProvider, Idl, web3 } from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { BN } from "bn.js"; // Import BN class as a value
// import IDLJson from "@/idl/spl_transfer.json";
import IDLJson from "@/idl/token_transfer.json";

const PROGRAM_ID = "7jnSQqiycxtGL9LpmFhdph6ytjcCtDxSFjtdUbMRnmWp";

export default function Home() { 
  const [solBalance] = useAtom(solbalanceAtom);
  const [splbalance] = useAtom(splbalanceAtom);
  const [mintAddr, setMintAddr] = useAtom(mintAddrAtom);
  const [walletAddress] = useAtom(walletAtom);
  const [recipientAddress, setRecipientAddress] = useState(""); // State for recipient address input
  const [status, setStatus] = useState("");
  const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

  const handleTransfer = async () => {
    try {
      const payer = new PublicKey(String(walletAddress));
      const mint = new PublicKey(String(mintAddr));
      const recipient = new PublicKey(recipientAddress);

      const connection = new Connection(DEVNET_ENDPOINT);
      const provider = new AnchorProvider(
        connection,
        solana,
        AnchorProvider.defaultOptions()
      );

      const senderATA = spl.getAssociatedTokenAddressSync(
        mint,
        payer,
        true,
        spl.TOKEN_2022_PROGRAM_ID
      );

      const recipientATA = spl.getAssociatedTokenAddressSync(
        mint,
        recipient,
        true,
        spl.TOKEN_2022_PROGRAM_ID
      );

      console.log("here :", senderATA.toBase58(), recipientATA.toBase58());

      const toAtaInfo = await connection.getAccountInfo(recipientATA);
      let transaction = new web3.Transaction();
      if (!toAtaInfo) {
        const createAtaIx = spl.createAssociatedTokenAccountInstruction(
          payer, // payer
          recipientATA, // ata
          recipient, // owner
          mint, // mint
          spl.TOKEN_2022_PROGRAM_ID // programId
        );
        transaction.add(createAtaIx);
      }
      const program = new Program(
        IDLJson as Idl,
        PROGRAM_ID,
        provider
      );
      console.log("here-->1");

      const transferIx = await program.methods
        .transferToken2022(new BN(10000000000))
        .accounts({
          from: payer,
          fromAta: senderATA,
          to: recipient,
          toAta: recipientATA,
          mint: mint,
          tokenProgram: spl.TOKEN_2022_PROGRAM_ID,
        })
        .transaction();
      console.log("here-->");

      transaction.add(transferIx);

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = payer;
      const simRes = await connection.simulateTransaction(transaction);
      if (simRes.value.err) {
        console.log(simRes);
        return;
      }
      const signature = await solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature.signature);
      console.log("Okay", signature);
      setStatus("Success")
      // setTransactionResult({
      // signature: signature,
      // success: true
      // });
    } catch (error) {
      console.error("fail:", error);
      // setTransactionResult({
      //     signature: '',
      //     success: false
      // });
    }
  };
  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-screen bg-gradient-to-b from-blue-100 to-white ">
      <div className="text-4xl font-bold text-blue-700 text-center mb-8">Venus Token</div>
      <div className="mb-6">
        <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 transition-colors duration-200" />
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-semibold">SOL Balance:</span> {solBalance}
            </div>
            <div>
              <span className="font-semibold">SPL Token Balance:</span> {splbalance}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-md">Token Address:</span>
            <span className="text-sm break-all">{mintAddr}</span>
          </div>
          <div className="flex flex-col">
            <label htmlFor="recipient" className="text-md font-semibold mb-1">
              Recipient Address:
            </label>
            <input
              id="recipient"
              type="text"
              placeholder="Enter recipient address"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>
          <div className="text-md">
            <span className="font-semibold">Token Amount:</span> 1,000,000
          </div>
        </div>
        <div className="flex justify-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={handleTransfer}
          >
            Send Tokens
          </button>
        </div>
        <div className="flex justify-center text-blue-500">{status}</div>
      </div>
    </div>
  )
}