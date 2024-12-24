
import { coinbaseWallet } from "@wagmi/connectors"
import { createConfig, getConnectors, getWalletClient, getPublicClient } from "@wagmi/core"
import { mainnet, sepolia } from "@wagmi/core/chains"
import { parseAbi } from 'abitype'
import { parseEther, http } from "viem"
import { CONTRACT_ADDRESS, D0_MINT_PRICE, DEFAULT_SMP, MAX_DEPTH } from "../common/constants"
import { myPlots, setNotification, walletAddress } from "./store"
import PlotId from "../common/plotId"
import MyPlot from "./plot/myPlot"

const COINBASE_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI4IDU2YzE1LjQ2NCAwIDI4LTEyLjUzNiAyOC0yOFM0My40NjQgMCAyOCAwIDAgMTIuNTM2IDAgMjhzMTIuNTM2IDI4IDI4IDI4WiIgZmlsbD0iIzFCNTNFNCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNyAyOGMwIDExLjU5OCA5LjQwMiAyMSAyMSAyMXMyMS05LjQwMiAyMS0yMVMzOS41OTggNyAyOCA3IDcgMTYuNDAyIDcgMjhabTE3LjIzNC02Ljc2NmEzIDMgMCAwIDAtMyAzdjcuNTMzYTMgMyAwIDAgMCAzIDNoNy41MzNhMyAzIDAgMCAwIDMtM3YtNy41MzNhMyAzIDAgMCAwLTMtM2gtNy41MzNaIiBmaWxsPSIjZmZmIi8+PC9zdmc+"
const ABI = parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function mint(uint tokenId) public payable",
    "function getSmp(uint tokenId) public view returns (uint)",
    "function setSmp(uint tokenId, uint amount) public",
    "function balanceOf(address owner) public view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)"
])

const hardhat = {
    id: 31337, // Hardhat's chain ID
    name: 'Hardhat',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
    testnet: true
};


const wagmiConfig = createConfig({
    chains: [sepolia],
    connectors: [
        coinbaseWallet({
            appName: "trraform",
            reloadOnDisconnect: false,
        })
    ],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [hardhat.id]: http("http://127.0.0.1:8545")
    },
})



export default class WalletConnection {

    static isConnected = false
    static connection = null
    static plotCount = 0
    static plotIterator = 0

    static async _connect(connector, addresses, addressIndex){

        const publicCli = getPublicClient(wagmiConfig)
       
        this.connection = {
            connector,
            walletCli: await getWalletClient(wagmiConfig, { connector }),
            publicCli,
            addresses,
            addressIndex
        }

        await this.changeWallets(addressIndex)
        this.isConnected = true

        localStorage.setItem("last-connector", connector.id)
        localStorage.setItem("last-address", addressIndex)

    }

    
    static async changeWallets(index){

        this.connection.addressIndex = index
        localStorage.setItem("last-address", index)
        walletAddress.set(this.connection.addresses[index])
        myPlots.set([])
        this.plotCount = await this.getPlotCount()
        this.plotIterator = 0

    }

    static async reconnect() {

        const connectors = getConnectors(wagmiConfig)
        const lastConnected = localStorage.getItem("last-connector")

        //loop through connectors to check for last connected
        for (const connector of connectors) {

            //if connector still exist
            if (connector.id === lastConnected) {

                try {

                    //get connected accounts
                    const accounts = await connector.getAccounts()

                    //if none connected
                    if (!accounts.length) 

                        return false

                    await this._connect(connector, accounts, parseInt(localStorage.getItem("last-address")) || 0)

                    return true

                } catch (e) {

                    return false

                }

            }

        }

        return false

    }

    static async connect(connector) {

        try {

            await connector.connect()

            await this._connect(connector, await connector.getAccounts(), 0)

            return true

        } catch(e) {

            return false

        }

    }

    static async disconnect() {

        try{

            await this.connection.connector.disconnect()
            this.connection = null

            myPlots.set([])
            this.plotIterator = this.plotCount = 0

            this.isConnected = false

            return true

        } catch {

            return false

        }

    }

    static getConnectors() {

        const connectors = getConnectors(wagmiConfig)
        const objs = []

        for (const c of connectors) {

            const obj = {
                id: c.id,
                name: c.name,
                isLastConnected: c.id === localStorage.getItem("last-connector"),
                connector: c
            }

            if (c.id === "coinbaseWalletSDK")

                obj.icon = COINBASE_ICON
            
            else

                obj.icon = c.icon || null

            objs.push(obj)

        }

        return objs

    }

    static async mint(plotId, _mintPrice = null) {

        const { walletCli, addresses, addressIndex } = this.connection
        const parentId = plotId.getParent()
        const mintPrice = _mintPrice || await this.getSmp(parentId)

        return await walletCli.writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            account: addresses[addressIndex],
            functionName: 'mint',   
            args: [plotId.bigInt()],
            value: mintPrice,
        })

    }

    static async txSuccess(hash){

        const { publicCli } = this.connection
        const receipt = await publicCli.waitForTransactionReceipt({ hash })

        if(receipt.status !== "success")

            throw new Error("Transaction failed")

    }

    static async getSmp(plotId){

        if(plotId.id == 0 || plotId.depth() >= MAX_DEPTH)

            return parseEther(D0_MINT_PRICE.toString())

        const { publicCli } = this.connection
        const tokenId = plotId.bigInt()

        const smp = await publicCli.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'getSmp',
            args: [tokenId]
        })

        return smp == 0n ? parseEther(DEFAULT_SMP.toString()) : smp

    }

    static async setSmp(plotId, smp){

        const { walletCli, addresses, addressIndex } = this.connection
        const tokenId = plotId.bigInt()
        const smpWei = parseEther(smp.toString())

        await walletCli.writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            account: addresses[addressIndex],
            functionName: 'setSmp',
            args: [tokenId, smpWei]
        })

    }

    static async getPlotCount(){

        const { publicCli, addresses, addressIndex } = this.connection

        const count = await publicCli.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'balanceOf',
            args: [addresses[addressIndex]]
        })

        return Number(count)

    }

    static async refreshPlotCount(){

        this.plotCount = await this.getPlotCount()

    }

    static async loadMyPlots(range){

        const { publicCli, addresses, addressIndex } = this.connection
        const promises = []

        range = Math.min(range, this.plotCount)

        while(this.plotIterator < range){

            const tokenId = publicCli.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [addresses[addressIndex], BigInt(this.plotIterator)]
            }).then(tokenId => {

                const plotId = new PlotId(Number(tokenId))
                const myPlot = new MyPlot(plotId)

                myPlots.update(arr => {
                    arr.push(myPlot)
                    return arr
                })

            })

            promises.push(tokenId)
            this.plotIterator++

        }

        await Promise.all(promises)

    }

    static async getSignature(message){

        const { walletCli, addresses, addressIndex } = this.connection

        return await walletCli.signMessage({
            message: message,
            account: addresses[addressIndex]
        })
    
    }

    async getSmp(){

        if(!WalletConnection.isConnected)

            return null

        if(this._gettingSmp === null)

            this._gettingSmp = WalletConnection.getSmp(this.id)

        return this._gettingSmp

    }

}
