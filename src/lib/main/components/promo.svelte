
<button class="relative w-full p-3 overflow-hidden transition-all bg-black shadow-xl promo-banner rounded-2xl outline-zinc-700 outline-1 outline">
    <div class="smoke-bg"></div>
    <div class="space-y-1">
        <div class="flex justify-between w-full">
            <div class="flex items-center gap-1">
                <div class="font-extrabold">Build More & Stand Out</div> 
                <img class="w-3.5 aspect-square" src="/verified.svg " alt="">
            </div>
            <div class="text-sm text-zinc-300">Try it!</div>
        </div>
        <div class="text-sm text-left text-zinc-300 ">🔥 Get <b class="text-white">8 bonus</b> plot credits</div>
        <div class="text-sm text-left text-zinc-300">🔥 Unlock <b class="text-white">8x</b> greater build space, <b class="text-white">verified badges</b>, <b class="text-white">links</b>, and <b class="text-white">tags</b> on <b class="text-white">ALL</b> of your plots!</div>
    </div>
</button>


<style lang="postcss">

    .smoke-bg {
        @apply absolute -left-1/2 -top-1/2 w-[calc(200%)] h-[calc(200%)] z-0;
        background:
            radial-gradient(circle at 25% 40%, #a259ff55, transparent 60%),
            radial-gradient(circle at 65% 50%, #00cfff44, transparent 60%),
            radial-gradient(circle at 45% 65%, #ffce0044, transparent 60%);
        filter: blur(100px);
        animation: flow 10s linear infinite;
    }

    @keyframes flow {
        0% {
            transform: scale(1) translate(-30px, 0px) rotate(0deg);
        }
        50% {
            transform: scale(1.05) translate(30px, -30px) rotate(180deg);
        }
        100% {
            transform: scale(1) translate(-30px, 0px) rotate(360deg);
        }
    }
</style>