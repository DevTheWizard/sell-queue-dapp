import { useState, useEffect } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xYourContractAddress"; // Replace with actual contract address
const ABI = [
  "function requestSell(uint256 amount) external",
  "function sellRequests(address) view returns (uint256)",
  "function sellQueue(uint256) view returns (address)",
  "function dailySellCap() view returns (uint256)",
  "function emergencySell(uint256 amount) external",
];

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [sellAmount, setSellAmount] = useState("");
  const [queue, setQueue] = useState([]);
  const [dailyLimit, setDailyLimit] = useState("0");

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask is required");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    setProvider(provider);
    setSigner(signer);
    setAccount(account);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setContract(contract);

    const dailyCap = await contract.dailySellCap();
    setDailyLimit(ethers.utils.formatUnits(dailyCap, 18));
    loadQueue(contract);
  }

  async function loadQueue(contract) {
    const queueData = [];
    for (let i = 0; i < 10; i++) {
      try {
        const user = await contract.sellQueue(i);
        queueData.push(user);
      } catch (err) {
        break;
      }
    }
    setQueue(queueData);
  }

  async function requestSell() {
    if (!contract || !sellAmount) {
      alert("Please connect wallet and enter a valid amount");
      return;
    }
    try {
      const amount = ethers.utils.parseUnits(sellAmount, 18);
      console.log("Requesting sell for:", amount.toString());
      const tx = await contract.requestSell(amount);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");
      alert("Sell request submitted!");
      loadQueue(contract);
    } catch (error) {
      console.error("Error submitting sell request:", error);
      alert("Transaction failed: " + (error.message || "Unknown error"));
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sell Queue dApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <div>
        <h2>Submit Sell Request</h2>
        <input
          type="number"
          placeholder="Enter amount"
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
        />
        <button onClick={requestSell}>Request Sell</button>
      </div>
      <div>
        <h2>Sell Queue</h2>
        <ul>
          {queue.map((wallet, index) => (
            <li key={index}>#{index + 1} - {wallet}</li>
          ))}
        </ul>
      </div>
      <p>Daily Sell Cap: {dailyLimit} SQT</p>
    </div>
  );
}
