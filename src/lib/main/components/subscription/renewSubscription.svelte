
<script>

    import Modal from "../../../common/components/modal.svelte";
    import { loadScreenOpacity, notification, user } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher } from "svelte";
    import { pushNotification } from "$lib/common/utils"

    const dispatch = createEventDispatcher()

    async function renewSubscription(){

        $loadScreenOpacity = 50

        try{

            const res = await fetch(`${API_ORIGIN}/payment/subscription/update`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ update: "renew" })
            })

            if(!res.ok)
                throw new Error()

            $user.subCanceled = false
            $user = $user

            dispatch("close")
            pushNotification(notification, "Subscription renewed", "Thanks for supporting Trraform!")

        }catch{
            pushNotification(notification, "Something went wrong", "Please reach out to us for assistance.")
        }

        $loadScreenOpacity = 0

    }

</script>

<Modal class="max-w-80" header="Renew subscription" on:close>
    <div class="text-sm">Pick back up right where you left off.</div>
    <button on:click={renewSubscription} class="w-full mt-4 button0">Renew</button>
</Modal>