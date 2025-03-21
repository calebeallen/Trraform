import { coinbaseWallet } from "@wagmi/connectors"
import { createConfig, getConnectors, getWalletClient, getPublicClient } from "@wagmi/core"
import { polygon } from "@wagmi/core/chains"
import { parseAbi } from 'abitype'
import { parseEther, http } from "viem"
import { myPlots } from "$lib/main/store"
import QuoterV2 from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import PlotId from "../common/plotId"
import MyPlot from "./plot/myPlot"

const PROXY_CONTRACT_ADDRESS = "0x82163c63A889A8B8631fFd854114456aA93ec33B"
const IMPLEMENTATION_CONTRACT_ADDRESS = "0xE16AfC1CB2328620948f5a960D20E782e540222E"
const UNISWAP_QUOTER_CONTRACT_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"
const WMATIC_CONTRACT_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
const USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"

const IMPLEMENTATION_CONTRACT_ABI = parseAbi([
    "function balanceOf(address owner) public view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tempLock(uint tokenId) public view returns (uint)"
])

const PROXY_CONTRACT_ABI = parseAbi([
    "function mintWithPOL(uint tokenId, bool useTempLock) public payable",
    "function mintWithUSDC(uint tokenId, bool useTempLock, uint256 deadline, bytes memory signature) public" 
])

const USDC_ABI = parseAbi([
    "function name() view returns (string)",
    "function nonces(address) view returns (uint256)",
]);

const wagmiConfig = createConfig({
    chains: [polygon],
    connectors: [
        coinbaseWallet({
            appName: "Trraform",
            reloadOnDisconnect: false,
        })
    ],
    transports: {
        [polygon.id]: http()
    },
})

const publicCli = getPublicClient(wagmiConfig)

class WalletConnection {

    static async getTempLock(plotId){
    
        const tokenId = plotId.bigInt()

        const lockedTimeBigInt = await publicCli.readContract({
            address: IMPLEMENTATION_CONTRACT_ADDRESS,
            abi: IMPLEMENTATION_CONTRACT_ABI,
            functionName: 'tempLock',
            args: [tokenId]
        })

        const lockedTime = parseInt(lockedTimeBigInt.toString())
        const currentTime = Math.floor(Date.now() / 1000)

        return lockedTime - currentTime

    }

    static async getOwnerOf(plotId){
    
        try {

            const tokenId = plotId.bigInt()
            const owner = await publicCli.readContract({
                address: IMPLEMENTATION_CONTRACT_ADDRESS,
                abi: IMPLEMENTATION_CONTRACT_ABI,
                functionName: 'ownerOf',
                args: [tokenId]
            })

            return owner

        } catch(e){

            return null

        }

    }

    static async getQuotePOL(amount){

        const params = {
            tokenIn: WMATIC_CONTRACT_ADDRESS,
            tokenOut: USDC_CONTRACT_ADDRESS,
            fee: 500,
            amount,
            sqrtPriceLimitX96: 0
        };

        const out = await publicCli.readContract({
            address: UNISWAP_QUOTER_CONTRACT_ADDRESS,
            abi: QuoterV2.abi,
            functionName: "quoteExactOutputSingle",
            args: [params],
        })

        return out[0]

    }

    static getConnectors() {
    
        const connectors = getConnectors(wagmiConfig)
        const cs = []

        for (const c of connectors) {

            const connector = {
                id: c.id,
                name: c.name,
                isLastConnected: c.id === localStorage.getItem("last-connector"),
                connector: c
            }

            if (c.id === "coinbaseWalletSDK")

                connector.icon = "/coinbase.svg"
            
            else

                connector.icon = c.icon || null

            cs.push(connector)

        }

        return cs

    }

    static async txSuccess(hash){

        const { publicCli } = this.connection
        const receipt = await publicCli.waitForTransactionReceipt({ hash })

        if(receipt.status !== "success")

            throw new Error("Transaction failed")

    }

