import { React, useState, useEffect, useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom' 
import Logo from 'assets/images/logo.png'
import Rocket from 'assets/images/rocket.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faPlus, faTimes} from '@fortawesome/free-solid-svg-icons'
import { faClock} from '@fortawesome/free-regular-svg-icons'
import moment from 'moment'
import 'moment-precise-range-plugin'

import { connect, isConnected, disconnect, address, getNativeToken, ERC20, balance, depositToken, withdrawToken, listHodls, toEther, getChain, isValidChain, switchNetwork, setOnNetworkChange} from 'services/web3'
import tokens from "assets/tokens.json"

///TEST TOKEN 0x9A676e781A523b5d0C0e43731313A708CB607508

const times = [
    {type:"minutes",name:"Minutes", value:60, m:60},
    {type:"hours", name:"Hours", value:24, m:3600},
    {type:"days", name:"Days", value:1, m:86400},
    {type:"weeks", name:"Weeks",value:1, m:604800},
    {type:"months", name:"Months", value:1, m:2629746},
    {type:"years", name:"Years", value:1, m:31556952},
]

const Hodl = () => {

    const [connected, setConnected] = useState(null)
    const [unsupported, setUnsupported] = useState(null)
    const [publicKey, setPublicKey] = useState(address)
    const [hodls, setHodls] = useState([])
    const [page, setPage] = useState("root")
    const [selectType, setSelectType] = useState("token")
    const [nativeToken, setNativeToken] = useState({"network":""})
    const [tokenList, setTokenList] = useState([])
    const [importTokenValue, setImportTokenValue] = useState("")
    const [selectedToken, setSelectedToken] = useState({"symbol":"","name":"","contract":"","decimal":"","network":""})
    const [selectedTime, setSelectedTime] = useState(times[0])
    const [approved, setApproved] = useState(true)
    const [depositLoading, setDepositLoading] = useState(false)
    const depositInput = useRef(null)
    const timeInput = useRef(null)

    useEffect(() => {
        checkConnection()
    }, [])

    useEffect(() => {
        list()
        loadTokens()
    }, [nativeToken])

    useEffect(() => {
        if (connected)
            setup()
    }, [connected])

    const setup = async () => {
        await switchNetwork()
        var supported = await isValidChain()

        if (!supported)
            return setUnsupported(true)
        else
            setUnsupported(false)

        setOnNetworkChange(async() => {
            var supported = await isValidChain()
            if (!supported)
                return setUnsupported(true)
            else{
                setUnsupported(false)
                setup()
            }
        })
        
        let nt = await getNativeToken()
        let _balance = await balance()
        nt.balance_real = _balance
        nt.balance = _balance.split(".")[0]
        if (_balance.split(".").length > 1)
            nt.balance+= "." + _balance.split(".")[1].substring(0,5)
        setNativeToken(nt)
        setSelectedToken(nt)
    }

    const switchToSupportedNetwork = async () => {
        await switchNetwork()
        var supported = await isValidChain()
        console.log(supported)
        if (!supported)
            return setUnsupported(true)
        else
            setup()
    }

    const checkConnection = async () => {
        var isconnected = await isConnected()
        isconnected ? (() => {setConnected(true); setPublicKey(address())})()  : (() => {setConnected(false); setPublicKey("")})()
    }

    const connectWallet = async () => {
        await connect()
        checkConnection()
    }

    const logout = async () => {
        disconnect()
        setConnected(false)
    }

    const list = async () => {
        const _list = await listHodls()
        var hodlslist = []
        for (var i = 0; i < _list.length; i++){
            var item = _list[i]

            if (!item.native)
                var symbol = await ERC20.symbolOf(item.token)
            else
                var symbol = nativeToken.symbol
            var _amount = toEther(item.amount)
            var amount = _amount.split(".")[0]
            if (_amount.split(".").length > 1)
                amount += "." + _amount.split(".")[1].substring(0,5)

            var ends = moment.unix(item.time)
            var starts = moment()
            
            var time = moment.preciseDiff(starts, ends);

            hodlslist.push(
                {
                    id:item.id,
                    symbol,
                    amount,
                    _amount,
                    time,
                    finished: (new Date() - new Date(item.time * 1000)) > 0 
                }
            )
            
        }

        setHodls(hodlslist)
    }

    const loadTokens = async() => {
        for (var i = 0; i < tokens.length; i++)
            loadToken(tokens[i])
    }

    const loadToken = async (token) => {
        if (typeof tokenList.find(x => x.contract === token.contract) !== "undefined" || nativeToken.network !== token.network)
            return;
        var balance = await ERC20.balanceOf(token.contract)
        let tokenlist = [...tokenList]
        tokenlist.push(
            {...token, balance}
        )
        setTokenList(tokenlist)
    }

    const importToken = async () => {
        if (importTokenValue.trim() === "")
            return;
        var details = await ERC20.detailsOf(importTokenValue)

        if (details !== false)
        {
            setTokenList([...tokenList, {...details, contract:importTokenValue}])
            setPage("select")
        }
    }

    const openSelection = (type) => {
        setSelectType(type)
        setPage("select")
    }

    const selectToken = async (token) => {
        if (token === "native"){
            setSelectedToken(nativeToken)
            setPage("hodl")
            setApproved(true)
        }else{
            setSelectedToken(token)
            setPage("hodl")

            var check = await ERC20.checkAllowance(token.contract)
            setApproved(check)
        }
    }

    const selectTime = (time) => {
        setSelectedTime(time)
        setPage("hodl")
        list()
    }

    const approve = async () => {
        var allow = await ERC20.allow(selectedToken.contract)
        if (allow)
            setApproved(true)
    }

    const deposit = async () => {
        var time = timeInput.current.value * selectedTime.m
        var amount = depositInput.current.value
        setDepositLoading(true)
        var _deposit = await depositToken(selectedToken.contract, amount, time, selectedTime.type)

        if (_deposit){
            setPage("root")
            list()
        }
        setDepositLoading(false)
    }

    const withdraw = async (id) => {
        const w = await withdrawToken(id)
        if (w)
            list()
    }

    return (
        <div className="hodl">

            <div className="logo">
                <Container>
                    <Link className="logo-text" to="/">
                        <img src={Logo}/>
                        <div>HODL<span>FOR</span>ME</div>
                    </Link>
                    {connected === true && (
                        <div className="wallet">
                            {nativeToken.network !== "" && (
                                <div className="network">{nativeToken.network}</div>
                            )}
                            <div className="address">{publicKey.slice(0, 4)}...{publicKey.slice(-4)}</div>
                            <button className="logout button" onClick={logout}>Disconnect</button>
                        </div>
                    )}
                </Container>
            </div>
                {(connected === true && unsupported === false && page === "root") && (
                    <Container className="hodl-list">
                        <div className="hodl-top">
                            <div className="title">
                                Hodl List
                            </div>
                            <button className="button" onClick={() => setPage("hodl")}>
                                Deposit
                            </button>
                        </div>

                        <div className="hodl-header">
                            <div className="symbol">Symbol</div>
                            <div className="amount">Amount Locked</div>
                            <div className="time">Time Left</div>
                            <div className="actions">Actions</div>
                        </div>
                        {hodls.map((item, i) => (
                            <div className="hodl-item" key={i}>
                                <div className="symbol">{item.symbol}</div>
                                <div className="amount" title={item._amount}>{item.amount}</div>
                                <div className="time">{item.finished ? "time is up" : item.time}</div>
                                <div className="actions">
                                    <button className="button" onClick={() => withdraw(item.id)}>Withdraw</button>
                                </div>
                            </div>
                        ))}

                        {hodls.length === 0 && (
                            <div className="no-item">
                                Currently you dont hodl any coin
                                <span onClick={() => setPage("hodl")}>Click to Hodl</span>
                            </div>
                        )}
                        
                    </Container>
                )}

                {(connected === true && unsupported === false && page === "hodl") && (
                    <div className="hodl-page">
                        <div className="hodl-box">
                            <div className="hodl-box-title">Deposit <FontAwesomeIcon onClick={() => setPage("root")} icon={faTimes}/></div>
                            <div className="hodl-coin">
                                <div className="top-text">
                                    You Deposit
                                </div>
                                <div className="middle">
                                    <div className="symbol" onClick={() => openSelection("token")}>
                                        <div className="symbol-icon">{selectedToken.symbol.substr(0,1)}</div>
                                        {selectedToken.symbol} <FontAwesomeIcon icon={faChevronDown}/>
                                    </div>
                                    <div className="input">
                                        <input type="number" step="0.1" ref={depositInput} defaultValue="1"/>
                                    </div>
                                </div>
                                <div className="bottom">
                                    <div className="token-name">{selectedToken.name}</div>
                                    <div className="max" onClick={() => {if (typeof selectedToken.balance !== "undefined"){ depositInput.current.value = selectedToken.balance;}}}>MAX</div>
                                </div>
                            </div>

                            <div className="time">
                                <div className="top-text">
                                    Time to Hodl
                                </div>
                                <div className="time-input">
                                    <div className="due-type" onClick={() => openSelection("time")}>
                                        <div className="symbol-icon"><FontAwesomeIcon icon={faClock}/></div>
                                        {selectedTime.name} <FontAwesomeIcon icon={faChevronDown}/>
                                    </div>
                                    <div className="input">
                                        <input type="number" step="0.1" ref={timeInput}  defaultValue={selectedTime.value}/>
                                    </div>
                                </div>
                                <div className="bottom">
                                        you cant withdraw your coins until the time passes
                                </div>
                            </div>

                            <div className="buttons">
                                <div className="button-cont">
                                    <button className="button" disabled={approved} onClick={approve}>Approve</button>
                                </div>
                                <div className="button-cont">
                                    <button className="button" disabled={!approved} onClick={deposit}>Deposit</button>
                                </div>
                            </div>

                            <div className="message">
                                {depositLoading && (<>Loading...</>)}
                            </div>
                        </div>
                    </div>
                )}

                {(connected === true && unsupported === false && page === "select") && (
                    <div className="hodl-page">
                        <div className="hodl-box selection">
                            <div className="hodl-box-title">
                                {selectType === "token" && (<>Select a Token</>)}
                                {selectType === "time" && (<>Select Time to Hodl</>)}
                                <FontAwesomeIcon onClick={() => setPage("hodl")} icon={faTimes}/>
                            </div>
                            <div className="list">
                                {selectType === "token" && (
                                    <>
                                        <div className="item" onClick={() => selectToken("native")}>
                                            <div className="left">
                                                <div className="icon">{nativeToken.symbol.substr(0,1)}</div>
                                                <div className="symbol-p">
                                                    <div className="symbol">{nativeToken.symbol}</div>
                                                    <div className="name">{nativeToken.name}</div>
                                                </div>
                                            </div>
                                            <div className="balance">{nativeToken.balance}</div>
                                        </div>

                                        {tokenList.map((token, i) => (
                                            <div className="item" key={i} onClick={() => selectToken(token)}>
                                                <div className="left">
                                                    <div className="icon">{token.symbol.substr(0,1)}</div>
                                                    <div className="symbol-p">
                                                        <div className="symbol">{token.symbol}</div>
                                                        <div className="name">{token.name}</div>
                                                    </div>
                                                </div>
                                                <div className="balance">{token.balance}</div>
                                            </div>
                                        ))}

                                        <div className="item item-add" onClick={() => setPage("import-tokens")}>
                                            Import Tokens <FontAwesomeIcon icon={faPlus}/>
                                        </div>
                                    </>
                                )}

                                {selectType === "time" && (
                                    <>
                                        {times.map((time, i) => (
                                            <div className="item" key={i} onClick={() => selectTime(time)}>
                                                <div className="left">
                                                    <div className="icon">{time.name.substring(0,1)}</div>
                                                    <div className="symbol-p">
                                                        <div className="symbol">{time.name}</div>
                                                        <div className="name"></div>
                                                    </div>
                                                </div>
                                                <div className="balance"></div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            
                            </div>
                        </div>
                    </div>
                )}

                {(connected === true && unsupported === false && page === "import-tokens") && (
                    <div className="hodl-page">
                        <div className="hodl-box import">
                            <div className="hodl-box-title">Import a Token <FontAwesomeIcon onClick={() => setPage("select")} icon={faTimes}/></div>
                            <input type="text" onChange={(e) => {setImportTokenValue(e.target.value)}} placeholder="Contract address"/>

                            <div className="buttons">
                                <button className="button" onClick={importToken}>Import</button>
                            </div>
                        </div>
                    </div>
                )}

                {connected === false && (
                    <Container className="wallet-connect">
                        <img src={Rocket}/>
                        <div className="text">
                            Connect your wallet<br/>to continue
                        </div>
                        <button onClick={connectWallet} className="button">CONNECT WALLET</button>
                    </Container>
                )}

                {(connected === true && unsupported === true) && (
                    <Container className="wallet-connect">
                        <div className="text">
                            This network is not supported
                        </div>
                        <button onClick={switchToSupportedNetwork} className="button">SWITCH TO SUPPORTED NETWORK</button>
                    </Container>
                )}


            
        </div>
    )

}

export default Hodl