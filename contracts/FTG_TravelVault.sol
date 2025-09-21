// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for FTSO V2 Feed Consumer
interface IFtsoV2FeedConsumer {
    function getFeedById(bytes21 feedId) external view returns (uint256 value, uint64 timestamp, uint8 decimals);
}

/**
 * @title FTG - Flare Travel Goals
 * @dev Smart group savings contract with price-triggered releases using Flare FTSO
 * @notice Inspired by OGC but enhanced with real-time market data for optimal travel timing
 */
contract FTG_TravelVault is ReentrancyGuard {
    
    // ============== EVENTS ==============
    event VaultCreated(uint256 indexed vaultId, address creator, string destination, uint256 targetAmount);
    event MemberJoined(uint256 indexed vaultId, address member);
    event ContributionMade(uint256 indexed vaultId, address contributor, uint256 amount);
    event FundsReleased(uint256 indexed vaultId, uint256 amount, string reason);
    event VaultClosed(uint256 indexed vaultId, string reason);
    event PriceTriggerSet(uint256 indexed vaultId, bytes21 feedId, uint256 triggerPrice, bool isLowerBound);
    
    // ============== STRUCTS ==============
    struct TravelVault {
        string destination;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        address creator;
        address[] members;
        mapping(address => uint256) contributions;
        mapping(address => bool) isMember;
        bool isActive;
        bool fundsReleased;
        
        // Price trigger settings
        bytes21 priceFeedId;  // FTSO feed ID (e.g., ETH/USD)
        uint256 triggerPrice;  // Price that triggers release
        bool isLowerBound;     // true = release when price goes below, false = above
        bool priceTriggersEnabled;
        
        // Governance
        uint256 requiredApprovals;
        mapping(address => bool) hasApproved;
        uint256 currentApprovals;
    }
    
    // ============== STATE VARIABLES ==============
    IFtsoV2FeedConsumer public ftsoConsumer;
    
    mapping(uint256 => TravelVault) public vaults;
    uint256 public nextVaultId;
    
    // Flare FTSO Feed IDs (examples)
    bytes21 public constant ETH_USD_FEED = 0x014554482f55534400000000000000000000000000;
    bytes21 public constant BTC_USD_FEED = 0x014254432f55534400000000000000000000000000;
    bytes21 public constant FLR_USD_FEED = 0x01464c522f55534400000000000000000000000000;
    
    // ============== CONSTRUCTOR ==============
    constructor(address _ftsoConsumer) {
        ftsoConsumer = IFtsoV2FeedConsumer(_ftsoConsumer);
        nextVaultId = 1;
    }
    
    // ============== MODIFIERS ==============
    modifier onlyVaultMember(uint256 vaultId) {
        require(vaults[vaultId].isMember[msg.sender], "Not a vault member");
        _;
    }
    
    modifier onlyActiveVault(uint256 vaultId) {
        require(vaults[vaultId].isActive, "Vault is not active");
        _;
    }
    
    modifier onlyVaultCreator(uint256 vaultId) {
        require(vaults[vaultId].creator == msg.sender, "Only vault creator");
        _;
    }
    
    // ============== CORE FUNCTIONS ==============
    
    /**
     * @dev Create a new travel savings vault
     * @param destination Travel destination name
     * @param targetAmount Target savings amount in wei
     * @param deadline Unix timestamp deadline
     * @param priceFeedId FTSO feed ID for price triggers (optional)
     * @param triggerPrice Price that triggers fund release (optional)
     * @param isLowerBound Whether trigger activates when price goes below (true) or above (false)
     */
    function createVault(
        string memory destination,
        uint256 targetAmount,
        uint256 deadline,
        bytes21 priceFeedId,
        uint256 triggerPrice,
        bool isLowerBound
    ) external payable returns (uint256 vaultId) {
        require(targetAmount > 0, "Target amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");
        
        vaultId = nextVaultId++;
        TravelVault storage vault = vaults[vaultId];
        
        vault.destination = destination;
        vault.targetAmount = targetAmount;
        vault.deadline = deadline;
        vault.creator = msg.sender;
        vault.isActive = true;
        vault.requiredApprovals = 1; // Creator approval by default
        
        // Set price trigger if provided
        if (priceFeedId != bytes21(0) && triggerPrice > 0) {
            vault.priceFeedId = priceFeedId;
            vault.triggerPrice = triggerPrice;
            vault.isLowerBound = isLowerBound;
            vault.priceTriggersEnabled = true;
            
            emit PriceTriggerSet(vaultId, priceFeedId, triggerPrice, isLowerBound);
        }
        
        // Add creator as first member
        vault.members.push(msg.sender);
        vault.isMember[msg.sender] = true;
        
        // Initial contribution if sent
        if (msg.value > 0) {
            vault.contributions[msg.sender] = msg.value;
            vault.currentAmount = msg.value;
            emit ContributionMade(vaultId, msg.sender, msg.value);
        }
        
        emit VaultCreated(vaultId, msg.sender, destination, targetAmount);
        emit MemberJoined(vaultId, msg.sender);
    }
    
    /**
     * @dev Join an existing vault
     */
    function joinVault(uint256 vaultId) external payable onlyActiveVault(vaultId) {
        TravelVault storage vault = vaults[vaultId];
        require(!vault.isMember[msg.sender], "Already a member");
        require(block.timestamp < vault.deadline, "Vault deadline passed");
        
        vault.members.push(msg.sender);
        vault.isMember[msg.sender] = true;
        
        // Update required approvals (75% of members)
        vault.requiredApprovals = (vault.members.length * 75) / 100;
        if (vault.requiredApprovals == 0) vault.requiredApprovals = 1;
        
        // Contribution if sent
        if (msg.value > 0) {
            vault.contributions[msg.sender] += msg.value;
            vault.currentAmount += msg.value;
            emit ContributionMade(vaultId, msg.sender, msg.value);
        }
        
        emit MemberJoined(vaultId, msg.sender);
    }
    
    /**
     * @dev Contribute to vault
     */
    function contribute(uint256 vaultId) external payable onlyVaultMember(vaultId) onlyActiveVault(vaultId) {
        require(msg.value > 0, "Must send ETH");
        require(block.timestamp < vaults[vaultId].deadline, "Vault deadline passed");
        
        TravelVault storage vault = vaults[vaultId];
        vault.contributions[msg.sender] += msg.value;
        vault.currentAmount += msg.value;
        
        emit ContributionMade(vaultId, msg.sender, msg.value);
        
        // Check if target reached
        if (vault.currentAmount >= vault.targetAmount) {
            _checkAutoRelease(vaultId);
        }
    }
    
    /**
     * @dev Vote to approve fund release
     */
    function voteToRelease(uint256 vaultId) external onlyVaultMember(vaultId) onlyActiveVault(vaultId) {
        TravelVault storage vault = vaults[vaultId];
        require(!vault.hasApproved[msg.sender], "Already voted");
        
        vault.hasApproved[msg.sender] = true;
        vault.currentApprovals++;
        
        // Check if enough approvals to release
        if (vault.currentApprovals >= vault.requiredApprovals) {
            _releaseFunds(vaultId, "Group consensus reached");
        }
    }
    
    /**
     * @dev Check if price triggers should release funds
     */
    function checkPriceTrigger(uint256 vaultId) public view returns (bool shouldRelease, uint256 currentPrice) {
        TravelVault storage vault = vaults[vaultId];
        
        if (!vault.priceTriggersEnabled || !vault.isActive || vault.fundsReleased) {
            return (false, 0);
        }
        
        // Get current price from FTSO
        (currentPrice, , ) = ftsoConsumer.getFeedById(vault.priceFeedId);
        
        if (vault.isLowerBound) {
            shouldRelease = currentPrice <= vault.triggerPrice;
        } else {
            shouldRelease = currentPrice >= vault.triggerPrice;
        }
    }
    
    /**
     * @dev Execute price-triggered release (anyone can call)
     */
    function executePriceTrigger(uint256 vaultId) external onlyActiveVault(vaultId) nonReentrant {
        (bool shouldRelease, uint256 currentPrice) = checkPriceTrigger(vaultId);
        require(shouldRelease, "Price trigger conditions not met");
        
        string memory reason = string(abi.encodePacked(
            "Price trigger activated at ",
            _uint2str(currentPrice)
        ));
        
        _releaseFunds(vaultId, reason);
    }
    
    /**
     * @dev Emergency refund if deadline passed without consensus
     */
    function emergencyRefund(uint256 vaultId) external onlyActiveVault(vaultId) nonReentrant {
        TravelVault storage vault = vaults[vaultId];
        require(block.timestamp > vault.deadline, "Deadline not passed");
        require(!vault.fundsReleased, "Funds already released");
        
        vault.isActive = false;
        
        // Refund all members proportionally
        for (uint256 i = 0; i < vault.members.length; i++) {
            address member = vault.members[i];
            uint256 contribution = vault.contributions[member];
            
            if (contribution > 0) {
                vault.contributions[member] = 0;
                payable(member).transfer(contribution);
            }
        }
        
        emit VaultClosed(vaultId, "Emergency refund - deadline passed");
    }
    
    // ============== INTERNAL FUNCTIONS ==============
    
    function _checkAutoRelease(uint256 vaultId) internal {
        TravelVault storage vault = vaults[vaultId];
        
        // Auto-release if target reached and price triggers are met (if enabled)
        if (vault.priceTriggersEnabled) {
            (bool shouldRelease, ) = checkPriceTrigger(vaultId);
            if (shouldRelease) {
                _releaseFunds(vaultId, "Target reached + price trigger activated");
            }
        } else {
            // Release immediately if no price triggers
            _releaseFunds(vaultId, "Target amount reached");
        }
    }
    
    function _releaseFunds(uint256 vaultId, string memory reason) internal {
        TravelVault storage vault = vaults[vaultId];
        require(!vault.fundsReleased, "Funds already released");
        
        vault.fundsReleased = true;
        vault.isActive = false;
        
        uint256 totalAmount = vault.currentAmount;
        
        // Distribute funds proportionally to contributions
        for (uint256 i = 0; i < vault.members.length; i++) {
            address member = vault.members[i];
            uint256 contribution = vault.contributions[member];
            
            if (contribution > 0) {
                uint256 share = contribution; // For now, just return original contribution
                vault.contributions[member] = 0;
                payable(member).transfer(share);
            }
        }
        
        emit FundsReleased(vaultId, totalAmount, reason);
        emit VaultClosed(vaultId, reason);
    }
    
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        
        return string(bstr);
    }
    
    // ============== VIEW FUNCTIONS ==============
    
    function getVaultInfo(uint256 vaultId) external view returns (
        string memory destination,
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 deadline,
        address creator,
        bool isActive,
        bool fundsReleased,
        uint256 memberCount
    ) {
        TravelVault storage vault = vaults[vaultId];
        return (
            vault.destination,
            vault.targetAmount,
            vault.currentAmount,
            vault.deadline,
            vault.creator,
            vault.isActive,
            vault.fundsReleased,
            vault.members.length
        );
    }
    
    function getVaultMembers(uint256 vaultId) external view returns (address[] memory) {
        return vaults[vaultId].members;
    }
    
    function getMemberContribution(uint256 vaultId, address member) external view returns (uint256) {
        return vaults[vaultId].contributions[member];
    }
    
    function getPriceTriggerInfo(uint256 vaultId) external view returns (
        bytes21 feedId,
        uint256 triggerPrice,
        bool isLowerBound,
        bool enabled
    ) {
        TravelVault storage vault = vaults[vaultId];
        return (
            vault.priceFeedId,
            vault.triggerPrice,
            vault.isLowerBound,
            vault.priceTriggersEnabled
        );
    }
}