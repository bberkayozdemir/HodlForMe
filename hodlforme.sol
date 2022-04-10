//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Hodlforme is ReentrancyGuard {
    
    using SafeMath for uint;
    using Counters for Counters.Counter;

    Counters.Counter private hodlIds;
    mapping(uint => Hodl) public balances;
    struct Hodl {
        uint id;
        address owner;
        address token;
        bool native;
        uint256 time;
        string timeType;
        uint256 amount;
    }

    constructor(){}

    function deposit(uint256 time, string memory timeType) external payable{
        require(msg.value > 0, "Ether value must be non-zero.");

        hodlIds.increment();
        uint256 id = hodlIds.current();

        balances[id] = Hodl(
            id,
            msg.sender,
            address(0),
            true,
            block.timestamp + time,
            timeType,
            msg.value
        );
    }

    function deposit(address token, uint256 amount, uint256 time, string memory timeType) external{
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        hodlIds.increment();
        uint256 id = hodlIds.current();

        balances[id] = Hodl(
            id,
            msg.sender,
            token,
            false,
            block.timestamp + time,
            timeType,
            amount
        );
    }

    function withdraw(uint id) public nonReentrant{
        require(balances[id].owner == msg.sender, "Wrong id");
        require(block.timestamp > balances[id].time, "Lock time is not expired");

        if (balances[id].native){
            if (!payable(balances[id].owner).send(balances[id].amount))
                revert("Failed to send");
        }else{
            IERC20(balances[id].token).transfer(balances[id].owner, balances[id].amount);
        }

        delete balances[id];
    }

    function hodlsOf(address owner) external view returns (Hodl[] memory){
        uint totalItemCount = hodlIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 1; i <= totalItemCount; i++) {
            if (balances[i].owner == owner)
            {
                itemCount += 1;
            }
        }

        Hodl[] memory items = new Hodl[](itemCount);
        for (uint i = 1; i <= totalItemCount; i++){
            if (balances[i].owner == owner){
                items[currentIndex] = balances[i];
                currentIndex += 1;
            }
        }

        return items;
    }
}