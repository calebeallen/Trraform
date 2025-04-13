
<script>

    import { cart, paymentSession } from "$lib/main/store"
    import { PRICE } from "$lib/common/constants"

    let plots = []
    let total = ""
    let hasUnavailable = false

    $:{

        hasUnavailable = false
        plots = []
        let tot = 0

        for(const id in $cart){

            const { depth, isClaimed } = $cart[id]
            const plot = {
                id,
                isClaimed,
                price: PRICE[depth] / 100,
                s: isClaimed ? -1 : depth
            }
            
            if(isClaimed)
                hasUnavailable = true

            tot += PRICE[depth]
            plots.push(plot)

        }

        total = (tot / 100).toFixed(2)
        plots.sort((a, b) => a.s - b.s)

    }

    function removeFromCart(id){

        delete $cart[id]
        $cart = $cart
        localStorage.setItem("cart", JSON.stringify($cart))

    }

    function claim(){

        let tot = 0
        const plotIds = []

        for(const id in $cart){
            tot += PRICE[$cart[id].depth]
            plotIds.push(id)
        }

        $paymentSession = { 
            method: "payment", 
            total: tot,
            plotIds
        }

    }

</script>

<div class="flex flex-col h-full p-3 pointer-events-auto max-h-max bg-zinc-900 rounded-2xl outline-zinc-800 outline outline-1">
    <div class="pb-3 border-b border-zinc-800">
        <div class="font-bold sm:text-base">Your cart</div>
    </div>
    {#if plots.length}
        <div class="p-px mt-3 space-y-2 overflow-y-auto scrollbar-clean shrink w-72">
            {#each plots as { id, isClaimed, price } }
                <button class="relative flex items-center justify-between w-full gap-2 p-2 transition-[outline] outline outline-1 rounded-xl { !isClaimed ? "outline-zinc-800 hover:outline-zinc-700" : "outline-red-600 hover:outline-red-500"}">
                    <div class="flex items-center gap-2">
                        <img class="w-8 opacity-60" src="/plot1.svg" alt="">
                        <div class="text-sm text-left w-max">
                            <div class="">0x{id}</div>
                            {#if isClaimed}
                                <div class="text-xs font-semibold text-red-500 rounded-full ">Unavailable</div>
                            {:else}
                                <div class="text-xs text-zinc-300">${price}</div>
                            {/if}
                        </div>
                    </div>
                    <button on:click={() => removeFromCart(id)} class="p-1 group">
                        <img class="w-4 transition-opacity opacity-50 pointer-events-none select-none aspect-square group-hover:opacity-100" src="/trash.svg" alt="">
                    </button>
                </button>
            {/each}
        </div>
        <div class="pt-3 mt-3 space-y-3 border-t border-zinc-800">
            <div class="flex gap-1 font-bold">
                <div>Total:</div>
                <div>${total}</div>
            </div>
            {#if plots.length && !hasUnavailable}
                <button on:click={claim} class="w-full button0">Claim</button>
            {/if}
        </div>
    {:else}
        <div class="flex items-center justify-center h-32 opacity-50 pointer-events-none select-none w-72">
            <div class="space-y-1">
                <img class="w-5 mx-auto aspect-square" src="/cart.svg" alt="">
                <div class="mx-auto text-sm w-max">Cart empty</div>
            </div>
        </div>
    {/if}
</div>
