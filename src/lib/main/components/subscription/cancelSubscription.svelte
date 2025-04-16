
<script>

    import Modal from "../../../common/components/modal.svelte";
    import { loadScreenOpacity, notification, user } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher } from "svelte";
    import { pushNotification } from "$lib/common/utils"

    const dispatch = createEventDispatcher()

    async function cancelSubscription(){

        $loadScreenOpacity = 50

        try{

            const res = await fetch(`${API_ORIGIN}/payment/subscription/update`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ update: "cancel" })
            })

            if(!res.ok)
                throw new Error()

            $user.subCanceled = true
            $user = $user

            dispatch("close")
            pushNotification(notification, "Subscription canceled", "Thanks for supporting Trraform!")

        }catch{
            pushNotification(notification, "Something went wrong", "Please reach out to us for assistance.")
        }

        $loadScreenOpacity = 0

    }

</script>

<Modal class="max-w-sm" header="Cancel subscription" on:close>
    <div class="space-y-4 text-xs sm:text-sm">
        <div>Thanks for supporting Trraform. We're sorry to see you go!</div>
        <div class="p-2 space-y-2 rounded-xl bg-zinc-900 outline outline-1 outline-zinc-700">
            <div class="font-bold">What you'll lose:</div>
            <li>
                <img class="icon" src="/redX.svg" alt="">
                <div>Verification badges</div>
            </li>
            <li>
                <img class="icon" src="/redX.svg" alt="">
                <div>Name tags above plots</div>
            </li>
            <li>
                <img class="icon" src="/redX.svg" alt="">
                <div>Builds of size greater than 32x32x32 will be removed from the world.</div>
            </li>
            <li>
                <img class="icon" src="/redX.svg" alt="">
                <div>Links will not appear on plot profiles.</div>
            </li>
            <li>
                <img class="icon" src="/redX.svg" alt="">
                <div>Remaining monthly bonus plot credits.</div>
            </li>
        </div>
        <div class="p-2 space-y-2 rounded-xl bg-zinc-900 outline outline-1 outline-zinc-700">
            <div class="font-bold">What you'll keep:</div>
            <li>
                <img class="icon" src="/check.svg" alt="">
                <div>Access to all features until the end of the current billing cycle.</div>
            </li>
            <li>
                <img class="icon" src="/check.svg" alt="">
                <div>Any bonus plot credits you've already received. Remaining ones will be given monthly once you resubscribe.</div>
            </li>
            <li>
                <img class="icon" src="/check.svg" alt="">
                <div>Access to your builds of size greater than 32x32x32.</div>
            </li>
        </div>
        <button on:click={cancelSubscription} class="w-full p-1 font-semibold transition-colors bg-red-600 rounded-lg outline-1 outline outline-red-500 hover:bg-red-500">Cancel subscription</button>
    </div>
</Modal>

<style lang="postcss">

    .icon{
        @apply w-4 sm:w-5 aspect-square;
    }

    li{
        @apply flex gap-1 items-start;
    }

</style>