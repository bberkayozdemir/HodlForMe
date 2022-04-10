import Web3 from 'web3'
import ERC20ABI from "assets/erc20.abi.json"
import ABI from "assets/hodlforme.abi.json"

const { ethereum } = window
var walletaddress = localStorage.getItem('walletaddress')
var web3 = new Web3(ethereum)

var contractAddress = ""

ethereum.on('accountsChanged', (accounts) => {
    if (!accounts.length) {
        disconnect()
    }else{
        setAddress(accounts[0])
    }
})

var onNetworkChange = () => {}

export const setOnNetworkChange = (cb) => {
    onNetworkChange = cb
}

ethereum.on('networkChanged', (networkId) => {
    onNetworkChange()
})

export const setAddress = (address) => {
    walletaddress = address
    localStorage.setItem('walletaddress', address)
}

export const address = () => walletaddress

export const disconnect = async () => {
    walletaddress = null
    localStorage.removeItem('walletaddress')
}

export const isConnected = async () => {
    return localStorage.getItem('walletaddress') !== null
}

export const switchNetwork = async () => {
    const network = {
        chainId: `0x${Number(43113).toString(16)}`,
        chainName: 'Avalanche FUJI C-Chain',
        nativeCurrency: {
            name: "AVAX",
            symbol: "AVAX",
            decimals: 18
        },
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://testnet.snowtrace.io/"]
    }

    try{
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    ...network
                }
            ]
        })
    }catch(e){
        console.log(e)
        return false
    }

    return true
}

export const connect = async () => {
    if (!window.ethereum)
    {
        alert("lütfen metamask eklentisini kurun!")
        return
    }

    var accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
    setAddress(accounts[0])
    return accounts[0]
}

export const getChain = async () => {
    var chain = await web3.eth.net.getId()
    return chain
}

export const isValidChain = async () => {
    var chain = await getChain()

    if (chain === 31337 || chain === 43113)
        return true

    return false
}

export const getNativeToken = async () => {

    var chain = await getChain()

    if (chain === 31337){
        contractAddress = ""
        return {
            "symbol":"ETH",
            "name":"Ethereum",
            "contract":"",
            "decimal":18,
            "network":"HARDHAT"
        }
    }else if (chain === 43113){
        contractAddress = "0x5BF2F69E60412A974eb24600521bd58362B109D1"
        return {
            "symbol":"AVAX",
            "name":"Avalanche",
            "contract":"",
            "decimal":18,
            "network":"FUJI"
        }
    }
    
    return {
        "symbol":"ETH",
        "name":"Ethereum",
        "contract":"",
        "decimal":18,
        "network":"ETHEREUM"
    }
}

const balanceOf = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.balanceOf(walletaddress).call()
        return Web3.utils.fromWei(result, 'ether');
    }catch(err){
        console.log(err)
        return 0
    }
}

const nameOf = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.name().call()
        return result
    }catch(err){
        console.log(err)
        return 0
    }
}

const symbolOf = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.symbol().call()
        return result
    }catch(err){
        console.log(err)
        return 0
    }
}

const decimalsOf = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.decimals().call()
        return result
    }catch(err){
        console.log(err)
        return 0
    }
}

const detailsOf = async (contract) => {
    return new Promise(async (resolve, reject) => {
        try{
            var balance = await balanceOf(contract)
            var name = await nameOf(contract)
            var symbol = await symbolOf(contract)
            var decimals = await decimalsOf(contract)

            resolve({
                balance,
                name,
                symbol,
                decimals
            })
        }catch(err){  
            reject(false)
        }
    })
}

const checkAllowance = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.allowance(walletaddress, contractAddress).call()

        console.log(result)

        if (result === 0 || result === "0")
            return false
        
        return true
    }catch(err){
        console.log(err)
        return false
    }
}

const allow = async (contract) => {
    try{
        const token = new web3.eth.Contract(ERC20ABI, contract)
        const result = await token.methods.approve(contractAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").send({from:walletaddress})
        return true
    }catch(err){
        console.log(err)
        return false
    }
}

export const ERC20 = {
    balanceOf,
    symbolOf,
    decimalsOf,
    nameOf,
    detailsOf,
    checkAllowance,
    allow
}

export const balance = async () => {
    var result = await web3.eth.getBalance(walletaddress)
    return web3.utils.fromWei(result, "ether")
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const depositToken = async (token, value, time, timeType) => {

    return new Promise((resolve, reject) => {
        try
        {
            const contract = new web3.eth.Contract(ABI, contractAddress)
            
            if (token === "")
                contract.methods.deposit(time, timeType).send({
                    from:walletaddress,
                    value:web3.utils.toWei(value, "ether")
                }, (error, tx) => depositTx(error, tx, resolve, reject))
            else
                contract.methods.deposit(token, web3.utils.toWei(value, "ether"), time, timeType).send({
                    from:walletaddress,
                }, (error, tx) => depositTx(error, tx, resolve, reject))
        }catch(err){
            console.log(err)
            reject(false)
        }
    })
    
}
const expectedBlockTime = 1000; 
const depositTx = async (error, transactonHash, resolve, reject) => {
    console.log(transactonHash)
    if (error){
        return reject(false)
    }

    let transactionReceipt = null
    while (transactionReceipt == null) {
        transactionReceipt = await web3.eth.getTransactionReceipt(transactonHash);
        await sleep(expectedBlockTime)
    }
    console.log("Got the transaction receipt: ", transactionReceipt)

    resolve(true)
}


export const listHodls = async () => {
    try
    {
        const contract = new web3.eth.Contract(ABI, contractAddress)
        
        const result = await contract.methods.hodlsOf(walletaddress).call()

        return result
    }catch(err){
        console.log(err)
        return []
    }
}

export const withdrawToken = async (id) => {
    try
    {
        const contract = new web3.eth.Contract(ABI, contractAddress)

        await contract.methods.withdraw(id).send({
            from:walletaddress,
        })

        return true
    }catch(err){
        console.log(err)
        return false
    }
}

export const toEther = (eth) => {
    return Web3.utils.fromWei(eth, 'ether')
}