    constructor(){

        this.myPlotsCount = 0
        this.myPlotsIterator = 0
        this.walletCli = null
        this.connector = null
        this.connected = false

    }

   
    async _connect(connector, address){

        this.walletCli = await getWalletClient(wagmiConfig, { connector })
        this.connector = connector
        this.address = address
        this.connected = true

        const count = await publicCli.readContract({
            address: IMPLEMENTATION_CONTRACT_ADDRESS,
            abi: IMPLEMENTATION_CONTRACT_ABI,
            functionName: 'balanceOf',
            args: [this.address]
        })

        this.myPlotsCount = Number(count)
        this.myPlotsIterator = 0

        localStorage.setItem("last-connector", connector.id)

    }


    async connect(connector) {

        try {

            await connector.connect()
            const accounts = await connector.getAccounts()

            await this._connect(connector, accounts[0])
            return true

        } catch(e) {

            return false

        }

    }

    async reconnect() {

        const connectors = getConnectors(wagmiConfig)
        const lastConnected = localStorage.getItem("last-connector")

        //loop through connectors to check for last connected
        for (const connector of connectors) 

            //if connector still exist
            if (connector.id === lastConnected) {

                try {

                    //get connected accounts
                    const accounts = await connector.getAccounts()

                    //if none connected return
                    if (!accounts.length) 

                        return false

                    await this._connect(connector, accounts[0])

                    return true

                } catch (e) {

                    return false

                }

            }

        return false

    }

    async disconnect() {

        try{

            await this.connector.disconnect()
            myPlots.set([])
            this.myPlotsCount = 0
            this.myPlotsIterator = 0
            this.walletCli = null
            this.connector = null
            this.connected = false

            return true

        } catch {

            return false

        }

    }

    async loadMyPlots(range){

        const promises = []

        range = Math.min(range, this.myPlotsCount)

        while(this.myPlotsIterator < range){

            const tokenId = publicCli.readContract({
                address: IMPLEMENTATION_CONTRACT_ADDRESS,
                abi: IMPLEMENTATION_CONTRACT_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [this.address, this.myPlotsIterator]
            }).then(tokenId => {

                const plotId = new PlotId(Number(tokenId))
                myPlots.update(arr => {
                    arr.push(new MyPlot(plotId))
                    return arr
                })

            })

            promises.push(tokenId)
            this.myPlotsIterator++

        }
        await Promise.all(promises)

    }

    async claimWithPOL(plotId, useMintLock, amount){

        const quote = await WalletConnection.getQuotePOL(amount)

        return await this.walletCli.writeContract({
            address: PROXY_CONTRACT_ADDRESS,
            abi: PROXY_CONTRACT_ABI,
            account: this.address,
            functionName: 'mintWithPOL',   
            args: [plotId.bigInt(), useMintLock],
            value: quote,
        })

    }

    async claimWithUSDC(plotId, useMintLock, amount){

        const nonce = await publicCli.readContract({
            address: USDC_CONTRACT_ADDRESS,
            abi: USDC_ABI,
            functionName: 'nonces',
            args: [this.address],
        })

        const usdcName = await publicCli.readContract({
            address: USDC_CONTRACT_ADDRESS,
            abi: USDC_ABI,
            functionName: 'name',
        })

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20
        const signature = await this.walletCli.signTypedData({
            domain: {
                name: usdcName,
                version: '2',            // Confirm if USDC requires something else
                chainId: 137,            // Polygon mainnet
                verifyingContract: USDC_CONTRACT_ADDRESS,
            },
            types: {
                Permit: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
            },
            message: {
                owner: this.address,
                spender: PROXY_CONTRACT_ADDRESS,
                value: amount,
                nonce,
                deadline
            },
            primaryType: 'Permit',
            account: this.address
        });

        const res = await this.walletCli.writeContract({
            address: PROXY_CONTRACT_ADDRESS,
            abi: PROXY_CONTRACT_ABI,
            account: this.address,
            functionName: 'mintWithUSDC',   
            args: [
                plotId.bigInt(), 
                useMintLock,
                deadline,
                signature
            ]
        })

    }

    async getSignature(message){

        return await this.walletCli.signMessage({
            message: message,
            account: this.address,
            prefix: true
        })
    
    }

}

export { WalletConnection, IMPLEMENTATION_CONTRACT_ADDRESS }