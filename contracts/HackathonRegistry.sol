// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HackathonRegistry {
    struct Participant {
        address walletAddress;
        string name;
        string teamName;
        string projectTitle;
        bool isRegistered;
        uint256 registrationTime;
    }
    
    struct AuraCoin {
        uint256 balance;
        uint256 totalEarned;
        uint256 totalRedeemed;
    }
    
    struct AuraTransaction {
        address user;
        uint256 auraAmount;
        uint256 ethAmount;
        string transactionType; // "earned_aura", "redeemed_eth"
        string hackathonName;
        string reason;
        uint256 timestamp;
        bytes32 txHash;
        address awardedBy;
    }
    
    mapping(address => Participant) public participants;
    mapping(address => AuraCoin) public auraCoinBalances;
    mapping(address => AuraTransaction[]) public userAuraHistory;
    mapping(address => bool) public hackathonHosts;
    address[] public participantAddresses;
    AuraTransaction[] public allAuraTransactions;
    address public owner;
    
    uint256 public constant AURA_TO_ETH_RATE = 1000; // 1000 AURA = 1 ETH
    uint256 public totalAuraInCirculation;
    uint256 public totalEthRedeemed;
    
    event ParticipantRegistered(address indexed participant, string name, string teamName);
    event AuraCoinAwarded(address indexed user, uint256 auraAmount, string hackathonName, string reason, address awardedBy);
    event AuraCoinRedeemed(address indexed user, uint256 auraAmount, uint256 ethAmount);
    event HackathonHostAdded(address indexed host);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyHackathonHost() {
        require(hackathonHosts[msg.sender] || msg.sender == owner, "Only hackathon hosts can award AURA");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        hackathonHosts[msg.sender] = true;
    }
    
    function addHackathonHost(address _host) public onlyOwner {
        hackathonHosts[_host] = true;
        emit HackathonHostAdded(_host);
    }
    
    function registerParticipant(
        string memory _name,
        string memory _teamName,
        string memory _projectTitle
    ) public {
        require(!participants[msg.sender].isRegistered, "Already registered");
        
        participants[msg.sender] = Participant({
            walletAddress: msg.sender,
            name: _name,
            teamName: _teamName,
            projectTitle: _projectTitle,
            isRegistered: true,
            registrationTime: block.timestamp
        });
        
        participantAddresses.push(msg.sender);
        
        emit ParticipantRegistered(msg.sender, _name, _teamName);
    }
    
    function awardAuraCoin(
        address _participant,
        uint256 _auraAmount,
        string memory _hackathonName,
        string memory _reason
    ) public onlyHackathonHost {
        require(participants[_participant].isRegistered, "Participant not registered");
        require(_auraAmount > 0, "AURA amount must be greater than 0");
        
        // Update AURA coin balance
        auraCoinBalances[_participant].balance += _auraAmount;
        auraCoinBalances[_participant].totalEarned += _auraAmount;
        totalAuraInCirculation += _auraAmount;
        
        // Record transaction
        AuraTransaction memory newTx = AuraTransaction({
            user: _participant,
            auraAmount: _auraAmount,
            ethAmount: 0,
            transactionType: "earned_aura",
            hackathonName: _hackathonName,
            reason: _reason,
            timestamp: block.timestamp,
            txHash: keccak256(abi.encodePacked(_participant, block.timestamp, _auraAmount)),
            awardedBy: msg.sender
        });
        
        userAuraHistory[_participant].push(newTx);
        allAuraTransactions.push(newTx);
        
        emit AuraCoinAwarded(_participant, _auraAmount, _hackathonName, _reason, msg.sender);
    }
    
    function redeemAuraForETH(uint256 _auraAmount) public {
        require(participants[msg.sender].isRegistered, "Not registered");
        require(auraCoinBalances[msg.sender].balance >= _auraAmount, "Insufficient AURA balance");
        require(_auraAmount >= AURA_TO_ETH_RATE, "Minimum 1000 AURA required for redemption");
        
        uint256 ethAmount = (_auraAmount * 1 ether) / AURA_TO_ETH_RATE;
        require(address(this).balance >= ethAmount, "Insufficient contract ETH balance");
        
        // Deduct AURA coins
        auraCoinBalances[msg.sender].balance -= _auraAmount;
        auraCoinBalances[msg.sender].totalRedeemed += _auraAmount;
        totalAuraInCirculation -= _auraAmount;
        totalEthRedeemed += ethAmount;
        
        // Transfer ETH
        payable(msg.sender).transfer(ethAmount);
        
        // Record transaction
        AuraTransaction memory newTx = AuraTransaction({
            user: msg.sender,
            auraAmount: _auraAmount,
            ethAmount: ethAmount,
            transactionType: "redeemed_eth",
            hackathonName: "ETH Redemption",
            reason: "Converted AURA to ETH",
            timestamp: block.timestamp,
            txHash: keccak256(abi.encodePacked(msg.sender, block.timestamp, _auraAmount, ethAmount)),
            awardedBy: msg.sender
        });
        
        userAuraHistory[msg.sender].push(newTx);
        allAuraTransactions.push(newTx);
        
        emit AuraCoinRedeemed(msg.sender, _auraAmount, ethAmount);
    }
    
    function getAuraCoinBalance(address _user) public view returns (uint256 balance, uint256 totalEarned, uint256 totalRedeemed) {
        AuraCoin memory userAura = auraCoinBalances[_user];
        return (userAura.balance, userAura.totalEarned, userAura.totalRedeemed);
    }
    
    function getAuraRedemptionHistory(address _user) public view returns (AuraTransaction[] memory) {
        return userAuraHistory[_user];
    }
    
    function getAllAuraTransactions() public view returns (AuraTransaction[] memory) {
        return allAuraTransactions;
    }
    
    function getAuraToEthRate() public pure returns (uint256) {
        return AURA_TO_ETH_RATE;
    }
    
    function getAuraStats() public view returns (uint256 totalInCirculation, uint256 totalEthRedeemed_) {
        return (totalAuraInCirculation, totalEthRedeemed);
    }
    
    function isHackathonHost(address _address) public view returns (bool) {
        return hackathonHosts[_address];
    }
    
    function getParticipantCount() public view returns (uint256) {
        return participantAddresses.length;
    }
    
    function getParticipant(address _addr) public view returns (Participant memory) {
        return participants[_addr];
    }
    
    // Fund the contract with ETH for AURA redemptions
    function fundContract() public payable onlyOwner {
        // Contract receives ETH for AURA redemptions
    }
    
    receive() external payable {}
}