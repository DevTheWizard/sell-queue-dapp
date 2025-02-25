import { useState, useEffect } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xYourContractAddress"; // Replace with your contract address
const ABI = [
  "function requestSell(uint256 amount) external",
  "function sellRequests(address) view returns (uint256)",
  "function sellQueue(uint256) view returns (address)",
  "function dailySellCap() view returns (uint256)",
  "function emergencySell(uint256 amount) external",
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [sellAmount, setSellAmount] = useState("");
  const [queue, setQueue] = useState([]);
  const [dailyLimit, setDailyLimit] = useState("0");

  useEffect(() => {
    async function loadBlockchainData() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(contract);

      const dailyCap = await contract.dailySellCap();
      setDailyLimit(ethers.utils.formatUnits(dailyCap, 18));

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

    if (window.ethereum) {
      loadBlockchainData();
    }
  }, []);

  async function requestSell() {
    if (!contract || !sellAmount) return;
    const amount = ethers.utils.parseUnits(sellAmount, 18);
    const tx = await contract.requestSell(amount);
    await tx.wait();
    alert("Sell request submitted!");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sell Queue dApp</h1>
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
            <li key={index}>
              #{index + 1} - {wallet}
            </li>
          ))}
        </ul>
      </div>
      <p>Daily Sell Cap: {dailyLimit} SQT</p>
    </div>
  );
}
