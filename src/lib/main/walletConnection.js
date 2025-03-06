
import { coinbaseWallet } from "@wagmi/connectors"
import { createConfig, getConnectors, getWalletClient, getPublicClient } from "@wagmi/core"
import { mainnet, sepolia } from "@wagmi/core/chains"
import { parseAbi } from 'abitype'
import { parseEther, http } from "viem"
import { CHAIN, DATA_CONTRACT_ADDRESS, WRAPPER_CONTRACT_ADDRESS, D0_MINT_PRICE, DEFAULT_SMP, MAX_DEPTH } from "../common/constants"
import { walletAddress } from "./store"
import PlotId from "../common/plotId"
import MyPlot from "./plot/myPlot"

const DATA_CONTRACT_ABI = parseAbi([
    "function setSmp(uint tokenId, uint amount) public",
    "function smp(uint tokenId) public view returns (uint)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tempLock(uint tokenId) public view returns (uint)"
])

const WRAPPER_CONTRACT_ABI = parseAbi([
    "function mint(uint tokenId, bool useTempLock) public payable",
    "function setSmp(uint tokenId, uint amount) public",
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
    chains: [CHAIN],
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
        // myPlots.set([])
        this.plotCount = await this.getPlotCount()
        this.plotIterator = 0

    }

    static getCurrentAddress(){

        const { addresses, addressIndex } = this.connection
        return addresses[addressIndex]

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

            // myPlots.set([])
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

                obj.icon = "/coinbase.svg"
            
            else

                obj.icon = c.icon || null

            objs.push(obj)

        }

        return objs

    }

    static async txSuccess(hash){

        const { publicCli } = this.connection
        const receipt = await publicCli.waitForTransactionReceipt({ hash })

        if(receipt.status !== "success")

            throw new Error("Transaction failed")

    }

    static async refreshPlotCount(){

        this.plotCount = await this.getPlotCount()

    }

    static async getSignature(message){

        const { walletCli, addresses, addressIndex } = this.connection

        return await walletCli.signMessage({
            message: message,
            account: addresses[addressIndex],
            prefix: true
        })
    
    }

    static async mint(plotId, useMintLock, mintPrice) {

        const { walletCli, addresses, addressIndex } = this.connection

        return await walletCli.writeContract({
            address: WRAPPER_CONTRACT_ADDRESS,
            abi: WRAPPER_CONTRACT_ABI,
            account: addresses[addressIndex],
            functionName: 'mint',   
            args: [plotId.bigInt(), useMintLock],
            value: mintPrice,
        })

    }

    static async setSmp(plotId, smp){

        const { walletCli, addresses, addressIndex } = this.connection
        const tokenId = plotId.bigInt()
        const smpWei = parseEther(smp.toString())

        await walletCli.writeContract({
            address: WRAPPER_CONTRACT_ADDRESS,
            abi: WRAPPER_CONTRACT_ABI,
            account: addresses[addressIndex],
            functionName: 'setSmp',
            args: [tokenId, smpWei]
        })

    }

    static async getSmp(plotId){

        if(plotId.id == 0 || plotId.depth() >= MAX_DEPTH)

            return parseEther(D0_MINT_PRICE.toString())

        const { publicCli } = this.connection
        const tokenId = plotId.bigInt()

        const smp = await publicCli.readContract({
            address: DATA_CONTRACT_ADDRESS,
            abi: DATA_CONTRACT_ABI,
            functionName: 'smp',
            args: [tokenId]
        })

        return smp == 0n ? parseEther(DEFAULT_SMP.toString()) : smp

    }

    static async getPlotCount(){

        const { publicCli, addresses, addressIndex } = this.connection

        const count = await publicCli.readContract({
            address: DATA_CONTRACT_ADDRESS,
            abi: DATA_CONTRACT_ABI,
            functionName: 'balanceOf',
            args: [addresses[addressIndex]]
        })

        return Number(count)

    }

    static async loadMyPlots(range){

        const { publicCli, addresses, addressIndex } = this.connection
        const promises = []

        range = Math.min(range, this.plotCount)

        while(this.plotIterator < range){

            const tokenId = publicCli.readContract({
                address: DATA_CONTRACT_ADDRESS,
                abi: DATA_CONTRACT_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [addresses[addressIndex], BigInt(this.plotIterator)]
            }).then(tokenId => {

                const plotId = new PlotId(Number(tokenId))
                const myPlot = new MyPlot(plotId)

                // myPlots.update(arr => {
                //     arr.push(myPlot)
                //     return arr
                // })

            })

            promises.push(tokenId)
            this.plotIterator++

        }

        await Promise.all(promises)

    }

    static async getOwnerOf(plotId){

        try {

            const { publicCli } = this.connection

            const tokenId = plotId.bigInt()
            const owner = await publicCli.readContract({
                address: DATA_CONTRACT_ADDRESS,
                abi: DATA_CONTRACT_ABI,
                functionName: 'ownerOf',
                args: [tokenId]
            })

            return owner

        } catch {

            return null

        }

    }

    static async getTempLock(plotId){

        const { publicCli } = this.connection
        const tokenId = plotId.bigInt()

        const lockedTimeBigInt = await publicCli.readContract({
            address: DATA_CONTRACT_ADDRESS,
            abi: DATA_CONTRACT_ABI,
            functionName: 'tempLock',
            args: [tokenId]
        })

        const lockedTime = parseInt(lockedTimeBigInt.toString())
        const currentTime = Math.floor(Date.now() / 1000)

        return lockedTime - currentTime

    }

}
