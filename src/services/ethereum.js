import { ethers } from 'ethers';
import HackathonRegistryContract from '../contracts/HackathonRegistry.json';

class EthereumService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
  }

  async connectWallet() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed.');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Use ethers v5 syntax for compatibility
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      this.contract = new ethers.Contract(
        HackathonRegistryContract.address,
        HackathonRegistryContract.abi,
        this.signer
      );
      
      this.isConnected = true;
      
      const address = await this.signer.getAddress();
      console.log('✅ Wallet connected:', address);
      
      return address;
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      throw error;
    }
  }

  // AURA Coin Functions
  async getAuraCoinBalance(address) {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      const result = await this.contract.getAuraCoinBalance(address);
      return {
        balance: result.balance.toNumber(),
        totalEarned: result.totalEarned.toNumber(),
        totalRedeemed: result.totalRedeemed.toNumber()
      };
    } catch (error) {
      console.error('❌ Error getting AURA balance:', error);
      return { balance: 0, totalEarned: 0, totalRedeemed: 0 };
    }
  }

  async awardAuraCoin(participantAddress, auraAmount, hackathonName, reason) {
    try {
      if (!this.isConnected) {
        await this.connectWallet();
      }

      console.log(`🌟 Awarding ${auraAmount} AURA coins to ${participantAddress}...`);
      
      const tx = await this.contract.awardAuraCoin(participantAddress, auraAmount, hackathonName, reason);
      console.log('⏳ Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ AURA coins awarded successfully!');
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error awarding AURA coins:', error);
      throw error;
    }
  }

  async redeemAuraForETH(auraAmount) {
    try {
      if (!this.isConnected) {
        await this.connectWallet();
      }

      console.log(`💰 Redeeming ${auraAmount} AURA coins for ETH...`);
      
      const tx = await this.contract.redeemAuraForETH(auraAmount);
      console.log('⏳ Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ AURA coins redeemed for ETH successfully!');
      
      const ethAmount = (auraAmount * 1) / 1000; // 1000 AURA = 1 ETH
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        ethAmount: ethAmount
      };
    } catch (error) {
      console.error('❌ Error redeeming AURA coins:', error);
      throw error;
    }
  }

  async getAuraRedemptionHistory(address) {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      const transactions = await this.contract.getAuraRedemptionHistory(address);
      
      return transactions.map(tx => ({
        user: tx.user,
        auraAmount: tx.auraAmount.toNumber(),
        ethAmount: ethers.utils.formatEther(tx.ethAmount),
        transactionType: tx.transactionType,
        hackathonName: tx.hackathonName,
        reason: tx.reason,
        timestamp: new Date(tx.timestamp.toNumber() * 1000),
        txHash: tx.txHash,
        awardedBy: tx.awardedBy
      }));
    } catch (error) {
      console.error('❌ Error getting AURA history:', error);
      return [];
    }
  }

  async getAuraToEthRate() {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      const rate = await this.contract.getAuraToEthRate();
      return rate.toNumber();
    } catch (error) {
      console.error('❌ Error getting AURA rate:', error);
      return 1000; // Default fallback
    }
  }

  async isHackathonHost(address) {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      return await this.contract.isHackathonHost(address);
    } catch (error) {
      console.error('❌ Error checking host status:', error);
      return false;
    }
  }

  // Regular hackathon functions
  async registerParticipant(name, teamName, projectTitle) {
    try {
      const tx = await this.contract.registerParticipant(name, teamName, projectTitle);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw error;
    }
  }

  async getBalance() {
    try {
      if (!this.provider) {
        await this.connectWallet();
      }
      
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      // Use ethers v5 syntax
      return ethers.utils.formatEther(balance);
    } catch (error) {
      return '0';
    }
  }

  async isOwner() {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      const owner = await this.contract.owner();
      const currentAddress = await this.signer.getAddress();
      return owner.toLowerCase() === currentAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  async getParticipantCount() {
    try {
      if (!this.contract) {
        await this.connectWallet();
      }
      
      const count = await this.contract.getParticipantCount();
      return count.toNumber();
    } catch (error) {
      return 0;
    }
  }
}

export default new EthereumService();